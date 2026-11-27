# 自訂元件區塊

在文件中嵌入可互動的 React 元件，用來示範 CSS / DOM / Canvas 效果，或做一個能直接操作的小工具。元件會跟隨應用程式主題切換深淺色與配色。

## 插入與編輯

1. 在內文空行輸入 `/`，或開啟區塊選單，搜尋「React 元件」（也可搜尋「元件」「自訂」）插入空白元件。
2. 新區塊會自動進入原始碼編輯，修改後下方即時預覽；編寫完成點擊「完成」退出編輯。
3. 滑鼠懸停在元件上，透過右上角操作列編輯或刪除，在文件內直接操作預覽。
4. 原始碼有語法或執行錯誤時，預覽下方會顯示錯誤訊息，修正後自動恢復。

## 編寫元件

原始碼是一段 TSX，必須宣告名為 `Component` 的無參數元件，不寫 `import` / `export`：

```jsx
const { useState } = React;

const Component = () => {
  const [count, setCount] = useState(0);
  return (
    <div className="flex items-center gap-3">
      <ui.Button variant="secondary" size="sm" onClick={() => setCount(c => c + 1)}>
        點擊 +1
      </ui.Button>
      <span className="text-tau-body text-ink-2">已點擊 {count} 次</span>
    </div>
  );
};
```

可直接使用以下繫結：

| 繫結          | 用途                                                                                 |
| ------------- | ------------------------------------------------------------------------------------ |
| `React`       | hooks 從這裡解構，如 `const { useState, useEffect } = React`                         |
| `ui`          | 應用程式設計系統控制項：`Button`、`Input`、`Switch`、`Select`、`Tooltip`、`Popover` 等 |
| `icons`       | lucide 圖示，如 `<icons.Copy className="size-4" />`                                  |
| `toast`       | 輕提示，如 `toast.success("已複製")`                                                 |
| `useTokens()` | 取得目前主題實際色值，供 Canvas、SVG 使用：`useTokens().color("accent")`             |

樣式要點：

- 優先使用 Tailwind 類別名稱，類別名稱需完整寫在原始碼裡，不要拼接字串（`bg-tag-${i}` 不會生效）。
- 顏色使用主題語意類別（`text-ink-1`、`border-line-1`、`bg-accent-soft` 等），這樣切換主題時元件會自動適配；不要寫死 hex 或 `bg-blue-500` 這類調色盤顏色。
- Tailwind 寫不了的樣式放在區塊內 `<style>`，並包在 `@scope { }` 中，避免影響頁面其他部分。
- 修改原始碼或捲動導致元件卸載時，計時器、事件監聽、`ResizeObserver` 需要在 effect 清理函式中釋放。主題變化只會重新整理元件，不會重新編譯原始碼。
- 元件內不能發起網路請求，也不能讀寫 `localStorage` 或區塊外的 DOM。

## 讓 AI 幫你寫

啟用外掛後，Skill 頁面會多出「自訂元件區塊」。在對話裡讓 AI 做一個互動示範，它會按這份規範寫出元件；完整的編寫規範也可以在 Skill 頁面查看。

## 匯入匯出

元件在 Markdown 中儲存為 `custom-block` 程式碼區塊，匯出、複製和再匯入都會保留完整原始碼。

## 小提醒

- 安裝後到外掛頁的「已安裝」裡開啟開關，再點「立即重啟」才會生效；關閉或升級外掛也要重新啟動。關閉期間，文件中的元件不會遺失，重新開啟後照常顯示。
