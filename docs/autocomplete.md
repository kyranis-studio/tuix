# Autocomplete

A text input with suggestion completion — supports dropdown mode and inline completion mode.

```typescript
import { Autocomplete } from "jsr:@kyranis-studio/tuix";
```

---

## Constructor

```typescript
const auto = new Autocomplete(
  "Search framework...",    // placeholder
  ["React", "Vue", "Svelte", "Solid", "Deno"],
  (item) => {
    console.log(`Selected: ${item}`);
  },
);
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `placeholder` | `string` | `""` | Ghost text when empty |
| `suggestions` | `string[]` | `[]` | Full list of suggestions |
| `onSelect` | `(item) => void` | `null` | Called on selection |

---

## Modes

```typescript
auto.mode = "dropdown";  // Default — shows a floating list of filtered suggestions
auto.mode = "inline";    // Completes inline with ghost text after cursor
```

### Dropdown mode

As the user types, the suggestion list filters based on the input (case-insensitive substring match). The floating list appears below the input when there are matching suggestions. Arrow keys navigate the list, Enter selects.

### Inline mode

When the typed text matches the start of a suggestion, the completion appears as dim text after the cursor. Press Tab to accept the completion.

---

## Custom Filter

```typescript
auto.filterFn = (value, suggestions) => {
  return suggestions.filter(s => s.startsWith(value));
};
```

## Properties

```typescript
auto.value;                 // Current text
auto.placeholder;           // Placeholder text
auto.cursorPos;             // Cursor position
auto.mode;                  // "dropdown" | "inline"
auto.maxVisibleItems;       // Max items in dropdown (default 6)
auto.filteredSuggestions;   // Currently visible filtered list
auto.onSelect;              // (item: string) => void
auto.onChange;              // (val: string) => void
```

## Interaction

| Key | Dropdown mode | Inline mode |
|-----|---------------|-------------|
| Type | Filters suggestions | Computes inline completion |
| `ArrowDown` / `ArrowUp` | Navigate dropdown | — |
| `Enter` | Select focused item | — |
| `Tab` | Close dropdown | Accept ghost completion |
| `Escape` | Close dropdown | — |

The widget requires `appRef` to be set for showing/hiding the dropdown overlay:

```typescript
auto.appRef = app;
```
