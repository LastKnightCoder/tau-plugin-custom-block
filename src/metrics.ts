import type { EditorMetricRule } from "@tau/plugins";

export const editorMetrics = [
  {
    type: "custom-block",
    textFields: ["content"],
  },
] as const satisfies readonly EditorMetricRule[];
