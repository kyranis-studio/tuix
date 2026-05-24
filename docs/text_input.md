# TextInput

A single-line text input field with cursor, text selection, clipboard copy/paste, and placeholder support.

```typescript
import { TextInput } from "jsr:@kyranis-studio/tuix";
```

---

## Constructor

```typescript
const input = new TextInput(
  "Type here...",           // placeholder
  "initial value",          // initial value
  (val) => console.log(val), // onChange
  true,                      // copyOnSelect — auto-copy selected text
  true,                      // notifyOnCopy — show "Copied!" toast
  "✓ Copied!",               // custom copy notification message
);
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `placeholder` | `string` | `""` | Ghost text when empty |
| `value` | `string` | `""` | Initial value |
| `onChange` | `(val) => void` | `null` | Called on every value change |
| `copyOnSelect` | `boolean` | `false` | Auto-copy to clipboard on selection |
| `notifyOnCopy` | `boolean` | `false` | Show notification toast on copy |
| `copyNotificationMessage` | `string` | `"Copied!"` | Notification text |

---

## Interaction

| Key | Action |
|-----|--------|
| Printable char | Insert at cursor |
| `Backspace` | Delete char before cursor |
| `Enter` | Fire `onSubmit` |
| `ArrowLeft` / `ArrowRight` | Move cursor |
| `Home` / `End` | Jump to start / end |
| `Alt+C` | Copy selection (or all text) |
| `Alt+V` | Paste from clipboard |
| `Ctrl+Shift+C` | Copy (Kitty protocol) |
| `Ctrl+Shift+V` | Paste (Kitty protocol) |

### Mouse

| Action | Behavior |
|--------|----------|
| Left-click | Position cursor |
| Drag left button | Select text (auto-copies on release) |
| Right-click release | Paste from clipboard at cursor |

---

## Properties

```typescript
input.value;          // Current text
input.placeholder;    // Placeholder text
input.cursorPos;      // Cursor position (0-indexed)
input.copyOnSelect;   // Auto-copy on selection
input.onChange;       // (val: string) => void
input.onSubmit;       // (val: string) => void — Enter key
```

Selection is highlighted with `theme.highlight` background and `theme.bg` foreground. The cursor renders as an inverted block over the character.
