import { definePlugin } from "@tau/plugins";
import { customBlockExtension } from "./index";
import { customBlockCodec } from "./markdown";
import manifest from "../manifest.json";

export default definePlugin({
  id: manifest.id,
  name: manifest.name,
  version: manifest.version,
  editorExtensions: [customBlockExtension],
  editorCodecs: [customBlockCodec],
});
