import { Rect } from "../layout.ts";
import { CellBuffer } from "../terminal.ts";
import { Theme } from "../theme.ts";
import { InputPrimitive } from "./input_primitive.ts";

export class TextInput extends InputPrimitive {
  constructor(
    label = "Input",
    placeholder = "",
    value = "",
    onChange?: (val: string) => void,
    copyOnSelect = false,
    notifyOnCopy = false,
    copyNotificationMessage = "Copied!",
    burstThreshold?: number,
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
    this.burstThreshold = burstThreshold ?? null;
    this.height = { fixed: 3 };

    this.onFocus = () => {
      this.cursorPos = 0;
    };

    this.onPaint = (buf, rect, theme) => {
      this.renderContent(buf, rect, theme);
    };
  }

  renderContent(buf: CellBuffer, rect: Rect, theme: Theme): void {
    const isFocused = this.focused;
    const showPlaceholder = !this.value;
    const bg = isFocused ? theme.inputFocusBg : theme.inputBg;

    if (showPlaceholder) {
      const fg = theme.muted;
      for (let i = 0; i < rect.width; i++) {
        const isCursorHere = isFocused && i === this.cursorPos;
        if (i < this.placeholder.length) {
          buf.set(rect.x + i, rect.y, {
            char: this.placeholder[i],
            fg: isCursorHere ? bg : fg,
            bg: isCursorHere ? fg : bg,
            bold: isCursorHere,
          });
        } else if (isCursorHere) {
          buf.set(rect.x + i, rect.y, {
            char: " ",
            fg: bg,
            bg: theme.highlight,
          });
        } else {
          buf.set(rect.x + i, rect.y, { char: " ", fg, bg });
        }
      }
      return;
    }

    // ── Overflow handling with "..." ─────────────────────────
    const maxW = rect.width;
    const textLen = this.value.length;

    // Auto-scroll to keep cursor visible
    this._ensureCursorVisible(maxW, textLen);

    const leftEllipsis = this.scrollX > 0;
    const rightEllipsis = this.scrollX + maxW < textLen;

    // Build visible slice
    let displayText = this.value.slice(this.scrollX, this.scrollX + maxW);
    let cursorScreenX = this.cursorPos - this.scrollX;
    let leftOffset = 0;
    const minW = 4; // minimum width to show ellipsis

    if (leftEllipsis && rightEllipsis && maxW >= minW + 2) {
      displayText = ".." + displayText.slice(2, maxW - 2) + "..";
      leftOffset = 2;
      cursorScreenX += 2;
    } else if (leftEllipsis && maxW >= minW) {
      displayText = ".." + displayText.slice(2);
      leftOffset = 2;
      cursorScreenX += 2;
    } else if (rightEllipsis && maxW >= minW) {
      displayText = displayText.slice(0, maxW - 2) + "..";
    }

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

    for (let i = 0; i < maxW; i++) {
      const charIdx = this.scrollX + i - leftOffset;
      const inSel =
        selActive && charIdx >= selMin && charIdx < selMax;
      const isCursorHere =
        isFocused && i === cursorScreenX;
      const isMarker = !inSel && !isCursorHere && inPasteRange(charIdx);

      if (i < displayText.length) {
        const ch = displayText[i];
        if (inSel && isCursorHere) {
          buf.set(rect.x + i, rect.y, {
            char: ch,
            fg: theme.primaryBg,
            bg: theme.text,
            bold: true,
          });
        } else if (inSel) {
          buf.set(rect.x + i, rect.y, {
            char: ch,
            fg: theme.appBg,
            bg: theme.highlight,
          });
        } else if (isCursorHere) {
          buf.set(rect.x + i, rect.y, {
            char: ch,
            fg: theme.primaryBg,
            bg: theme.text,
            bold: true,
          });
        } else if (isMarker) {
          const shade = pasteShadeAt(charIdx);
          buf.set(rect.x + i, rect.y, {
            char: ch,
            fg: shade ?? theme.muted,
            bg,
            bold: true,
          });
        } else {
          buf.set(rect.x + i, rect.y, {
            char: ch,
            fg: theme.text,
            bg,
          });
        }
      } else if (isCursorHere) {
        buf.set(rect.x + i, rect.y, {
          char: " ",
          fg: theme.primaryBg,
          bg: theme.highlight,
        });
      } else {
        buf.set(rect.x + i, rect.y, {
          char: " ",
          fg: theme.text,
          bg,
        });
      }
    }
  }

  protected override _mouseToCursor(
    col: number,
    _row: number,
    contentX: number,
    _contentY: number,
  ): number | null {
    const maxW = this._contentWidth();
    const leftEllipsis = this.scrollX > 0;
    const leftOff = leftEllipsis ? 2 : 0;
    const relCol = col - contentX;
    let pos = this.scrollX + relCol - leftOff;
    if (pos < 0) pos = 0;
    if (pos > this.value.length) pos = this.value.length;
    return pos;
  }

  private _contentWidth(): number {
    const hasBorder = this.style.border !== "none";
    const bOff = hasBorder ? 2 : 0;
    const p = this.style.padding;
    return Math.max(0, this.rect.width - bOff - p.left - p.right);
  }

  private _ensureCursorVisible(maxW: number, textLen: number): void {
    const cursorScreenX = this.cursorPos - this.scrollX;
    const margin = 2;
    if (cursorScreenX < margin) {
      this.scrollX = Math.max(0, this.cursorPos - margin);
    } else if (cursorScreenX >= maxW - margin) {
      this.scrollX = Math.min(
        Math.max(0, textLen - maxW),
        this.cursorPos - maxW + margin,
      );
    }
    this.scrollX = Math.max(
      0,
      Math.min(this.scrollX, Math.max(0, textLen - maxW)),
    );
  }
}
