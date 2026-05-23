import { Box } from "../layout.ts";

export class Checkbox extends Box {
  checked = false;
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
      const boxChar = this.checked ? "☑" : "☐";
      const boxColor = this.focused ? theme.highlight : theme.muted;
      const textColor = theme.text;
      const bg = theme.panelBg;

      const indicator = `${boxChar} ${this.label}`;

      for (let i = 0; i < indicator.length && i < rect.width; i++) {
        const char = indicator[i];
        let fg = textColor;
        if (i === 0) {
          fg = boxColor;
        } else if (this.focused) {
          fg = theme.highlight;
        }

        buf.set(rect.x + i, rect.y, {
          char,
          fg,
          bg,
          bold: this.focused,
        });
      }
    };

    this.onKey = (key) => {
      if (key === "Enter" || key === " ") {
        this.toggle();
      }
    };

    this.onMouse = (_col, _row, action) => {
      if (action === "press") {
        this.toggle();
      }
    };
  }

  toggle(): void {
    this.checked = !this.checked;
    if (this.onChange) this.onChange(this.checked);
  }
}
