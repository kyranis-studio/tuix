# TextArea

A multi-line text editor with scrollbar, cursor navigation, line-based operations, clipboard support, multi-byte/emoji support, and burst protection.

```typescript
import { TextArea } from "jsr:@kyranis-studio/tuix";
```

---

## Constructor

```typescript
const ta = new TextArea(
  "TextArea",                 // label (shown in border)
  "Start typing...",          // placeholder — ghost text when empty
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
| `label` | `string` | `"TextArea"` | Border label |
| `placeholder` | `string` | `""` | Ghost text when empty |
| `value` | `string` | `""` | Initial value |
| `onChange` | `(val) => void` | `null` | Called on every change |
| `maxLines` | `number` | `null` | Maximum visible rows (null = unlimited) |
| `copyOnSelect` | `boolean` | `false` | Auto-copy selected text |
| `notifyOnCopy` | `boolean` | `false` | Show toast on copy |
| `copyNotificationMessage` | `string` | `"Copied!"` | Notification text |

---

## Key Features

- **🚀 Multi-byte Support**: Robustly handles UTF-8 characters, including emojis. Navigation and deletion operations are character-aware (i.e., you won't split a surrogate pair).
- **🛡️ Burst Protection**: Detects fast-arriving input (like terminal pastes) and clipboard pastes via `InputPrimitive.createPasteBurstHandler()` (counts **lines**, not characters). Pastes exceeding the threshold are replaced by an interactive marker `copied text N [L line]` where `L` is the line count. Backspace/Delete removes the entire marker block at once.
- **🔌 Hook System**: The `onKeyPress` hook allows external control over every key event — used for slash commands, file mentions, auto-complete, and burst protection.
- **📝 Multi-line Bursts**: Set `trackEnter: true` in `createPasteBurstHandler()` so newlines are tracked as part of input bursts. Multi-line terminal pastes are detected as a single burst and replaced by a single marker.
- **✨ Selection Handling**: Supports standard mouse selection, as well as double-click (word) and triple-click (line) selection.

---

## Interaction

### Keyboard

| Key | Action |
|-----|--------|
| Printable char | Insert at cursor (replaces selection if active) |
| `Enter` | Newline at cursor |
| `Backspace` | Delete character before cursor, or entire paste marker block at once |
| `Delete` | Delete character after cursor, or entire paste marker block at once |
| `ArrowLeft` / `ArrowRight` | Move cursor character-by-character |
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
| Double-click | Select the word under cursor |
| Triple-click | Select the current line |
| Drag left button | Select text (auto-copies on release if `copyOnSelect` is true) |
| Right-click release | Paste from clipboard |

---

## Burst Protection

Burst protection is no longer a constructor parameter. Use the static `InputPrimitive.createPasteBurstHandler()` factory with `trackEnter: true`:

```typescript
const handler = InputPrimitive.createPasteBurstHandler({
  threshold: 50,
  trackEnter: true,   // track newlines as part of the burst
});

myTextArea.onKeyPress = handler.onKeyPress;
myTextArea.clipboardPasteHandler = handler.handleClipboardPaste;
```

When a terminal paste burst or clipboard paste exceeds the threshold, it's replaced by an inline `copied text N [L line]` marker. These markers are interactive:

- Rendered in **bold** with cycling colors.
- Backspace at the end of a marker or Delete at its start removes the entire block at once.
- Backspace/Delete also removes the block when triggered on the paste marker text.

---

## Properties

```typescript
ta.value;                     // Full text content (\n-separated)
ta.placeholder;               // Placeholder text
ta.cursorPos;                 // Global cursor position (string index)
ta.minRows;                   // Minimum visible rows (default 3)
ta.maxLines;                  // Maximum visible rows (null = unlimited)
ta.pasteShades;               // Color palette for paste markers (null = defaults)
ta.onChange;                  // (val: string) => void
ta.onKeyPress;                // KeyPressHandler hook — intercept key events
ta.clipboardPasteHandler;     // Handler for clipboard paste markers
``` The height auto-adjusts to content up to `maxLines`. A scrollbar is rendered in the rightmost column when content exceeds visible rows.

### Scrollbar Customization

The scrollbar characters can be customized via `style.scrollbar`:

```typescript
textarea.style.scrollbar = {
  showArrows: true,           // show ↑/↓ arrow indicators at scrollbar ends
  verticalTrack: "│",         // track character (default "│")
  verticalThumb: "▌",         // thumb character (default "▌")
  arrowUp: "↑",               // upward arrow (default "↑")
  arrowDown: "↓",             // downward arrow (default "↓")
};
```

Arrow indicators dim when at the scroll limit and become bold when scrolling is possible in that direction.

