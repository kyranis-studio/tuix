# FloatingWindow

A draggable floating window with a title bar, close button, and content area.

```typescript
import { FloatingWindow } from "../src/mod.ts";
```

---

## Constructor

```typescript
const win = new FloatingWindow(
  "Draggable Window",
  {
    width: 48,
    height: 18,
    onClose: () => console.log("window closed"),
  },
);
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `title` | `string` | — | Window title (displayed in title bar) |
| `options.width` | `number` | `46` | Window width in characters |
| `options.height` | `number` | `16` | Window height in characters |
| `options.onClose` | `() => void` | `null` | Called when window is closed |

---

## Usage

```typescript
win.appRef = app;
app.showOverlay(win, { modal: false });

// Add content
win.contentBox.add(childWidget);
```

## Interaction

| Action | Behavior |
|--------|----------|
| Drag title bar | Move window |
| Click `[×]` | Close window |
| `Escape` | Close (via app overlay handling) |

## Properties

```typescript
win.contentBox;  // Box — add child widgets here
```

## Methods

```typescript
win.close();     // Programmatically close
```

## Visual

- Rounded border
- Title bar row with `toolbarBg` background and `highlight` title text
- Dim separator line between title bar and content
- `[×]` close button turns red on hover/focus
- Content area accepts any child widgets
