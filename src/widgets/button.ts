import { Box, paintCenteredText } from "../layout.ts";
import type { CellBuffer } from "../terminal.ts";
import type { Theme } from "../theme.ts";
import { getBorderChars } from "../theme.ts";

export type ButtonStyle = "default" | "small" | "large" | "ghost" | "outline";

export class Button extends Box {
  static readonly FLASH_BLEND = 0.55;

  onClick: (() => void) | null = null;
  onToggle: ((toggled: boolean) => void) | null = null;
  disabled = false;
  toggled = false;
  toggleOnClick = false;
  flash = false;
  flashOnClick = true;
  buttonStyle: ButtonStyle = "default";

  constructor(label: string, onClick?: () => void) {
    super(label);
    this.focusable = true;
    this.tabIndex = 0;
    this.onClick = onClick ?? null;
    this._applyStyle("default");

    this.onKey = (key) => {
      if (this.disabled) return;
      if (key === "Enter" || key === " ") {
        if (this.toggleOnClick) this.toggle();
        this.onClick?.();
        if (this.flashOnClick) this._triggerFlash();
      }
    };

    this.onMouse = (_col, _row, action) => {
      if (this.disabled) return;
      if (action === "press") {
        if (this.toggleOnClick) this.toggle();
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
      const hasBorder = this.style.border !== "none";

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
        fillBg = this.style.border !== "none" ? theme.panelBg : theme.bg;
        textFg = isFocused ? theme.highlight : theme.text;
      }

      const bOff = hasBorder ? 1 : 0;
      const p = this.style.padding;

      // Fill border area with panelBg (or button bg for borderless)
      const baseBg = this.style.border !== "none" ? theme.panelBg : fillBg;
      buf.fill(r.x, r.y, r.width, r.height, { char: " ", fg: null, bg: baseBg });

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

      // Expand the flash fill across the entire button area for bordered styles
      // Flash: fill the entire button area (including border / padding gutters)
      if (isFlash) {
        const flashFillBg = hasBorder ? fillBg : Button._blend(theme.focus, theme.panelBg, Button.FLASH_BLEND);
        buf.fill(r.x, r.y, r.width, r.height, { char: " ", fg: null, bg: flashFillBg });
        if (hasBorder) {
          const chars = getBorderChars(this.style.border);
          buf.set(r.x, r.y, { char: chars.topLeft, fg: borderColor, bg: flashFillBg });
          buf.set(r.x + r.width - 1, r.y, { char: chars.topRight, fg: borderColor, bg: flashFillBg });
          for (let col = r.x + 1; col < r.x + r.width - 1; col++) {
            buf.set(col, r.y, { char: chars.horizontal, fg: borderColor, bg: flashFillBg });
          }
          buf.set(r.x, r.y + r.height - 1, { char: chars.bottomLeft, fg: borderColor, bg: flashFillBg });
          buf.set(r.x + r.width - 1, r.y + r.height - 1, { char: chars.bottomRight, fg: borderColor, bg: flashFillBg });
          for (let col = r.x + 1; col < r.x + r.width - 1; col++) {
            buf.set(col, r.y + r.height - 1, { char: chars.horizontal, fg: borderColor, bg: flashFillBg });
          }
          for (let row = r.y + 1; row < r.y + r.height - 1; row++) {
            buf.set(r.x, row, { char: chars.vertical, fg: borderColor, bg: flashFillBg });
            buf.set(r.x + r.width - 1, row, { char: chars.vertical, fg: borderColor, bg: flashFillBg });
          }
        }
      }

      const contentRect = { x: cx, y: cy, width: cw, height: ch };
      const labelBg = isFlash && !hasBorder ? Button._blend(theme.focus, theme.panelBg, Button.FLASH_BLEND) : fillBg;
      paintCenteredText(buf, contentRect, this.label, textFg, labelBg, isFocused || isToggled);
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

  /** Apply visual style configuration. */
  private _applyStyle(style: ButtonStyle): void {
    this.buttonStyle = style;
    switch (style) {
      case "small":
        this.style.border = "none";
        this.height = { fixed: 1 };
        break;
      case "large":
        this.style.border = "single";
        this.style.padding = { top: 1, bottom: 1, left: 2, right: 2 };
        this.height = { fixed: 5 };
        break;
      case "ghost":
        this.style.border = "none";
        this.style.padding = { top: 0, bottom: 0, left: 1, right: 1 };
        this.height = { fixed: 3 };
        break;
      case "outline":
        this.style.border = "single";
        this.style.padding = { top: 0, bottom: 0, left: 1, right: 1 };
        this.height = { fixed: 3 };
        break;
      default:
        this.style.border = "single";
        this.style.padding = { top: 0, bottom: 0, left: 1, right: 1 };
        this.height = { fixed: 3 };
        break;
    }
  }

  /** Switch the button visual style at runtime. */
  setButtonStyle(style: ButtonStyle): void {
    this._applyStyle(style);
  }

  /** Linear interpolation between two RGB colors: t=0 → a, t=1 → b */
  static _blend(
    a: { r: number; g: number; b: number },
    b: { r: number; g: number; b: number },
    t: number,
  ): { r: number; g: number; b: number } {
    return {
      r: Math.round(a.r + (b.r - a.r) * t),
      g: Math.round(a.g + (b.g - a.g) * t),
      b: Math.round(a.b + (b.b - a.b) * t),
    };
  }

  /** Create a button with a given style. */
  static withStyle(style: ButtonStyle, label: string, onClick?: () => void): Button {
    const btn = new Button(label, onClick);
    btn.setButtonStyle(style);
    return btn;
  }

  /** Create a borderless 1-row button. */
  static small(label: string, onClick?: () => void): Button {
    return Button.withStyle("small", label, onClick);
  }

  /** Create a bordered tall button. */
  static large(label: string, onClick?: () => void): Button {
    return Button.withStyle("large", label, onClick);
  }

  /** Create a borderless normal-height button. */
  static ghost(label: string, onClick?: () => void): Button {
    return Button.withStyle("ghost", label, onClick);
  }

  /** Create a compact bordered button. */
  static outline(label: string, onClick?: () => void): Button {
    return Button.withStyle("outline", label, onClick);
  }
}
