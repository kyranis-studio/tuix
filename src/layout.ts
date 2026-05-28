/**
 * layout.ts — Flex-like layout engine with fixed/grow sizing,
 * padding, margin, gutter, border, and alignment.
 *
 * SIZING DEFAULTS
 * ───────────────
 * new Box() initialises width = { grow: 1 } and height = { grow: 1 } so every
 * box fills the available space by default.
 *
 * SHRINK-WRAP (hug content)
 * ─────────────────────────
 * Set width = {} or height = {} (no keys) to hug content on that axis.
 *   • Main-axis hug: the container shrinks to exactly fit its children.
 *   • Cross-axis hug: the container matches the largest child on that axis.
 *
 * AUTO SCROLL
 * ───────────
 * overflow: "auto" (the default) enables scrolling automatically whenever
 * children overflow the viewport — both horizontally and vertically.
 * The engine computes scrollMaxX / scrollMaxY for both axes.
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

export function isInsideRect(col: number, row: number, r: Rect): boolean {
  return col >= r.x && col < r.x + r.width && row >= r.y && row < r.y + r.height;
}

// ─── Sizing ───────────────────────────────────────────────────────────────────

export interface SizeConstraint {
  /** Fixed character count — overrides grow/shrink */
  fixed?: number;
  /** Flex-grow factor. Set to a number to participate in flex distribution. */
  grow?: number;
  /** Minimum characters */
  min?: number;
  /** Maximum characters */
  max?: number;
}

/** Returns true when the constraint means "hug / shrink-wrap". */
function isHug(sc: SizeConstraint): boolean {
  return sc.fixed === undefined && sc.grow === undefined;
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

// ─── Scrollbar customization ───────────────────────────────────────────────────

/**
 * Customizable characters and behavior for scrollbar rendering.
 * All fields are optional — defaults are used when omitted.
 */
export interface ScrollbarStyle {
  /** Vertical track character (default: "│") */
  verticalTrack?: string;
  /** Vertical thumb character (default: "▌") */
  verticalThumb?: string;
  /** Horizontal track character (default: "─") */
  horizontalTrack?: string;
  /** Horizontal thumb character (default: "▄") */
  horizontalThumb?: string;
  /** Show directional arrows at scrollbar ends (default: true) */
  showArrows?: boolean;
  /** Character for the up arrow (default: "↑") */
  arrowUp?: string;
  /** Character for the down arrow (default: "↓") */
  arrowDown?: string;
  /** Character for the left arrow (default: "◄") */
  arrowLeft?: string;
  /** Character for the right arrow (default: "►") */
  arrowRight?: string;
}

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
  /**
   * Overflow handling for content exceeding bounds (default: "auto").
   * "auto"    — scroll appears automatically when content overflows.
   * "scroll"  — scrollbar always shown (even when not overflowing).
   * "hidden"  — overflow is clipped, no scrollbar.
   * "visible" — overflow is not clipped (no scrollbar, no clip).
   */
  overflow: Overflow;
  /** Custom scrollbar characters and behavior (optional) */
  scrollbar?: Partial<ScrollbarStyle>;
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
  // Default: { grow: 1 } — fills available space on both axes.
  // Use {}              — to hug / shrink-wrap on that axis.
  // Use { fixed: N }    — for a fixed size.
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

  /** Called on mouse events (action: "press"|"release"|"move", button: 0=left,2=right) */
  onMouse:
    | ((col: number, row: number, action: string, button: number, modifiers?: { ctrl: boolean; alt: boolean; shift: boolean }) => void)
    | null;

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
    // Default: grow to fill available space on both axes.
    this.width = { grow: 1 };
    this.height = { grow: 1 };
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

    // ── Determine sizing mode ────────────────────────────────────────────────
    //
    // Main axis:
    //   fixed → exactly N chars
    //   grow  → flex-fill available space
    //   hug   → shrink-wrap to children
    //
    // Cross axis:
    //   fixed → exactly N chars
    //   grow  → fill available cross space
    //   hug   → match the tallest/widest child

    const mainSC = isRow ? this.width : this.height;
    const crossSC = isRow ? this.height : this.width;

    const mainHug = isHug(mainSC) && childCount > 0;
    const crossHug = isHug(crossSC) && childCount > 0;

    // Base own sizes derived from constraints / parent available space
    let selfW: number;
    let selfH: number;

    const initialSelfW = (): number => {
      if (this.width.fixed !== undefined) {
        return clamp(this.width.fixed, this.width.min ?? 0, this.width.max ?? Infinity);
      }
      return clamp(outerW, this.width.min ?? 0, this.width.max ?? Infinity);
    };
    const initialSelfH = (): number => {
      if (this.height.fixed !== undefined) {
        return clamp(this.height.fixed, this.height.min ?? 0, this.height.max ?? Infinity);
      }
      return clamp(outerH, this.height.min ?? 0, this.height.max ?? Infinity);
    };

    selfW = initialSelfW();
    selfH = initialSelfH();

    let contentW = Math.max(0, selfW - bOff * 2 - p.left - p.right);
    let contentH = Math.max(0, selfH - bOff * 2 - p.top - p.bottom);
    const contentX = outerX + bOff + p.left;
    const contentY = outerY + bOff + p.top;

    if (childCount > 0) {
      // ── Resolve main-axis child sizes ──────────────────────────────────────
      const mainAvailable = isRow ? contentW : contentH;
      const mainSizes = this._resolveMainAxis(mainAvailable, gutter, mainHug);

      // Total content extent along the main axis
      const totalMain =
        mainSizes.reduce((a, b) => a + b, 0) + gutter * (childCount - 1);

      // ── Shrink-wrap main axis ──────────────────────────────────────────────
      if (mainHug) {
        const contentExtent =
          totalMain + bOff * 2 + (isRow ? p.left + p.right : p.top + p.bottom);
        const maxExtent = isRow ? outerW : outerH;
        const clamped = Math.min(contentExtent, maxExtent);
        if (isRow) {
          selfW = clamp(
            clamped,
            this.width.min ?? 0,
            this.width.max ?? Infinity,
          );
          contentW = Math.max(0, selfW - bOff * 2 - p.left - p.right);
        } else {
          selfH = clamp(
            clamped,
            this.height.min ?? 0,
            this.height.max ?? Infinity,
          );
          contentH = Math.max(0, selfH - bOff * 2 - p.top - p.bottom);
        }
      }

      // ── Cross-axis available ───────────────────────────────────────────────
      let crossAvailable = isRow ? contentH : contentW;

      // When cross-hugging, children that have a `grow` constraint on the
      // cross axis will grow to fill crossAvailable, defeating shrink-wrap.
      // We temporarily override those children to `{}` (hug) so their
      // final rect reflects content size, not available space.

      const crossOverride: ({ axis: "height" | "width"; saved: SizeConstraint } | null)[] = [];

      if (crossHug) {
        for (let i = 0; i < childCount; i++) {
          const child = this.children[i];
          const sc = isRow ? child.height : child.width;
          if (sc.fixed === undefined && sc.grow !== undefined) {
            crossOverride[i] = {
              axis: isRow ? "height" : "width",
              saved: { ...sc },
            };
            if (isRow) child.height = {};
            else child.width = {};
          } else {
            crossOverride[i] = null;
          }
        }
      }

      // ── Compute main-axis positions ────────────────────────────────────────
      const freeSpace = (isRow ? contentW : contentH) - totalMain;
      let mainOffsets: number[];
      switch (this.style.justify) {
        case "center":
          mainOffsets = this._spreadOffsets(
            mainSizes,
            gutter,
            Math.floor(freeSpace / 2),
          );
          break;
        case "end":
          mainOffsets = this._spreadOffsets(mainSizes, gutter, freeSpace);
          break;
        case "space-between": {
          const gap =
            childCount > 1 ? Math.floor(freeSpace / (childCount - 1)) : 0;
          mainOffsets = this._spreadOffsets(mainSizes, gap);
          break;
        }
        case "space-around": {
          const gap = Math.floor(freeSpace / childCount);
          mainOffsets = this._spreadOffsets(
            mainSizes,
            gap + gutter,
            Math.floor(gap / 2),
          );
          break;
        }
        default: // "start"
          mainOffsets = this._spreadOffsets(mainSizes, gutter);
      }

      // ── Lay out children ───────────────────────────────────────────────────
      // For cross-hug, we measure the natural content size of each child.

      // Determine per-child cross size
      const childCrossSizes: number[] = [];
      for (let i = 0; i < childCount; i++) {
        const child = this.children[i];
        const childMainSC = isRow ? child.width : child.height;
        const childCrossSC = isRow ? child.height : child.width;
        let crossSize: number;
        if (childCrossSC.fixed !== undefined) {
          crossSize = childCrossSC.fixed;
        } else if (crossHug) {
          // We don't know the cross extent yet — give children max available,
          // then we'll measure after layout
          crossSize = crossAvailable;
        } else if (this.style.align === "stretch") {
          crossSize = crossAvailable;
        } else {
          crossSize = Math.min(
            crossAvailable,
            childCrossSC.max ?? crossAvailable,
          );
        }
        childCrossSizes.push(Math.max(0, crossSize));
      }

      // Layout children
      for (let i = 0; i < childCount; i++) {
        const child = this.children[i];
        const mainSize = mainSizes[i];
        const mainOff = mainOffsets[i];
        let crossSize = childCrossSizes[i];

        let crossOff = 0;
        const childCrossSC = isRow ? child.height : child.width;
        const actualCross =
          childCrossSC.fixed !== undefined ? childCrossSC.fixed : crossSize;
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
          ? {
              x: contentX + mainOff - this.scrollX,
              y: contentY + crossOff - this.scrollY,
              width: mainSize,
              height: crossSize,
            }
          : {
              x: contentX + crossOff - this.scrollX,
              y: contentY + mainOff - this.scrollY,
              width: crossSize,
              height: mainSize,
            };

        child.layout(childParentRect);
      }

      // ── Restore overridden cross constraints ──────────────────────────────
      for (let i = 0; i < childCount; i++) {
        const ov = crossOverride[i];
        if (ov) {
          if (ov.axis === "height") this.children[i].height = ov.saved;
          else this.children[i].width = ov.saved;
        }
      }

      // ── Cross-axis hug: shrink-wrap self to tallest/widest child ──────────
      if (crossHug) {
        let maxCross = 0;
        for (const child of this.children) {
          const childCross = isRow ? child.rect.height : child.rect.width;
          maxCross = Math.max(maxCross, childCross);
        }
        // Add border + padding on the cross axis
        const crossExtent =
          maxCross + bOff * 2 + (isRow ? p.top + p.bottom : p.left + p.right);
        const maxCrossExtent = isRow ? outerH : outerW;
        const clamped = Math.min(crossExtent, maxCrossExtent);
        if (isRow) {
          selfH = clamp(
            clamped,
            this.height.min ?? 0,
            this.height.max ?? Infinity,
          );
        } else {
          selfW = clamp(
            clamped,
            this.width.min ?? 0,
            this.width.max ?? Infinity,
          );
        }
      }

      this.rect = { x: outerX, y: outerY, width: selfW, height: selfH };

      // ── Compute scroll max (both axes for "auto" / "scroll") ──────────────
      const overflow = this.style.overflow;
      if (overflow === "hidden" || overflow === "visible") {
        this.scrollMaxX = 0;
        this.scrollMaxY = 0;
      } else {
        // Main-axis scroll
        const mainViewport = isRow ? contentW : contentH;
        const mainOverflow = Math.max(0, totalMain - mainViewport);
        if (isRow) {
          this.scrollMaxX = mainOverflow;
          // Cross-axis scroll for row: tallest child vs contentH
          const maxChildH = Math.max(
            0,
            ...this.children.map((c) => c.rect.height),
          );
          this.scrollMaxY = Math.max(0, maxChildH - contentH);
        } else {
          this.scrollMaxY = mainOverflow;
          // Cross-axis scroll for column: widest child vs contentW
          const maxChildW = Math.max(
            0,
            ...this.children.map((c) => c.rect.width),
          );
          this.scrollMaxX = Math.max(0, maxChildW - contentW);
        }
      }

      this.scrollX = clamp(this.scrollX, 0, this.scrollMaxX);
      this.scrollY = clamp(this.scrollY, 0, this.scrollMaxY);
    } else {
      // Leaf node — set rect; leaf widgets manage their own scroll
      this.rect = { x: outerX, y: outerY, width: selfW, height: selfH };
    }
  }

  /**
   * Recursively compute the natural size of `child` along `mainAxisIsRow`.
   *
   * `mainAxisIsRow` indicates which axis we are measuring:
   *   true  → measuring width  (main axis of a row container)
   *   false → measuring height (main axis of a column container)
   *
   * When the child stacks its own children in the SAME axis as we are
   * measuring, sizes are **summed** (e.g. a column measuring height).
   * When the child arranges children perpendicularly, the **max** is
   * taken (e.g. a row measuring height — the tallest child wins).
   */
  private _computeNaturalMainSize(child: Box, mainAxisIsRow: boolean): number {
    const sc = mainAxisIsRow ? child.width : child.height;
    if (sc.fixed !== undefined) return sc.fixed;

    const grandchildren = child.children;
    if (grandchildren.length === 0) return Math.max(1, sc.min ?? 1);

    const childIsRow = child.style.direction === "row";
    // True when the child's layout direction matches the axis we measure.
    const childStacksAlongAxis = childIsRow === mainAxisIsRow;
    const gutter = child.style.gutter;

    let total = 0;
    let maxItem = 0;

    for (const gc of grandchildren) {
      const gcSC = mainAxisIsRow ? gc.width : gc.height;
      let itemSize: number;
      if (gcSC.fixed !== undefined) {
        itemSize = gcSC.fixed;
      } else {
        itemSize = this._computeNaturalMainSize(gc, mainAxisIsRow);
      }

      if (childStacksAlongAxis) {
        total += itemSize;
      } else {
        maxItem = Math.max(maxItem, itemSize);
      }
    }

    if (childStacksAlongAxis) {
      total += gutter * Math.max(0, grandchildren.length - 1);
    } else {
      total = maxItem;
    }

    const hasBorder = child.style.border !== "none";
    const bOff = hasBorder ? 1 : 0;
    const p = child.style.padding;
    total += bOff * 2 + (mainAxisIsRow ? p.left + p.right : p.top + p.bottom);

    return Math.max(1, total);
  }

  private _resolveMainAxis(
    available: number,
    gutter: number,
    hugMode: boolean,
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
      } else if (hugMode) {
        // In hug mode the container will shrink-wrap; give each child its
        // natural size so we can measure the total
        sizes[i] = this._computeNaturalMainSize(c, isRow);
      } else if (isHug(sc)) {
        // Child wants to hug but parent is NOT hugging — compute the child's
        // natural size so it gets enough room and doesn't collapse to 0.
        sizes[i] = this._computeNaturalMainSize(c, isRow);
        // NOTE: we don't subtract from `remaining` because hug children
        // take what they need and overflow the parent
      } else {
        totalGrow += sc.grow ?? 1;
      }
    }

    remaining = Math.max(0, remaining);

    // Distribute remaining space to grow children
    if (!hugMode) {
      for (let i = 0; i < n; i++) {
        const c = children[i];
        const isRow = this.style.direction === "row";
        const sc = isRow ? c.width : c.height;
        if (sc.fixed === undefined && !isHug(sc)) {
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

    const bg = this.style.bg ?? theme.primaryBg;
    const fg = this.style.fg ?? theme.text;

    // Fill background
    buf.fill(r.x, r.y, r.width, r.height, { char: " ", bg, fg: null });

    // Draw border
    if (this.style.border !== "none") {
      const chars = getBorderChars(this.style.border);
      const borderColor = this.focused ? theme.focusBorder : theme.border;
      const borderBg = bg;

      // Top row
      buf.set(r.x, r.y, { char: chars.topLeft, fg: borderColor, bg: borderBg });
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

      // Label in top border
      const labelText = this.label ? ` ${this.label} ` : null;
      if (labelText) {
        const startCol = r.x + 2;
        const labelFg = this.focused ? theme.highlight : theme.muted;
        for (
          let i = 0;
          i < labelText.length && startCol + i < r.x + r.width - 1;
          i++
        ) {
          buf.set(startCol + i, r.y, {
            char: labelText[i],
            fg: labelFg,
            bg: borderBg,
            bold: this.focused,
          });
        }
      }
    }

    // Custom paint hook
    if (this.onPaint) {
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

    // Paint children with viewport clipping
    const hasBorderForClip = this.style.border !== "none";
    const hasChildren = this.children.length > 0;
    const isOverflowing = this.scrollMaxY > 0 || this.scrollMaxX > 0;
    const overflow = this.style.overflow;

    const shouldClip = overflow !== "visible" && (hasChildren || isOverflowing);
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

    // Scrollbar
    const wantsScrollbar =
      (overflow === "scroll" || (overflow === "auto" && isOverflowing));
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

    const sb = this.style.scrollbar ?? {};
    const showArrows = sb.showArrows ?? true;

    // Resolve characters with defaults
    const vTrack = sb.verticalTrack ?? "│";
    const vThumb = sb.verticalThumb ?? "▌";
    const hTrack = sb.horizontalTrack ?? "─";
    const hThumb = sb.horizontalThumb ?? "▄";
    const upArrow = sb.arrowUp ?? "↑";
    const downArrow = sb.arrowDown ?? "↓";
    const leftArrow = sb.arrowLeft ?? "◄";
    const rightArrow = sb.arrowRight ?? "►";

    // Determine whether each scrollbar is needed
    const showVScroll = this.scrollMaxY > 0 || this.style.overflow === "scroll";
    const showHScroll = this.scrollMaxX > 0 || this.style.overflow === "scroll";
    const showBoth = showVScroll && showHScroll;

    // ── Corner cell (when both scrollbars visible) ───────────────────────
    const cornerCol = contentX + contentW - 1;
    const cornerRow = contentY + contentH - 1;

    // ── Vertical scrollbar (right edge of content) ─────────────────────────
    if (showVScroll) {
      const maxScroll = this.scrollMaxY;
      const col = cornerCol;
      // If horizontal bar is also visible, shorten vertical bar by 1 row
      const vh = showBoth ? contentH - 1 : contentH;

      const arrowTop = showArrows && maxScroll > 0;
      const arrowBot = showArrows && maxScroll > 0;
      const arrowSlots = (arrowTop ? 1 : 0) + (arrowBot ? 1 : 0);
      const availH = vh - arrowSlots;

      if (maxScroll <= 0) {
        for (let row = contentY; row < contentY + vh; row++) {
          buf.set(col, row, { char: vTrack, fg: theme.muted, bg: theme.primaryBg });
        }
      } else if (availH <= 0) {
        if (arrowTop) buf.set(col, contentY, { char: upArrow, fg: theme.muted, bg: theme.primaryBg });
        if (arrowBot) buf.set(col, contentY + vh - 1, { char: downArrow, fg: theme.muted, bg: theme.primaryBg });
      } else {
        const totalContent = availH + maxScroll;
        const thumbH = Math.max(1, Math.floor((availH / totalContent) * availH));
        const thumbY = Math.floor((this.scrollY / maxScroll) * (availH - thumbH));

        let row = contentY;
        if (arrowTop) {
          const canScrollUp = this.scrollY > 0;
          buf.set(col, row, { char: upArrow, fg: canScrollUp ? theme.text : theme.muted, bg: theme.primaryBg, bold: canScrollUp });
          row++;
        }
        for (let r = 0; r < availH; r++) {
          const isThumb = r >= thumbY && r < thumbY + thumbH;
          buf.set(col, row, { char: isThumb ? vThumb : vTrack, fg: isThumb ? theme.text : theme.muted, bg: theme.primaryBg });
          row++;
        }
        if (arrowBot) {
          const canScrollDown = this.scrollY < maxScroll;
          buf.set(col, row, { char: downArrow, fg: canScrollDown ? theme.text : theme.muted, bg: theme.primaryBg, bold: canScrollDown });
        }
      }
    }

    // ── Horizontal scrollbar (bottom edge of content) ──────────────────────
    if (showHScroll) {
      const maxScroll = this.scrollMaxX;
      const row = cornerRow;
      // If vertical bar is also visible, shorten horizontal bar by 1 column
      const hw = showBoth ? contentW - 1 : contentW;

      const arrowLeftEnd = showArrows && maxScroll > 0;
      const arrowRightEnd = showArrows && maxScroll > 0;
      const arrowSlots = (arrowLeftEnd ? 1 : 0) + (arrowRightEnd ? 1 : 0);
      const availW = hw - arrowSlots;

      if (maxScroll <= 0) {
        for (let col = contentX; col < contentX + hw; col++) {
          buf.set(col, row, { char: hTrack, fg: theme.muted, bg: theme.primaryBg });
        }
      } else if (availW <= 0) {
        if (arrowLeftEnd) buf.set(contentX, row, { char: leftArrow, fg: theme.muted, bg: theme.primaryBg });
        if (arrowRightEnd) buf.set(contentX + hw - 1, row, { char: rightArrow, fg: theme.muted, bg: theme.primaryBg });
      } else {
        const totalContent = availW + maxScroll;
        const thumbW = Math.max(1, Math.floor((availW / totalContent) * availW));
        const thumbX = Math.floor((this.scrollX / maxScroll) * (availW - thumbW));

        let col = contentX;
        if (arrowLeftEnd) {
          const canScrollLeft = this.scrollX > 0;
          buf.set(col, row, { char: leftArrow, fg: canScrollLeft ? theme.text : theme.muted, bg: theme.primaryBg, bold: canScrollLeft });
          col++;
        }
        for (let c = 0; c < availW; c++) {
          const isThumb = c >= thumbX && c < thumbX + thumbW;
          buf.set(col, row, { char: isThumb ? hThumb : hTrack, fg: isThumb ? theme.text : theme.muted, bg: theme.primaryBg });
          col++;
        }
        if (arrowRightEnd) {
          const canScrollRight = this.scrollX < maxScroll;
          buf.set(col, row, { char: rightArrow, fg: canScrollRight ? theme.text : theme.muted, bg: theme.primaryBg, bold: canScrollRight });
        }
      }
    }

    // ── Corner cell ────────────────────────────────────────────────────────
    if (showBoth) {
      buf.set(cornerCol, cornerRow, { char: "┘", fg: theme.muted, bg: theme.primaryBg });
    }
  }

  // ─── Hit testing ────────────────────────────────────────────────────────────

  hitTest(col: number, row: number): Box | null {
    const r = this.rect;
    if (col < r.x || col >= r.x + r.width) return null;
    if (row < r.y || row >= r.y + r.height) return null;
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

// ─── Text helpers ─────────────────────────────────────────────────────────────

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
