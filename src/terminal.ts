/**
 * terminal.ts — Raw terminal I/O, ANSI helpers, and cell buffer.
 */

export interface TermSize {
  cols: number;
  rows: number;
}

export interface Color {
  r: number;
  g: number;
  b: number;
}

export interface Cell {
  char: string;
  fg: Color | null;
  bg: Color | null;
  bold: boolean;
  dim: boolean;
  underline: boolean;
}

export const EMPTY_CELL: Cell = {
  char: " ",
  fg: null,
  bg: null,
  bold: false,
  dim: false,
  underline: false,
};

// ─── ANSI escape sequences ────────────────────────────────────────────────────

const ESC = "\x1b";
const CSI = `${ESC}[`;

export const ansi = {
  reset: `${CSI}0m`,
  bold: `${CSI}1m`,
  dim: `${CSI}2m`,
  underline: `${CSI}4m`,
  hideCursor: `${CSI}?25l`,
  showCursor: `${CSI}?25h`,
  clearScreen: `${CSI}2J${CSI}H`,
  altScreenOn: `${CSI}?1049h`,
  altScreenOff: `${CSI}?1049l`,
  mouseOn: `${CSI}?1000h${CSI}?1006h`, // SGR mouse mode
  mouseOff: `${CSI}?1000l${CSI}?1006l`,

  moveTo(row: number, col: number): string {
    return `${CSI}${row + 1};${col + 1}H`;
  },

  fg(c: Color): string {
    return `${CSI}38;2;${c.r};${c.g};${c.b}m`;
  },

  bg(c: Color): string {
    return `${CSI}48;2;${c.r};${c.g};${c.b}m`;
  },
};

// ─── Terminal size ────────────────────────────────────────────────────────────

export function getTermSize(): TermSize {
  const size = Deno.consoleSize();
  return { cols: size.columns, rows: size.rows };
}

// ─── Raw mode ─────────────────────────────────────────────────────────────────

let rawModeEnabled = false;

export function enableRawMode(): void {
  if (!rawModeEnabled) {
    Deno.stdin.setRaw(true, { cbreak: true });
    rawModeEnabled = true;
  }
}

export function disableRawMode(): void {
  if (rawModeEnabled) {
    Deno.stdin.setRaw(false);
    rawModeEnabled = false;
  }
}

// ─── Cell Buffer ──────────────────────────────────────────────────────────────

function cellEqual(a: Cell, b: Cell): boolean {
  return (
    a.char === b.char &&
    a.bold === b.bold &&
    a.dim === b.dim &&
    a.underline === b.underline &&
    colorEqual(a.fg, b.fg) &&
    colorEqual(a.bg, b.bg)
  );
}

function colorEqual(a: Color | null, b: Color | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.r === b.r && a.g === b.g && a.b === b.b;
}

export class CellBuffer {
  cols: number;
  rows: number;
  private cells: Cell[];
  private clipStack: { x: number; y: number; w: number; h: number }[] = [];

  constructor(cols: number, rows: number) {
    this.cols = cols;
    this.rows = rows;
    this.cells = Array.from(
      { length: cols * rows },
      () => ({ ...EMPTY_CELL }),
    );
  }

  pushClip(x: number, y: number, w: number, h: number): void {
    if (this.clipStack.length > 0) {
      const cur = this.clipStack[this.clipStack.length - 1];
      const ix = Math.max(cur.x, x);
      const iy = Math.max(cur.y, y);
      const nw = Math.min(cur.x + cur.w, x + w) - ix;
      const nh = Math.min(cur.y + cur.h, y + h) - iy;
      this.clipStack.push({ x: ix, y: iy, w: Math.max(0, nw), h: Math.max(0, nh) });
    } else {
      this.clipStack.push({ x, y, w: Math.max(0, w), h: Math.max(0, h) });
    }
  }

  popClip(): void {
    this.clipStack.pop();
  }

  get(col: number, row: number): Cell {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
      return { ...EMPTY_CELL };
    }
    return this.cells[row * this.cols + col];
  }

  set(col: number, row: number, cell: Partial<Cell>): void {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;
    if (this.clipStack.length > 0) {
      const clip = this.clipStack[this.clipStack.length - 1];
      if (col < clip.x || col >= clip.x + clip.w || row < clip.y || row >= clip.y + clip.h) return;
    }
    const idx = row * this.cols + col;
    this.cells[idx] = { ...this.cells[idx], ...cell };
  }

  fill(
    x: number,
    y: number,
    width: number,
    height: number,
    cell: Partial<Cell>,
  ): void {
    for (let row = y; row < y + height; row++) {
      for (let col = x; col < x + width; col++) {
        this.set(col, row, cell);
      }
    }
  }

  writeText(
    x: number,
    y: number,
    text: string,
    style: Partial<Cell> = {},
  ): void {
    const chars = [...text]; // handle multi-byte
    for (let i = 0; i < chars.length; i++) {
      this.set(x + i, y, { ...style, char: chars[i] });
    }
  }

  clear(): void {
    for (let i = 0; i < this.cells.length; i++) {
      this.cells[i] = { ...EMPTY_CELL };
    }
  }

  resize(cols: number, rows: number): void {
    this.cols = cols;
    this.rows = rows;
    this.cells = Array.from(
      { length: cols * rows },
      () => ({ ...EMPTY_CELL }),
    );
  }
}

// ─── Flusher ──────────────────────────────────────────────────────────────────

const encoder = new TextEncoder();

export class Renderer {
  private prev: CellBuffer;
  private curr: CellBuffer;

  constructor(cols: number, rows: number) {
    this.prev = new CellBuffer(cols, rows);
    this.curr = new CellBuffer(cols, rows);
  }

  get buffer(): CellBuffer {
    return this.curr;
  }

  resize(cols: number, rows: number): void {
    this.prev.resize(cols, rows);
    this.curr.resize(cols, rows);
    this.prev.clear();
  }

  flush(): void {
    const { cols, rows } = this.curr;
    let out = ansi.hideCursor;
    let prevFg: Color | null = null;
    let prevBg: Color | null = null;
    let prevBold = false;
    let prevDim = false;
    let prevUnderline = false;
    let resetPending = false;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cell = this.curr.get(col, row);
        const old = this.prev.get(col, row);
        if (cellEqual(cell, old)) continue;

        out += ansi.moveTo(row, col);

        // Check if we need a reset
        if (
          (!cell.bold && prevBold) ||
          (!cell.dim && prevDim) ||
          (!cell.underline && prevUnderline)
        ) {
          out += ansi.reset;
          prevFg = null;
          prevBg = null;
          prevBold = false;
          prevDim = false;
          prevUnderline = false;
          resetPending = true;
        }

        if (cell.bold && !prevBold) {
          out += ansi.bold;
          prevBold = true;
        }
        if (cell.dim && !prevDim) {
          out += ansi.dim;
          prevDim = true;
        }
        if (cell.underline && !prevUnderline) {
          out += ansi.underline;
          prevUnderline = true;
        }

        if (!colorEqual(cell.fg, prevFg)) {
          out += cell.fg ? ansi.fg(cell.fg) : `${CSI}39m`;
          prevFg = cell.fg;
        }
        if (!colorEqual(cell.bg, prevBg)) {
          out += cell.bg ? ansi.bg(cell.bg) : `${CSI}49m`;
          prevBg = cell.bg;
        }

        out += cell.char || " ";
      }
    }

    out += ansi.reset;

    Deno.stdout.writeSync(encoder.encode(out));

    // Swap
    const tmp = this.prev;
    this.prev = this.curr;
    this.curr = tmp;
    this.curr.clear();
  }
}

// ─── Resize listener ──────────────────────────────────────────────────────────

const resizeCallbacks: Array<(size: TermSize) => void> = [];

export function onResize(cb: (size: TermSize) => void): () => void {
  resizeCallbacks.push(cb);
  return () => {
    const idx = resizeCallbacks.indexOf(cb);
    if (idx !== -1) resizeCallbacks.splice(idx, 1);
  };
}

// Poll for resize (SIGWINCH not reliably available in Deno on all platforms)
let lastSize: TermSize = { cols: 0, rows: 0 };
let resizeInterval: number | null = null;

export function startResizePoller(intervalMs = 100): void {
  if (resizeInterval !== null) return;
  lastSize = getTermSize();
  resizeInterval = setInterval(() => {
    const s = getTermSize();
    if (s.cols !== lastSize.cols || s.rows !== lastSize.rows) {
      lastSize = s;
      for (const cb of resizeCallbacks) cb(s);
    }
  }, intervalMs);
}

export function stopResizePoller(): void {
  if (resizeInterval !== null) {
    clearInterval(resizeInterval);
    resizeInterval = null;
  }
}
