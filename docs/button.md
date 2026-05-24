# Button

A clickable button with border, keyboard and mouse support, and multiple visual states.

```typescript
import { Button } from "../src/mod.ts";
```

---

## Constructor

```typescript
const btn = new Button("Click Me", () => {
  console.log("clicked!");
});
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `label` | `string` | — | Button text (also used as border label) |
| `onClick` | `() => void` | `null` | Called on click / Enter / Space |

---

## States

| State | Appearance | Interaction |
|-------|-----------|-------------|
| Default | Single border, `panelBg` fill, `highlight` text | Click, focus |
| Focused | Border switches to `focusBorder` | Keyboard Enter/Space |
| Toggled | `highlight` fill with `bg` text | `btn.toggle()` |
| Disabled | `disabled` bg, `muted` text, no border | None |
| Flash | `focus` fill, `bg` text — pulses 150ms | `flashOnClick` auto-triggers |

---

## Properties

```typescript
btn.disabled = false;      // Dims and blocks interaction
btn.toggled = false;       // Toggle state (visual only)
btn.flash = false;         // Flash state
btn.flashOnClick = true;   // Auto-flash on click
btn.onClick = () => {};    // Click handler
btn.onToggle = (t) => {};  // Called when toggled via toggle()
```

## Methods

```typescript
btn.setDisabled(true);     // Disable + remove focusability
btn.toggle();              // Toggle toggled state + fire onToggle
btn.setToggled(true);      // Set toggled state directly
```

## Height

Buttons have a fixed height of 3 rows (single border + 1 content row + bottom border).
