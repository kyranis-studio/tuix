import { Rect } from "../layout.ts";
import { CellBuffer } from "../terminal.ts";
import { Theme } from "../theme.ts";
import { InputPrimitive } from "./input_primitive.ts";

export class TextArea extends InputPrimitive {
  minRows = 3;
  maxLines: number | null = null;

  constructor(
    label = "TextArea",
    placeholder = "",
    value = "",
    onChange?: (val: string) => void,
    maxLines?: number,
    copyOnSelect = false,
    notifyOnCopy = false,
    copyNotificationMessage = "Copied!",
  ) {
    super(
      label,
      placeholder,
      value,
      onChange ?? null,
      copyOnSelect,
      notifyOnCopy,
      copyNotificationMessage,
    );
    this.maxLines = maxLines ?? null;
    this.cursorPos = value.length;

    this._syncHeight();

    this.onFocus = () => {
      this.cursorPos = Math.max(
        0,
        Math.min(this.cursorPos, this.value.length),
      );
    };

    this.onPaint = (buf, rect, theme) => {
      this.renderContent(buf, rect, theme);
    };
  }

  // ────────────────────────────────────────────────────────────
  //  Override points
  // ────────────────────────────────────────────────────────────

  protected override _onEnter(): void {
    this.value =
      this.value.slice(0, this.cursorPos) +
      "\n" +
      this.value.slice(this.cursorPos);
    this.cursorPos++;
    this._syncHeight();
    if (this.onChange) this.onChange(this.value);
  }

  protected override _onHome(
    modifiers: { ctrl: boolean; alt: boolean; shift: boolean },
  ): void {
    if (modifiers.ctrl) {
      this.cursorPos = 0;
    } else {
      this.cursorPos = this._lineStart(this._cursorRow());
    }
  }

  protected override _onEnd(
    modifiers: { ctrl: boolean; alt: boolean; shift: boolean },
  ): void {
    if (modifiers.ctrl) {
      this.cursorPos = this.value.length;
    } else {
      this.cursorPos = this._lineEnd(this._cursorRow());
    }
  }

  protected override _onValueChanged(): void {
    this._syncHeight();
  }

  protected override _onArrowUp(): void {
    const col = this._cursorCol();
    const row = this._cursorRow();
    if (row > 0) {
      this.cursorPos =
        this._lineStart(row - 1) + Math.min(col, this._lineLength(row - 1));
    }
  }

  protected override _onArrowDown(): void {
    const col = this._cursorCol();
    const row = this._cursorRow();
    if (row < this._rowCount() - 1) {
      this.cursorPos =
        this._lineStart(row + 1) + Math.min(col, this._lineLength(row + 1));
    }
  }

  protected override _mouseToCursor(
    col: number,
    row: number,
    contentX: number,
    contentY: number,
  ): number | null {
    const relRow = row - contentY;
    if (relRow < 0) return null;
    const lineIdx = this.scrollY + relRow;
    const lines = this._lines();
    if (lineIdx >= 0 && lineIdx < lines.length) {
      const relCol = col - contentX;
      const clamped = Math.max(
        0,
        Math.min(relCol, lines[lineIdx].length),
      );
      return this._lineStart(lineIdx) + clamped;
    } else if (lineIdx >= lines.length) {
      return this.value.length;
    }
    return null;
  }

  protected override _selectLine(): void {
    const row = this._cursorRow();
    const lines = this._lines();
    if (row < 0 || row >= lines.length) return;
    this._selStart = this._lineStart(row);
    this._selEnd = this._lineEnd(row);
    this.cursorPos = this._selEnd;
  }



  // ────────────────────────────────────────────────────────────
  //  Rendering
  // ────────────────────────────────────────────────────────────

  renderContent(buf: CellBuffer, rect: Rect, theme: Theme): void {
    const isFocused = this.focused;
    const showPlaceholder = !this.value;
    const bg = isFocused ? theme.inputFocusBg : theme.inputBg;
    const ch = rect.height;
    const totalRows = this._rowCount();
    const sbX = rect.x + rect.width - 1;
    const cw = Math.max(0, rect.width - 1);

    // Customizable scrollbar chars
    const sb = this.style.scrollbar ?? {};
    const showArrows = sb.showArrows ?? true;
    const vTrack = sb.verticalTrack ?? "│";
    const vThumb = sb.verticalThumb ?? "▌";
    const upArrow = sb.arrowUp ?? "↑";
    const downArrow = sb.arrowDown ?? "↓";

    // Clear text area
    for (let row = 0; row < ch; row++) {
      for (let col = 0; col < cw; col++) {
        buf.set(rect.x + col, rect.y + row, {
          char: " ",
          fg: theme.text,
          bg,
        });
      }
    }

    if (showPlaceholder) {
      for (let col = 0; col < cw && col < this.placeholder.length; col++) {
        const isCur = isFocused && col === this.cursorPos;
        buf.set(rect.x + col, rect.y, {
          char: this.placeholder[col],
          fg: isCur ? bg : theme.muted,
          bg: isCur ? theme.muted : bg,
          bold: isCur,
        });
      }
      if (
        isFocused &&
        this.cursorPos < cw &&
        this.cursorPos >= this.placeholder.length
      ) {
        buf.set(rect.x + this.cursorPos, rect.y, {
          char: " ",
          fg: bg,
          bg: theme.highlight,
        });
      }
    } else {
      const cursorRow = this._cursorRow();
      const cursorCol = this._cursorCol();

      // Scroll to keep cursor visible
      if (cursorRow < this.scrollY) this.scrollY = cursorRow;
      else if (cursorRow >= this.scrollY + ch)
        this.scrollY = cursorRow - ch + 1;
      this.scrollY = Math.max(
        0,
        Math.min(this.scrollY, this.scrollMaxY),
      );

      const lines = this._lines();
      const selActive = this._hasSelection();
      const selMin = selActive
        ? Math.min(this._selStart, this._selEnd)
        : -1;
      const selMax = selActive
        ? Math.max(this._selStart, this._selEnd)
        : -1;
      const pasteRanges = this._findPasteRanges();
      const inPasteRange = (idx: number) =>
        pasteRanges.some((r) => idx >= r.start && idx < r.end);
      const pasteShadeAt = (idx: number): { r: number; g: number; b: number } | null => {
        for (const r of pasteRanges) {
          if (idx >= r.start && idx < r.end) return this.getPasteShade(r.pasteIndex);
        }
        return null;
      };

      for (let row = 0; row < ch; row++) {
        const lineIdx = this.scrollY + row;
        if (lineIdx >= lines.length) break;
        const line = lines[lineIdx];
        for (let col = 0; col < cw; col++) {
          const charIdx = this._lineStart(lineIdx) + col;
          const inSel =
            selActive && charIdx >= selMin && charIdx < selMax;
          const isCur =
            isFocused && lineIdx === cursorRow && col === cursorCol;
          const isMarker = !inSel && !isCur && inPasteRange(charIdx);

          if (col < line.length) {
            const ch = this._getDisplayChar(line[col]);
            if (inSel && isCur) {
              buf.set(rect.x + col, rect.y + row, {
                char: ch,
                fg: bg,
                bg: theme.text,
                bold: true,
              });
            } else if (inSel) {
              buf.set(rect.x + col, rect.y + row, {
                char: ch,
                fg: theme.appBg,
                bg: theme.highlight,
              });
            } else if (isCur) {
              buf.set(rect.x + col, rect.y + row, {
                char: ch,
                fg: bg,
                bg: theme.text,
                bold: true,
              });
            } else if (isMarker) {
              const shade = pasteShadeAt(charIdx);
              buf.set(rect.x + col, rect.y + row, {
                char: ch,
                fg: shade ?? theme.muted,
                bg,
                bold: true,
              });
            } else {
              buf.set(rect.x + col, rect.y + row, {
                char: ch,
                fg: theme.text,
                bg,
              });
            }
          } else if (isCur) {
            buf.set(rect.x + col, rect.y + row, {
              char: " ",
              fg: bg,
              bg: theme.highlight,
            });
          }
        }
      }
    }

    // ── Scrollbar with customizable characters and arrows ──────
    const maxScroll = this.scrollMaxY;
    if (maxScroll <= 0) {
      for (let row = 0; row < ch; row++) {
        buf.set(sbX, rect.y + row, { char: vTrack, fg: theme.muted, bg });
      }
    } else {
      const arrowTop = showArrows;
      const arrowBot = showArrows;
      const arrowSlots = (arrowTop ? 1 : 0) + (arrowBot ? 1 : 0);
      const availH = ch - arrowSlots;

      if (availH <= 0) {
        if (arrowTop) buf.set(sbX, rect.y, { char: upArrow, fg: theme.muted, bg });
        if (arrowBot) buf.set(sbX, rect.y + ch - 1, { char: downArrow, fg: theme.muted, bg });
      } else {
        const thumbH = Math.max(1, Math.floor((availH / totalRows) * availH));
        const thumbY = Math.floor(
          (this.scrollY / maxScroll) * (availH - thumbH),
        );

        let row = 0;
        if (arrowTop) {
          const canScrollUp = this.scrollY > 0;
          buf.set(sbX, rect.y + row, { char: upArrow, fg: canScrollUp ? theme.text : theme.muted, bg, bold: canScrollUp });
          row++;
        }
        for (let r = 0; r < availH; r++) {
          const isThumb = r >= thumbY && r < thumbY + thumbH;
          buf.set(sbX, rect.y + row, {
            char: isThumb ? vThumb : vTrack,
            fg: isThumb ? theme.highlight : theme.muted,
            bg,
          });
          row++;
        }
        if (arrowBot) {
          const canScrollDown = this.scrollY < maxScroll;
          buf.set(sbX, rect.y + row, { char: downArrow, fg: canScrollDown ? theme.text : theme.muted, bg, bold: canScrollDown });
        }
      }
    }
  }

  // ────────────────────────────────────────────────────────────
  //  Line helpers
  // ────────────────────────────────────────────────────────────

  protected _lines(): string[] {
    return this.value.split("\n");
  }

  protected _cursorRow(): number {
    return this.value.slice(0, this.cursorPos).split("\n").length - 1;
  }

  protected _cursorCol(): number {
    const before = this.value.slice(0, this.cursorPos);
    const nl = before.lastIndexOf("\n");
    return nl >= 0 ? this.cursorPos - nl - 1 : this.cursorPos;
  }

  protected _lineStart(row: number): number {
    let pos = 0;
    for (let i = 0; i < row; i++) {
      const nl = this.value.indexOf("\n", pos);
      if (nl < 0) return this.value.length;
      pos = nl + 1;
    }
    return pos;
  }

  protected _lineEnd(row: number): number {
    const start = this._lineStart(row);
    const nl = this.value.indexOf("\n", start);
    return nl >= 0 ? nl : this.value.length;
  }

  protected _lineLength(row: number): number {
    return this._lineEnd(row) - this._lineStart(row);
  }

  protected _rowCount(): number {
    return this._lines().length;
  }

  private _syncHeight(): void {
    const p = this.style.padding;
    const hasBorder = this.style.border !== "none";
    const bOff = hasBorder ? 1 : 0;
    const lines = this._lines().length;
    const needed = Math.max(lines + 1, this.minRows);
    const capped =
      this.maxLines !== null ? Math.min(needed, this.maxLines) : needed;
    this.height.fixed = bOff * 2 + p.top + p.bottom + capped;
    this.scrollMaxY = Math.max(0, lines - capped);
    this.scrollY = Math.min(this.scrollY, this.scrollMaxY);
  }
}
