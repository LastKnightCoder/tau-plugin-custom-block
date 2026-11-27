# Custom Component Block

Embed interactive React components directly in your documents to demonstrate CSS, DOM, or Canvas effects, or to build hands-on mini-tools. Components automatically follow the app's light/dark mode and theme palette.

## Insert & Edit

1. Type `/` on an empty line or open the block menu, search for **React Component** (or "component" / "custom"), and insert a blank block.
2. New blocks open in source edit mode with a live preview below; click **Done** when finished.
3. Hover over a component to edit or delete it from the top-right action bar, or interact directly with the preview inside the document.
4. Syntax or runtime errors appear below the preview and clear automatically once fixed.

## Authoring Components

Write TSX source that declares a parameterless component named `Component` without `import` or `export` statements:

```jsx
const { useState } = React;

const Component = () => {
  const [count, setCount] = useState(0);
  return (
    <div className="flex items-center gap-3">
      <ui.Button variant="secondary" size="sm" onClick={() => setCount(c => c + 1)}>
        Click +1
      </ui.Button>
      <span className="text-tau-body text-ink-2">Clicked {count} times</span>
    </div>
  );
};
```

The following bindings are available directly in scope:

| Binding       | Purpose                                                                                             |
| ------------- | --------------------------------------------------------------------------------------------------- |
| `React`       | Destructure hooks from here, e.g. `const { useState, useEffect } = React`                           |
| `ui`          | App design-system controls: `Button`, `Input`, `Switch`, `Select`, `Tooltip`, `Popover`, and more   |
| `icons`       | Lucide icons, e.g. `<icons.Copy className="size-4" />`                                              |
| `toast`       | Toast notifications, e.g. `toast.success("Copied")`                                                 |
| `useTokens()` | Read resolved theme color values for Canvas or SVG: `useTokens().color("accent")`                   |

Styling guidelines:

- Prefer Tailwind class names written out in full—avoid string concatenation (`bg-tag-${i}` will not be generated).
- Use semantic theme classes (`text-ink-1`, `border-line-1`, `bg-accent-soft`, etc.) so components adapt to theme changes; avoid hardcoded hex values or palette colors like `bg-blue-500`.
- Put custom CSS that Tailwind cannot express inside a `<style>` tag wrapped in `@scope { }` so it does not leak to the rest of the page.
- Clean up timers, event listeners, and `ResizeObserver` instances in effect cleanup functions when source changes or scrolling unmounts the component. Theme changes re-render the component without recompiling the source.
- Components cannot make network requests, access `localStorage`, or touch the DOM outside the block.

## Let AI Write It for You

Once enabled, **Custom Component Block** appears on the Skills page. Ask AI in chat to build an interactive demo and it will follow this spec; you can also view the full authoring guide on the Skills page.

## Import & Export

Components are stored in Markdown as `custom-block` fenced code blocks, preserving the full source across export, copy, and re-import.

## Tips

- After installing, turn on the plugin in the **Installed** tab and click **Restart now** to activate it; disabling or updating also requires a restart. Existing components remain intact in your documents while disabled and reappear once re-enabled.
