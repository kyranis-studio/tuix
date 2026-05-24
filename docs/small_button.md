# SmallButton

A borderless single-row button — compact alternative to `Button`.

```typescript
import { SmallButton } from "../src/mod.ts";
```

---

## Constructor

```typescript
const btn = new SmallButton("Reset", () => {
  console.log("reset");
});
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `label` | `string` | — | Button text |
| `onClick` | `() => void` | `null` | Called on click / Enter / Space |

---

## States

| State | Appearance |
|-------|-----------|
| Default | `panelBg` fill, `text` foreground |
| Focused | `highlight` fill, `bg` text, bold |
| Disabled | `disabled` fill, `muted` text |
| Flash | `focus` fill, `bg` text, bold — pulses 150ms |

## Properties

```typescript
btn.disabled = false;
btn.flash = false;
btn.flashOnClick = true;
btn.onClick = () => {};
```

## Methods

```typescript
btn.setDisabled(true);
```

## Height

Fixed height of 1 row — no border, no padding.
