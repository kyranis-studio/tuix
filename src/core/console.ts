export interface Cell {
  char: string;
  fg: string;
  bg: string;
  bold: boolean;
  dim: boolean;
}

export class VirtualConsole {
  private buffer: Cell[][];
  private prevBuffer: Cell[][];
  private width: number;
  private height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.buffer = this.createBuffer();
    this.prevBuffer = this.createBuffer();
  }

  private createBuffer(): Cell[][] {
    return Array.from({ length: this.height }, () =>
      Array.from({ length: this.width }, () => ({
        char: " ",
        fg: "",
        bg: "",
        bold: false,
        dim: false,
      }))
    );
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.buffer = this.createBuffer();
    this.prevBuffer = this.createBuffer();
  }

  set(x: number, y: number, cell: Partial<Cell>) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    const current = this.buffer[y][x];
    this.buffer[y][x] = { ...current, ...cell };
  }

  clear() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.buffer[y][x] = {
          char: " ",
          fg: "",
          bg: "",
          bold: false,
          dim: false,
        };
      }
    }
  }

  renderDiff(): string {
    let output = "";
    let lastFg = "";
    let lastBg = "";
    let lastBold = false;
    let lastDim = false;

    for (let y = 0; y < this.height; y++) {
      let cursorMoved = false;
      for (let x = 0; x < this.width; x++) {
        const cell = this.buffer[y][x];
        const prev = this.prevBuffer[y][x];

        if (
          cell.char !== prev.char ||
          cell.fg !== prev.fg ||
          cell.bg !== prev.bg ||
          cell.bold !== prev.bold ||
          cell.dim !== prev.dim
        ) {
          if (!cursorMoved) {
            output += `\x1b[${y + 1};${x + 1}H`;
            cursorMoved = true;
          } else {
            // If we are already at the next position, we don't need to move cursor
            // But for simplicity in this first version, we'll just move it if it's the first change in a row
            // A more optimized version would check if the previous cell was also updated.
          }

          // Apply styles
          if (cell.fg !== lastFg || cell.bg !== lastBg || cell.bold !== lastBold || cell.dim !== lastDim) {
             output += "\x1b[0m"; // Reset
             if (cell.bold) output += "\x1b[1m";
             if (cell.dim) output += "\x1b[2m";
             if (cell.fg) output += cell.fg; // Assuming fg is full ANSI sequence like \x1b[38;5;...m
             if (cell.bg) output += cell.bg;
             lastFg = cell.fg;
             lastBg = cell.bg;
             lastBold = cell.bold;
             lastDim = cell.dim;
          }

          output += cell.char;
          this.prevBuffer[y][x] = { ...cell };
        } else {
          cursorMoved = false; // Need to move cursor for the next change
        }
      }
    }

    return output;
  }
}
