import { Box } from "../layout.ts";

export class Dropdown extends Box {
  options: string[] = [];
  selectedIndex = 0;
  open = false;
  onChange: ((value: string, index: number) => void) | null = null;
  maxVisible = 6;

  private _cursorIndex = 0;

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

      const hasBorder = this.style.border !== "none";
      const bOff = hasBorder ? 1 : 0;
      const p = this.style.padding;
      const cx = rect.x + bOff + p.left;
      const cy = rect.y + bOff + p.top;
      const cw = Math.max(1, rect.width - bOff * 2 - p.left - p.right);
      const ch = Math.max(1, rect.height - bOff * 2 - p.top - p.bottom);

      for (let row = 0; row < ch; row++) {
        for (let col = 0; col < cw; col++) {
          buf.set(cx + col, cy + row, { char: " ", fg: theme.text, bg });
        }
      }

      const selected = this.options[this.selectedIndex] ?? "";
      const arrow = this.open ? "▲" : "▼";
      const text = `${selected} ${arrow}`;
      const textFg = isFocused ? theme.highlight : theme.text;

      for (let col = 0; col < cw && col < text.length; col++) {
        buf.set(cx + col, cy, {
          char: text[col],
          fg: textFg,
          bg,
          bold: isFocused,
        });
      }

      if (this.open && this.options.length > 0) {
        const visible = Math.min(this.options.length, this.maxVisible);
        const listY = cy + ch;
        const listH = visible;

        for (let row = 0; row < listH; row++) {
          const itemIndex = row;
          const isCur = itemIndex === this._cursorIndex;
          for (let col = 0; col < cw; col++) {
            const ch = col < this.options[itemIndex].length
              ? this.options[itemIndex][col]
              : " ";
            buf.set(cx + col, listY + row, {
              char: ch,
              fg: isCur ? theme.bg : theme.text,
              bg: isCur ? theme.highlight : theme.panelBg,
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
          const hasBorder = this.style.border !== "none";
          const bOff = hasBorder ? 1 : 0;
          const p = this.style.padding;
          const cy = this.rect.y + bOff + p.top;
          const ch = Math.max(1, this.rect.height - bOff * 2 - p.top - p.bottom);
          const listY = cy + ch;
          const index = row - listY;
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
    this._syncListHeight();
  }

  private _close(): void {
    this.open = false;
    this._syncListHeight();
  }

  private _select(index: number): void {
    if (index < 0 || index >= this.options.length) return;
    this.selectedIndex = index;
    this.open = false;
    this._syncListHeight();
    if (this.onChange) this.onChange(this.options[index], index);
  }

  private _syncListHeight(): void {
    const visible = this.open
      ? Math.min(this.options.length, this.maxVisible)
      : 0;
    this.height = { fixed: 3 + visible };
  }

  override hitTest(col: number, row: number): Box | null {
    const r = this.rect;
    if (col < r.x || col >= r.x + r.width) return null;
    if (row < r.y || row >= r.y + r.height) return null;
    return this;
  }
}
