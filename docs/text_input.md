# TextInput

A single-line text input field with cursor, text selection, clipboard copy/paste, placeholder support, multi-byte/emoji support, burst protection, and overflow scrolling.

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
  50,                        // burstThreshold — replace large pastes with marker
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
| `burstThreshold` | `number` | `null` | Max input burst lines (null = no limit) |

---

## Key Features

- **🚀 Multi-byte Support**: Robustly handles UTF-8 characters, including emojis. Navigation and deletion operations are character-aware (i.e., you won't split a surrogate pair).
- **🛡️ Burst Protection**: Detects fast-arriving input (like terminal pastes) via `burstThreshold` (counts **lines**, not characters). If a burst exceeds the threshold, it's replaced by an interactive marker `copied text N[L ]` where `L` is the line count.
- **✨ Selection Handling**: Supports standard mouse selection, as well as double-click (word) and triple-click (entire text) selection.

---

## Interaction

### Keyboard

| Key | Action |
|-----|--------|
| Printable char | Insert at cursor (replaces selection if active) |
| `Backspace` | Delete character before cursor (or delete selection) |
| `Delete` | Delete character after cursor (or delete selection) |
| `Enter` | Fire `onSubmit` |
| `ArrowLeft` / `ArrowRight` | Move cursor character-by-character (scrolls overflow text) |
| `Home` / `End` | Jump to start / end |
| `Alt+C` | Copy selection (or all text) |
| `Alt+V` | Paste from clipboard |
| `Ctrl+Shift+C` | Copy (Kitty protocol) |
| `Ctrl+Shift+V` | Paste (Kitty protocol) |

### Mouse

| Action | Behavior |
|--------|----------|
| Left-click | Position cursor |
| Double-click | Select the word under cursor |
| Triple-click | Select entire text |
| Drag left button | Select text (auto-copies on release if `copyOnSelect` is true) |
| Right-click release | Paste from clipboard at cursor |

---

## Overflow Scrolling

When the text exceeds the available width:

- `scrollX` tracks the horizontal offset into the text.
- `..` ellipsis indicators appear at the left and/or right boundaries.
- Arrow keys auto-scroll to keep the cursor visible.
- `Home`/`End` jump to the start/end of the text.

---

## Properties

```typescript
input.value;            // Current text
input.placeholder;      // Placeholder text
input.cursorPos;        // Cursor position (string index)
input.burstThreshold;   // Current burst threshold
input.copyOnSelect;     // Auto-copy on selection
input.onChange;         // (val: string) => void
input.onSubmit;         // (val: string) => void — Enter key
```

Selection is highlighted with `theme.highlight` background and `theme.bg` foreground. The cursor renders as an inverted block over the character.
