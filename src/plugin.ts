import { editorMetrics } from "./metrics";
import { definePlugin } from "@tau/plugins";
import { customBlockExtension } from "./index";
import { customBlockCodec } from "./markdown";
import { captureTranslator, messages } from "./i18n";
import manifest from "../manifest.json";

export default definePlugin({
  id: manifest.id,
  name: manifest.name,
  version: manifest.version,
  i18n: messages,
  create: () => ({
    activate(context) {
      captureTranslator(context.i18n.t);
    },
  }),
  editorExtensions: [customBlockExtension],
  editorMetrics,
  editorCodecs: [customBlockCodec],
});
