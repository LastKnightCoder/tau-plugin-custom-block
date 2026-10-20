# 开发与维护

## 自动发布

本仓库的.github/workflows/release.yml与公开模板一致。同步更新package.json和manifest.json版本并提交后，推送对应版本tag即可自动安装依赖、运行测试（若定义）、构建并将ZIP上传到GitHub Release，无需手动上传或配置额外Token。

```sh
version=$(node -p "require('./manifest.json').version")
git tag "v$version"
git push origin HEAD
git push origin "v$version"
```

tag也可不带v前缀，版本必须与两个文件一致；预发布版本自动标记为Pre-release。Actions失败可重跑，已有Release会更新同名ZIP。已发布版本不要移动tag，代码修复应提高版本再发布。仓库需启用Actions并允许contents:write。正式版本发布后，工作流通过 GitHub OIDC 自动提交到 Tau 插件中心；首次提交需在网页绑定仓库。客户端固定测试产物仍需单独更新。

源码仓库：https://github.com/LastKnightCoder/tau-plugin-custom-block 。使用 Node.js 24、pnpm 11.9.0。

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm build
```

产物在 dist/package，ZIP 为 dist/tau.custom-block-<版本>.zip。仅依赖公开 npm SDK 0.8.0、UI 契约与普通 npm 包；主题工具类从 @tau/plugins/tailwind.css 编译，不引用主项目源码。

src/index.tsx 声明编辑器扩展，src/markdown.ts 声明纯 codec，src/plugin.ts 为发布入口。SKILL.md 随插件注册，src/utils/renderTemplate.ts 承载组件执行、主题变化和清理生命周期；compiler.worker.ts 独占 Babel 转换，构建时嵌入为 Blob Worker 源码，不依赖外部脚本 URL。compiler.ts 合并同源在途转换、处理取消与线程失败，空闲 30 秒后释放线程。Worker 不可用时显示错误，不回退到界面线程编译。组件函数和 React/DOM 仍在界面线程运行。

单元测试验证插件自身编译、清理和 Skill 示例，tests/host-ui.tsx 以测试替身隔离宿主 UI；实际编辑器、Markdown 往返、插入和博客发布由 Tau 主项目加载发布包做集成验证。

发布时同时提升 package.json 与 manifest.json 版本并更新 CHANGELOG.md；提交源码并推送版本标签后，由上述工作流生成 Release 和 ZIP。主项目通过仓库地址、提交与产物摘要固定版本，不使用 submodule，不直接编译本仓库源码。
