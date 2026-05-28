# PasswordInput

A password input field that masks typed characters and blocks clipboard copy operations — extends `TextInput`.

```typescript
import { PasswordInput } from "jsr:@kyranis-studio/tuix";
```

---

## Constructor

```typescript
const pw = new PasswordInput(
  "Password",               // label (shown in border)
  "Enter your password...", // placeholder
  "",                        // initial value
  (val) => console.log(val),// onChange
);
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `label` | `string` | `"Password"` | Border label |
| `placeholder` | `string` | `""` | Ghost text when empty |
| `value` | `string` | `""` | Initial value |
| `onChange` | `(val) => void` | `null` | Called on every value change |

All `TextInput` parameters (`copyOnSelect`, `notifyOnCopy`, etc.) are also available.

---

## Key Features

- **🔒 Character Masking**: Every typed character is displayed as `*` using `_getDisplayChar()`.
- **🚫 Copy Blocked**: `Ctrl+Shift+C` is intercepted via `onKeyPress` — returns `{ consumed: true }` preventing clipboard copy.
- **🖱️ Auto-Copy Disabled**: Mouse selection auto-copy is disabled by setting `_autoCopySelection` to `noop`.
- **🧬 Inherits Full TextInput API**: Selection, cursor navigation, clipboard paste (`Ctrl+V`), overflow scrolling, and placeholder support all work as expected.

---

## Security Notes

- **Clipboard copy is blocked** — both keyboard (`Ctrl+Shift+C`) and mouse auto-copy are prevented.
- **Clipboard paste is allowed** — `Ctrl+V` and right-click paste work normally (users need to enter passwords).
- **Character masking** — all characters render as `*` regardless of content. The actual value is preserved in `input.value` for programmatic access.
- **Terminal buffer visibility** — standard terminal concern: password characters are masked on screen but may be visible in terminal scrollback buffers depending on the terminal emulator.

---

## Properties

```typescript
pw.value;             // Actual password text (not masked)
pw.placeholder;       // Placeholder text
pw.cursorPos;         // Cursor position
pw.onChange;          // (val: string) => void
```

All `TextInput` and `InputPrimitive` properties and methods are inherited.
