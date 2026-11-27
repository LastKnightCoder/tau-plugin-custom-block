import { Box } from "lucide-react";
import type { PluginEditorExtension } from "@tau/plugins";
import { insertCustomBlock } from "../insert";
import { t } from "../i18n";

// 块菜单每次打开时重建，标题与描述按当前语言解析
const items: NonNullable<PluginEditorExtension["blockPanel"]> = (editor) => [
  {
    icon: Box,
    title: t("panel.title"),
    keywords: ["React", "组件", "custom", "自定义", "react", "zidingyi"],
    description: t("panel.description"),
    onClick: editor => {
      insertCustomBlock(editor);
    },
  },
];

export default items;
