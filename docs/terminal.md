# Terminal

The terminal module (`src/terminal.ts`) handles raw terminal I/O, the double-buffered cell buffer, and resize polling.

---

## ANSI Helpers

```typescript
import { ansi } from "jsr:@kyranis-studio/tuix";

ansi.reset;          // Reset all attributes
ansi.bold;           // Bold on
ansi.dim;           // Dim on
ansi.underline;      // Underline on
ansi.hideCursor;     // Hide cursor
ansi.showCursor;     // Show cursor
ansi.clearScreen;    // Clear screen
ansi.altScreenOn;    // Switch to alternate screen buffer
ansi.altScreenOff;   // Switch back to main screen buffer
ansi.mouseOn;        // Enable SGR mouse reporting
ansi.mouseOff;       // Disable mouse reporting
ansi.moveTo(row, col); // Move cursor to position (0-indexed)
ansi.fg(color);      // Set foreground color (24-bit)
ansi.bg(color);      // Set background color (24-bit)
```

---

## Terminal Size

```typescript
import { getTermSize } from "jsr:@kyranis-studio/tuix";

const { cols, rows } = getTermSize();
```

Uses `Deno.consoleSize()`.

---

## Raw Mode

```typescript
import { enableRawMode, disableRawMode } from "jsr:@kyranis-studio/tuix";

enableRawMode();   // Set stdin to raw mode (cbreak)
disableRawMode();  // Restore cooked mode
```

Managed by `App` automatically — called on `run()` and `stop()`.

---

## CellBuffer

A 2D grid of cells that widgets draw into:

```typescript
interface Cell {
  char: string;
  fg: Color | null;
  bg: Color | null;
  bold: boolean;
  dim: boolean;
  underline: boolean;
}
```

```typescript
const buf = new CellBuffer(cols, rows);

buf.set(x, y, { char: "█", fg: theme.highlight, bg: theme.panelBg });
buf.get(x, y);                 // → Cell at (x, y)
buf.fill(x, y, w, h, cell);    // Fill rectangle
buf.writeText(x, y, "hello");  // Write text at position
buf.clear();                   // Clear all cells to empty
buf.resize(cols, rows);        // Resize buffer
```

### Clipping

```typescript
buf.pushClip(x, y, w, h);  // Push clip region (intersects with current)
buf.popClip();             // Restore previous clip region
```

All `set()` operations are clipped to the current clip region. The layout engine uses this to prevent children from painting outside their containers.

---

## Renderer (Double Buffer)

The `Renderer` maintains two `CellBuffer` instances — current and previous. On each frame, it diffs the two and writes only the changed cells to stdout:

```typescript
const renderer = new Renderer(cols, rows);

renderer.buffer;       // The current frame buffer (write into this)
renderer.resize(c, r); // Resize both buffers
renderer.flush();      // Diff and write changes to terminal
```

The flush optimises by:
- Only emitting ANSI codes for changed cells
- Tracking the previous fg/bg/bold/dim/underline state to avoid redundant sequences
- Using `ansi.moveTo()` to jump between changed cells
- Skipping identical cells entirely

---

## Resize Polling

Since `SIGWINCH` is not reliably available in Deno on all platforms, a poller checks terminal size at a regular interval:

```typescript
import { startResizePoller, stopResizePoller, onResize } from "jsr:@kyranis-studio/tuix";

const unsubscribe = onResize((size) => {
  console.log(`Terminal resized to ${size.cols}x${size.rows}`);
});

startResizePoller(80);  // Check every 80ms
// ...
stopResizePoller();
```

The `App` manages this automatically — the poller calls `doLayout()` + `doRender()` on resize.
