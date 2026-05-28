/**
 * app.ts — Main application loop: ties together terminal, layout,
 * focus, events, and the render cycle.
 */

import {
  Renderer,
  getTermSize,
  enableRawMode,
  disableRawMode,
  startResizePoller,
  stopResizePoller,
  onResize,
  ansi,
} from "./terminal.ts";
import { Box, Rect, isInsideRect } from "./layout.ts";
import { FocusManager } from "./focus.ts";
import { readEvents, TuixEvent } from "./events.ts";
import { Theme, defaultTheme } from "./theme.ts";
import { Splitter } from "./splitter.ts";

const encoder = new TextEncoder();

function write(s: string) {
  Deno.stdout.writeSync(encoder.encode(s));
}

export interface AppOptions {
  theme?: Theme;
  fps?: number;
  mouse?: boolean;
}

// ─── Overlay state for floating widgets ───────────────────────────────────

export interface OverlayEntry {
  box: Box;
  /** If true, blocks mouse interaction with the main tree */
  modal: boolean;
  /** If true, clicking outside the overlay (and outside triggerRect) auto-dismisses it */
  autoDismiss?: boolean;
  /** When set, clicks within this rect won't trigger auto-dismiss */
  triggerRect?: Rect;
  /** Called during doLayout() to reposition the overlay (e.g. on resize) */
  reposition?: () => void;
  /** Called when the overlay is removed */
  onClose?: () => void;
}

export class App {
  private root: Box;
  private focus: FocusManager;
  private theme: Theme;
  private fps: number;
  private mouse: boolean;
  private renderer!: Renderer;
  private _running = false;
  private abortController!: AbortController;

  /** Stack of floating overlays rendered on top of the main tree */
  private overlays: OverlayEntry[] = [];

  /** Drag state for floating windows */
  private _dragBox: Box | null = null;
  private _dragOffX = 0;
  private _dragOffY = 0;

  /** Mouse drag state for text selection */
  private _mouseDragTarget: Box | null = null;

  /** Previous focus before showing an overlay */
  private _savedFocus: Box | null = null;

  constructor(root: Box, opts: AppOptions = {}) {
    this.root = root;
    this.focus = new FocusManager();
    this.focus.setRoot(root);
    this.theme = opts.theme ?? defaultTheme;
    this.fps = opts.fps ?? 30;
    this.mouse = opts.mouse ?? true;
  }

  get focusManager(): FocusManager {
    return this.focus;
  }

  get activeTheme(): Theme {
    return this.theme;
  }

  setTheme(theme: Theme): void {
    this.theme = theme;
  }

  /** Register a shortcut that jumps focus to a box. */
  shortcut(key: string, box: Box): this {
    this.focus.registerShortcut(key, box);
    return this;
  }

  // ─── Overlay / floating widget management ────────────────────────────────

  /**
   * Show a floating widget as an overlay.
   * The overlay is rendered on top of the main tree and receives mouse events first.
   */
  showOverlay(
    box: Box,
    options?: {
      modal?: boolean;
      autoDismiss?: boolean;
      triggerRect?: Rect;
      reposition?: () => void;
      onClose?: () => void;
    },
  ): void {
    const { cols, rows } = getTermSize();
    const fullRect: Rect = { x: 0, y: 0, width: cols, height: rows };
    box.layout(fullRect);
    // Center by default (overlay can override after layout)
    const r = box.rect;
    if (r.x === 0 && r.y === 0) {
      box.rect.x = Math.floor((cols - r.width) / 2);
      box.rect.y = Math.floor((rows - r.height) / 2);
    }
    this.overlays.push({
      box,
      modal: options?.modal ?? true,
      autoDismiss: options?.autoDismiss,
      triggerRect: options?.triggerRect,
      reposition: options?.reposition,
      onClose: options?.onClose,
    });
    // Include overlays in focus manager's root set
    const allRoots = [this.root, ...this.overlays.map(o => o.box)];
    this.focus.setRoot(...allRoots);
    // Focus first focusable element in the overlay
    this._savedFocus = this.focus.current();
    const focusable = this._collectFocusable(box);
    if (focusable.length > 0) {
      this.focus.focusBox(focusable[0]);
    }
  }

  /** Remove a floating overlay. */
  removeOverlay(box: Box): void {
    const idx = this.overlays.findIndex(o => o.box === box);
    if (idx < 0) return;
    const entry = this.overlays[idx];
    this.overlays.splice(idx, 1);
    // Restore focus manager roots
    const allRoots = [this.root, ...this.overlays.map(o => o.box)];
    this.focus.setRoot(...allRoots);
    // Restore previous focus
    if (this._savedFocus && this._savedFocus !== box) {
      this.focus.focusBox(this._savedFocus);
    } else {
      this.focus.focusFirst();
    }
    entry.onClose?.();
  }

  /** Start dragging a floating box. */
  startDrag(box: Box, col: number, row: number): void {
    this._dragBox = box;
    this._dragOffX = col - box.rect.x;
    this._dragOffY = row - box.rect.y;
  }

  /** Returns true if any modal overlay is active. */
  get hasModalOverlay(): boolean {
    return this.overlays.some(o => o.modal);
  }

  /** Returns the topmost overlay box, or null. */
  get topOverlay(): Box | null {
    return this.overlays.length > 0 ? this.overlays[this.overlays.length - 1].box : null;
  }

  private _collectFocusable(box: Box): Box[] {
    const result: Box[] = [];
    const walk = (b: Box) => {
      if (b.focusable) result.push(b);
      for (const c of b.children) walk(c);
    };
    walk(box);
    return result;
  }

  private doLayout(): void {
    const { cols, rows } = getTermSize();
    const fullRect: Rect = { x: 0, y: 0, width: cols, height: rows };
    this.root.layout(fullRect);
    // Reposition + layout overlays
    for (const ov of this.overlays) {
      ov.reposition?.();
      ov.box.layout(ov.box.rect);
    }
  }

  private doRender(): void {
    const { cols, rows } = getTermSize();
    if (
      this.renderer.buffer.cols !== cols ||
      this.renderer.buffer.rows !== rows
    ) {
      this.renderer.resize(cols, rows);
    }
    this.root.paint(this.renderer.buffer, this.theme);
    // Paint overlays on top (in order)
    for (const ov of this.overlays) {
      ov.box.paint(this.renderer.buffer, this.theme);
    }
    this.renderer.flush();
  }

  async run(): Promise<void> {
    this._running = true;
    this.abortController = new AbortController();

    // Setup terminal
    enableRawMode();
    write(ansi.altScreenOn);
    write(ansi.hideCursor);
    if (this.mouse) write(ansi.mouseOn);
    write(ansi.clearScreen);

    const { cols, rows } = getTermSize();
    this.renderer = new Renderer(cols, rows);

    // Initial focus
    this.focus.focusFirst();

    // Layout + render first frame
    this.doLayout();
    this.doRender();

    startResizePoller(80);
    onResize(() => {
      this.doLayout();
      this.doRender();
    });

    // Render loop
    const frameMs = Math.floor(1000 / this.fps);
    const renderTimer = setInterval(() => {
      if (this._running) {
        this.doLayout();
        this.doRender();
      }
    }, frameMs);

    // Event loop
    try {
      for await (const ev of readEvents(this.abortController.signal)) {
        if (!this._running) break;
        this._handleEvent(ev);
      }
    } finally {
      clearInterval(renderTimer);
      this._cleanup();
    }
  }

  stop(): void {
    this._running = false;
    this.abortController?.abort();
  }

  private _handleEvent(ev: TuixEvent): void {
    if (ev.type === "key") {
      const { key, modifiers } = ev;

      // Quit: Ctrl+Q
      if (key === "q" && modifiers.ctrl) {
        this.stop();
        return;
      }

      // Block plain Ctrl+C (without shift) — consumed but does nothing.
      // Terminals with Kitty keyboard protocol send Ctrl+Shift+C with shift=true
      // so we preserve that distinction for users whose terminal supports it.
      if (key === "c" && modifiers.ctrl && !modifiers.shift) {
        return;
      }

      // Escape — close topmost overlay (if any)
      if (key === "Escape") {
        if (this.overlays.length > 0) {
          const top = this.overlays[this.overlays.length - 1];
          this.removeOverlay(top.box);
          return;
        }
        const focused = this.focus.current();
        if (focused?.onKey) {
          focused.onKey("Escape", modifiers);
        }
        return;
      }

      // Tab / Shift+Tab — navigate focus
      if (key === "Tab" && !modifiers.shift && !modifiers.ctrl) {
        const focused = this.focus.current();
        if (focused?.handleTab?.()) return;
        this.focus.focusNext();
        return;
      }
      if (key === "Tab" && modifiers.shift) {
        this.focus.focusPrev();
        return;
      }

      // Try shortcut
      if (this.focus.handleShortcut(key)) return;

      // Dispatch to focused widget
      this.focus.dispatchKey(key, modifiers);

      // Ctrl+ArrowLeft/Right: horizontal scroll with larger step
      if ((key === "ArrowLeft" || key === "ArrowRight") && modifiers.ctrl) {
        const fw = this.focus.current();
        if (fw?.onKey) return; // widget consumed the key
        let box: Box | null = fw;
        while (box) {
          if (box.scrollMaxX > 0) {
            const dx = key === "ArrowRight" ? 3 : -3;
            const prev = box.scrollX;
            box.scrollX = Math.max(
              0,
              Math.min(box.scrollX + dx, box.scrollMaxX),
            );
            if (box.scrollX !== prev) break;
          }
          box = box.parent;
        }
        return;
      }

      // Scroll keys — walk up from focused widget to find a scrollable container.
      // Skip if the focused widget has its own onKey handler; it already consumed the key.
      const focusedWidget = this.focus.current();
      if (
        key === "ArrowDown" || key === "ArrowUp" ||
        key === "ArrowLeft" || key === "ArrowRight" ||
        key === "PageDown" || key === "PageUp"
      ) {
        if (focusedWidget?.onKey) return;
        let box: Box | null = focusedWidget;
        while (box) {
          // Vertical scroll (ArrowDown/Up, PageDown/Up)
          if (key === "ArrowDown" || key === "ArrowUp" || key === "PageDown" || key === "PageUp") {
            const dy =
              key === "ArrowDown"
                ? 1
                : key === "ArrowUp"
                  ? -1
                  : key === "PageDown"
                    ? 5
                    : -5;
            if (box.scrollMaxY > 0) {
              const prev = box.scrollY;
              box.scrollY = Math.max(
                0,
                Math.min(box.scrollY + dy, box.scrollMaxY),
              );
              if (box.scrollY !== prev) break;
            }
          }
          // Horizontal scroll (ArrowLeft/Right)
          if (key === "ArrowLeft" || key === "ArrowRight") {
            if (box.scrollMaxX > 0) {
              const dx = key === "ArrowRight" ? 1 : -1;
              const prev = box.scrollX;
              box.scrollX = Math.max(
                0,
                Math.min(box.scrollX + dx, box.scrollMaxX),
              );
              if (box.scrollX !== prev) break;
            }
          }
          box = box.parent;
        }
      }
    } else if (ev.type === "mouse") {
      this._handleMouse(ev);
    }
  }

  private _activeSplitter: Splitter | null = null;

  private _handleMouse(ev: import("./events.ts").MouseEvent): void {
    const { action, col, row, button, wheelDelta, modifiers } = ev;

    // ── Handle active window drag ────────────────────────────────────────
    if (this._dragBox) {
      if (action === "move") {
        this._dragBox.rect.x = col - this._dragOffX;
        this._dragBox.rect.y = row - this._dragOffY;
      } else if (action === "release") {
        this._dragBox = null;
      }
      return;
    }

    // ── Find hit in overlays first ───────────────────────────────────────
    const findOverlayHit = (): Box | null => {
      for (let i = this.overlays.length - 1; i >= 0; i--) {
        const ov = this.overlays[i];
        const hit = ov.box.hitTest(col, row);
        if (hit) return hit;
      }
      return null;
    };

    if (action === "wheel" && wheelDelta) {
      const hit = findOverlayHit() ?? this.root.hitTest(col, row);
      if (hit) {
        const isAlt = ev.modifiers.alt;
        let box: Box | null = hit;
        while (box) {
          if (isAlt && box.scrollMaxX > 0) {
            // Alt+wheel → horizontal scroll
            const prev = box.scrollX;
            box.scrollX = Math.max(0, Math.min(box.scrollX + (wheelDelta > 0 ? 3 : -3), box.scrollMaxX));
            if (box.scrollX !== prev) break;
          } else if (!isAlt && box.scrollMaxY > 0) {
            // Default wheel → vertical scroll
            const prev = box.scrollY;
            box.scrollY = Math.max(0, Math.min(box.scrollY + (wheelDelta > 0 ? 3 : -3), box.scrollMaxY));
            if (box.scrollY !== prev) break;
          }
          // Fallback: if the preferred axis has no scroll, try the other axis
          if (isAlt && box.scrollMaxX <= 0 && box.scrollMaxY > 0) {
            const prev = box.scrollY;
            box.scrollY = Math.max(0, Math.min(box.scrollY + (wheelDelta > 0 ? 3 : -3), box.scrollMaxY));
            if (box.scrollY !== prev) break;
          } else if (!isAlt && box.scrollMaxY <= 0 && box.scrollMaxX > 0) {
            const prev = box.scrollX;
            box.scrollX = Math.max(0, Math.min(box.scrollX + (wheelDelta > 0 ? 3 : -3), box.scrollMaxX));
            if (box.scrollX !== prev) break;
          }
          box = box.parent;
        }
      }
      return;
    }

    // ── Press ────────────────────────────────────────────────────────────
    if (action === "press" && button === 0) {
      // Check overlays first
      const overlayHit = findOverlayHit();
      if (overlayHit) {
        if (overlayHit.focusable) this.focus.focusBox(overlayHit);
        // Walk up from hit to find the nearest onMouse handler
        // (parent boxes like titleBar may have the handler, not the deepest child)
        let target: Box | null = overlayHit;
        while (target && !target.onMouse) target = target.parent;
        target?.onMouse?.(col, row, "press", 0, modifiers);
        return;
      }

      // If a modal overlay is active, block clicks on main tree
      if (this.hasModalOverlay) return;

      // Auto-dismiss: close topmost autoDismiss overlay if click is outside its triggerRect
      if (this.overlays.length > 0) {
        const top = this.overlays[this.overlays.length - 1];
        if (top.autoDismiss) {
          const inTrigger = top.triggerRect && isInsideRect(col, row, top.triggerRect);
          if (!inTrigger) {
            this.removeOverlay(top.box);
            return;
          }
        }
      }

      // Check for splitter hit
      const splitter = this._findSplitter(this.root, col, row);
      if (splitter && splitter.isHandle(col, row)) {
        this._activeSplitter = splitter;
        const coord = splitter["_direction"] === "horizontal" ? col : row;
        splitter.startDrag(coord);
        return;
      }

      // Click to focus + start drag tracking for text selection
      const hit = this.root.hitTest(col, row);
      if (hit && hit.focusable) this.focus.focusBox(hit);
      if (hit?.onMouse) {
        hit.onMouse(col, row, "press", 0, modifiers);
        this._mouseDragTarget = hit;
      }
      return;
    }

    // ── Right-click press — focus the widget (actual paste happens on release) ─
    if (action === "press" && button === 2) {
      const overlayHit = findOverlayHit();
      if (overlayHit) {
        if (overlayHit.focusable) this.focus.focusBox(overlayHit);
        return;
      }
      if (this.hasModalOverlay) return;
      const hit = this.root.hitTest(col, row);
      if (hit && hit.focusable) this.focus.focusBox(hit);
      return;
    }

    // ── Move ─────────────────────────────────────────────────────────────
    if (action === "move") {
      // Text selection drag takes priority
      if (this._mouseDragTarget) {
        this._mouseDragTarget.onMouse?.(col, row, "move", 0, modifiers);
        return;
      }
      if (this._activeSplitter) {
        const sp = this._activeSplitter;
        const coord = sp["_direction"] === "horizontal" ? col : row;
        sp.updateDrag(coord);
        return;
      }
      return;
    }

    // ── Release ──────────────────────────────────────────────────────────
    if (action === "release") {
      // Text selection release takes priority
      if (this._mouseDragTarget) {
        this._mouseDragTarget.onMouse?.(col, row, "release", 0, modifiers);
        this._mouseDragTarget = null;
        return;
      }

      // Check overlays first
      const overlayHit = findOverlayHit();
      if (overlayHit) {
        // Walk up from hit to find nearest onMouse handler
        let target: Box | null = overlayHit;
        while (target && !target.onMouse) target = target.parent;
        target?.onMouse?.(col, row, "release", button, modifiers);
      } else if (!this.hasModalOverlay) {
        const hit = this.root.hitTest(col, row);
        if (hit?.onMouse) hit.onMouse(col, row, "release", button, modifiers);
      }
      // Clear active splitter
      if (this._activeSplitter) {
        this._activeSplitter.endDrag();
        this._activeSplitter = null;
      }
    }
  }

  private _findSplitter(box: Box, col: number, row: number): Splitter | null {
    for (const child of box.children) {
      const found = this._findSplitter(child, col, row);
      if (found) return found;
    }
    if (box instanceof Splitter) {
      const r = box.rect;
      if (
        col >= r.x &&
        col < r.x + r.width &&
        row >= r.y &&
        row < r.y + r.height
      ) {
        return box;
      }
    }
    return null;
  }

  private _cleanup(): void {
    stopResizePoller();
    if (this.mouse) write(ansi.mouseOff);
    write(ansi.showCursor);
    write(ansi.altScreenOff);
    write(ansi.reset);
    disableRawMode();
  }
}
