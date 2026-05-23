import { Box } from "../layout.ts";

export class ButtonGroup extends Box {
  options: string[] = [];
  selectedIndex = 0;
  onChange: ((value: string, index: number) => void) | null = null;

  constructor(
    label = "",
    options: string[] = [],
    selectedIndex = 0,
    onChange?: (value: string, index: number) => void,
  ) {
    super(label);
    this.focusable = true;
    this.tabIndex = 0;
    this.options = options;
    this.selectedIndex = selectedIndex;
    this.onChange = onChange ?? null;

    this.height = { fixed: 3 };

    this.onPaint = (buf, rect, theme) => {
      const isFocused = this.focused;
      const bg = theme.panelBg;
      const totalW = rect.width;
      const count = this.options.length;
      if (count === 0) return;

      const sep = " ";
      const sepW = sep.length;
      const totalSepW = sepW * (count - 1);
      const btnW = Math.max(1, Math.floor((totalW - totalSepW) / count));

      for (let i = 0; i < count; i++) {
        const x = rect.x + i * (btnW + sepW);
        const isSelected = i === this.selectedIndex;
        const itemFg = isSelected
          ? (isFocused ? theme.bg : theme.highlight)
          : theme.text;
        const itemBg = isSelected
          ? (isFocused ? theme.highlight : theme.border)
          : bg;

        for (let col = 0; col < btnW; col++) {
          const charIndex = col;
          buf.set(x + col, rect.y, {
            char: charIndex < this.options[i].length
              ? this.options[i][charIndex]
              : " ",
            fg: itemFg,
            bg: itemBg,
            bold: isSelected,
          });
        }

        if (i < count - 1) {
          buf.set(x + btnW, rect.y, { char: sep, fg: theme.muted, bg });
        }
      }
    };

    this.onKey = (key) => {
      if (key === "ArrowRight") {
        if (this.selectedIndex < this.options.length - 1) {
          this._select(this.selectedIndex + 1);
        }
      } else if (key === "ArrowLeft") {
        if (this.selectedIndex > 0) {
          this._select(this.selectedIndex - 1);
        }
      } else if (key === "Enter" || key === " ") {
        if (this.onChange) this.onChange(this.options[this.selectedIndex], this.selectedIndex);
      } else if (key === "Home") {
        this._select(0);
      } else if (key === "End") {
        this._select(this.options.length - 1);
      }
    };

    this.onMouse = (col, _row, action) => {
      if (action === "press") {
        const count = this.options.length;
        if (count === 0) return;
        const sep = " ";
        const sepW = sep.length;
        const totalW = this.rect.width;
        const btnW = Math.max(1, Math.floor((totalW - sepW * (count - 1)) / count));
        const relX = col - this.rect.x;
        const index = Math.floor(relX / (btnW + sepW));
        if (index >= 0 && index < count) {
          this._select(index);
        }
      }
    };
  }

  private _select(index: number): void {
    if (index < 0 || index >= this.options.length) return;
    if (index === this.selectedIndex) return;
    this.selectedIndex = index;
    if (this.onChange) this.onChange(this.options[index], index);
  }
}
