# App

The `App` class (`src/app.ts`) is the main entry point for every **tuix** application. It owns the terminal, the render loop, the event loop, focus management, and overlay system.

---

## Quick Start

```typescript
import { App, Box, Button, defaultTheme } from "jsr:@kyranis-studio/tuix";

const root = Box.col("root");
root.add(new Button("Hello", () => console.log("clicked")));

const app = new App(root, { theme: defaultTheme, fps: 30, mouse: true });
await app.run();
```

---

## Constructor

```typescript
const app = new App(root, options);
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `root` | `Box` | — | Root of the widget tree |
| `options.theme` | `Theme` | `vscodeDarkTheme` | Colors and border defaults |
| `options.fps` | `number` | `30` | Render frames per second |
| `options.mouse` | `boolean` | `true` | Enable SGR mouse reporting |

---

## Lifecycle

### `app.run()`

Starts the application. This is an `async` method that:

1. **Terminal setup** — enables raw mode, switches to the alternate screen buffer, hides the cursor, enables mouse reporting, clears the screen
2. **Initial render** — lays out the widget tree and renders the first frame
3. **Resize polling** — starts an 80ms poller that detects terminal resize (`SIGWINCH`) and re-lays-out the tree
4. **Render loop** — re-lays-out and re-renders at the configured `fps` via `setInterval`
5. **Event loop** — reads keyboard and mouse events from stdin and dispatches them

### `app.stop()`

Stops the application gracefully: sets `_running = false` and aborts the event stream iterator. The render loop is cleared and `_cleanup()` restores the terminal (shows cursor, disables mouse, switches back to the main screen buffer, disables raw mode).

---

## Theme

```typescript
app.activeTheme;          // → current Theme object
app.setTheme(newTheme);   // swap theme at runtime
```

The theme is passed to every box's `paint()` method each frame, so widgets immediately reflect the new colors. `setTheme()` was added to support runtime theme switching (used by the showcase's theme dropdown).

---

## Focus Management

Access the `FocusManager` directly:

```typescript
app.focusManager; // → FocusManager instance
```

The app automatically handles Tab / Shift+Tab cycling. The focus manager collects all `focusable` boxes, sorts by `tabIndex`, and wraps around.

### Shortcuts

```typescript
app.shortcut("1", zone1Box);
app.shortcut("2", zone2Box);
// Pressing "1" jumps focus to zone1Box
```

Returns `this` for chaining.

---

## Overlays

Overlays are floating widgets rendered on top of the main tree. The app manages a **stack** of them — the topmost overlay receives mouse events first.

### `showOverlay(box, options?)`

```typescript
app.showOverlay(dialogBox, {
  modal: true,
  onClose: () => console.log("dialog closed"),
});
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `modal` | `boolean` | `true` | If true, blocks mouse interaction with the main tree |
| `onClose` | `() => void` | — | Called when the overlay is removed |

The overlay is centered on screen by default. It's added to the app's focus root set, and the first focusable element inside it receives focus. Previous focus is saved so it can be restored when the overlay closes.

### `removeOverlay(box)`

Removes the overlay from the stack, restores focus roots, and restores the previously focused widget. Calls the `onClose` callback.

### `hasModalOverlay`

Returns `true` if any overlay in the stack is modal. When true, mouse clicks on the main tree are ignored.

### `topOverlay`

Returns the topmost overlay's `Box`, or `null` if the stack is empty.

---

## Drag Support

Used by `FloatingWindow` for dragging:

```typescript
app.startDrag(box, col, row);
```

Stores the drag offset and updates `box.rect` on subsequent mouse move events until release.

---

## Event Handling

### Keyboard Events (`_handleEvent`)

The app's event dispatcher processes keys in this priority:

| Key | Action |
|-----|--------|
| `Ctrl+Q` | Quit the application |
| `Ctrl+C` | Consumed and ignored (prevents accidental exit) |
| `Escape` | Close topmost overlay, or dispatch to focused widget |
| `Tab` | Cycle focus forward (unless the widget's `handleTab` consumes it) |
| `Shift+Tab` | Cycle focus backward |
| Shortcut keys | Jump focus to the registered box |
| Other keys | Dispatched to the focused widget's `onKey` |
| Arrow / Page keys | Walk up from the focused widget and scroll the nearest scrollable container |
| `Ctrl+Arrow` | Horizontal scroll with larger step (3 instead of 1) |

### Mouse Events (`_handleMouse`)

| Event | Action |
|-------|--------|
| **Wheel** | Find hit in overlays first, then main tree; walk up to scroll the nearest container with `scrollMaxY > 0` or `scrollMaxX > 0` |
| **Left-click press** | Check overlays first (focus and dispatch `onMouse`). If no overlay hit and no modal blocking: check splitter handles, then focus and dispatch to main tree |
| **Right-click press** | Focus the widget under the cursor (paste typically happens on release via the widget's own handler) |
| **Move** | If dragging a floating box, update position. If dragging a splitter, resize panels. If in a text selection drag, send `"move"` to the widget |
| **Release** | End drags, dispatch `"release"` to overlays or main tree |

---

## Internal Flow

```
run()
  ├── enableRawMode(), alt screen, hide cursor, mouse on
  ├── create Renderer
  ├── focusFirst()
  ├── doLayout() + doRender()  // first frame
  ├── startResizePoller(80ms)
  ├── render loop (setInterval @ fps)
  │     ├── doLayout()
  │     └── doRender()
  └── event loop (for await ... readEvents)
        ├── _handleEvent(key / mouse)
        ├── render loop keeps painting in background
        └── on stop: clearInterval, _cleanup()
```

- `doLayout()` — calls `root.layout(fullScreenRect)` then re-layouts all overlays
- `doRender()` — resizes the `Renderer` buffer if needed, calls `root.paint()`, paints overlays on top, then flushes the diff to stdout

---

## Cleanup

`_cleanup()` is called when the event loop exits:

1. `stopResizePoller()`
2. `ansi.mouseOff` — disable mouse reporting
3. `ansi.showCursor` — restore cursor
4. `ansi.altScreenOff` — switch back to main screen buffer
5. `ansi.reset` — reset terminal attributes
6. `disableRawMode()` — restore cooked terminal mode
