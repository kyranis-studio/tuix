# Layout

The layout engine is built around the **`Box`** class (`src/layout.ts`), which serves as both a layout container and a base class for all widgets. It uses a flex-like model inspired by CSS Flexbox.

---

## Box — The Core Node

Every element in a **tuix** UI is a `Box`. Boxes form a tree — each box can contain child boxes, and the layout engine recursively positions and sizes them.

```typescript
import { Box } from "../src/mod.ts";

const root = new Box("root");
const left = new Box("left pane");
const right = new Box("right pane");
root.add(left, right);
```

### Direction

A box arranges its children along its **main axis**:

| Direction | Main axis | Cross axis |
|-----------|-----------|------------|
| `"row"`   | horizontal (→) | vertical (↓) |
| `"column"` | vertical (↓) | horizontal (→) |

Use the static builders for readability:

```typescript
const row = Box.row("row");    // direction: "row"
const col = Box.col("column"); // direction: "column"
```

The default direction is `"row"`.

---

## Sizing

Each axis has a `SizeConstraint` that controls how the box is sized:

```typescript
interface SizeConstraint {
  fixed?: number; // exact character count
  grow?: number;  // flex-grow factor
  min?: number;   // minimum size
  max?: number;   // maximum size
}
```

### Fixed

The box occupies exactly N characters on that axis:

```typescript
box.width  = { fixed: 20 };
box.height = { fixed: 3 };
```

### Grow

The box flexes to fill the available space. Multiple grow children share space proportional to their factor:

```typescript
boxA.width = { grow: 1 }; // takes 1/3 of remaining space
boxB.width = { grow: 2 }; // takes 2/3 of remaining space
```

Grow is the **default** — `new Box()` sets both `width` and `height` to `{ grow: 1 }`.

### Hug (shrink-wrap)

An empty constraint `{}` makes the box shrink-wrap to its children on that axis:

```typescript
container.width  = {}; // hug width to children
container.height = {}; // hug height to children
```

**Main-axis hug:** the container shrinks to exactly fit its children along the main axis.
**Cross-axis hug:** the container shrinks to match the largest child on the cross axis.

When both the parent and a child use hug sizing in the same direction, the child gets its natural size computed recursively.

### Min / Max

Clamp sizing within bounds (works with `grow` or `hug`):

```typescript
box.width = { grow: 1, min: 10, max: 40 };
```

---

## Alignment

### Cross-axis (`align`)

Controls how children are positioned perpendicular to the main axis:

| Value | Behavior |
|-------|----------|
| `"stretch"` (default) | Children fill the full cross-axis size |
| `"start"` | Children align at the start |
| `"center"` | Children are centered |
| `"end"` | Children align at the end |

```typescript
row.style.align = "center";
```

### Main-axis (`justify`)

Controls how children are distributed along the main axis when there's free space:

| Value | Behavior |
|-------|----------|
| `"start"` (default) | Children packed at the start |
| `"center"` | Children centered |
| `"end"` | Children packed at the end |
| `"space-between"` | Equal space between children |
| `"space-around"` | Equal space around each child |

```typescript
row.style.justify = "space-between";
```

---

## Spacing

### Gutter

Spacing between adjacent children:

```typescript
container.style.gutter = 2; // 2-character gap between children
```

### Padding

Inner spacing around the content area (inside any border):

```typescript
container.style.padding = { top: 1, right: 2, bottom: 1, left: 2 };
```

Helper functions:

```typescript
import { edgesZero, edgesAll, edgesXY } from "../src/mod.ts";

edgesZero();           // { top: 0, right: 0, bottom: 0, left: 0 }
edgesAll(1);           // { top: 1, right: 1, bottom: 1, left: 1 }
edgesXY(2, 1);         // { top: 1, right: 2, bottom: 1, left: 2 }
```

### Margin

Outer spacing around the box (outside any border, subtracted from the parent's allocation):

```typescript
box.style.margin = { top: 0, right: 1, bottom: 0, left: 1 };
```

---

## Borders

```typescript
box.style.border = "single";   // ┌─┐
box.style.border = "double";   // ╔═╗
box.style.border = "rounded";  // ╭─╮
box.style.border = "bold";     // ┏━┓
box.style.border = "none";     // no border (default)
```

Custom borders using `BorderChars`:

```typescript
import { BORDERS, getBorderChars } from "../src/mod.ts";

box.style.border = { topLeft: "╔", topRight: "╗", ... };
```

When a box has a `label`, it's rendered inside the top border:

```typescript
const box = new Box("Settings");
box.style.border = "rounded";
// Displays: ╭─ Settings ─╮
```

Border colors switch between `theme.border` and `theme.focusBorder` when the box is focused.

---

## Overflow & Scrolling

```typescript
box.style.overflow = "auto";   // scrollbars appear when content overflows (default)
box.style.overflow = "scroll"; // scrollbars always visible
box.style.overflow = "hidden"; // clip content, no scrollbars
box.style.overflow = "visible"; // content overflows without clipping
```

When overflow is `"auto"` or `"scroll"`, the engine calculates `scrollMaxX` and `scrollMaxY` based on child sizes vs content area. The app's event loop automatically handles:
- Arrow keys / PageUp / PageDown — scrolls any focused container
- Ctrl+ArrowLeft/Right — horizontal scroll with larger step
- Mouse wheel — scrolls under the cursor

The scrollbar is painted as a track (`│`/`─`) with a draggable thumb (`▌`/`▄`).

---

## Splitter

`Splitter` (`src/splitter.ts`) creates resizable panel dividers:

```typescript
import { Splitter } from "../src/mod.ts";

const split = new Splitter("horizontal", leftPanel, rightPanel, {
  initialSplit: 40, // 40% for left panel
  minA: 10,         // minimum left panel size
  minB: 10,         // minimum right panel size
});
```

| Parameter | Description |
|-----------|-------------|
| `direction` | `"horizontal"` or `"vertical"` |
| `initialSplit` | Starting split position in characters |
| `minA` / `minB` | Minimum size for each panel |

Splitters are managed by the `App` — mouse press on the handle starts drag, mouse move resizes, release ends drag. The handle renders as `┃` (horizontal) or `━` (vertical) with a `◈` indicator at center.

---

## Painting

### Custom paint (`onPaint`)

Override to render custom content inside a box:

```typescript
box.onPaint = (buf, rect, theme) => {
  // buf: CellBuffer to draw into
  // rect: content area (inside border + padding)
  // theme: current Theme
  for (let i = 0; i < rect.width; i++) {
    buf.set(rect.x + i, rect.y, { char: "█", fg: theme.highlight, bg: theme.bg });
  }
};
```

### Paint helpers

```typescript
import { paintCenteredText, paintText } from "../src/mod.ts";

// Centered text
paintCenteredText(buf, rect, "Hello", theme.text, theme.bg, true);

// Text at a specific row
paintText(buf, rect, "Status: OK", 0, theme.highlight);
```

### Fill

The `CellBuffer.fill()` method fills a rectangular area:

```typescript
buf.fill(x, y, width, height, { char: " ", bg: theme.panelBg, fg: null });
```

---

## Hit Testing

`Box.hitTest(col, row)` recursively finds the deepest child at a given terminal coordinate. Returns `null` if outside the box. Used by the app for mouse event dispatch.

---

## Layout Algorithm Overview

The layout pass (`Box.layout()`) proceeds in this order:

1. **Resolve own size** from constraints (`fixed` → exact, `grow` → fill parent, `hug` → shrink-wrap)
2. **Compute content area** by subtracting border and padding
3. **Resolve main-axis child sizes** — fixed children take their size, grow children share remaining space, hug children get natural size
4. **Compute main-axis positions** using `justify` and gutter
5. **Resolve cross-axis sizes** using `align` and child constraints
6. **Layout each child** recursively with its computed rect
7. **Shrink-wrap cross-axis** if hugging
8. **Compute scroll extents** if overflow is `"auto"` or `"scroll"`
9. **Paint pass** (`Box.paint()`) — background fill, border, custom `onPaint`, clipping, child painting, scrollbar
