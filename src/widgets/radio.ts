import { Box } from "../layout.ts";

export interface RadioOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export class RadioButton extends Box {
  value: string;
  selected = false;
  disabled = false;
  onChange: ((value: string) => void) | null = null;

  constructor(label: string, value: string, selected = false) {
    super(label);
    this.focusable = true;
    this.tabIndex = 0;
    this.value = value;
    this.selected = selected;

    this.style.border = "none";
    this.height = { fixed: 1 };

    this.onPaint = (buf, rect, theme) => {
      const isDisabled = this.disabled;
      const isFocused = this.focused && !isDisabled;

      const dot = this.selected ? "•" : "○";
      const fg = isDisabled ? theme.muted : (isFocused ? theme.highlight : theme.text);
      const bg = isDisabled ? theme.disabledBg : theme.primaryBg;
      const text = ` ${dot} ${this.label}`;
      for (let i = 0; i < text.length && i < rect.width; i++) {
        buf.set(rect.x + i, rect.y, {
          char: text[i],
          fg: (i < 3 && isFocused) ? theme.highlight : fg,
          bg,
          bold: this.selected && isFocused,
        });
      }
    };

    this.onKey = (key) => {
      if (this.disabled) return;
      if (key === "Enter" || key === " ") {
        this.select();
      }
    };

    this.onMouse = (_col, _row, action) => {
      if (this.disabled) return;
      if (action === "press") {
        this.select();
      }
    };
  }

  setDisabled(v: boolean): void {
    this.disabled = v;
    this.focusable = !v;
  }

  select(): void {
    if (!this.selected) {
      this.selected = true;
      if (this.onChange) this.onChange(this.value);
    }
  }
}

export class RadioGroup extends Box {
  selectedValue: string;
  onChange: ((value: string) => void) | null = null;
  private _buttons: RadioButton[] = [];

  constructor(
    label: string,
    options: RadioOption[],
    selectedValue?: string,
    onChange?: (value: string) => void,
  ) {
    super(label);
    this.style.direction = "column";
    this.style.border = "single";
    this.style.padding = { top: 0, bottom: 0, left: 1, right: 1 };
    this.selectedValue = selectedValue ?? (options.length > 0 ? options[0].value : "");
    this.onChange = onChange ?? null;

    for (const opt of options) {
      const rb = new RadioButton(opt.label, opt.value, opt.value === this.selectedValue);
      if (opt.disabled) rb.setDisabled(true);
      rb.onChange = (val) => this._onChildChange(val);
      this._buttons.push(rb);
      this.add(rb);
    }

    this.height = { fixed: 2 + this._buttons.length };
  }

  select(value: string): void {
    this._onChildChange(value);
  }

  private _onChildChange(value: string): void {
    const target = this._buttons.find((b) => b.value === value);
    if (target?.disabled) return;
    this.selectedValue = value;
    for (const rb of this._buttons) {
      rb.selected = rb.value === value;
    }
    if (this.onChange) this.onChange(value);
  }
}
