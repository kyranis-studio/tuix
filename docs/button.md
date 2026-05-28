# Button

A clickable button with border, keyboard and mouse support, multiple visual styles, and toggle/flash states.

```typescript
import { Button } from "jsr:@kyranis-studio/tuix";
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
| `label` | `string` | — | Button text |
| `onClick` | `() => void` | `null` | Called on click / Enter / Space |

---

## Styles

Five built-in visual styles. Default is `"default"`.

| Style | Height | Border | Padding | Rest-state fill |
|-------|--------|--------|---------|----------------|
| `default` | 3 | single | `{0,0,1,1}` | `panelBg` |
| `small` | 1 | none | `{0,0,1,1}` | `bg` (darker) |
| `large` | 5 | single | `{1,1,2,2}` | `panelBg` |
| `ghost` | 3 | none | `{0,0,1,1}` | `bg` (darker) |
| `outline` | 3 | single | `{0,0,1,1}` | `panelBg` |

### Static factories

```typescript
Button.small("Undo");        // small style
Button.large("Submit");      // large style
Button.ghost("Cancel");      // ghost style
Button.outline("Preview");   // outline style
Button.withStyle("default", "OK");  // any style by name
```

### Runtime switching

```typescript
btn.setButtonStyle("ghost");
```

---

## States

| State | Appearance | Interaction |
|-------|-----------|-------------|
| Default (bordered) | Single border, `panelBg` fill, `text`/`highlight` text | Click, focus |
| Default (borderless) | `bg` fill, `text`/`highlight` text | Click, focus |
| Focused | Border switches to `focusBorder` (bordered); text bold + `highlight` | Keyboard Enter/Space |
| Toggled | `highlight` fill with `bg` text; border → `focusBorder`/`highlight` | `btn.toggle()` or auto-toggle |
| Disabled | `disabled` bg, `muted` text, no interaction | None |
| Flash (bordered) | `focus` fill across entire button + border, `bg` text — pulses 150ms | `flashOnClick` auto-triggers |
| Flash (borderless) | `focus` blended with `panelBg` (55/45) across entire button, `bg` text — pulses 150ms | `flashOnClick` auto-triggers |

---

## Properties

```typescript
btn.disabled = false;          // Dims and blocks interaction
btn.toggled = false;           // Current toggle visual state
btn.toggleOnClick = false;     // If true, clicking calls toggle()
btn.flash = false;             // Current flash state
btn.flashOnClick = true;       // Auto-flash on every click
btn.buttonStyle = "default";   // Current visual style
btn.onClick = () => {};        // Click handler
btn.onToggle = (t) => {};      // Called when toggled via toggle()
```

---

## Toggle

`toggleOnClick` controls both the ability to toggle and (when combined with the
separate `toggled` property) the visual state.

```typescript
const btn = new Button("Pin");
btn.toggleOnClick = true;    // Clicking will auto-toggle
btn.onToggle = (v) => {
  btn.label = v ? "Pinned" : "Pin";
};

// Manual control:
btn.toggle();                // Flip toggled state
btn.setToggled(true);        // Set directly
```

---

## Methods

```typescript
btn.setDisabled(true);       // Disable + remove focusability
btn.toggle();                // Toggle toggled state + fire onToggle
btn.setToggled(true);        // Set toggled state directly
btn.setButtonStyle("large"); // Switch visual style at runtime
```

---

## Flash

Flash fires automatically on every click when `flashOnClick` is `true` (default).
It paints a 150ms pulse of `theme.focus` across the entire button area.

- **Bordered styles** (default, large, outline): full button area + border redrawn in `focus` color
- **Borderless styles** (small, ghost): full button area filled with a subtle blend of `focus` and `panelBg`
