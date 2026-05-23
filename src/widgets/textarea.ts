import { Box } from "../layout.ts";

export class TextArea extends Box {
  value = "";
  placeholder = "";
  cursorPos = 0;
  scrollRow = 0;
  minRows = 3;
  maxLines: number | null = null;
  onChange: ((val: string) => void) | null = null;

  constructor(placeholder = "", value = "", onChange?: (val: string) => void, maxLines?: number) {
    super("TextArea");
    this.focusable = true;
    this.tabIndex = 0;
    this.placeholder = placeholder;
    this.value = value;
    this.cursorPos = value.length;
    this.onChange = onChange ?? null;
    this.maxLines = maxLines ?? null;

    this.style.border = "single";
    this.style.padding = { top: 0, bottom: 0, left: 1, right: 1 };
    this._syncHeight();

    this.onFocus = () => {
      this.cursorPos = 0;
      this.scrollRow = 0;
    };

    this.onPaint = (buf, rect, theme) => {
      const isFocused = this.focused;
      const showPlaceholder = !this.value;
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

      if (showPlaceholder) {
        for (let col = 0; col < cw; col++) {
          if (col < this.placeholder.length) {
            const isCur = isFocused && col === this.cursorPos;
            buf.set(cx + col, cy, {
              char: this.placeholder[col],
              fg: isCur ? bg : theme.muted,
              bg: isCur ? theme.muted : bg,
              bold: isCur,
            });
          } else if (isFocused && col === this.cursorPos) {
            buf.set(cx + col, cy, {
              char: " ",
              fg: bg,
              bg: theme.highlight,
            });
          }
        }
        return;
      }

      const cursorRow = this._cursorRow();
      const cursorCol = this._cursorCol();

      if (cursorRow < this.scrollRow) this.scrollRow = cursorRow;
      else if (cursorRow >= this.scrollRow + ch) this.scrollRow = cursorRow - ch + 1;

      const lines = this._lines();
      for (let row = 0; row < ch; row++) {
        const lineIdx = this.scrollRow + row;
        if (lineIdx >= lines.length) break;
        const line = lines[lineIdx];
        for (let col = 0; col < cw; col++) {
          if (col < line.length) {
            const isCur = isFocused && lineIdx === cursorRow && col === cursorCol;
            buf.set(cx + col, cy + row, {
              char: line[col],
              fg: isCur ? bg : theme.text,
              bg: isCur ? theme.text : bg,
              bold: isCur,
            });
          } else if (isFocused && lineIdx === cursorRow && col === cursorCol) {
            buf.set(cx + col, cy + row, {
              char: " ",
              fg: bg,
              bg: theme.highlight,
            });
          }
        }
      }

      if (this.maxLines !== null && lines.length > ch) {
        if (this.scrollRow > 0) {
          buf.set(cx + cw - 1, cy, { char: "▲", fg: theme.text, bg });
        }
        if (this.scrollRow + ch < lines.length) {
          buf.set(cx + cw - 1, cy + ch - 1, { char: "▼", fg: theme.text, bg });
        }
      }
    };

    this.onKey = (key, modifiers) => {
      if (key === "Backspace") {
        if (this.cursorPos > 0) {
          this.value = this.value.slice(0, this.cursorPos - 1) + this.value.slice(this.cursorPos);
          this.cursorPos--;
          this._syncHeight();
          if (this.onChange) this.onChange(this.value);
        }
      } else if (key === "Enter") {
        this.value = this.value.slice(0, this.cursorPos) + "\n" + this.value.slice(this.cursorPos);
        this.cursorPos++;
        this._syncHeight();
        if (this.onChange) this.onChange(this.value);
      } else if (key === "ArrowLeft") {
        if (this.cursorPos > 0) this.cursorPos--;
      } else if (key === "ArrowRight") {
        if (this.cursorPos < this.value.length) this.cursorPos++;
      } else if (key === "ArrowUp") {
        const col = this._cursorCol();
        const row = this._cursorRow();
        if (row > 0) {
          const prevLen = this._lineLength(row - 1);
          this.cursorPos = this._lineStart(row - 1) + Math.min(col, prevLen);
        }
      } else if (key === "ArrowDown") {
        const col = this._cursorCol();
        const row = this._cursorRow();
        if (row < this._rowCount() - 1) {
          const nextLen = this._lineLength(row + 1);
          this.cursorPos = this._lineStart(row + 1) + Math.min(col, nextLen);
        }
      } else if (key === "Home") {
        this.cursorPos = this._lineStart(this._cursorRow());
      } else if (key === "End") {
        this.cursorPos = this._lineEnd(this._cursorRow());
      } else if (key.length === 1 && !modifiers.ctrl && !modifiers.alt) {
        this.value = this.value.slice(0, this.cursorPos) + key + this.value.slice(this.cursorPos);
        this.cursorPos++;
        this._syncHeight();
        if (this.onChange) this.onChange(this.value);
      }
    };

    this.onMouse = (col, row, action) => {
      if (action === "press") {
        const hasBorder = this.style.border !== "none";
        const bOff = hasBorder ? 1 : 0;
        const p = this.style.padding;
        const cy = this.rect.y + bOff + p.top;
        const relRow = row - cy;
        if (relRow >= 0) {
          const lineIdx = this.scrollRow + relRow;
          const lines = this._lines();
          if (lineIdx >= 0 && lineIdx < lines.length) {
            const cx = this.rect.x + bOff + p.left;
            const relCol = col - cx;
            const clamped = Math.max(0, Math.min(relCol, lines[lineIdx].length));
            this.cursorPos = this._lineStart(lineIdx) + clamped;
          }
        }
      }
    };
  }

  private _lines(): string[] {
    return this.value.split("\n");
  }

  private _cursorRow(): number {
    return this.value.slice(0, this.cursorPos).split("\n").length - 1;
  }

  private _cursorCol(): number {
    const before = this.value.slice(0, this.cursorPos);
    const nl = before.lastIndexOf("\n");
    return nl >= 0 ? this.cursorPos - nl - 1 : this.cursorPos;
  }

  private _lineStart(row: number): number {
    let pos = 0;
    for (let i = 0; i < row; i++) {
      const nl = this.value.indexOf("\n", pos);
      if (nl < 0) return this.value.length;
      pos = nl + 1;
    }
    return pos;
  }

  private _lineEnd(row: number): number {
    const start = this._lineStart(row);
    const nl = this.value.indexOf("\n", start);
    return nl >= 0 ? nl : this.value.length;
  }

  private _lineLength(row: number): number {
    return this._lineEnd(row) - this._lineStart(row);
  }

  private _rowCount(): number {
    return this._lines().length;
  }

  private _syncHeight(): void {
    const p = this.style.padding;
    const hasBorder = this.style.border !== "none";
    const bOff = hasBorder ? 1 : 0;
    const lines = this._lines().length;
    const needed = Math.max(lines + 1, this.minRows);
    const capped = this.maxLines !== null ? Math.min(needed, this.maxLines) : needed;
    this.height.fixed = bOff * 2 + p.top + p.bottom + capped;
  }
}
