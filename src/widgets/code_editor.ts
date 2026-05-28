/**
 * code_editor.ts — A text editor with regex-based syntax highlighting.
 *
 * Extends TextArea with per-line tokenization that colors keywords, strings,
 * comments, numbers, types, and function calls.
 *
 * Usage:
 *   const editor = new CodeEditor();
 *   editor.language = "typescript";  // default
 */

import { Rect } from "../layout.ts";
import { CellBuffer } from "../terminal.ts";
import { Theme, Color } from "../theme.ts";
import { TextArea } from "./textarea.ts";
import { InputPrimitive } from "./input_primitive.ts";

// ─── Token types ──────────────────────────────────────────────────────────────

export type SyntaxTokenType =
  | "keyword"
  | "string"
  | "comment"
  | "number"
  | "type"
  | "function"
  | "decorator"
  | "plain";

export interface SyntaxTheme {
  keyword: Color;
  string: Color;
  comment: Color;
  number: Color;
  type: Color;
  function: Color;
  decorator: Color;
}

/**
 * Default syntax colours inspired by VS Code Dark+.
 * Each colour maps to a token type and is applied when no theme-matching is
 * needed — the CodeEditor uses these directly.
 */
export const defaultSyntaxTheme: SyntaxTheme = {
  keyword:  { r: 86,  g: 156, b: 214 },  // blue
  string:   { r: 206, g: 145, b: 120 },  // orange
  comment:  { r: 106, g: 153, b: 85 },   // green
  number:   { r: 181, g: 206, b: 168 },  // mint
  type:     { r: 78,  g: 201, b: 176 },  // teal
  function: { r: 220, g: 220, b: 170 },  // yellow
  decorator: { r: 200, g: 180, b: 240 }, // lavender
};

// ─── Token range ──────────────────────────────────────────────────────────────

export interface TokenRange {
  start: number;
  end: number;
  type: SyntaxTokenType;
}

// ─── Language keyword lists ───────────────────────────────────────────────────

const KEYWORDS: Record<string, Set<string>> = {
  typescript: new Set([
    "function", "const", "let", "var", "if", "else", "for", "while",
    "do", "switch", "case", "break", "continue", "return", "throw",
    "try", "catch", "finally", "new", "delete", "typeof", "instanceof",
    "in", "of", "import", "export", "default", "from", "as", "class",
    "extends", "implements", "interface", "type", "enum", "namespace",
    "module", "declare", "abstract", "private", "protected", "public",
    "static", "readonly", "async", "await", "yield", "super", "this",
    "null", "undefined", "true", "false", "void", "with",
  ]),
  javascript: new Set([
    "function", "const", "let", "var", "if", "else", "for", "while",
    "do", "switch", "case", "break", "continue", "return", "throw",
    "try", "catch", "finally", "new", "delete", "typeof", "instanceof",
    "in", "of", "import", "export", "default", "from", "as", "class",
    "extends", "super", "this", "null", "undefined", "true", "false",
    "void", "async", "await", "yield",
  ]),
};

const TYPES: Set<string> = new Set([
  "string", "number", "boolean", "object", "Array", "Promise",
  "Map", "Set", "Error", "Date", "RegExp", "any", "unknown",
  "never", "void", "undefined", "null", "symbol", "bigint",
  "Record", "Partial", "Required", "Readonly", "Pick", "Omit",
  "Exclude", "Extract", "NonNullable", "ReturnType", "Parameters",
  "ConstructorParameters", "InstanceType",
]);

// ─── Tokenizer ────────────────────────────────────────────────────────────────

/**
 * Tokenize a single line of TypeScript/JavaScript source code.
 * Returns an array of non-overlapping TokenRanges covering the entire line.
 */
export function tokenizeLine(
  line: string,
  language: string = "typescript",
): TokenRange[] {
  const tokens: TokenRange[] = [];
  const keywords = KEYWORDS[language] ?? KEYWORDS.typescript;
  let pos = 0;

  const emit = (start: number, end: number, type: SyntaxTokenType) => {
    if (end > start) tokens.push({ start, end, type });
  };

  while (pos < line.length) {
    const ch = line[pos];
    const next = line[pos + 1] ?? "";

    // ── Single-line comment ──────────────────────────────────
    if (ch === "/" && next === "/") {
      tokens.push({ start: pos, end: line.length, type: "comment" });
      pos = line.length;
      continue;
    }

    // ── Block comment start ───────────────────────────────────
    if (ch === "/" && next === "*") {
      const endIdx = line.indexOf("*/", pos + 2);
      if (endIdx >= 0) {
        tokens.push({ start: pos, end: endIdx + 2, type: "comment" });
        pos = endIdx + 2;
        continue;
      } else {
        // Block comment runs to end of line — rest is comment
        tokens.push({ start: pos, end: line.length, type: "comment" });
        pos = line.length;
        continue;
      }
    }

    // ── String literals ───────────────────────────────────────
    if (ch === '"' || ch === "'" || ch === "`") {
      let end = pos + 1;
      while (end < line.length) {
        if (line[end] === "\\") {
          end += 2; // skip escaped char
          continue;
        }
        if (line[end] === ch) {
          end++;
          break;
        }
        end++;
      }
      tokens.push({ start: pos, end, type: "string" });
      pos = end;
      continue;
    }

    // ── Template literal continuation (dollar-brace) ──────────
    // (handled inside the string match above for backtick)

    // ── Decorators @Foo ───────────────────────────────────────
    if (ch === "@" && /[a-zA-Z_]/.test(next)) {
      let end = pos + 1;
      while (end < line.length && /[a-zA-Z0-9_.]/.test(line[end])) end++;
      tokens.push({ start: pos, end, type: "decorator" });
      pos = end;
      continue;
    }

    // ── Numbers ───────────────────────────────────────────────
    if (/[0-9]/.test(ch)) {
      let end = pos + 1;
      // hex 0x, binary 0b, octal 0o
      if (ch === "0" && /[xXbBoO]/.test(next)) {
        end = pos + 2;
        while (end < line.length && /[0-9a-fA-F_]/.test(line[end])) end++;
      } else {
        while (end < line.length && /[0-9.eE+\-]/.test(line[end])) end++;
      }
      tokens.push({ start: pos, end, type: "number" });
      pos = end;
      continue;
    }

    // ── Identifiers / keywords / types / functions ────────────
    if (/[a-zA-Z_$]/.test(ch)) {
      let end = pos + 1;
      while (end < line.length && /[a-zA-Z0-9_$]/.test(line[end])) end++;
      const word = line.slice(pos, end);

      if (keywords.has(word)) {
        emit(pos, end, "keyword");
      } else if (TYPES.has(word) || (end < line.length && line[end] === ":")) {
        // Type annotation: `foo: TypeName`
        // Also pure type references
        if (TYPES.has(word)) {
          emit(pos, end, "type");
        } else {
          // Check if next non-space char after word is ':' → type context
          let peek = end;
          while (peek < line.length && line[peek] === " ") peek++;
          if (line[peek] === ":") {
            emit(pos, end, "type");
          } else {
            emit(pos, end, "plain");
          }
        }
      } else if (end < line.length && line[end] === "(") {
        emit(pos, end, "function");
      } else {
        // Check if preceded by `.` → property access, not a type
        const isProperty = pos > 0 && line[pos - 1] === ".";
        if (!isProperty) {
          // Could be a type in `const x: TypeName` context
          // For now, leave as plain — the `:` check above handles most cases
        }
        emit(pos, end, "plain");
      }
      pos = end;
      continue;
    }

    // ── Everything else ───────────────────────────────────────
    pos++;
  }

  return tokens;
}

/**
 * Build a fast lookup structure from token ranges for per-character queries.
 */
export function buildTokenLookup(
  tokens: TokenRange[],
): Map<number, SyntaxTokenType | null> {
  const map = new Map<number, SyntaxTokenType | null>();
  for (const t of tokens) {
    for (let i = t.start; i < t.end; i++) {
      map.set(i, t.type);
    }
  }
  return map;
}

// ─── CodeEditor widget ────────────────────────────────────────────────────────

export class CodeEditor extends TextArea {
  /** The language for keyword highlighting. */
  language = "typescript";

  /** Custom syntax colour palette (defaults to defaultSyntaxTheme). */
  syntaxTheme: SyntaxTheme = { ...defaultSyntaxTheme };

  constructor(
    label = "CodeEditor",
    placeholder = "",
    value = "",
    onChange?: (val: string) => void,
    language = "typescript",
  ) {
    // maxLines = null → unlimited; burstThreshold high → no paste markers
    super(label, placeholder, value, onChange, undefined, false, false, "Copied!", 9999);
    this.language = language;

    // Re-attach onPaint with syntax highlighting
    this.onPaint = (buf, rect, theme) => {
      this._renderWithHighlighting(buf, rect, theme);
    };
  }

  /** Set the language and re-render. */
  setLanguage(lang: string): void {
    this.language = lang;
    // re-render happens on next paint cycle
  }

  // ────────────────────────────────────────────────────────────
  //  Rendering with syntax highlighting
  // ────────────────────────────────────────────────────────────

  private _renderWithHighlighting(
    buf: CellBuffer,
    rect: Rect,
    theme: Theme,
  ): void {
    // Access the base TextArea's rendering logic by calling the
    // inherited renderContent, but we need to inject colours…
    //
    // Instead we replicate the core rendering loop with tokenization.
    this._syntaxRenderContent(buf, rect, theme);
  }

  private _syntaxRenderContent(
    buf: CellBuffer,
    rect: Rect,
    theme: Theme,
  ): void {
    const isFocused = this.focused;
    const showPlaceholder = !this.value;
    const bg = theme.primaryBg;
    const gutterBg = theme.appBg;
    const ch = rect.height;
    const totalRows = this._rowCount();
    const gutterWidth = Math.max(3, String(totalRows).length + 1);
    const contentX = rect.x + gutterWidth;
    const sbX = rect.x + rect.width - 1;
    const cw = Math.max(0, rect.width - gutterWidth - 1);

    // Scrollbar chars
    const sb = this.style.scrollbar ?? {};
    const showArrows = sb.showArrows ?? true;
    const vTrack = sb.verticalTrack ?? "│";
    const vThumb = sb.verticalThumb ?? "▌";
    const upArrow = sb.arrowUp ?? "↑";
    const downArrow = sb.arrowDown ?? "↓";

    const st = this.syntaxTheme;

    // Clear gutter + content area
    for (let row = 0; row < ch; row++) {
      for (let col = 0; col < gutterWidth; col++) {
        buf.set(rect.x + col, rect.y + row, {
          char: " ",
          fg: theme.muted,
          bg: gutterBg,
        });
      }
      for (let col = 0; col < cw; col++) {
        buf.set(contentX + col, rect.y + row, {
          char: " ",
          fg: theme.text,
          bg,
        });
      }
    }

    if (showPlaceholder) {
      for (let col = 0; col < cw && col < this.placeholder.length; col++) {
        const isCur = isFocused && col === this.cursorPos;
        buf.set(contentX + col, rect.y, {
          char: this.placeholder[col],
          fg: isCur ? bg : theme.muted,
          bg: isCur ? theme.muted : bg,
          bold: isCur,
        });
      }
      if (
        isFocused &&
        this.cursorPos < cw &&
        this.cursorPos >= this.placeholder.length
      ) {
        buf.set(contentX + this.cursorPos, rect.y, {
          char: " ",
          fg: bg,
          bg: theme.highlight,
        });
      }
    } else {
      const cursorRow = this._cursorRow();
      const cursorCol = this._cursorCol();

      // Scroll to keep cursor visible
      if (cursorRow < this.scrollY) this.scrollY = cursorRow;
      else if (cursorRow >= this.scrollY + ch)
        this.scrollY = cursorRow - ch + 1;
      this.scrollY = Math.max(
        0,
        Math.min(this.scrollY, this.scrollMaxY),
      );

      const lines = this._lines();
      const selActive = this._hasSelection();
      const selMin = selActive
        ? Math.min(this._selStart, this._selEnd)
        : -1;
      const selMax = selActive
        ? Math.max(this._selStart, this._selEnd)
        : -1;
      const pasteRanges = this._findPasteRanges();
      const inPasteRange = (idx: number) =>
        pasteRanges.some((r) => idx >= r.start && idx < r.end);
      const pasteShadeAt = (
        idx: number,
      ): Color | null => {
        for (const r of pasteRanges) {
          if (idx >= r.start && idx < r.end)
            return InputPrimitive.getPasteShade(r.pasteIndex);
        }
        return null;
      };

      for (let row = 0; row < ch; row++) {
        const lineIdx = this.scrollY + row;
        if (lineIdx >= lines.length) break;
        const line = lines[lineIdx];

        // Draw line number in gutter
        const lineNum = String(lineIdx + 1);
        const numStartX = rect.x + gutterWidth - lineNum.length - 1;
        for (let n = 0; n < lineNum.length; n++) {
          buf.set(numStartX + n, rect.y + row, {
            char: lineNum[n],
            fg: theme.muted,
            bg: gutterBg,
          });
        }

        // Tokenize this line
        const tokens = tokenizeLine(line, this.language);
        const tokenMap = buildTokenLookup(tokens);

        for (let col = 0; col < cw; col++) {
          const charIdx = this._lineStart(lineIdx) + col;
          const inSel =
            selActive && charIdx >= selMin && charIdx < selMax;
          const isCur =
            isFocused && lineIdx === cursorRow && col === cursorCol;
          const isMarker = !inSel && !isCur && inPasteRange(charIdx);

          // Determine syntax colour for this character
          const tokenType =
            !inSel && !isCur ? (tokenMap.get(col) ?? null) : null;
          let syntaxFg: Color | null = null;
          if (tokenType && tokenType !== "plain") {
            switch (tokenType) {
              case "keyword":
                syntaxFg = st.keyword;
                break;
              case "string":
                syntaxFg = st.string;
                break;
              case "comment":
                syntaxFg = st.comment;
                break;
              case "number":
                syntaxFg = st.number;
                break;
              case "type":
                syntaxFg = st.type;
                break;
              case "function":
                syntaxFg = st.function;
                break;
              case "decorator":
                syntaxFg = st.decorator;
                break;
            }
          }

          if (col < line.length) {
            const fg = syntaxFg ?? theme.text;
            if (inSel && isCur) {
              buf.set(contentX + col, rect.y + row, {
                char: line[col],
                fg: bg,
                bg: theme.text,
                bold: true,
              });
            } else if (inSel) {
              buf.set(contentX + col, rect.y + row, {
                char: line[col],
                fg: theme.appBg,
                bg: theme.highlight,
              });
            } else if (isCur) {
              buf.set(contentX + col, rect.y + row, {
                char: line[col],
                fg: bg,
                bg: theme.text,
                bold: true,
              });
            } else if (isMarker) {
              const shade = pasteShadeAt(charIdx);
              buf.set(contentX + col, rect.y + row, {
                char: line[col],
                fg: shade ?? theme.muted,
                bg,
                bold: true,
              });
            } else {
              buf.set(contentX + col, rect.y + row, {
                char: line[col],
                fg,
                bg,
              });
            }
          } else if (isCur) {
            buf.set(contentX + col, rect.y + row, {
              char: " ",
              fg: bg,
              bg: theme.highlight,
            });
          }
        }
      }
    }

    // ── Scrollbar ─────────────────────────────────────────────
    const maxScroll = this.scrollMaxY;
    if (maxScroll <= 0) {
      for (let row = 0; row < ch; row++) {
        buf.set(sbX, rect.y + row, {
          char: vTrack,
          fg: theme.muted,
          bg,
        });
      }
    } else {
      const arrowSlots = (showArrows ? 2 : 0);
      const availH = ch - arrowSlots;

      if (availH <= 0) {
        if (showArrows)
          buf.set(sbX, rect.y, { char: upArrow, fg: theme.muted, bg });
        if (showArrows)
          buf.set(sbX, rect.y + ch - 1, {
            char: downArrow,
            fg: theme.muted,
            bg,
          });
      } else {
        const thumbH = Math.max(
          1,
          Math.floor((availH / totalRows) * availH),
        );
        const thumbY = Math.floor(
          (this.scrollY / maxScroll) * (availH - thumbH),
        );

        let row = 0;
        if (showArrows) {
          const canScrollUp = this.scrollY > 0;
          buf.set(sbX, rect.y + row, {
            char: upArrow,
            fg: canScrollUp ? theme.text : theme.muted,
            bg,
            bold: canScrollUp,
          });
          row++;
        }
        for (let r = 0; r < availH; r++) {
          const isThumb = r >= thumbY && r < thumbY + thumbH;
          buf.set(sbX, rect.y + row, {
            char: isThumb ? vThumb : vTrack,
            fg: isThumb ? theme.highlight : theme.muted,
            bg,
          });
          row++;
        }
        if (showArrows) {
          const canScrollDown = this.scrollY < maxScroll;
          buf.set(sbX, rect.y + row, {
            char: downArrow,
            fg: canScrollDown ? theme.text : theme.muted,
            bg,
            bold: canScrollDown,
          });
        }
      }
    }
  }

}
