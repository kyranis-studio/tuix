import { Box, paintCenteredText } from "../layout.ts";
import type { CellBuffer } from "../terminal.ts";
import type { Theme } from "../theme.ts";
import { getBorderChars } from "../theme.ts";

export class Button extends Box {
  onClick: (() => void) | null = null;
  onToggle: ((toggled: boolean) => void) | null = null;
  disabled = false;
  toggled = false;
  flash = false;
  flashOnClick = true;

  constructor(label: string, onClick?: () => void) {
    super(label);
    this.focusable = true;
    this.tabIndex = 0;
    this.onClick = onClick ?? null;

    this.style.border = "single";
    this.style.padding = { top: 0, bottom: 0, left: 1, right: 1 };
    this.height = { fixed: 3 };

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

    this.paint = (buf: CellBuffer, theme: Theme) => {
      const r = this.rect;
      if (r.width <= 0 || r.height <= 0) return;

      const isDisabled = this.disabled;
      const isFocused = this.focused && !isDisabled;
      const isToggled = this.toggled && !isDisabled;
      const isFlash = this.flash && !isDisabled;

      let borderColor: { r: number; g: number; b: number };
      let fillBg: { r: number; g: number; b: number };
      let textFg: { r: number; g: number; b: number };

      if (isDisabled) {
        borderColor = theme.disabled;
        fillBg = theme.disabled;
        textFg = theme.muted;
      } else if (isFlash) {
        borderColor = theme.focus;
        fillBg = theme.focus;
        textFg = theme.bg;
      } else if (isToggled) {
        borderColor = isFocused ? theme.focusBorder : theme.highlight;
        fillBg = theme.highlight;
        textFg = theme.bg;
      } else {
        borderColor = isFocused ? theme.focusBorder : theme.border;
        fillBg = theme.panelBg;
        textFg = theme.highlight;
      }

      const hasBorder = this.style.border !== "none";
      const bOff = hasBorder ? 1 : 0;
      const p = this.style.padding;

      // Fill border area with panelBg
      buf.fill(r.x, r.y, r.width, r.height, { char: " ", fg: null, bg: theme.panelBg });

      // Draw border
      if (hasBorder) {
        const chars = getBorderChars(this.style.border);
        buf.set(r.x, r.y, { char: chars.topLeft, fg: borderColor, bg: theme.panelBg });
        buf.set(r.x + r.width - 1, r.y, { char: chars.topRight, fg: borderColor, bg: theme.panelBg });
        for (let col = r.x + 1; col < r.x + r.width - 1; col++) {
          buf.set(col, r.y, { char: chars.horizontal, fg: borderColor, bg: theme.panelBg });
        }
        buf.set(r.x, r.y + r.height - 1, { char: chars.bottomLeft, fg: borderColor, bg: theme.panelBg });
        buf.set(r.x + r.width - 1, r.y + r.height - 1, { char: chars.bottomRight, fg: borderColor, bg: theme.panelBg });
        for (let col = r.x + 1; col < r.x + r.width - 1; col++) {
          buf.set(col, r.y + r.height - 1, { char: chars.horizontal, fg: borderColor, bg: theme.panelBg });
        }
        for (let row = r.y + 1; row < r.y + r.height - 1; row++) {
          buf.set(r.x, row, { char: chars.vertical, fg: borderColor, bg: theme.panelBg });
          buf.set(r.x + r.width - 1, row, { char: chars.vertical, fg: borderColor, bg: theme.panelBg });
        }
      }

      // Fill inner content area with fillBg (highlight/disabled only inside border)
      const cx = r.x + bOff + p.left;
      const cy = r.y + bOff + p.top;
      const cw = Math.max(0, r.width - bOff * 2 - p.left - p.right);
      const ch = Math.max(0, r.height - bOff * 2 - p.top - p.bottom);
      if (cw > 0 && ch > 0) {
        buf.fill(cx, cy, cw, ch, { char: " ", fg: null, bg: fillBg });
      }

      const contentRect = { x: cx, y: cy, width: cw, height: ch };
      paintCenteredText(buf, contentRect, this.label, textFg, fillBg, isFocused || isToggled);
    };
  }

  setDisabled(v: boolean): void {
    this.disabled = v;
    this.focusable = !v;
  }

  toggle(): void {
    this.toggled = !this.toggled;
    this.onToggle?.(this.toggled);
  }

  private _triggerFlash(): void {
    this.flash = true;
    setTimeout(() => { this.flash = false; }, 150);
  }

  setToggled(v: boolean): void {
    this.toggled = v;
  }
}
