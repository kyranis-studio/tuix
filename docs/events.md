# Events

The events module (`src/events.ts`) parses raw terminal input from stdin into structured `KeyEvent` and `MouseEvent` objects.

---

## Event Types

```typescript
type TuixEvent = KeyEvent | MouseEvent;
```

### KeyEvent

```typescript
interface KeyEvent {
  type: "key";
  key: string;     // "a", "Enter", "Tab", "ArrowUp", "F1", "Escape", etc.
  raw: string;     // Raw bytes decoded as text
  modifiers: { ctrl: boolean; alt: boolean; shift: boolean };
}
```

Special key names: `Tab`, `Enter`, `Backspace`, `Escape`, `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Home`, `End`, `Insert`, `Delete`, `PageUp`, `PageDown`, `F1`–`F12`.

### MouseEvent

```typescript
interface MouseEvent {
  type: "mouse";
  action: "press" | "release" | "move" | "wheel";
  button: 0 | 1 | 2 | 3;  // 0=left, 1=middle, 2=right, 3=none (move)
  col: number;   // 0-indexed column
  row: number;   // 0-indexed row
  modifiers: { ctrl: boolean; alt: boolean; shift: boolean };
  wheelDelta?: number;  // -1 (up) or 1 (down) for wheel events
}
```

---

## Reading Events

```typescript
import { readEvents } from "../src/mod.ts";

const abortController = new AbortController();
for await (const ev of readEvents(abortController.signal)) {
  if (ev.type === "key") {
    console.log(`Key pressed: ${ev.key}`, ev.modifiers);
  } else if (ev.type === "mouse") {
    console.log(`Mouse ${ev.action} at (${ev.col}, ${ev.row})`);
  }
}
```

The `readEvents` async generator yields events as they arrive from stdin. Pass an `AbortSignal` to stop.

---

## Parsed Sequences

The parser handles:

| Input | Result |
|-------|--------|
| Single byte (0x01–0x1a) | `Ctrl+letter` |
| 0x09 | `Tab` |
| 0x0d / 0x0a | `Enter` |
| 0x7f / 0x08 | `Backspace` |
| 0x1b | `Escape` |
| ESC + char | `Alt+char` |
| `ESC [ A` / `B` / `C` / `D` | Arrow keys |
| `ESC [ H` / `F` | `Home` / `End` |
| `ESC [ 5~` / `6~` | `PageUp` / `PageDown` |
| `ESC [ Z` | `Shift+Tab` |
| `ESC [ 1;5 A`–`D` | `Ctrl+Arrow` |
| `ESC [ code ; mod u` | Kitty keyboard protocol (any key with modifiers) |
| `ESC [ <btn;col;row M/m` | SGR mouse events (press, release, move, wheel) |
| `ESC OP`–`OS`, `ESC [11~`–`24~` | F1–F12 |
| Multi-byte UTF-8 | Printable characters |
