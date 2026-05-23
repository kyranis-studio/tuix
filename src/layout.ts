/**
 * layout.ts — Flex-like layout engine with fixed/grow sizing,
 * padding, margin, gutter, border, and alignment.
 */

import { CellBuffer } from "./terminal.ts";
import { Theme, getBorderChars, BorderStyle } from "./theme.ts";

// ─── Geometry ─────────────────────────────────────────────────────────────────

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// ─── Sizing ───────────────────────────────────────────────────────────────────

export interface SizeConstraint {
  /** Fixed character count — overrides grow/shrink */
  fixed?: number;
  /** Flex-grow factor (default 1 when no fixed) */
  grow?: number;
  /** Minimum characters */
  min?: number;
  /** Maximum characters */
  max?: number;
}

// ─── Spacing ──────────────────────────────────────────────────────────────────

export interface Edges {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

function edgesZero(): Edges {
  return { top: 0, right: 0, bottom: 0, left: 0 };
}

function edgesAll(n: number): Edges {
  return { top: n, right: n, bottom: n, left: n };
}

function edgesXY(x: number, y: number): Edges {
  return { top: y, right: x, bottom: y, left: x };
}

export { edgesZero, edgesAll, edgesXY };

// ─── Box style ────────────────────────────────────────────────────────────────

export type Direction = "row" | "column";
export type Align = "start" | "center" | "end" | "stretch";
export type Justify =
  | "start"
  | "center"
  | "end"
  | "space-between"
  | "space-around";

/** Overflow behavior for content that exceeds the container bounds */
export type Overflow = "auto" | "scroll" | "hidden" | "visible";

export interface BoxStyle {
  direction: Direction;
  /** Spacing between children */
  gutter: number;
  padding: Edges;
  margin: Edges;
  align: Align; // cross-axis
  justify: Justify; // main-axis
  border: BorderStyle | "none";
  /** Override background color from theme */
  bg?: { r: number; g: number; b: number };
  /** Override foreground text color */
  fg?: { r: number; g: number; b: number };
  /** Overflow handling for content exceeding bounds (default: "auto") */
  overflow: Overflow;
}

function defaultStyle(): BoxStyle {
  return {
    direction: "row",
    gutter: 0,
    padding: edgesZero(),
    margin: edgesZero(),
    align: "stretch",
    justify: "start",
    border: "none",
    overflow: "auto",
  };
}

// ─── Box node ─────────────────────────────────────────────────────────────────

let _nextId = 0;

export class Box {
  readonly id: number;
  label: string;

  // Sizing constraints
  width: SizeConstraint;
  height: SizeConstraint;

  // Style
  style: BoxStyle;

  // Focus
  focusable: boolean;
  tabIndex: number;
  shortcut: string | null;
  focused: boolean;

  // Content
  /** Called during paint — override to render custom content */
  onPaint: ((buf: CellBuffer, rect: Rect, theme: Theme) => void) | null;

  /** Called on key events when this box is focused */
  onKey:
    | ((
        key: string,
        modifiers: { ctrl: boolean; alt: boolean; shift: boolean },
      ) => void)
    | null;

  /** Called on mouse events */
  onMouse: ((col: number, row: number, action: string) => void) | null;

  /** If set, called when Tab is pressed instead of navigating focus. Return true to consume Tab. */
  handleTab: (() => boolean) | null;

  /** Called when this box gains focus */
  onFocus: (() => void) | null;

  // Tree
  children: Box[];
  parent: Box | null;

  // Computed geometry (set during layout pass)
  rect: Rect;

  // Scrolling
  scrollX = 0;
  scrollY = 0;
  scrollMaxX = 0;
  scrollMaxY = 0;

  constructor(label = "") {
    this.id = _nextId++;
    this.label = label;
    this.width = {};
    this.height = {};
    this.style = defaultStyle();
    this.focusable = false;
    this.tabIndex = 0;
    this.shortcut = null;
    this.focused = false;
    this.onPaint = null;
    this.onKey = null;
    this.onMouse = null;
    this.handleTab = null;
    this.onFocus = null;
    this.children = [];
    this.parent = null;
    this.rect = { x: 0, y: 0, width: 0, height: 0 };
  }

  add(...children: Box[]): this {
    for (const c of children) {
      c.parent = this;
      this.children.push(c);
    }
    return this;
  }

  // ─── Layout pass ────────────────────────────────────────────────────────────

  layout(parentRect: Rect): void {
    const m = this.style.margin;

    const outerX = parentRect.x + m.left;
    const outerY = parentRect.y + m.top;
    const outerW = parentRect.width - m.left - m.right;
    const outerH = parentRect.height - m.top - m.bottom;

    const hasBorder = this.style.border !== "none";
    const bOff = hasBorder ? 1 : 0;
    const p = this.style.padding;

    const isRow = this.style.direction === "row";
    const gutter = this.style.gutter;
    const childCount = this.children.length;

    // Determine if auto-sized on main axis:
    // - Container has no fixed or grow on main axis
    // - No child has explicit grow (they'd need distributed space)
    const hasGrowChild = childCount > 0 && this.children.some((c) => {
      const sc = isRow ? c.width : c.height;
      return sc.grow !== undefined;
    });
    // Only auto-size if the container has no explicit constraint on the main axis
    // AND at least one child has a positive main-axis size (fixed or min > 0).
    // This prevents shrink-wrapping to zero when children have no intrinsic size.
    const hasContentChild = childCount > 0 && this.children.some((c) => {
      const sc = isRow ? c.width : c.height;
      return sc.fixed !== undefined || (sc.min !== undefined && sc.min > 0);
    });
    const autoSizeMain = !hasGrowChild && hasContentChild && childCount > 0 && (isRow
      ? (this.width.fixed === undefined && this.width.grow === undefined)
      : (this.height.fixed === undefined && this.height.grow === undefined));

    // Base sizes from parent constraints
    let selfW = this.width.fixed !== undefined
      ? clamp(this.width.fixed, this.width.min ?? 0, this.width.max ?? Infinity)
      : clamp(outerW, this.width.min ?? 0, this.width.max ?? Infinity);
    let selfH = this.height.fixed !== undefined
      ? clamp(this.height.fixed, this.height.min ?? 0, this.height.max ?? Infinity)
      : clamp(outerH, this.height.min ?? 0, this.height.max ?? Infinity);

    // Working content area
    let contentX = outerX + bOff + p.left;
    let contentY = outerY + bOff + p.top;
    let contentW = Math.max(0, selfW - bOff * 2 - p.left - p.right);
    let contentH = Math.max(0, selfH - bOff * 2 - p.top - p.bottom);

    if (childCount > 0) {
      // Resolve main-axis child sizes
      const mainAvailable = isRow ? contentW : contentH;
      const mainSizes = this._resolveMainAxis(mainAvailable, gutter, autoSizeMain);

      // Compute total content size on main axis
      const totalMain = mainSizes.reduce((a, b) => a + b, 0) + gutter * (childCount - 1);

      // Auto-size: shrink-wrap to content, clamped to available space
      if (autoSizeMain) {
        const contentExtent = totalMain + bOff * 2 +
          (isRow ? p.left + p.right : p.top + p.bottom);
        const maxExtent = isRow ? outerW : outerH;
        const clamped = Math.min(contentExtent, maxExtent);

        if (isRow) {
          selfW = clamp(clamped, this.width.min ?? 0, this.width.max ?? Infinity);
          contentW = Math.max(0, selfW - bOff * 2 - p.left - p.right);
        } else {
          selfH = clamp(clamped, this.height.min ?? 0, this.height.max ?? Infinity);
          contentH = Math.max(0, selfH - bOff * 2 - p.top - p.bottom);
        }
      }

      this.rect = { x: outerX, y: outerY, width: selfW, height: selfH };

      // Cross-axis available size
      const crossAvailable = isRow ? contentH : contentW;

      // Compute main-axis positions
      const freeSpace = (isRow ? contentW : contentH) - totalMain;
      let mainOffsets: number[];
      switch (this.style.justify) {
        case "center":
          mainOffsets = this._spreadOffsets(mainSizes, gutter, Math.floor(freeSpace / 2));
          break;
        case "end":
          mainOffsets = this._spreadOffsets(mainSizes, gutter, freeSpace);
          break;
        case "space-between": {
          const gap = childCount > 1 ? Math.floor(freeSpace / (childCount - 1)) : 0;
          mainOffsets = this._spreadOffsets(mainSizes, gap);
          break;
        }
        case "space-around": {
          const gap = Math.floor(freeSpace / childCount);
          mainOffsets = this._spreadOffsets(mainSizes, gap + gutter, Math.floor(gap / 2));
          break;
        }
        default: // "start"
          mainOffsets = this._spreadOffsets(mainSizes, gutter);
      }

      // Layout children with scroll offset
      for (let i = 0; i < childCount; i++) {
        const child = this.children[i];
        const mainSize = mainSizes[i];
        const mainOff = mainOffsets[i];

        let crossSize: number;
        if (isRow) {
          if (child.height.fixed !== undefined) {
            crossSize = child.height.fixed;
          } else if (this.style.align === "stretch") {
            crossSize = crossAvailable;
          } else {
            crossSize = Math.min(crossAvailable, child.height.max ?? crossAvailable);
          }
        } else {
          if (child.width.fixed !== undefined) {
            crossSize = child.width.fixed;
          } else if (this.style.align === "stretch") {
            crossSize = crossAvailable;
          } else {
            crossSize = Math.min(crossAvailable, child.width.max ?? crossAvailable);
          }
        }
        crossSize = Math.max(crossSize, 0);

        let crossOff = 0;
        const childCrossFixed = isRow
          ? (child.height.fixed ?? crossSize)
          : (child.width.fixed ?? crossSize);
        const actualCross = Math.min(childCrossFixed, crossSize);
        switch (this.style.align) {
          case "center":
            crossOff = Math.floor((crossAvailable - actualCross) / 2);
            break;
          case "end":
            crossOff = crossAvailable - actualCross;
            break;
          default:
            crossOff = 0;
        }

        const childParentRect: Rect = isRow
          ? { x: contentX + mainOff - this.scrollX, y: contentY + crossOff, width: mainSize, height: crossSize }
          : { x: contentX + crossOff, y: contentY + mainOff - this.scrollY, width: crossSize, height: mainSize };

        child.layout(childParentRect);
      }

      // Compute scroll max based on overflow mode
      const contentSize = totalMain;
      const viewportSize = isRow ? contentW : contentH;
      const overflow = this.style.overflow;

      if (overflow === "hidden" || overflow === "visible") {
        this.scrollMaxX = 0;
        this.scrollMaxY = 0;
      } else {
        const maxScroll = Math.max(0, contentSize - viewportSize);
        this.scrollMaxX = isRow ? maxScroll : 0;
        this.scrollMaxY = isRow ? 0 : maxScroll;
      }

      this.scrollX = clamp(this.scrollX, 0, this.scrollMaxX);
      this.scrollY = clamp(this.scrollY, 0, this.scrollMaxY);
    } else {
      this.rect = { x: outerX, y: outerY, width: selfW, height: selfH };
      // Leaf nodes (e.g. TextArea) manage their own scroll — don't reset
    }
  }

  private _resolveMainAxis(
    available: number,
    gutter: number,
    autoSize: boolean,
  ): number[] {
    const children = this.children;
    const n = children.length;
    if (n === 0) return [];

    const totalGutter = gutter * (n - 1);
    let remaining = available - totalGutter;

    const sizes = new Array<number>(n).fill(0);
    let totalGrow = 0;

    for (let i = 0; i < n; i++) {
      const c = children[i];
      const isRow = this.style.direction === "row";
      const sc = isRow ? c.width : c.height;

      if (sc.fixed !== undefined) {
        const sz = clamp(sc.fixed, sc.min ?? 0, sc.max ?? sc.fixed);
        sizes[i] = sz;
        remaining -= sz;
      } else if (autoSize) {
        sizes[i] = sc.min ?? 0;
      } else {
        totalGrow += sc.grow ?? 1;
      }
    }

    remaining = Math.max(0, remaining);

    // Distribute remaining space to grow children
    if (!autoSize) {
      for (let i = 0; i < n; i++) {
        const c = children[i];
        const isRow = this.style.direction === "row";
        const sc = isRow ? c.width : c.height;
        if (sc.fixed === undefined) {
          const growFactor = sc.grow ?? 1;
          const share =
            totalGrow > 0
              ? Math.floor((growFactor / totalGrow) * remaining)
              : 0;
          sizes[i] = clamp(share, sc.min ?? 0, sc.max ?? Infinity);
        }
      }
    }

    return sizes;
  }

  private _spreadOffsets(
    sizes: number[],
    gap: number,
    startOffset = 0,
  ): number[] {
    const offsets: number[] = [];
    let pos = startOffset;
    for (const sz of sizes) {
      offsets.push(pos);
      pos += sz + gap;
    }
    return offsets;
  }

  // ─── Paint pass ─────────────────────────────────────────────────────────────

  paint(buf: CellBuffer, theme: Theme): void {
    const r = this.rect;
    if (r.width <= 0 || r.height <= 0) return;

    const bg = this.style.bg ?? (this.focused ? theme.panelBg : theme.panelBg);
    const fg = this.style.fg ?? theme.text;

    // Fill background
    buf.fill(r.x, r.y, r.width, r.height, { char: " ", bg, fg: null });

    // Draw border
    if (this.style.border !== "none") {
      const chars = getBorderChars(this.style.border);
      const borderColor = this.focused ? theme.focusBorder : theme.border;
      const borderBg = bg;

      // Top row
      buf.set(r.x, r.y, {
        char: chars.topLeft,
        fg: borderColor,
        bg: borderBg,
      });
      buf.set(r.x + r.width - 1, r.y, {
        char: chars.topRight,
        fg: borderColor,
        bg: borderBg,
      });
      for (let col = r.x + 1; col < r.x + r.width - 1; col++) {
        buf.set(col, r.y, {
          char: chars.horizontal,
          fg: borderColor,
          bg: borderBg,
        });
      }

      // Bottom row
      buf.set(r.x, r.y + r.height - 1, {
        char: chars.bottomLeft,
        fg: borderColor,
        bg: borderBg,
      });
      buf.set(r.x + r.width - 1, r.y + r.height - 1, {
        char: chars.bottomRight,
        fg: borderColor,
        bg: borderBg,
      });
      for (let col = r.x + 1; col < r.x + r.width - 1; col++) {
        buf.set(col, r.y + r.height - 1, {
          char: chars.horizontal,
          fg: borderColor,
          bg: borderBg,
        });
      }

      // Left & right columns
      for (let row = r.y + 1; row < r.y + r.height - 1; row++) {
        buf.set(r.x, row, {
          char: chars.vertical,
          fg: borderColor,
          bg: borderBg,
        });
        buf.set(r.x + r.width - 1, row, {
          char: chars.vertical,
          fg: borderColor,
          bg: borderBg,
        });
      }

      // If focused, draw a label indicator on the top border
      if (this.focused && this.label) {
        const labelText = ` ${this.label} `;
        const startCol = r.x + 2;
        for (
          let i = 0;
          i < labelText.length && startCol + i < r.x + r.width - 1;
          i++
        ) {
          buf.set(startCol + i, r.y, {
            char: labelText[i],
            fg: theme.highlight,
            bg: borderBg,
            bold: true,
          });
        }
      } else if (this.label) {
        const labelText = ` ${this.label} `;
        const startCol = r.x + 2;
        for (
          let i = 0;
          i < labelText.length && startCol + i < r.x + r.width - 1;
          i++
        ) {
          buf.set(startCol + i, r.y, {
            char: labelText[i],
            fg: theme.muted,
            bg: borderBg,
          });
        }
      }
    }

    // Custom paint hook
    if (this.onPaint) {
      // Content rect (inside border+padding)
      const hasBorder = this.style.border !== "none";
      const bOff = hasBorder ? 1 : 0;
      const p = this.style.padding;
      const contentRect: Rect = {
        x: r.x + bOff + p.left,
        y: r.y + bOff + p.top,
        width: Math.max(0, r.width - bOff * 2 - p.left - p.right),
        height: Math.max(0, r.height - bOff * 2 - p.top - p.bottom),
      };
      this.onPaint(buf, contentRect, theme);
    }

    // Paint children with viewport clipping (unless overflow: visible)
    const hasBorderForClip = this.style.border !== "none";
    const hasChildren = this.children.length > 0;
    const isOverflowing = this.scrollMaxY > 0 || this.scrollMaxX > 0;
    const overflow = this.style.overflow;

    const shouldClip = overflow !== "visible" &&
      (hasChildren || isOverflowing);
    if (shouldClip) {
      const bOff = hasBorderForClip ? 1 : 0;
      const p = this.style.padding;
      const clipX = r.x + bOff + p.left;
      const clipY = r.y + bOff + p.top;
      const clipW = Math.max(0, r.width - bOff * 2 - p.left - p.right);
      const clipH = Math.max(0, r.height - bOff * 2 - p.top - p.bottom);
      buf.pushClip(clipX, clipY, clipW, clipH);
    }

    for (const child of this.children) {
      child.paint(buf, theme);
    }

    if (shouldClip) {
      buf.popClip();
    }

    // Paint scrollbar if overflow mode allows it and there's content to scroll
    const wantsScrollbar =
      (overflow === "scroll" || (overflow === "auto" && isOverflowing)) &&
      hasChildren;
    if (wantsScrollbar) {
      this._paintScrollbar(buf, theme);
    }
  }

  private _paintScrollbar(buf: CellBuffer, theme: Theme): void {
    const r = this.rect;
    const hasBorder = this.style.border !== "none";
    const bOff = hasBorder ? 1 : 0;
    const p = this.style.padding;
    const contentX = r.x + bOff + p.left;
    const contentY = r.y + bOff + p.top;
    const contentW = Math.max(0, r.width - bOff * 2 - p.left - p.right);
    const contentH = Math.max(0, r.height - bOff * 2 - p.top - p.bottom);
    if (contentW < 3 || contentH < 3) return;

    const isRow = this.style.direction === "row";

    if (isRow) {
      // Horizontal scrollbar — bottom row of content area
      const maxScroll = this.scrollMaxX;
      if (maxScroll <= 0) {
        // Track with no thumb: dim line
        for (let col = contentX; col < contentX + contentW; col++) {
          buf.set(col, contentY + contentH - 1, {
            char: "─",
            fg: theme.muted,
            bg: theme.panelBg,
          });
        }
        return;
      }
      const totalContent = contentW + maxScroll;
      const thumbW = Math.max(
        1,
        Math.floor((contentW / totalContent) * contentW),
      );
      const thumbX = Math.floor(
        (this.scrollX / maxScroll) * (contentW - thumbW),
      );
      for (let col = contentX; col < contentX + contentW; col++) {
        const off = col - contentX;
        const isThumb = off >= thumbX && off < thumbX + thumbW;
        buf.set(col, contentY + contentH - 1, {
          char: isThumb ? "▄" : "─",
          fg: isThumb ? theme.text : theme.muted,
          bg: theme.panelBg,
        });
      }
    } else {
      // Vertical scrollbar — rightmost column of content area
      const maxScroll = this.scrollMaxY;
      if (maxScroll <= 0) {
        // Track with no thumb: dim line
        for (let row = contentY; row < contentY + contentH; row++) {
          buf.set(contentX + contentW - 1, row, {
            char: "│",
            fg: theme.muted,
            bg: theme.panelBg,
          });
        }
        return;
      }
      const totalContent = contentH + maxScroll;
      const thumbH = Math.max(
        1,
        Math.floor((contentH / totalContent) * contentH),
      );
      const thumbY = Math.floor(
        (this.scrollY / maxScroll) * (contentH - thumbH),
      );
      for (let row = contentY; row < contentY + contentH; row++) {
        const off = row - contentY;
        const isThumb = off >= thumbY && off < thumbY + thumbH;
        buf.set(contentX + contentW - 1, row, {
          char: isThumb ? "▌" : "│",
          fg: isThumb ? theme.text : theme.muted,
          bg: theme.panelBg,
        });
      }
    }
  }

  // ─── Hit testing ────────────────────────────────────────────────────────────

  hitTest(col: number, row: number): Box | null {
    const r = this.rect;
    if (col < r.x || col >= r.x + r.width) return null;
    if (row < r.y || row >= r.y + r.height) return null;
    // Check children first (front-to-back)
    for (let i = this.children.length - 1; i >= 0; i--) {
      const hit = this.children[i].hitTest(col, row);
      if (hit) return hit;
    }
    return this;
  }

  // ─── Utility builders ───────────────────────────────────────────────────────

  static row(label = ""): Box {
    const b = new Box(label);
    b.style.direction = "row";
    return b;
  }

  static col(label = ""): Box {
    const b = new Box(label);
    b.style.direction = "column";
    return b;
  }
}

// ─── Text helper ─────────────────────────────────────────────────────────────

/**
 * Paints centered text within the given content rect.
 */
export function paintCenteredText(
  buf: CellBuffer,
  rect: Rect,
  text: string,
  fg: { r: number; g: number; b: number },
  bg: { r: number; g: number; b: number } | null = null,
  bold = false,
): void {
  const lines = text.split("\n");
  const startRow = rect.y + Math.floor((rect.height - lines.length) / 2);
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    const startCol = rect.x + Math.floor((rect.width - line.length) / 2);
    for (let ci = 0; ci < line.length; ci++) {
      if (startCol + ci >= rect.x && startCol + ci < rect.x + rect.width) {
        buf.set(startCol + ci, startRow + li, {
          char: line[ci],
          fg,
          bg: bg ?? undefined,
          bold,
        });
      }
    }
  }
}

/**
 * Paints left-aligned text at a given row within rect.
 */
export function paintText(
  buf: CellBuffer,
  rect: Rect,
  text: string,
  row: number,
  fg: { r: number; g: number; b: number },
  bold = false,
): void {
  const y = rect.y + row;
  if (y < rect.y || y >= rect.y + rect.height) return;
  for (let i = 0; i < text.length && i < rect.width; i++) {
    buf.set(rect.x + i, y, { char: text[i], fg, bold });
  }
}
