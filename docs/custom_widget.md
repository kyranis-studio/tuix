# Custom Widgets

You can create custom widgets by extending `Box` and overriding its hooks.

---

## Basic Pattern

```typescript
import { Box } from "jsr:@kyranis-studio/tuix";
import type { CellBuffer } from "../src/terminal.ts";
import type { Theme } from "../src/theme.ts";

class MyWidget extends Box {
  constructor() {
    super("myWidget");
    this.focusable = true;
    this.tabIndex = 0;
    this.height = { fixed: 3 };
    this.style.border = "single";

    // Custom paint
    this.onPaint = (buf, rect, theme) => {
      for (let i = 0; i < rect.width; i++) {
        buf.set(rect.x + i, rect.y, {
          char: "█",
          fg: theme.highlight,
          bg: theme.panelBg,
        });
      }
    };

    // Keyboard input
    this.onKey = (key, modifiers) => {
      if (key === "Enter") {
        // handle Enter
      }
    };

    // Mouse input
    this.onMouse = (col, row, action, button) => {
      if (action === "press") {
        // handle click
      }
    };
  }
}
```

---

## Hooks

| Hook | Signature | When called |
|------|-----------|-------------|
| `onPaint` | `(buf, rect, theme) => void` | Every render frame — draw custom content |
| `onKey` | `(key, modifiers) => void` | When focused and a key is pressed |
| `onMouse` | `(col, row, action, button) => void` | Mouse events within the box rect |
| `handleTab` | `() => boolean` | Tab pressed while focused (return true to consume) |
| `onFocus` | `() => void` | Box gains focus |

### onPaint

The `rect` parameter is the **content area** — inside border and padding. Use `this.rect` for the full box rect including border.

```typescript
this.onPaint = (buf, rect, theme) => {
  // rect.x, rect.y, rect.width, rect.height
  buf.fill(rect.x, rect.y, rect.width, rect.height, { char: " ", bg: theme.panelBg });
};
```

### onKey

```typescript
this.onKey = (key, modifiers) => {
  // key: "a", "Enter", "ArrowUp", "Escape", etc.
  // modifiers: { ctrl, alt, shift }
  if (key === "Escape") { /* ... */ }
};
```

### onMouse

```typescript
this.onMouse = (col, row, action, button) => {
  // action: "press" | "release" | "move"
  // button: 0 (left), 2 (right)
  if (action === "press" && button === 0) { /* ... */ }
};
```

---

## Overriding Paint

For full control, override the `paint` method directly instead of using `onPaint`:

```typescript
class MyWidget extends Box {
  override paint(buf: CellBuffer, theme: Theme): void {
    // Full control: background, border, children, etc.
    super.paint(buf, theme); // handles border + children
    // Add custom rendering after
  }
}
```

---

## Using Built-in Helpers

```typescript
import { paintCenteredText, paintText } from "jsr:@kyranis-studio/tuix";

// Centered text
paintCenteredText(buf, rect, "Hello", theme.text, theme.bg, true);

// Text at specific row
paintText(buf, rect, "Status: OK", 0, theme.highlight);

// Fill background
buf.fill(x, y, w, h, { char: " ", bg: theme.panelBg });

// Draw individual cells
buf.set(x, y, { char: "█", fg: theme.highlight, bg: theme.panelBg, bold: true });
```

---

## Composite Widgets

Build a widget from multiple `Box` children:

```typescript
class MyPanel extends Box {
  readonly header: Box;
  readonly body: Box;

  constructor(title: string) {
    super("panel");
    this.style.direction = "column";
    this.width = { grow: 1 };
    this.height = {}; // hug content

    this.header = new Box(title);
    this.header.height = { fixed: 1 };

    this.body = Box.col("body");
    this.body.style.gutter = 1;

    super.add(this.header, this.body);
  }

  override add(...children: Box[]): this {
    this.body.add(...children);
    return this;
  }
}
```
