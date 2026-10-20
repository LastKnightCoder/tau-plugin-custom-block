import { transform, availablePresets } from "@babel/standalone";

const scope = globalThis as unknown as {
  onmessage: (event: MessageEvent<{ id: number; source: string }>) => void;
  postMessage(value: unknown): void;
};

scope.onmessage = ({ data: { id, source } }) => {
  try {
    const code = transform(source, {
      presets: [
        availablePresets.react,
        [availablePresets.typescript, { onlyRemoveTypeImports: true, allExtensions: true, isTSX: true }],
      ],
    }).code ?? "";
    scope.postMessage({ id, code });
  } catch (error) {
    scope.postMessage({ id, error: error instanceof Error ? error.message : String(error) });
  }
};
