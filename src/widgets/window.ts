/**
 * window.ts — Draggable floating window widget for tuix.
 *
 * A window that can be moved by dragging its title bar, has a close button,
 * and contains a content area. Use with `app.showOverlay(window, { modal: false })`.
 */

import {
  Box,
  paintCenteredText,
  edgesAll,
  Rect,
} from "../layout.ts";
import { CellBuffer } from "../terminal.ts";
import { Theme, defaultTheme } from "../theme.ts";

/**
 * Creates a draggable floating window.
 *
 * The window has:
 *   - A title bar (drag to move)
 *   - A close [×] button
 *   - A content area for child widgets
 *
 * Use `window.contentBox` to add content children.
 */
export class FloatingWindow extends Box {
  /** The inner content container — add widgets here. */
  readonly contentBox: Box;

  private _title: string;
  private _appRef: {
    startDrag: (box: Box, col: number, row: number) => void;
    removeOverlay: (box: Box) => void;
  } | null = null;
  private _closeCb: (() => void) | null = null;
  private _titleBar: Box;
  private _closeBtn: Box;

  /**
   * @param title   Window title (displayed in the title bar)
   * @param options.width   Window width (default 46)
   * @param options.height  Window height (default 16)
   * @param options.onClose Called when the window is closed
   */
  constructor(
    title: string,
    options?: { width?: number; height?: number; onClose?: () => void },
  ) {
    super(title);
    this._title = title;
    this._closeCb = options?.onClose ?? null;

    const w = options?.width ?? 46;
    const h = options?.height ?? 16;

    this.width = { fixed: w };
    this.height = { fixed: h };
    this.style.border = "rounded";
    this.style.padding = edgesAll(0);
    this.style.bg = defaultTheme.elevatedBg;

    // ─── Layout ─────────────────────────────────────────────────────────
    const col = Box.col("win-col");
    col.style.gutter = 0;
    col.height = { grow: 1 };

    // Title bar row (height=1, but we render with border effect inside)
    const titleBar = Box.row("win-titlebar");
    titleBar.height = { fixed: 1 };
    titleBar.style.gutter = 0;
    titleBar.style.align = "center";
    titleBar.style.bg = defaultTheme.elevatedBg;

    const titleLabel = new Box("win-title");
    titleLabel.width = { grow: 1 };
    titleLabel.onPaint = (buf, rect, theme) => {
      const text = ` ${this._title} `;
      for (let i = 0; i < rect.width; i++) {
        const ch = i < text.length ? text[i] : " ";
        buf.set(rect.x + i, rect.y, { char: ch, fg: theme.highlight, bg: theme.elevatedBg, bold: i < text.length });
      }
    };
    titleBar.add(titleLabel);

    // Close button
    const closeBtn = new Box("win-close");
    closeBtn.width = { fixed: 4 };
    closeBtn.onPaint = (buf, rect, theme) => {
      const hover = this._closeBtn.focused;
      paintCenteredText(
        buf,
        rect,
        " [×] ",
        hover ? { r: 255, g: 80, b: 80 } : theme.muted,
        theme.elevatedBg,
        true,
      );
    };
    closeBtn.focusable = true;
    closeBtn.tabIndex = 9997;
    closeBtn.onMouse = (_col, _row, action) => {
      if (action === "press") this._close();
    };
    titleBar.add(closeBtn);
    this._closeBtn = closeBtn;

    // Make title bar draggable via mouse
    titleBar.onMouse = (col, row, action) => {
      // Don't start drag if clicking the close button
      if (action === "press" && !this._hitCloseBtn(col, row)) {
        this._appRef?.startDrag(this, col, row);
      }
    };

    // Content area (grows)
    const contentBox = Box.col("win-content");
    contentBox.style.gutter = 1;
    contentBox.style.padding = { top: 1, bottom: 1, left: 1, right: 1 };
    contentBox.height = { grow: 1 };

    col.add(titleBar, contentBox);
    this.add(col);
    this.contentBox = contentBox;
    this._titleBar = titleBar;
  }

  /**
   * Connect the window to an App-like controller.
   * Called automatically by showOverlay if the App provides these methods.
   */
  set appRef(ref: {
    startDrag: (box: Box, col: number, row: number) => void;
    removeOverlay: (box: Box) => void;
  }) {
    this._appRef = ref;
  }

  /** Close this window programmatically. */
  close(): void {
    this._close();
  }

  private _close(): void {
    this._closeCb?.();
    this._appRef?.removeOverlay(this);
  }

  private _hitCloseBtn(col: number, row: number): boolean {
    const r = this._closeBtn.rect;
    return (
      col >= r.x && col < r.x + r.width && row >= r.y && row < r.y + r.height
    );
  }

  /** Override paint to draw a separator line under the title bar */
  override paint(buf: CellBuffer, theme: Theme): void {
    super.paint(buf, theme);

    const r = this.rect;
    const bOff = 1; // rounded border
    const sepY = r.y + bOff + 1; // the title bar row
    if (sepY < r.y || sepY >= r.y + r.height) return;
    // Draw a dim separator line across the width (between title bar and content)
    for (let col = r.x + bOff; col < r.x + r.width - bOff; col++) {
      const existing = buf.get(col, sepY);
      if (
        existing &&
        (existing.char === "─" ||
          existing.char === "│" ||
          existing.char === "┌" ||
          existing.char === "┐")
      )
        continue;
      buf.set(col, sepY, {
        char: "─",
        fg: theme.border,
        bg: this.style.bg ?? undefined,
      });
    }
  }
}
