# CodeEditor

A syntax-highlighted code editor built on top of `TextArea`. Supports keyword, string, comment, number, type, function, and decorator highlighting with a customizable colour palette.

```typescript
import { CodeEditor } from "jsr:@kyranis-studio/tuix";
```

---

## Constructor

```typescript
const editor = new CodeEditor(
  "Type some code...",  // placeholder
  "const x = 1;",        // initial value
  (val) => console.log(val), // onChange
  "typescript",          // language
);
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `placeholder` | `string` | `""` | Ghost text when empty |
| `value` | `string` | `""` | Initial code content |
| `onChange` | `(val) => void` | `null` | Called on every value change |
| `language` | `string` | `"typescript"` | Language for keyword sets |

Paste markers are disabled by default (`burstThreshold = 9999`) since the editor is designed for code editing.

---

## Key Features

- **🎨 Syntax Highlighting** — Regex-based tokenizer colours 7 token types: keywords, strings, comments, numbers, types, function calls, and decorators.
- **🖌️ Custom Palette** — The `syntaxTheme` property lets you override colours per-token type.
- **🔢 Line Number Gutter** — Each line is prefixed with a right-aligned line number on a `theme.appBg` gutter background with `theme.muted` text. Gutter width adjusts to the digit count of the last line (minimum 3).
- **⌨️ Full TextArea Feature Set** — Inherits cursor navigation, selection (word/line), clipboard, scrollbar, and multi-byte support from `TextArea`.
- **📝 Language Support** — Built-in keyword sets for TypeScript and JavaScript (extensible via the `KEYWORDS` map).

---

## Interaction

All keyboard and mouse interaction from [`TextArea`](textarea.md) applies — cursor navigation, selection, clipboard, scrolling, etc.

### Supported Token Types

| Token | Example | Default Colour |
|-------|---------|----------------|
| `keyword` | `function`, `const`, `if`, `import` | Blue `#569CD6` |
| `string` | `"hello"`, `'world'`, `` `template` `` | Orange `#CE9178` |
| `comment` | `// TODO`, `/* block */` | Green `#6A9955` |
| `number` | `42`, `0xFF`, `1e3` | Mint `#B5CEA8` |
| `type` | `string`, `Promise<T>`, `x: Foo` | Teal `#4EC9B0` |
| `function` | `myFunc(...)` | Yellow `#DCDCAA` |
| `decorator` | `@Component`, `@override` | Lavender `#C8B4F0` |

---

## Properties

```typescript
editor.value;             // Full text content
editor.language;          // Current language ("typescript" | "javascript")
editor.syntaxTheme;       // SyntaxTheme object — per-token colours
editor.placeholder;       // Placeholder text
editor.setLanguage(lang); // Switch language and re-render
```

---

## Custom Syntax Theme

Override individual token colours:

```typescript
editor.syntaxTheme = {
  keyword:  { r: 200, g: 100, b: 100 },  // red keywords
  string:   { r: 100, g: 200, b: 100 },  // green strings
  comment:  { r: 150, g: 150, b: 150 },  // grey comments
  number:   defaultSyntaxTheme.number,   // keep default
  type:     defaultSyntaxTheme.type,
  function: defaultSyntaxTheme.function,
  decorator: defaultSyntaxTheme.decorator,
};
```

The `defaultSyntaxTheme` export provides the initial VS Code Dark+ inspired palette.

---

## Extending

### Custom Languages

The `KEYWORDS` map in `code_editor.ts` can be extended to support additional languages:

```typescript
// In your own module:
import { tokenizeLine } from "jsr:@kyranis-studio/tuix";

// tokenizeLine accepts any language string;
// unrecognised languages fall back to TypeScript keywords.
```

---

## API

### `tokenizeLine(line, language): TokenRange[]`

Tokenizes a single line of source code. Used internally by `CodeEditor` — also exported for custom rendering pipelines.

### `buildTokenLookup(tokens): Map<number, SyntaxTokenType | null>`

Builds a per-character colour lookup from an array of `TokenRange`s for O(1) access during rendering.

### `defaultSyntaxTheme`

The default VS Code Dark+ inspired colour palette — a `SyntaxTheme` object.
