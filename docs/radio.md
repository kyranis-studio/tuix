# RadioButton / RadioGroup

Mutually exclusive radio selection with `•`/`○` indicators.

```typescript
import { RadioButton, RadioGroup } from "jsr:@kyranis-studio/tuix";
```

---

## RadioGroup (recommended)

Manages a group of `RadioButton` instances with mutual exclusion:

```typescript
const group = new RadioGroup(
  "Options",
  [
    { label: "Option Alpha", value: "alpha" },
    { label: "Option Beta", value: "beta" },
    { label: "Option Gamma", value: "gamma" },
    { label: "Option Locked", value: "locked", disabled: true },
  ],
  "alpha",
  (val) => {
    console.log(`Selected: ${val}`);
  },
);
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `label` | `string` | — | Group label (rendered in border) |
| `options` | `RadioOption[]` | — | Array of option definitions |
| `selectedValue` | `string` | first option | Initially selected value |
| `onChange` | `(value) => void` | `null` | Called on selection change |

### RadioOption

```typescript
interface RadioOption {
  label: string;
  value: string;
  disabled?: boolean;
}
```

---

## RadioButton (standalone)

Individual radio button (for manual management):

```typescript
const rb = new RadioButton("Alpha", "alpha", true);
rb.onChange = (val) => console.log(val);
rb.setDisabled(true);
rb.select();   // Mark as selected + fire onChange
```

---

## Interaction

| Key | Action |
|-----|--------|
| `Enter` / `Space` | Select the focused radio option |
| Mouse click | Select the clicked option |

Disabled options cannot be selected and are visually dimmed.

---

## Properties (RadioGroup)

```typescript
group.selectedValue;  // Currently selected value string
group.select("beta"); // Programmatically select a value
group.onChange;       // (value: string) => void
```

## Visual

Selected: `•` with bold text. Unselected: `○` with normal text. Focused options use `theme.highlight` for the indicator color.
