export enum EventType {
  Key,
  Mouse,
  Resize,
}

export interface KeyEvent {
  type: EventType.Key;
  key: string;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
  code: string;
}

export enum MouseButton {
  Left = 0,
  Middle = 1,
  Right = 2,
  WheelUp = 64,
  WheelDown = 65,
  None = 3,
}

export interface MouseEvent {
  type: EventType.Mouse;
  x: number;
  y: number;
  button: MouseButton;
  drag: boolean;
  scroll: boolean;
}

export interface ResizeEvent {
  type: EventType.Resize;
  columns: number;
  rows: number;
}

export type TuiEvent = KeyEvent | MouseEvent | ResizeEvent;

export class Terminal {
  private static instance: Terminal;
  private isRaw = false;

  private constructor() {}

  static getInstance(): Terminal {
    if (!Terminal.instance) {
      Terminal.instance = new Terminal();
    }
    return Terminal.instance;
  }

  async enterRawMode() {
    if (this.isRaw) return;
    Deno.stdin.setRaw(true);
    await Deno.stdout.write(new TextEncoder().encode("\x1b[?1049h\x1b[H\x1b[?1000h\x1b[?1003h\x1b[?1006h\x1b[?25l"));
    this.isRaw = true;
  }

  async exitRawMode() {
    if (!this.isRaw) return;
    await Deno.stdout.write(new TextEncoder().encode("\x1b[?1006l\x1b[?1003l\x1b[?1000l\x1b[?25h\x1b[?1049l"));
    Deno.stdin.setRaw(false);
    this.isRaw = false;
  }

  async write(text: string) {
    await Deno.stdout.write(new TextEncoder().encode(text));
  }

  get size() {
    return Deno.consoleSize();
  }

  async *events(): AsyncIterableIterator<TuiEvent> {
    const buffer = new Uint8Array(1024);
    while (this.isRaw) {
      const n = await Deno.stdin.read(buffer);
      if (n === null) break;
      const data = buffer.subarray(0, n);
      yield* this.parseEvents(data);
    }
  }

  private *parseEvents(data: Uint8Array): Generator<TuiEvent> {
    const text = new TextDecoder().decode(data);
    
    // Mouse event: \x1b[<0;10;20M (SGR mode)
    const mouseMatch = text.match(/\x1b\[<(\d+);(\d+);(\d+)([Mm])/);
    if (mouseMatch) {
      const b = parseInt(mouseMatch[1]);
      const x = parseInt(mouseMatch[2]);
      const y = parseInt(mouseMatch[3]);
      const isRelease = mouseMatch[4] === "m";
      
      yield {
        type: EventType.Mouse,
        x,
        y,
        button: (b & 64) ? (b & 1 ? MouseButton.WheelDown : MouseButton.WheelUp) : (b & 3) as MouseButton,
        drag: !!(b & 32),
        scroll: !!(b & 64),
      };
      return;
    }

    // Resize event logic would typically come from a signal, 
    // but we can check consoleSize periodically or on certain events.
    // For now, we'll focus on Key and Mouse.

    // Basic key mapping (very simplified for now)
    if (text === "\r" || text === "\n") {
       yield { type: EventType.Key, key: "enter", ctrl: false, meta: false, shift: false, code: "Enter" };
    } else if (text === "\x1b[Z") {
       yield { type: EventType.Key, key: "tab", ctrl: false, meta: false, shift: true, code: "Tab" };
    } else if (text === "\t") {
       yield { type: EventType.Key, key: "tab", ctrl: false, meta: false, shift: false, code: "Tab" };
    } else if (text === "\x1b") {
       yield { type: EventType.Key, key: "escape", ctrl: false, meta: false, shift: false, code: "Escape" };
    } else if (text.length === 1) {
       yield { type: EventType.Key, key: text, ctrl: false, meta: false, shift: false, code: "" };
    }
  }
}
