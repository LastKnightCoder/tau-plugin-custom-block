import { vi } from "vitest";
import { createElement, type ReactNode } from "react";

// 单元测试隔离宿主 UI；真实控件和编辑器装配由 Tau 的插件包集成测试验证。
vi.mock("@tau/ui", () => {
  const Control = ({ children }: { children?: ReactNode }) => createElement("span", null, children);
  return {
    Button: ({ children, onClick, icon: Icon }: { children?: ReactNode; onClick?: () => void; icon?: React.ComponentType }) => createElement("button", { onClick }, Icon && createElement(Icon), children),
    IconButton: Control, Input: () => null, Textarea: () => null,
    NumberInput: () => null, Switch: () => null, Checkbox: () => null,
    RadioGroup: Control, Radio: Control, Select: () => null, Tag: Control, Spinner: () => null,
    Tooltip: Control,
    toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
    Popover: Object.assign(({ trigger, children }: { trigger?: ReactNode; children?: ReactNode }) => createElement("span", null, trigger, children), { Header: Control, Body: Control, Footer: Control }),
  };
});
