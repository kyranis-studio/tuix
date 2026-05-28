# Checkbox

A toggle checkbox with `☑`/`☐` indicators, keyboard and mouse support.

```typescript
import { Checkbox } from "jsr:@kyranis-studio/tuix";
```

---

## Constructor

```typescript
const chk = new Checkbox("Enable Feature", true, (checked) => {
  console.log(`Checked: ${checked}`);
});
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `label` | `string` | — | Text displayed next to the checkbox |
| `checked` | `boolean` | `false` | Initial state |
| `onChange` | `(checked) => void` | `null` | Called when toggled |

---

## Interaction

| Key | Action |
|-----|--------|
| `Enter` / `Space` | Toggle checked state |
| Mouse click | Toggle checked state |

## Properties

```typescript
chk.checked = true;    // Current state
chk.disabled = false;  // Dims and blocks interaction
chk.onChange = (c) => {}; // Change handler
```

## Methods

```typescript
chk.setDisabled(true);
chk.toggle();          // Toggle + fire onChange
```

## States

| State | Display |
|-------|---------|
| Unchecked | `☐ Enable Feature` |
| Checked | `☑ Enable Feature` (bold) |
| Focused | Box character uses `highlight` color |
| Disabled | All text in `muted`, bg in `disabledBg` |

The background fills the full content row width using `theme.secondaryBg`.

## Height

Fixed height of 1 row, no border.
