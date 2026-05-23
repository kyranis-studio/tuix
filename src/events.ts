/**
 * events.ts — Keyboard and mouse event parsing from stdin.
 */

export type KeyModifiers = {
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
};

export interface KeyEvent {
  type: "key";
  key: string; // "a", "Enter", "Tab", "ArrowUp", "F1", etc.
  raw: string;
  modifiers: KeyModifiers;
}

export interface MouseEvent {
  type: "mouse";
  action: "press" | "release" | "move";
  button: 0 | 1 | 2 | 3; // 0=left,1=middle,2=right,3=none(move)
  col: number; // 0-indexed
  row: number; // 0-indexed
  modifiers: KeyModifiers;
}

export type TuixEvent = KeyEvent | MouseEvent;

const ESC = 0x1b;
const decoder = new TextDecoder();

function parseKey(bytes: Uint8Array): KeyEvent | null {
  const raw = decoder.decode(bytes);
  const mods: KeyModifiers = { ctrl: false, alt: false, shift: false };

  // Single printable char
  if (bytes.length === 1) {
    const b = bytes[0];
    if (b === 0x09) return { type: "key", key: "Tab", raw, modifiers: mods };
    if (b === 0x0d || b === 0x0a)
      return { type: "key", key: "Enter", raw, modifiers: mods };
    if (b === 0x7f || b === 0x08)
      return { type: "key", key: "Backspace", raw, modifiers: mods };
    if (b === 0x1b) return { type: "key", key: "Escape", raw, modifiers: mods };
    if (b >= 0x01 && b <= 0x1a) {
      // Ctrl+letter
      return {
        type: "key",
        key: String.fromCharCode(b + 0x60),
        raw,
        modifiers: { ...mods, ctrl: true },
      };
    }
    return { type: "key", key: String.fromCharCode(b), raw, modifiers: mods };
  }

  // ESC sequences
  if (bytes[0] === ESC && bytes.length > 1) {
    const seq = raw.slice(1);

    // Alt + single char
    if (bytes.length === 2) {
      return {
        type: "key",
        key: String.fromCharCode(bytes[1]),
        raw,
        modifiers: { ...mods, alt: true },
      };
    }

    // CSI sequences
    if (seq.startsWith("[")) {
      const inner = seq.slice(1);

      // Mouse SGR handled separately — skip here
      if (/^<\d+;\d+;\d+[Mm]$/.test(inner)) return null;

      // Arrow keys + special
      const arrowMap: Record<string, string> = {
        A: "ArrowUp", B: "ArrowDown", C: "ArrowRight", D: "ArrowLeft",
        H: "Home", F: "End", "2~": "Insert", "3~": "Delete",
        "5~": "PageUp", "6~": "PageDown",
      };

      // Shift+Tab
      if (inner === "Z") {
        return {
          type: "key", key: "Tab", raw,
          modifiers: { ...mods, shift: true },
        };
      }

      // Ctrl+Arrow (e.g. [1;5A)
      const ctrlArrow = inner.match(/^1;5([ABCD])$/);
      if (ctrlArrow) {
        const k = arrowMap[ctrlArrow[1]];
        return { type: "key", key: k, raw, modifiers: { ...mods, ctrl: true } };
      }

      if (arrowMap[inner]) {
        return { type: "key", key: arrowMap[inner], raw, modifiers: mods };
      }

      // F-keys
      const fkMap: Record<string, string> = {
        "11~": "F1", "12~": "F2", "13~": "F3", "14~": "F4",
        "15~": "F5", "17~": "F6", "18~": "F7", "19~": "F8",
        "20~": "F9", "21~": "F10", "23~": "F11", "24~": "F12",
        "OP": "F1", "OQ": "F2", "OR": "F3", "OS": "F4",
      };
      if (fkMap[inner]) {
        return { type: "key", key: fkMap[inner], raw, modifiers: mods };
      }
    }
  }

  // Multi-byte UTF-8 printable
  if (bytes.length > 1 && bytes[0] !== ESC) {
    return { type: "key", key: raw, raw, modifiers: mods };
  }

  return null;
}

function parseMouse(bytes: Uint8Array): MouseEvent | null {
  const raw = decoder.decode(bytes);
  if (bytes[0] !== ESC) return null;
  const seq = raw.slice(1);
  if (!seq.startsWith("[")) return null;
  const inner = seq.slice(1);
  const m = inner.match(/^<(\d+);(\d+);(\d+)([Mm])$/);
  if (!m) return null;

  const btnCode = parseInt(m[1]);
  const col = parseInt(m[2]) - 1;
  const row = parseInt(m[3]) - 1;
  const release = m[4] === "m";
  const isMove = (btnCode & 32) !== 0;

  return {
    type: "mouse",
    action: release ? "release" : isMove ? "move" : "press",
    button: (btnCode & 3) as 0 | 1 | 2 | 3,
    col,
    row,
    modifiers: {
      ctrl: (btnCode & 16) !== 0,
      alt:  (btnCode & 8)  !== 0,
      shift: (btnCode & 4) !== 0,
    },
  };
}

function parseEvent(bytes: Uint8Array): TuixEvent | null {
  const mouse = parseMouse(bytes);
  if (mouse) return mouse;
  return parseKey(bytes);
}

/**
 * Async generator that yields parsed events from stdin.
 * Call with an AbortSignal to stop.
 */
export async function* readEvents(
  signal: AbortSignal,
): AsyncGenerator<TuixEvent> {
  const buf = new Uint8Array(256);

  while (!signal.aborted) {
    let n: number | null;
    try {
      n = await Deno.stdin.read(buf);
    } catch {
      break;
    }
    if (n === null) break;

    const chunk = buf.slice(0, n);

    // Try to split multiple events in the chunk
    let i = 0;
    while (i < chunk.length) {
      // Determine event boundary
      let len = 1;
      if (chunk[i] === ESC && i + 1 < chunk.length) {
        // Read until we can parse the escape sequence
        // Find end of sequence
        let j = i + 1;
        if (chunk[j] === 0x5b || chunk[j] === 0x4f) {
          // CSI or SS3
          j++;
          while (j < chunk.length && chunk[j] >= 0x20 && chunk[j] < 0x40) j++;
          if (j < chunk.length) j++;
        } else {
          j++;
        }
        len = j - i;
      } else if (chunk[i] >= 0xc0 && chunk[i] < 0xe0) {
        len = 2;
      } else if (chunk[i] >= 0xe0 && chunk[i] < 0xf0) {
        len = 3;
      } else if (chunk[i] >= 0xf0) {
        len = 4;
      }

      const slice = chunk.slice(i, i + Math.min(len, chunk.length - i));
      const ev = parseEvent(slice);
      if (ev) yield ev;
      i += len;
    }
  }
}
