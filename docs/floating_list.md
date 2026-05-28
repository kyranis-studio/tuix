# FloatingListBox

A floating list box widget designed as an overlay for autocomplete dropdowns, command palettes, and file mention pickers. It appears as a bordered list positioned relative to a trigger widget, and can be used as a non-focusable overlay so the underlying input retains keyboard focus.

```typescript
import { FloatingListBox } from "jsr:@kyranis-studio/tuix";
```

---

## Constructor

```typescript
const list = new FloatingListBox(
  ["Item A", "Item B", "Item C"],  // items
  0,                                // selectedIndex
);
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `items` | `string[]` | `[]` | Full list of items |
| `selectedIndex` | `number` | `0` | Initially selected index |

---

## Key Features

- **📋 Scrollable** — Supports up/down arrow navigation with automatic scroll clamping via `clampScroll()`.
- **📍 Position Aware** — `positionRelativeTo(triggerRect)` places the list below the trigger by default, flipping above if there isn't enough room.
- **🎯 Non-Focusable Mode** — Set `focusable = false` so the underlying input retains keyboard focus while the dropdown is visible.
- **🖱️ Mouse Support** — Click an item to select it; the list auto-dismisses via its `removeFn`.

---

## Usage

### Basic Dropdown (with Auto-Dismiss)

```typescript
const list = new FloatingListBox(items, 0);
list.maxVisible = 8;
list.focusable = false;  // Keep keyboard focus on the input

list.onItemSelect = (item: string) => {
  console.log(`Selected: ${item}`);
};
list.removeFn = () => app.removeOverlay(list);

// Show as overlay
app.showOverlay(list, {
  modal: false,
  autoDismiss: true,
  triggerRect: inputBox.rect,
  reposition: () => list.positionRelativeTo(inputBox.rect),
});
list.positionRelativeTo(inputBox.rect);
```

### Styling

```typescript
list.style.border = "single";
list.style.padding = { top: 0, bottom: 0, left: 1, right: 1 };
list.width = { fixed: 200 };
list.height = { fixed: 10 };
```

### Custom Scrollbar

```typescript
list.style.scrollbar = {
  showArrows: true,
  verticalTrack: "│",
  verticalThumb: "▌",
  arrowUp: "↑",
  arrowDown: "↓",
};
```

---

## Properties

```typescript
list.items;                  // string[] — the item list
list.selectedIndex;          // Currently selected index
list.maxVisible;             // Max visible items before scroll (default 8)
list.onItemSelect;           // (item: string, index: number) => void
list.removeFn;               // () => void — called to remove the overlay
list.clampScroll();          // Ensure selected index is visible
list.positionRelativeTo();   // Position below/above a trigger rect
```

---

## Interaction

| Key | Action |
|-----|--------|
| `ArrowUp` / `ArrowDown` | Navigate items |
| `Enter` / `Space` | Select focused item |
| `Escape` | Close dropdown via `removeFn` |
| `Tab` | Close dropdown |

| Mouse | Action |
|-------|--------|
| Click on item | Select that item |

Items are highlighted with `theme.highlight` background and `theme.appBg` foreground when selected, and `theme.text`/`theme.secondaryBg` otherwise.
