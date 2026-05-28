# ListBox

A scrollable list selector with keyboard and mouse navigation, per-item disabled support, single and multi-selection callbacks.

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

### Single-select mode (default)

| Key | Action |
|-----|--------|
| `ArrowDown` / `j` | Select next enabled item |
| `ArrowUp` / `k` | Select previous enabled item |
| `Enter` / `Space` | Confirm selection (fire `onSelect`) |
| Mouse click | Select and confirm |

### Multi-select mode (`multiple = true`)

| Key | Action |
|-----|--------|
| `ArrowDown` / `j` | Move focus to next enabled item |
| `ArrowUp` / `k` | Move focus to previous enabled item |
| `Space` | Toggle the focused item in/out of the selection |
| `Enter` | Confirm selection (fire `onSelect` for the focused item) |
| `Ctrl` + Click | Toggle the clicked item in/out of the selection |
| Mouse click | Clear selection and select only the clicked item |

---

## Properties

```typescript
list.items;               // ListBoxItem[] — all items
list.selectedIndex;       // Currently focused/selected index
list.selectedIndices;     // Set<number> — selected indices (multi-select only)
list.multiple;            // boolean — enable multi-select (default false)
list.disabled;            // true/false — full widget disable
list.onSelect;            // (item: string, index: number) => void — confirm selection
list.onSelectChange;      // (item: string, index: number) => void — called on every selection/focus change
```

---

## Methods

```typescript
list.setDisabled(true);
```

---

## Visual

**Single-select:** The selected item is prefixed with `▶` and highlighted using `theme.highlight` (when focused) or `theme.border` (when unfocused).

**Multi-select:** The focused item is prefixed with `▸`. Selected items show a `✓` suffix. Disabled items use `theme.muted` on `theme.disabledBg` background.

The background uses `theme.secondaryBg` and fills the full content width.
