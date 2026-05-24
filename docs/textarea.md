# TextArea

A multi-line text editor with scrollbar, cursor navigation, line-based operations, and clipboard support.

```typescript
import { TextArea } from "jsr:@kyranis-studio/tuix";
```

---

## Constructor

```typescript
const ta = new TextArea(
  "Start typing...",          // placeholder
  "initial\nvalue",           // initial value
  (val) => console.log(val),  // onChange
  10,                          // maxLines — max visible rows (null = no cap)
  true,                        // copyOnSelect
  true,                        // notifyOnCopy
  "✓ Copied!",                 // copy notification message
);
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `placeholder` | `string` | `""` | Ghost text when empty |
| `value` | `string` | `""` | Initial value |
| `onChange` | `(val) => void` | `null` | Called on every change |
| `maxLines` | `number` | `null` | Maximum visible rows (null = unlimited) |
| `copyOnSelect` | `boolean` | `false` | Auto-copy selected text |
| `notifyOnCopy` | `boolean` | `false` | Show toast on copy |
| `copyNotificationMessage` | `string` | `"Copied!"` | Notification text |

---

## Interaction

| Key | Action |
|-----|--------|
| Printable char | Insert at cursor |
| `Enter` | Newline at cursor |
| `Backspace` | Delete char before cursor |
| `Delete` | Delete char after cursor |
| `ArrowLeft` / `ArrowRight` | Move cursor horizontally |
| `ArrowUp` / `ArrowDown` | Move cursor vertically (same column) |
| `Home` | Start of line |
| `End` | End of line |
| `Ctrl+Home` | Start of text |
| `Ctrl+End` | End of text |
| `Alt+C` | Copy selection |
| `Alt+V` | Paste from clipboard |
| `Ctrl+Shift+C` | Copy (Kitty) |
| `Ctrl+Shift+V` | Paste (Kitty) |

### Mouse

| Action | Behavior |
|--------|----------|
| Left-click | Position cursor at click location |
| Drag left button | Select text (auto-copies on release) |
| Right-click release | Paste from clipboard |

---

## Properties

```typescript
ta.value;           // Full text content (\\n-separated)
ta.placeholder;     // Placeholder text
ta.cursorPos;       // Global cursor position (0 to value.length)
ta.minRows;         // Minimum visible rows (default 3)
ta.maxLines;        // Maximum visible rows (null = unlimited)
ta.onChange;        // (val: string) => void
```

The height auto-adjusts to content up to `maxLines`. A scrollbar is rendered in the rightmost column when content exceeds visible rows.
