import { Box, paintCenteredText } from "../layout.ts";

export class Button extends Box {
  onClick: (() => void) | null = null;

  constructor(label: string, onClick?: () => void) {
    super(label);
    this.focusable = true;
    this.tabIndex = 0;
    this.onClick = onClick ?? null;

    this.style.border = "single";
    this.style.padding = { top: 0, bottom: 0, left: 1, right: 1 };
    this.height = { fixed: 3 };

    this.onPaint = (buf, rect, theme) => {
      const isFocused = this.focused;
      const textFg = isFocused ? theme.bg : theme.highlight;
      const textBg = isFocused ? theme.highlight : theme.panelBg;

      paintCenteredText(buf, rect, this.label, textFg, textBg, isFocused);
    };

    this.onKey = (key) => {
      if (key === "Enter" || key === " ") {
        if (this.onClick) this.onClick();
      }
    };

    this.onMouse = (_col, _row, action) => {
      if (action === "press") {
        if (this.onClick) this.onClick();
      }
    };
  }
}
