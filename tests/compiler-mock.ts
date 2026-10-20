import { vi } from "vitest";

// DOM 生命周期测试单独替代线程传输；真实 Worker 编译由 compiler.test.ts 验证。
vi.mock("../src/utils/compiler", () => ({
  compileTsx: vi.fn(async (source: string) => {
    const Babel = await import("@babel/standalone");
    return Babel.transform(source, {
      presets: [Babel.availablePresets.react, [Babel.availablePresets.typescript, {
        onlyRemoveTypeImports: true, allExtensions: true, isTSX: true,
      }]],
    }).code ?? "";
  }),
}));
