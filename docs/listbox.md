# ListBox

A scrollable list selector with keyboard and mouse navigation, per-item disabled support, and selection callbacks.

```typescript
import { ListBox } from "jsr:@kyranis-studio/tuix";
```

---

## Constructor

```typescript
const items = [
  "Profile Alpha",
  "Profile Beta",
  { label: "Profile Locked", disabled: true },
];

const list = new ListBox(items, (item, index) => {
  console.log(`Selected: ${item} at ${index}`);
});
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `items` | `ListBoxItem[]` | `[]` | Array of items or `{ label, disabled? }` objects |
| `onSelect` | `(item, index) => void` | `null` | Called on Enter/Space/mouse click |

---

## Item Types

```typescript
type ListBoxItem = string | { label: string; disabled?: boolean };
```

```typescript
// Simple string (always enabled)
"Profile Alpha"

// Object with optional disabled
{ label: "Profile Locked", disabled: true }
```

Per-item `disabled` dims the item and prevents selection/focus on it. Arrow keys skip disabled items.

---

## Interaction

| Key | Action |
|-----|--------|
| `ArrowDown` / `j` | Select next enabled item |
| `ArrowUp` / `k` | Select previous enabled item |
| `Enter` / `Space` | Confirm selection (fire `onSelect`) |
| Mouse click | Select and confirm |

---

## Properties

```typescript
list.items;               // ListBoxItem[] — all items
list.selectedIndex;       // Currently selected index
list.disabled;            // true/false — full widget disable
list.onSelect;            // (item: string, index: number) => void — confirm selection
list.onSelectChange;      // (item: string, index: number) => void — called on every selection change
```

## Methods

```typescript
list.setDisabled(true);
```

## Visual

Selected items are prefixed with `▶` and highlighted using `theme.highlight` (when focused) or `theme.border` (when unfocused). Disabled items use `theme.muted` on `theme.disabled` background.
