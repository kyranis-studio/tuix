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
import { Box, Rect } from "./layout.ts";
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

export class App {
  private root: Box;
  private focus: FocusManager;
  private theme: Theme;
  private fps: number;
  private mouse: boolean;
  private renderer!: Renderer;
  private _running = false;
  private abortController!: AbortController;

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

  /** Register a shortcut that jumps focus to a box. */
  shortcut(key: string, box: Box): this {
    this.focus.registerShortcut(key, box);
    return this;
  }

  private doLayout(): void {
    const { cols, rows } = getTermSize();
    const fullRect: Rect = { x: 0, y: 0, width: cols, height: rows };
    this.root.layout(fullRect);
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

      // Quit: Ctrl+C or Ctrl+Q
      if ((key === "c" && modifiers.ctrl) || (key === "q" && modifiers.ctrl)) {
        this.stop();
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
    } else if (ev.type === "mouse") {
      this._handleMouse(ev);
    }
  }

  private _activeSplitter: Splitter | null = null;

  private _handleMouse(ev: import("./events.ts").MouseEvent): void {
    const { action, col, row, button } = ev;

    if (action === "press" && button === 0) {
      // Check for splitter hit first (walk root)
      const splitter = this._findSplitter(this.root, col, row);
      if (splitter && splitter.isHandle(col, row)) {
        this._activeSplitter = splitter;
        const coord =
          splitter["_direction"] === "horizontal" ? col : row;
        splitter.startDrag(coord);
        return;
      }

      // Click to focus
      const hit = this.root.hitTest(col, row);
      if (hit && hit.focusable) {
        this.focus.focusBox(hit);
      }
      if (hit?.onMouse) hit.onMouse(col, row, "press");
    } else if (action === "move") {
      if (this._activeSplitter) {
        const sp = this._activeSplitter;
        const coord = sp["_direction"] === "horizontal" ? col : row;
        sp.updateDrag(coord);
      }
    } else if (action === "release") {
      if (this._activeSplitter) {
        this._activeSplitter.endDrag();
        this._activeSplitter = null;
      }
      const hit = this.root.hitTest(col, row);
      if (hit?.onMouse) hit.onMouse(col, row, "release");
    }
  }

  private _findSplitter(box: Box, col: number, row: number): Splitter | null {
    for (const child of box.children) {
      const found = this._findSplitter(child, col, row);
      if (found) return found;
    }
    if (box instanceof Splitter) {
      const r = box.rect;
      if (col >= r.x && col < r.x + r.width && row >= r.y && row < r.y + r.height) {
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
