# Dropdown

A combo-box style selector — shows the current selection with a `▼` indicator and opens a scrollable floating list on activation.

```typescript
import { Dropdown } from "jsr:@kyranis-studio/tuix";
```

---

## Constructor

```typescript
const dropdown = new Dropdown(
  "Theme",                          // label
  ["Light", "Dark", "Solarized"],   // options
  0,                                 // selected index
  (value, index) => {
    console.log(`Selected: ${value}`);
  },
);
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `label` | `string` | `""` | Widget label |
| `options` | `string[]` | `[]` | List of options |
| `selectedIndex` | `number` | `0` | Initially selected option |
| `onChange` | `(value, index) => void` | `null` | Called on selection change |

---

## Interaction

| Key | Action |
|-----|--------|
| `Enter` / `Space` | Open the floating list |
| `ArrowDown` / `ArrowUp` | Cycle through options while closed |
| `Home` / `End` | Jump to first / last option while closed |
| Arrow keys | Navigate list when open |
| `Enter` | Select focused item when open |
| `Escape` / `Tab` | Close the list without selecting |

Mouse click toggles the list open/closed. Click on an item in the list selects it. The floating list auto-dismisses when clicking outside it.

---

## Properties

```typescript
dropdown.options;         // string[] — all options
dropdown.selectedIndex;   // Currently selected index
dropdown.open;            // true when list is visible
dropdown.maxVisible;      // Max items visible in the floating list (default 6)
dropdown.onChange;        // (value: string, index: number) => void
```

## App Reference

The dropdown requires `appRef` for showing/hiding the floating list overlay:

```typescript
dropdown.appRef = app;
```

## Visual

Closed: shows the selected option text with a `▼` arrow. Open: shows `▲` instead. The floating list is positioned below the dropdown, flipping above if there isn't enough room at the bottom.
