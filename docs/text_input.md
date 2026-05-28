# TextInput

A single-line text input field with cursor, text selection, clipboard copy/paste, placeholder support, multi-byte/emoji support, and overflow scrolling.

```typescript
import { TextInput } from "jsr:@kyranis-studio/tuix";
```

---

## Constructor

```typescript
const input = new TextInput(
  "Input",                   // label (shown in border)
  "Type here...",            // placeholder — ghost text when empty
  "initial value",           // initial value
  (val) => console.log(val), // onChange
  true,                      // copyOnSelect — auto-copy selected text
  true,                      // notifyOnCopy — show "Copied!" toast
  "✓ Copied!",               // custom copy notification message
);
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `label` | `string` | `"Input"` | Border label |
| `placeholder` | `string` | `""` | Ghost text when empty |
| `value` | `string` | `""` | Initial value |
| `onChange` | `(val) => void` | `null` | Called on every value change |
| `copyOnSelect` | `boolean` | `false` | Auto-copy to clipboard on selection |
| `notifyOnCopy` | `boolean` | `false` | Show notification toast on copy |
| `copyNotificationMessage` | `string` | `"Copied!"` | Notification text |

---

## Key Features

- **🚀 Multi-byte Support**: Robustly handles UTF-8 characters, including emojis. Navigation and deletion operations are character-aware (i.e., you won't split a surrogate pair).
- **🛡️ Burst Protection**: Detects fast-arriving input (like terminal pastes) and clipboard pastes via `InputPrimitive.createPasteBurstHandler()`. Pastes exceeding the threshold are replaced by an interactive marker `copied text N [L line]` where `L` is the line count.
- **⚛️ Atomic Ranges**: Treat blocks of text as a single character for navigation and deletion. Paste markers are automatically atomic. Custom atomic ranges (like @-mentions or #hashtags) can be provided via `getCustomAtomicRanges`.
- **🔌 Hook System**: The `onKeyPress` hook allows external control over every key event — modify values, reposition the cursor, or consume events entirely. Used internally for burst protection, auto-complete, slash commands, and file mentions.
- **✨ Selection Handling**: Supports standard mouse selection, as well as double-click (word) and triple-click (entire text) selection.

---

## Interaction

### Keyboard

| Key | Action |
|-----|--------|
| Printable char | Insert at cursor (replaces selection if active) |
| `Backspace` | Delete char before cursor, or entire atomic block (if cursor is within or at end) |
| `Delete` | Delete char after cursor, or entire atomic block (if cursor is within or at start) |
| `Enter` | Fire `onSubmit` |
| `ArrowLeft` / `ArrowRight` | Move cursor char-by-char, jumping over entire atomic blocks |
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
input.value;                     // Current text
input.placeholder;               // Placeholder text
input.cursorPos;                 // Cursor position (string index)
input.copyOnSelect;              // Auto-copy on selection
input.pasteShades;               // Color palette for paste markers (null = defaults)
input.getCustomAtomicRanges;      // () => Array<{start: number, end: number}> hook
input.onChange;                  // (val: string) => void
input.onSubmit;                  // (val: string) => void — Enter key
input.onKeyPress;                // KeyPressHandler hook — intercept key events
input.clipboardPasteHandler;     // Handler for clipboard paste markers
```

Selection is highlighted with `theme.highlight` background and `theme.appBg` foreground. The cursor renders as an inverted block over the character.

---

## Burst Protection (Paste Markers)

Burst protection is no longer a constructor parameter. Use the static `InputPrimitive.createPasteBurstHandler()` factory to create a hook-based handler:

```typescript
const handler = InputPrimitive.createPasteBurstHandler({
  threshold: 50,        // line/char count to trigger marker
  trackEnter: true,     // track newlines as part of the burst
});

myInput.onKeyPress = handler.onKeyPress;
myInput.clipboardPasteHandler = handler.handleClipboardPaste;
```

Paste markers are rendered in **bold** with cycling colors. Backspace at the end of a marker or Delete at its start removes the entire block at once.

---

## Atomic Ranges

Atomic ranges are blocks of text that the input widget treats as a single unit. When the cursor enters an atomic range (via keyboard navigation or mouse click), it is snapped to the nearest boundary. Operations like `Backspace`, `Delete`, and `Arrow` keys move across the entire range in one step.

### Custom Atomic Ranges

You can define custom atomic ranges by providing a `getCustomAtomicRanges` callback. This is useful for features like @-mentions, #hashtags, or tokens.

```typescript
input.getCustomAtomicRanges = () => {
  const ranges: Array<{ start: number; end: number }> = [];
  const val = input.value;
  // Example: treat all #hashtags as atomic
  const matches = val.matchAll(/#[\w-]+/g);
  for (const m of matches) {
    if (m.index !== undefined) {
      ranges.push({ start: m.index, end: m.index + m[0].length });
    }
  }
  return ranges;
};
```
