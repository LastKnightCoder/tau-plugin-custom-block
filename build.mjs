import { build } from "esbuild";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import AdmZip from "adm-zip";
import { lstat, readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { collectSkills } from "./skills.mjs";
import { buildPortablePluginManifest } from "@tau/plugins/portable";
import path from "node:path";

const LOCALIZED_README_PATTERN = /^README\.([A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*)\.md$/;

async function copyLocalizedReadmes(sourceDir, targetDir) {
  const seen = new Map();
  const entries = (await readdir(sourceDir, { withFileTypes: true })).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  for (const entry of entries) {
    const match = LOCALIZED_README_PATTERN.exec(entry.name);
    if (!match) continue;
    const tag = match[1];
    if (tag.length > 35) throw new Error(`无效的多语言说明文件名：${entry.name}`);
    let locale;
    try {
      locale = new Intl.Locale(tag).toString();
    } catch {
      throw new Error(`无效的多语言说明文件名：${entry.name}`);
    }
    const sourcePath = path.join(sourceDir, entry.name);
    const info = await lstat(sourcePath);
    if (info.isSymbolicLink() || !info.isFile())
      throw new Error(`多语言说明必须是普通文件：${entry.name}`);
    if (seen.has(locale)) throw new Error(`多语言说明存在重复语言：${entry.name}`);
    const content = new TextDecoder("utf-8", { fatal: true }).decode(await readFile(sourcePath));
    if (!content.trim()) throw new Error(`${entry.name} 不能为空`);
    seen.set(locale, entry.name);
    await writeFile(path.join(targetDir, `README.${locale}.md`), content);
  }
}

const root = import.meta.dirname;
const out = path.join(root, "dist/package");
await mkdir(out, { recursive: true });
const manifest = JSON.parse(await readFile(path.join(root, "manifest.json"), "utf8"));
const shared = [
  "@tau/plugins",
  "@tau/ui",
  "react",
  "react-dom",
  "react-dom/client",
  "react/jsx-runtime",
  "react/jsx-dev-runtime",
];
const worker = await build({
  absWorkingDir: root,
  entryPoints: ["src/utils/compiler.worker.ts"],
  bundle: true,
  write: false,
  format: "iife",
  platform: "browser",
  target: "es2022",
  minify: true,
});
const result = await build({
  absWorkingDir: root,
  entryPoints: ["src/plugin.ts"],
  outfile: path.join(out, "main.js"),
  bundle: true,
  format: "cjs",
  platform: "browser",
  target: "es2022",
  jsx: "automatic",
  minify: true,
  external: shared,
  loader: { ".md": "text" },
  metafile: true,
  define: { "process.env.NODE_ENV": '"production"' },
  plugins: [{
    name: "inline-compiler-worker",
    setup(build) {
      build.onResolve({ filter: /^custom-block:compiler-worker$/ }, () => ({
        path: "compiler-worker", namespace: "compiler-worker",
      }));
      build.onLoad({ filter: /.*/, namespace: "compiler-worker" }, () => ({
        contents: worker.outputFiles[0].text, loader: "text",
      }));
    },
  }],
});
for (const input of Object.keys(result.metafile.inputs)) {
  if (input.startsWith("../") && !input.includes("node_modules/"))
    throw new Error(`插件不能打包仓库内部源码：${input}`);
}
for (const output of Object.values(result.metafile.outputs))
  for (const dependency of output.imports)
    if (dependency.external && !shared.includes(dependency.path))
      throw new Error(`外部依赖不受支持：${dependency.path}`);
const compiler = await compile(await readFile(path.join(root, "src/styles.css"), "utf8"), {
  base: path.join(root, "src"),
  onDependency() {},
});
const utilities = compiler.build(new Scanner({ sources: compiler.sources }).scan());
// 不带前缀的工具类会覆盖 Tau 与博客模板的同名类（如模板的 md:flex 被 .hidden 盖掉）
const bare = [
  ...utilities.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/\.((?:\\.|[A-Za-z_-])(?:\\.|[\w-])*)/g),
]
  .map(match => match[1].replace(/\\(.)/g, "$1"))
  .filter(name => !name.startsWith("cb:"));
if (bare.length) throw new Error(`Tailwind 类名需要 cb: 前缀：${[...new Set(bare)].join(" ")}`);
await writeFile(path.join(out, "main.css"), utilities);
const skills = await collectSkills(out);
const integrity = {};
for (const file of skills.files)
  integrity[file] = createHash("sha256")
    .update(await readFile(path.join(out, file)))
    .digest("hex");
for (const file of ["main.js", "main.css"])
  integrity[file] = createHash("sha256")
    .update(await readFile(path.join(out, file)))
    .digest("hex");
const builtManifest = buildPortablePluginManifest(manifest, {
  main: "main.js",
  ...(skills.ids.length ? { skills: skills.ids } : {}),
  styles: "main.css",
  integrity,
});
const packagedManifest = {
  ...builtManifest,
  ...(builtManifest.i18n === undefined && manifest.i18n ? { i18n: manifest.i18n } : {}),
  ...(builtManifest.locales === undefined && manifest.locales
    ? { locales: manifest.locales }
    : {}),
};
await writeFile(path.join(out, "manifest.json"), JSON.stringify(packagedManifest, null, 2));
await writeFile(path.join(out, "README.md"), await readFile(path.join(root, "README.md")));
await copyLocalizedReadmes(root, out);
await writeFile(path.join(out, "LICENSE"), await readFile(path.join(root, "LICENSE")));
await writeFile(path.join(out, "CHANGELOG.md"), await readFile(path.join(root, "CHANGELOG.md")));
const zip = new AdmZip();
zip.addLocalFolder(out, manifest.id);
zip.writeZip(path.join(root, "dist", `${manifest.id}-${manifest.version}.zip`));
console.log(`插件包：${out}`);
