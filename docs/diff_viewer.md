# DiffViewer & SplitDiffViewer

Real-time diff visualization widgets built on top of the tuix layout system. Supports both unified and side-by-side diff views with colour-highlighted additions, deletions, and hunk headers.

```typescript
import { DiffViewer, SplitDiffViewer, computeDiff, computeSplitDiff } from "jsr:@kyranis-studio/tuix";
```

---

## Quick Start

```typescript
const originalCode = `function greet(name: string) {\n  return "Hello " + name;\n}`;
const editedCode   = `function greet(name: string) {\n  return "Hi " + name;\n}`;

// Unified diff view
const diffViewer = new DiffViewer();
diffViewer.setDiffContent(computeDiff(originalCode, editedCode));

// Side-by-side split diff view
const splitViewer = new SplitDiffViewer();
splitViewer.setDiffContent(originalCode, editedCode);

parent.add(diffViewer);
parent.add(splitViewer);
```

---

## DiffViewer (Unified Diff)

Displays a standard unified diff format with `+`/`-` prefixed lines and `@@` hunk headers. Built on top of `TextArea`, inheriting its full scrolling, selection, and clipboard support.

### Constructor

```typescript
const dv = new DiffViewer(
  "",         // initial diff text
  undefined,  // onChange callback
  16,         // maxLines (optional)
);
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `value` | `string` | `""` | Initial diff text |
| `onChange` | `(val) => void` | `undefined` | Called on value change |
| `maxLines` | `number` | `undefined` | Maximum visible lines |

### Methods

```typescript
dv.setDiffContent(content: string): void;
```
Update the displayed diff content. Parses the unified diff string and re-renders with appropriate colours.

### Scrolling

The `DiffViewer` is a read-only view — arrow keys and page keys scroll the viewport rather than moving a cursor. Scrollbar with up/down arrows is drawn on the right edge. Both mouse wheel and keyboard scrolling are supported.

| Key | Action |
|-----|--------|
| `↑` / `↓` | Scroll up/down one line |
| `PageUp` / `PageDown` | Scroll by 80% of viewport |
| `Ctrl`+`Home` | Scroll to top |
| `Ctrl`+`End` | Scroll to bottom |
| Mouse wheel | Vertical scroll (3 lines per tick) |

### Properties

```typescript
dv.diffTheme: DiffTheme;  // Customize colours (defaultDiffTheme by default)
dv.value: string;          // The raw diff text
```

---

## SplitDiffViewer (Side-by-Side)

Displays a side-by-side diff with the old file on the left and the new file on the right. Deletions are shown with a red background, insertions with green. Adjacent deletion+insertion pairs are merged into a single replacement row.

### Constructor

```typescript
const sv = new SplitDiffViewer();
```

### Methods

```typescript
sv.setDiffContent(oldText: string, newText: string): void;
```
Recompute and display the split diff between two texts.

### Properties

```typescript
sv.diffTheme: DiffTheme;  // Customize colours
```

### Scrolling

The `SplitDiffViewer` supports both keyboard and mouse wheel scrolling. A scrollbar with up/down arrows is drawn on the right edge.

| Key | Action |
|-----|--------|
| `↑` / `↓` | Scroll up/down one line |
| `PageUp` / `PageDown` | Scroll by 80% of viewport |
| `Home` | Scroll to top |
| `End` | Scroll to bottom |
| Mouse wheel | Vertical scroll (3 lines per tick) |

*Note: Focus the SplitDiffViewer by clicking or tabbing to it for keyboard scrolling. Mouse wheel works without focus.*

---

## computeDiff()

Computes a unified diff string between two texts using an LCS-based line diff algorithm (O(m×n)).

```typescript
const diff = computeDiff(oldText, newText);
// Returns: "--- a/original\n+++ b/current\n@@ -1,3 +1,3 @@\n context\n-added\n+added\n"
```

| Param | Type | Description |
|-------|------|-------------|
| `oldText` | `string` | The original text |
| `newText` | `string` | The edited text |

**Returns**: A unified diff string with:
- `--- a/original` / `+++ b/current` file headers
- `@@ -line,count +line,count @@` hunk headers
- `-` prefixed deletion lines
- `+` prefixed addition lines
- ` ` prefixed context lines (3 lines of context per hunk)

---

## computeSplitDiff()

Computes an aligned side-by-side diff between two texts, returning an array of `SplitDiffRow` objects suitable for rendering in a `SplitDiffViewer`.

```typescript
const rows = computeSplitDiff(oldText, newText);
```

| Param | Type | Description |
|-------|------|-------------|
| `oldText` | `string` | The original text |
| `newText` | `string` | The edited text |

**Returns**: `SplitDiffRow[]` — an array of aligned rows for side-by-side display.

---

## Types

### DiffLine

```typescript
interface DiffLine {
  type: "add" | "del" | "hunk" | "fileHeader" | "context";
  text: string;
}
```

### SplitDiffRow

```typescript
interface SplitDiffRow {
  oldLineNum: number | null;  // Line number in old file (null for insertions)
  oldText: string;             // Text from old file
  oldType: "eq" | "del" | "empty";
  newLineNum: number | null;  // Line number in new file (null for deletions)
  newText: string;             // Text from new file
  newType: "eq" | "ins" | "empty";
}
```

### DiffTheme

```typescript
interface DiffTheme {
  addFg: Color;          // Foreground for added lines
  addBg: Color;          // Background for added lines (green tint)
  delFg: Color;          // Foreground for removed lines
  delBg: Color;          // Background for removed lines (red tint)
  hunkFg: Color;         // Foreground for @@ hunk headers
  fileHeaderFg: Color;   // Foreground for ---/+++ file headers
  fileHeaderBold: boolean;
}
```

### defaultDiffTheme

The default colour palette:

| Token | Foreground | Background |
|-------|------------|------------|
| Addition (`+`) | `#50C878` (green) | `#0A280F` (dark green tint) |
| Deletion (`-`) | `#F06464` (red) | `#2D0C0C` (dark red tint) |
| Hunk (`@@`) | `#50C8F0` (cyan) | — |
| File header | `#C8A0FF` (lavender, bold) | — |

---

## Customizing Colours

```typescript
diffViewer.diffTheme = {
  addFg: { r: 100, g: 255, b: 100 },
  addBg: { r: 0, g: 30, b: 0 },
  delFg: { r: 255, g: 100, b: 100 },
  delBg: { r: 30, g: 0, b: 0 },
  hunkFg: { r: 100, g: 200, b: 255 },
  fileHeaderFg: { r: 200, g: 150, b: 255 },
  fileHeaderBold: true,
};
```

---

## parseDiff()

Parses a unified diff string into structured `DiffLine` objects.

```typescript
const parsed = parseDiff(diffText);
// Returns DiffLine[] with type classifications
```

| Param | Type | Description |
|-------|------|-------------|
| `content` | `string` | A unified diff string |

**Returns**: `DiffLine[]` — each line classified as `add`, `del`, `hunk`, `fileHeader`, or `context`.

---

## Showcase Example

The interactive showcase (`examples/01_showcase.ts`) demonstrates both diff views in the **Code** tab:

- **CodeEditor** on the left for typing
- **Unified Diff** and **Split Diff** stacked on the right
- A **ButtonGroup** at the top lets you switch between `Both`, `Unified`, or `Split` mode
- Both views update in real time as you edit the code
