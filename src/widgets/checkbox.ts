import { Box } from "../layout.ts";

export class Checkbox extends Box {
  checked = false;
  disabled = false;
  onChange: ((checked: boolean) => void) | null = null;

  constructor(label: string, checked = false, onChange?: (checked: boolean) => void) {
    super(label);
    this.focusable = true;
    this.tabIndex = 0;
    this.checked = checked;
    this.onChange = onChange ?? null;

    this.style.border = "none";
    this.height = { fixed: 1 };

    this.onPaint = (buf, rect, theme) => {
      const isDisabled = this.disabled;
      const isFocused = this.focused && !isDisabled;

      const boxChar = this.checked ? "☑" : "☐";
      const boxColor = isDisabled ? theme.muted : (isFocused ? theme.highlight : theme.muted);
      const textColor = isDisabled ? theme.muted : theme.text;
      const bg = isDisabled ? theme.disabled : theme.panelBg;

      const indicator = `${boxChar} ${this.label}`;

      for (let i = 0; i < indicator.length && i < rect.width; i++) {
        const char = indicator[i];
        let fg = textColor;
        if (i === 0) {
          fg = boxColor;
        } else if (isFocused) {
          fg = theme.highlight;
        }

        buf.set(rect.x + i, rect.y, {
          char,
          fg,
          bg,
          bold: isFocused,
        });
      }
    };

    this.onKey = (key) => {
      if (this.disabled) return;
      if (key === "Enter" || key === " ") {
        this.toggle();
      }
    };

    this.onMouse = (_col, _row, action) => {
      if (this.disabled) return;
      if (action === "press") {
        this.toggle();
      }
    };
  }

  setDisabled(v: boolean): void {
    this.disabled = v;
    this.focusable = !v;
  }

  toggle(): void {
    this.checked = !this.checked;
    if (this.onChange) this.onChange(this.checked);
  }
}
