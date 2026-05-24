# Dialog

A modal dialog widget with a title, body text, action buttons, and a dimmed backdrop.

```typescript
import { Dialog } from "../src/mod.ts";
```

---

## Constructor

```typescript
const dialog = new Dialog(
  " Confirm Action ",
  [
    "This is a modal dialog.",
    "",
    "It has a title, body text,",
    "and action buttons below.",
  ],
  [
    { label: "Cancel", action: () => {} },
    { label: "Confirm", action: () => {}, default: true },
  ],
  { width: 48 },
);
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `title` | `string` | — | Rendered in the double top border |
| `body` | `string[]` | — | Lines of body text (centered) |
| `buttons` | `DialogButton[]` | — | Action button definitions |
| `options.width` | `number` | `48` | Dialog width in characters |

### DialogButton

```typescript
interface DialogButton {
  label: string;
  action: () => void;
  default?: boolean;  // If true, activated by Enter when no button focused
}
```

---

## Usage

```typescript
dialog.appRef = app;
app.showOverlay(dialog, {
  modal: true,
  onClose: () => console.log("closed"),
});
```

The dialog closes automatically when a button is pressed (after the button's action fires).

## Interaction

| Key | Action |
|-----|--------|
| `Tab` | Cycle between buttons |
| `Enter` | Activate focused button (or default button) |
| `Escape` | Close dialog |
| Mouse | Click a button to activate |

## Visual

- Double border with title in the top border
- Body text centered in the content area
- Button row centered at the bottom
- A dimmed backdrop darkens the area behind the dialog
