# 开发与维护

源码仓库：https://github.com/LastKnightCoder/tau-plugin-custom-block 。使用 Node.js 24、pnpm 11.9.0。

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm build
```

产物在 dist/package，ZIP 为 dist/tau.custom-block-<版本>.zip。仅依赖公开 npm SDK 0.8.0、UI 契约与普通 npm 包；主题工具类从 @tau/plugins/tailwind.css 编译，不引用主项目源码。

src/index.tsx 声明编辑器扩展，src/markdown.ts 声明纯 codec，src/plugin.ts 为发布入口。SKILL.md 随插件注册，src/utils/renderTemplate.ts 承载代码编译、主题变化和清理生命周期。

单元测试验证插件自身编译、清理和 Skill 示例，tests/host-ui.tsx 以测试替身隔离宿主 UI；实际编辑器、Markdown 往返、插入和博客发布由 Tau 主项目加载发布包做集成验证。

发布时同时提升 package.json 与 manifest.json 版本并更新 CHANGELOG.md；提交源码、构建、创建版本标签后，将 ZIP 上传到 GitHub Release。主项目通过仓库地址、提交与产物摘要固定版本，不使用 submodule，不直接编译本仓库源码。
