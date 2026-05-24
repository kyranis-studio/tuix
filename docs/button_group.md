# ButtonGroup

A horizontal segmented control — multiple labeled options with single selection, arrow-key navigation, and underline indicator.

```typescript
import { ButtonGroup } from "../src/mod.ts";
```

---

## Constructor

```typescript
const group = new ButtonGroup(
  "Align",
  ["Left", "Center", "Right", "Justify"],
  0,
  (val, index) => {
    console.log(`Selected: ${val} at index ${index}`);
  },
);
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `label` | `string` | `""` | Widget label (used as Box label) |
| `options` | `string[]` | `[]` | Option labels |
| `selectedIndex` | `number` | `0` | Initially selected option |
| `onChange` | `(value, index) => void` | `null` | Called on selection change |

---

## Interaction

| Key | Action |
|-----|--------|
| `ArrowLeft` / `ArrowRight` | Move focus between options |
| `Enter` / `Space` | Select the focused option |
| `Home` / `End` | Jump to first / last option |

Mouse click on an option selects it directly.

---

## Properties

```typescript
group.options;        // string[] — option labels
group.selectedIndex;  // number — currently selected
group.focusedIndex;   // number — currently focused (may differ from selected)
group.onChange;       // (value: string, index: number) => void
```

The bottom border underline highlights the currently focused option using `theme.highlight`.
