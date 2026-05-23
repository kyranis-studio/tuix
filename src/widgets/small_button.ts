import { Box, paintCenteredText } from "../layout.ts";
import type { Color } from "../theme.ts";

export class SmallButton extends Box {
  onClick: (() => void) | null = null;
  disabled = false;
  flash = false;
  flashOnClick = true;

  constructor(label: string, onClick?: () => void) {
    super(label);
    this.focusable = true;
    this.tabIndex = 0;
    this.onClick = onClick ?? null;

    this.style.border = "none";
    this.height = { fixed: 1 };

    this.onKey = (key) => {
      if (this.disabled) return;
      if (key === "Enter" || key === " ") {
        this.onClick?.();
        if (this.flashOnClick) this._triggerFlash();
      }
    };

    this.onMouse = (_col, _row, action) => {
      if (this.disabled) return;
      if (action === "press") {
        this.onClick?.();
        if (this.flashOnClick) this._triggerFlash();
      }
    };

    this.onPaint = (buf, rect, theme) => {
      let fillBg: Color;
      let textFg: Color;
      let bold = false;

      if (this.disabled) {
        fillBg = theme.disabled;
        textFg = theme.muted;
      } else if (this.flash) {
        fillBg = theme.focus;
        textFg = theme.bg;
        bold = true;
      } else if (this.focused) {
        fillBg = theme.highlight;
        textFg = theme.bg;
        bold = true;
      } else {
        fillBg = theme.panelBg;
        textFg = theme.text;
      }

      buf.fill(rect.x, rect.y, rect.width, rect.height, { char: " ", fg: null, bg: fillBg });
      paintCenteredText(buf, rect, this.label, textFg, fillBg, bold);
    };
  }

  setDisabled(v: boolean): void {
    this.disabled = v;
    this.focusable = !v;
  }

  private _triggerFlash(): void {
    this.flash = true;
    setTimeout(() => { this.flash = false; }, 150);
  }
}
