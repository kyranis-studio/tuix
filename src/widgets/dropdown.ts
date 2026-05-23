import { Box } from "../layout.ts";
import { getTermSize } from "../terminal.ts";

export class Dropdown extends Box {
  options: string[] = [];
  selectedIndex = 0;
  open = false;
  onChange: ((value: string, index: number) => void) | null = null;
  maxVisible = 6;

  private _cursorIndex = 0;
  private _openUp = false;

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
    this._cursorIndex = selectedIndex;
    this.onChange = onChange ?? null;

    this.style.border = "single";
    this.style.padding = { top: 0, bottom: 0, left: 1, right: 1 };
    this.height = { fixed: 3 };

    this.onPaint = (buf, rect, theme) => {
      const isFocused = this.focused;
      const bg = theme.panelBg;

      const selected = this.options[this.selectedIndex] ?? "";
      const arrow = this._openUp ? "▲" : "▼";
      const text = `${selected} ${arrow}`;
      const textFg = isFocused ? theme.highlight : theme.text;

      for (let col = 0; col < rect.width && col < text.length; col++) {
        buf.set(rect.x + col, rect.y, {
          char: text[col],
          fg: textFg,
          bg,
          bold: isFocused,
        });
      }

      if (this.open && this.options.length > 0) {
        const visible = Math.min(this.options.length, this.maxVisible);
        const listBg = theme.toolbarBg;
        const listY = this._openUp ? rect.y - visible : rect.y + 1;

        for (let row = 0; row < visible; row++) {
          const itemIndex = row;
          const isCur = itemIndex === this._cursorIndex;
          for (let col = 0; col < rect.width; col++) {
            const ch = col < this.options[itemIndex].length
              ? this.options[itemIndex][col]
              : " ";
            buf.set(rect.x + col, listY + row, {
              char: ch,
              fg: isCur ? theme.bg : theme.text,
              bg: isCur ? theme.highlight : listBg,
              bold: isCur,
            });
          }
        }
      }
    };

    this.onKey = (key, modifiers) => {
      if (this.open) {
        if (key === "ArrowDown") {
          if (this._cursorIndex < this.options.length - 1) this._cursorIndex++;
        } else if (key === "ArrowUp") {
          if (this._cursorIndex > 0) this._cursorIndex--;
        } else if (key === "Enter") {
          this._select(this._cursorIndex);
        } else if (key === "Escape") {
          this._close();
        }
        return;
      }

      if (key === "Enter" || key === " ") {
        this._open();
      } else if (key === "ArrowDown") {
        if (this.selectedIndex < this.options.length - 1) {
          this._select(this.selectedIndex + 1);
        }
      } else if (key === "ArrowUp") {
        if (this.selectedIndex > 0) {
          this._select(this.selectedIndex - 1);
        }
      } else if (key === "Home") {
        this._select(0);
      } else if (key === "End") {
        this._select(this.options.length - 1);
      }
    };

    this.onMouse = (_col, row, action) => {
      if (action === "press") {
        if (this.open) {
          const visible = Math.min(this.options.length, this.maxVisible);
          let index = -1;
          if (this._openUp) {
            const listY = this.rect.y - visible;
            index = row - listY;
          } else {
            const listY = this.rect.y + 2;
            index = row - listY;
          }
          if (index >= 0 && index < this.options.length) {
            this._select(index);
          } else {
            this._close();
          }
        } else {
          this._open();
        }
      }
    };

    this.handleTab = () => {
      if (this.open) {
        this._close();
        return true;
      }
      return false;
    };
  }

  private _open(): void {
    if (this.options.length === 0) return;
    this.open = true;
    this._cursorIndex = this.selectedIndex;

    const visible = Math.min(this.options.length, this.maxVisible);
    const termSize = getTermSize();
    const spaceBelow = termSize.rows - (this.rect.y + 3);
    this._openUp = spaceBelow < visible && this.rect.y >= visible;
  }

  private _close(): void {
    this.open = false;
  }

  private _select(index: number): void {
    if (index < 0 || index >= this.options.length) return;
    this.selectedIndex = index;
    this.open = false;
    if (this.onChange) this.onChange(this.options[index], index);
  }

  override hitTest(col: number, row: number): Box | null {
    const r = this.rect;
    if (col < r.x || col >= r.x + r.width) return null;
    if (row >= r.y && row < r.y + r.height) return this;
    if (this.open) {
      const visible = Math.min(this.options.length, this.maxVisible);
      if (this._openUp && row >= r.y - visible && row < r.y) return this;
      if (!this._openUp && row >= r.y + r.height && row < r.y + r.height + visible) return this;
    }
    return null;
  }
}
