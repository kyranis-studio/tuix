/**
 * splitter.ts — Resizable panel splitter driven by mouse drag.
 */

import { Box, Rect } from "./layout.ts";
import { CellBuffer } from "./terminal.ts";
import { Theme, getBorderChars } from "./theme.ts";

export type SplitDirection = "horizontal" | "vertical";
export type SplitterValue = number | `${number}%`;

export class Splitter extends Box {
  private _direction: SplitDirection;
  private _panelA: Box;
  private _panelB: Box;
  /** Size of panel A in the split axis (chars). Grow fills remainder. */
  private _splitPos: number;
  private _dragging = false;
  private _dragStart = 0;
  private _splitStart = 0;
  private _initialSplit: SplitterValue;
  private _minOptA: SplitterValue;
  private _minOptB: SplitterValue;
  private _minA: number;
  private _minB: number;
  private _handleThickness = 1;
  private _splitResolved = false;

  constructor(
    direction: SplitDirection,
    panelA: Box,
    panelB: Box,
    opts: { initialSplit?: SplitterValue; minA?: SplitterValue; minB?: SplitterValue } = {},
  ) {
    super("splitter");
    this._direction = direction;
    this._panelA = panelA;
    this._panelB = panelB;
    this._initialSplit = opts.initialSplit ?? 40;
    this._splitPos = typeof this._initialSplit === "number" ? this._initialSplit : 0;
    this._splitResolved = typeof this._initialSplit === "number";
    this._minOptA = opts.minA ?? 5;
    this._minOptB = opts.minB ?? 5;
    this._minA = typeof this._minOptA === "number" ? this._minOptA : 0;
    this._minB = typeof this._minOptB === "number" ? this._minOptB : 0;

    // Splitter is a column (or row) container
    this.style.direction = direction === "horizontal" ? "row" : "column";
    this.style.gutter = 0;

    // We don't add children normally; we manage them manually
    this.children = [panelA, panelB];
    panelA.parent = this;
    panelB.parent = this;
  }

  get splitPos(): number { return this._splitPos; }
  set splitPos(v: number) { this._splitPos = v; }

  /** Call this when a mouse press event hits the splitter handle area. */
  startDrag(coord: number): void {
    this._dragging = true;
    this._dragStart = coord;
    this._splitStart = this._splitPos;
  }

  /** Call on mouse move events. */
  updateDrag(coord: number): void {
    if (!this._dragging) return;
    const delta = coord - this._dragStart;
    const isH = this._direction === "horizontal";
    const available = isH ? this.rect.width : this.rect.height;
    const maxA = available - this._minB - this._handleThickness;
    this._splitPos = Math.max(
      this._minA,
      Math.min(maxA, this._splitStart + delta),
    );
  }

  /** Call on mouse release. */
  endDrag(): void {
    this._dragging = false;
  }

  private _resolveValue(v: SplitterValue, available: number): number {
    if (typeof v === "string") {
      const pct = parseInt(v);
      if (isNaN(pct)) return 0;
      return Math.floor(available * pct / 100);
    }
    return v;
  }

  get isDragging(): boolean { return this._dragging; }

  /** Check if a terminal coordinate lands on the handle. */
  isHandle(col: number, row: number): boolean {
    const r = this.rect;
    if (this._direction === "horizontal") {
      const handleCol = r.x + this._splitPos;
      return row >= r.y && row < r.y + r.height && col === handleCol;
    } else {
      const handleRow = r.y + this._splitPos;
      return col >= r.x && col < r.x + r.width && row === handleRow;
    }
  }

  override layout(parentRect: Rect): void {
    const m = this.style.margin;
    const outerX = parentRect.x + m.left;
    const outerY = parentRect.y + m.top;
    const outerW = parentRect.width - m.left - m.right;
    const outerH = parentRect.height - m.top - m.bottom;

    this.rect = { x: outerX, y: outerY, width: outerW, height: outerH };

    const isH = this._direction === "horizontal";
    const available = isH ? outerW : outerH;

    // Resolve percentage-based initial split on first layout
    if (!this._splitResolved) {
      this._splitPos = this._resolveValue(this._initialSplit, available);
      this._splitResolved = true;
    }

    // Re-resolve min values each layout (percentage mins adapt to container)
    this._minA = this._resolveValue(this._minOptA, available);
    this._minB = this._resolveValue(this._minOptB, available);

    // Clamp within valid range (block resize at min/max)
    const maxA = available - this._minB - this._handleThickness;
    this._splitPos = Math.max(this._minA, Math.min(this._splitPos, maxA));

    if (isH) {
      const aW = this._splitPos;
      const bW = Math.max(0, outerW - aW - this._handleThickness);
      this._panelA.layout({ x: outerX, y: outerY, width: aW, height: outerH });
      this._panelB.layout({
        x: outerX + aW + this._handleThickness,
        y: outerY,
        width: bW,
        height: outerH,
      });
    } else {
      const aH = this._splitPos;
      const bH = Math.max(0, outerH - aH - this._handleThickness);
      this._panelA.layout({ x: outerX, y: outerY, width: outerW, height: aH });
      this._panelB.layout({
        x: outerX,
        y: outerY + aH + this._handleThickness,
        width: outerW,
        height: bH,
      });
    }
  }

  override paint(buf: CellBuffer, theme: Theme): void {
    // Paint panels
    this._panelA.paint(buf, theme);
    this._panelB.paint(buf, theme);

    // Paint handle
    const r = this.rect;
    const handleColor = this._dragging ? theme.highlight : theme.splitter;
    const handleChar = this._direction === "horizontal" ? "┃" : "━";

    if (this._direction === "horizontal") {
      const hCol = r.x + this._splitPos;
      for (let row = r.y; row < r.y + r.height; row++) {
        buf.set(hCol, row, {
          char: handleChar,
          fg: handleColor,
          bg: theme.appBg,
          bold: this._dragging,
        });
      }
      // Center drag indicator
      const midRow = r.y + Math.floor(r.height / 2);
      buf.set(hCol, midRow, { char: "◈", fg: theme.highlight, bg: theme.appBg, bold: true });
    } else {
      const hRow = r.y + this._splitPos;
      for (let col = r.x; col < r.x + r.width; col++) {
        buf.set(col, hRow, {
          char: handleChar,
          fg: handleColor,
          bg: theme.appBg,
          bold: this._dragging,
        });
      }
      const midCol = r.x + Math.floor(r.width / 2);
      buf.set(midCol, hRow, { char: "◈", fg: theme.highlight, bg: theme.appBg, bold: true });
    }
  }
}
