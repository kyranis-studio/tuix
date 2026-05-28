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
  200,                         // burstThreshold — replace bursts >200 chars
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
| `burstThreshold` | `number` | `null` | Max input burst lines (null = no limit) |

---

## Key Features

- **🚀 Multi-byte Support**: Robustly handles UTF-8 characters, including emojis. Navigation and deletion operations are character-aware (i.e., you won't split a surrogate pair).
- **🛡️ Burst Protection**: Detects fast-arriving input (like terminal pastes) via `burstThreshold` (counts **lines**, not characters). If a burst exceeds the threshold, it's replaced by an interactive marker `copied text N[L ]` where `L` is the line count.
- **📝 Multi-line Bursts**: In `TextArea`, newlines are tracked as part of input bursts. This means a multi-line paste from the terminal is detected as a single burst and replaced by a single marker.
- **✨ Selection Handling**: Supports standard mouse selection, as well as double-click (word) and triple-click (line) selection.

---

## Interaction

### Keyboard

| Key | Action |
|-----|--------|
| Printable char | Insert at cursor (replaces selection if active) |
| `Enter` | Newline at cursor (tracked in bursts) |
| `Backspace` | Delete character before cursor (or delete selection) |
| `Delete` | Delete character after cursor (or delete selection) |
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

When `burstThreshold` is set, input arriving in a fast burst (like a terminal paste) that exceeds the threshold (counted in **lines**) is replaced by an inline `copied text N[L ]` marker where `L` is the number of lines. This prevents the UI from freezing or lagging when handling extremely large volumes of text. These markers are interactive:

- They are rendered in **bold** to distinguish them from regular text.
- They can be deleted as a single unit using Backspace (at the end) or Delete (at the start).
- You can freely type text between or beside them.

---

## Properties

```typescript
ta.value;              // Full text content (\n-separated)
ta.placeholder;        // Placeholder text
ta.cursorPos;          // Global cursor position (string index)
ta.minRows;            // Minimum visible rows (default 3)
ta.maxLines;           // Maximum visible rows (null = unlimited)
ta.burstThreshold;     // Max burst length (null = no limit)
ta.onChange;           // (val: string) => void
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

