/**
 * diff_viewer.ts — A diff viewer with color-highlighted additions, deletions,
 * and hunk headers.
 *
 * Parses unified diff format and renders each line with appropriate colors:
 *   • Added lines (+)   → green foreground + green-tinted background
 *   • Removed lines (-) → red foreground + red-tinted background
 *   • Hunk headers (@@) → cyan foreground, bold
 *   • File headers      → magenta/cyan, bold
 *   • Context lines     → default text colour
 *
 * Usage:
 *   const dv = new DiffViewer(diffText);
 *   parent.add(dv);
 */

import { Rect, Box } from "../layout.ts";
import { CellBuffer } from "../terminal.ts";
import { Theme, Color } from "../theme.ts";
import { TextArea } from "./textarea.ts";

// ─── Diff line types ──────────────────────────────────────────────────────────

export type DiffLineType = "add" | "del" | "hunk" | "fileHeader" | "context";

export interface DiffLine {
  type: DiffLineType;
  text: string;
}

// ─── Default diff colours ─────────────────────────────────────────────────────

export interface DiffTheme {
  /** Foreground colour for added lines */
  addFg: Color;
  /** Background colour for added lines */
  addBg: Color;
  /** Foreground colour for removed lines */
  delFg: Color;
  /** Background colour for removed lines */
  delBg: Color;
  /** Foreground colour for hunk headers (@@ -1,5 +1,7 @@) */
  hunkFg: Color;
  /** Foreground colour for ---/+++ file headers */
  fileHeaderFg: Color;
  /** Flag to make file headers bold */
  fileHeaderBold: boolean;
}

export const defaultDiffTheme: DiffTheme = {
  addFg: { r: 80, g: 200, b: 120 },  // green
  addBg: { r: 10, g: 40, b: 15 },    // dark green tint
  delFg: { r: 240, g: 100, b: 100 }, // red
  delBg: { r: 45, g: 12, b: 12 },    // dark red tint
  hunkFg: { r: 80, g: 200, b: 240 }, // cyan
  fileHeaderFg: { r: 200, g: 160, b: 255 }, // lavender/purple
  fileHeaderBold: true,
};

// ─── Diff parser ──────────────────────────────────────────────────────────────

/**
 * Parse a unified diff string into an array of DiffLine objects.
 */
export function parseDiff(content: string): DiffLine[] {
  const lines = content.split("\n");
  const result: DiffLine[] = [];

  for (const rawLine of lines) {
    if (rawLine.startsWith("+") && !rawLine.startsWith("+++")) {
      result.push({ type: "add", text: rawLine });
    } else if (rawLine.startsWith("-") && !rawLine.startsWith("---")) {
      result.push({ type: "del", text: rawLine });
    } else if (rawLine.startsWith("@@")) {
      result.push({ type: "hunk", text: rawLine });
    } else if (rawLine.startsWith("---") || rawLine.startsWith("+++")) {
      result.push({ type: "fileHeader", text: rawLine });
    } else {
      result.push({ type: "context", text: rawLine });
    }
  }

  return result;
}

/**
 * Compute a unified-diff string between two texts.
 *
 * Uses an LCS-based line diff (O(m×n)) to find the minimal edit
 * operations, then formats hunks with 3 lines of context.
 */
export function computeDiff(oldText: string, newText: string): string {
  if (oldText === newText) return "";

  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const m = oldLines.length;
  const n = newLines.length;

  // ── Special case: one side is empty ────────────────────────────
  if (m === 0 || n === 0) {
    const result: string[] = [
      "--- a/original",
      "+++ b/current",
    ];
    for (const line of oldLines) result.push("-" + line);
    for (const line of newLines) result.push("+" + line);
    return result.join("\n");
  }

  // ── LCS table ─────────────────────────────────────────────────
  const dp: number[][] = new Array(m + 1);
  for (let i = 0; i <= m; i++) {
    dp[i] = new Array(n + 1).fill(0);
  }
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = oldLines[i - 1] === newLines[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  // ── Backtrack to build edit ops ────────────────────────────────
  type Op = { t: "eq" | "del" | "ins"; line: string };
  const ops: Op[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      ops.push({ t: "eq", line: oldLines[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.push({ t: "ins", line: newLines[j - 1] });
      j--;
    } else {
      ops.push({ t: "del", line: oldLines[i - 1] });
      i--;
    }
  }
  ops.reverse();

  // ── Group into hunks with 3 lines of context ───────────────────
  const CONTEXT = 3;

  const result: string[] = ["--- a/original", "+++ b/current"];
  let oldLineNum = 1;
  let newLineNum = 1;

  for (let idx = 0; idx < ops.length; ) {
    // Skip context lines until we find a change
    if (ops[idx].t === "eq") {
      idx++;
      continue;
    }

    // ── Lead-in context (up to CONTEXT lines before this change) ──
    // Only include eq ops — non-eq ops belong to a previous change
    // and would produce incorrect output lines.
    const ctxBefore: Op[] = [];
    for (let k = Math.max(0, idx - CONTEXT); k < idx; k++) {
      if (ops[k].t !== "eq") continue;
      ctxBefore.push(ops[k]);
    }

    // ── The change itself: deletions then insertions ─────────────
    const changeLines: Op[] = [];
    while (idx < ops.length && ops[idx].t !== "eq") {
      changeLines.push(ops[idx]);
      idx++;
    }

    // ── Trail-out context (up to CONTEXT lines after this change) ─
    // Only include eq ops — non-eq ops will start the next hunk.
    const ctxAfter: Op[] = [];
    for (let k = idx; k < Math.min(ops.length, idx + CONTEXT); k++) {
      if (ops[k].t !== "eq") break;
      ctxAfter.push(ops[k]);
    }

    // Count lines in old/new for hunk header
    // ctxBefore/ctxAfter only contain eq ops, changeLines contain del/ins.
    const ctxCount = ctxBefore.length + ctxAfter.length;
    let changeOldCount = 0, changeNewCount = 0;
    for (const op of changeLines) {
      if (op.t === "del") changeOldCount++;
      else if (op.t === "ins") changeNewCount++;
    }
    const oldCount = ctxCount + changeOldCount;
    const newCount = ctxCount + changeNewCount;

    result.push(`@@ -${oldLineNum},${oldCount} +${newLineNum},${newCount} @@`);

    for (const op of [...ctxBefore, ...changeLines, ...ctxAfter]) {
      if (op.t === "eq") {
        result.push(" " + op.line);
        oldLineNum++;
        newLineNum++;
      } else if (op.t === "del") {
        result.push("-" + op.line);
        oldLineNum++;
      } else {
        result.push("+" + op.line);
        newLineNum++;
      }
    }

    // Advance idx past ctxAfter to avoid reprocessing these lines.
    idx += ctxAfter.length;
  }

  return result.join("\n");
}

// ─── Split-diff types ──────────────────────────────────────────────────────────

export interface SplitDiffRow {
  /** Line number in the old file (null if this is a pure insertion). */
  oldLineNum: number | null;
  /** Text content from the old file ("" if insertion). */
  oldText: string;
  /** How to display the old side: context, deletion, or empty. */
  oldType: "eq" | "del" | "empty";
  /** Line number in the new file (null if this is a pure deletion). */
  newLineNum: number | null;
  /** Text content from the new file ("" if deletion). */
  newText: string;
  /** How to display the new side: context, insertion, or empty. */
  newType: "eq" | "ins" | "empty";
}

/**
 * Compute a side-by-side split diff between two texts.
 *
 * Returns aligned rows where each row represents one visual line
 * in the split view. Insertions and deletions are paired when
 * adjacent (forming a replacement row).
 */
export function computeSplitDiff(
  oldText: string,
  newText: string,
): SplitDiffRow[] {
  if (oldText === newText) return [];

  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const m = oldLines.length;
  const n = newLines.length;

  // ── Edge case: one side is empty ────────────────────────────
  if (m === 0 || n === 0) {
    const rows: SplitDiffRow[] = [];
    let ol = 1, nl = 1;
    for (const line of oldLines) {
      rows.push({ oldLineNum: ol++, oldText: line, oldType: "del", newLineNum: null, newText: "", newType: "empty" });
    }
    for (const line of newLines) {
      rows.push({ oldLineNum: null, oldText: "", oldType: "empty", newLineNum: nl++, newText: line, newType: "ins" });
    }
    return rows;
  }

  // ── LCS table ──────────────────────────────────────────────
  const dp: number[][] = new Array(m + 1);
  for (let i = 0; i <= m; i++) {
    dp[i] = new Array(n + 1).fill(0);
  }
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = oldLines[i - 1] === newLines[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  // ── Backtrack to build edit ops ────────────────────────────
  type Op = { t: "eq" | "del" | "ins"; line: string };
  const ops: Op[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      ops.push({ t: "eq", line: oldLines[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.push({ t: "ins", line: newLines[j - 1] });
      j--;
    } else {
      ops.push({ t: "del", line: oldLines[i - 1] });
      i--;
    }
  }
  ops.reverse();

  // ── Walk ops to produce aligned rows ───────────────────────
  const rows: SplitDiffRow[] = [];
  let oldLineNum = 1;
  let newLineNum = 1;
  let idx = 0;

  while (idx < ops.length) {
    if (ops[idx].t === "eq") {
      rows.push({
        oldLineNum: oldLineNum++,
        oldText: ops[idx].line,
        oldType: "eq",
        newLineNum: newLineNum++,
        newText: ops[idx].line,
        newType: "eq",
      });
      idx++;
    } else if (ops[idx].t === "del") {
      // Check if next op is "ins" — pair them as a replacement row
      if (idx + 1 < ops.length && ops[idx + 1].t === "ins") {
        rows.push({
          oldLineNum: oldLineNum++,
          oldText: ops[idx].line,
          oldType: "del",
          newLineNum: newLineNum++,
          newText: ops[idx + 1].line,
          newType: "ins",
        });
        idx += 2;
      } else {
        // Pure deletion — old side only
        rows.push({
          oldLineNum: oldLineNum++,
          oldText: ops[idx].line,
          oldType: "del",
          newLineNum: null,
          newText: "",
          newType: "empty",
        });
        idx++;
      }
    } else {
      // Pure insertion — new side only
      rows.push({
        oldLineNum: null,
        oldText: "",
        oldType: "empty",
        newLineNum: newLineNum++,
        newText: ops[idx].line,
        newType: "ins",
      });
      idx++;
    }
  }

  return rows;
}

// ─── SplitDiffViewer widget ────────────────────────────────────────────────────

/**
 * Side-by-side split diff viewer.
 *
 * Shows the old file on the left and the new file on the right
 * with deletions (red background) and insertions (green background).
 * Adjacent del+ins ops are paired into a single replacement row.
 */
export class SplitDiffViewer extends Box {
  private _rows: SplitDiffRow[] = [];
  private _scrollY = 0;

  /** Custom diff colour palette (shares DiffTheme). */
  diffTheme: DiffTheme = { ...defaultDiffTheme };

  constructor() {
    super("");
    this.focusable = true;
    this.onPaint = (buf, rect, theme) => this._renderSplit(buf, rect, theme);
    this.onKey = (key) => this._handleKey(key);
  }

  /** Update with new old/new texts and recompute the split diff. */
  setDiffContent(oldText: string, newText: string): void {
    this._rows = computeSplitDiff(oldText, newText);
    this._scrollY = 0;
  }

  private _handleKey(k: string): boolean {
    if (k === "ArrowUp") {
      this._scrollY = Math.max(0, this._scrollY - 1);
      return true;
    }
    if (k === "ArrowDown") {
      this._scrollY = Math.min(this._maxScrollY(), this._scrollY + 1);
      return true;
    }
    if (k === "PageUp") {
      const ch = this.rect?.height ?? 10;
      this._scrollY = Math.max(0, this._scrollY - Math.floor(ch * 0.8));
      return true;
    }
    if (k === "PageDown") {
      const ch = this.rect?.height ?? 10;
      this._scrollY = Math.min(this._maxScrollY(), this._scrollY + Math.floor(ch * 0.8));
      return true;
    }
    if (k === "Home") {
      this._scrollY = 0;
      return true;
    }
    if (k === "End") {
      this._scrollY = this._maxScrollY();
      return true;
    }
    return false;
  }

  private _maxScrollY(): number {
    const ch = this.rect?.height ?? 10;
    return Math.max(0, this._rows.length - ch + 1);
  }

  private _renderSplit(
    buf: CellBuffer,
    rect: Rect,
    theme: Theme,
  ): void {
    const bg = theme.panelBg;
    const ch = rect.height;
    const w = rect.width;

    // ── Layout dimensions ─────────────────────────────────────
    const lineNumW = 5; // right-aligned line number (e.g. " 123") + space
    const colW = Math.floor((w - 3) / 2); // width of each side
    const textW = Math.max(0, colW - lineNumW); // text width per side
    const sepX = rect.x + colW + 1; // separator column (middle of the 3-char gap)

    const dt = this.diffTheme;

    // ── Clear ────────────────────────────────────────────────
    for (let row = 0; row < ch; row++) {
      for (let col = 0; col < w; col++) {
        buf.set(rect.x + col, rect.y + row, {
          char: " ",
          fg: theme.text,
          bg,
        });
      }
    }

    // ── No-diff placeholder ───────────────────────────────────
    if (this._rows.length === 0) {
      const msg = "No changes — edit code to see split diff";
      for (let col = 0; col < msg.length && col < w; col++) {
        buf.set(rect.x + col, rect.y, {
          char: msg[col],
          fg: theme.muted,
          bg,
        });
      }
      return;
    }

    // ── Render rows ──────────────────────────────────────────
    for (let row = 0; row < ch; row++) {
      const rowIdx = this._scrollY + row;
      if (rowIdx >= this._rows.length) break;

      const r = this._rows[rowIdx];

      // ── Old side (left) ──────────────────────────────────
      const leftX = rect.x;
      if (r.oldType === "del") {
        // Red background for deletions
        _fillLine(buf, leftX, rect.y + row, colW, " ", dt.delFg, dt.delBg);
        _drawNum(buf, leftX, rect.y + row, lineNumW, r.oldLineNum, dt.delFg, dt.delBg);
        _drawText(buf, leftX + lineNumW, rect.y + row, textW, r.oldText, dt.delFg, dt.delBg);
      } else if (r.oldType === "eq") {
        _drawNum(buf, leftX, rect.y + row, lineNumW, r.oldLineNum, theme.muted, bg);
        _drawText(buf, leftX + lineNumW, rect.y + row, textW, r.oldText, theme.text, bg);
      } else {
        // empty — draw line num as "-"
        _drawNum(buf, leftX, rect.y + row, lineNumW, null, theme.muted, bg);
      }

      // ── Separator ───────────────────────────────────────
      if (sepX < rect.x + w) {
        buf.set(sepX, rect.y + row, {
          char: "│",
          fg: theme.muted,
          bg,
        });
      }

      // ── New side (right) ────────────────────────────────
      const rightX = rect.x + colW + 3;
      const rightW = w - colW - 3;
      if (r.newType === "ins") {
        // Green background for insertions
        _fillLine(buf, rightX, rect.y + row, rightW, " ", dt.addFg, dt.addBg);
        _drawNum(buf, rightX, rect.y + row, lineNumW, r.newLineNum, dt.addFg, dt.addBg);
        _drawText(buf, rightX + lineNumW, rect.y + row, textW, r.newText, dt.addFg, dt.addBg);
      } else if (r.newType === "eq") {
        _drawNum(buf, rightX, rect.y + row, lineNumW, r.newLineNum, theme.muted, bg);
        _drawText(buf, rightX + lineNumW, rect.y + row, textW, r.newText, theme.text, bg);
      } else {
        _drawNum(buf, rightX, rect.y + row, lineNumW, null, theme.muted, bg);
      }
    }

    // ── Scrollbar ───────────────────────────────────────────
    const totalRows = this._rows.length;
    const maxScroll = this._maxScrollY();
    const sbX = rect.x + w - 1;

    if (maxScroll <= 0) {
      for (let row = 0; row < ch; row++) {
        buf.set(sbX, rect.y + row, {
          char: "│",
          fg: theme.muted,
          bg,
        });
      }
    } else {
      const availH = ch - 2;
      if (availH > 0) {
        const thumbH = Math.max(1, Math.floor((ch / totalRows) * availH));
        const thumbY = Math.floor(
          (this._scrollY / maxScroll) * (availH - thumbH),
        );

        let sRow = 0;
        const canUp = this._scrollY > 0;
        buf.set(sbX, rect.y + sRow, {
          char: "↑",
          fg: canUp ? theme.text : theme.muted,
          bg,
          bold: canUp,
        });
        sRow++;
        for (let r = 0; r < availH; r++) {
          const isThumb = r >= thumbY && r < thumbY + thumbH;
          buf.set(sbX, rect.y + sRow, {
            char: isThumb ? "▌" : "│",
            fg: isThumb ? theme.highlight : theme.muted,
            bg,
          });
          sRow++;
        }
        const canDown = this._scrollY < maxScroll;
        buf.set(sbX, rect.y + sRow, {
          char: "↓",
          fg: canDown ? theme.text : theme.muted,
          bg,
          bold: canDown,
        });
      }
    }
  }
}

// ─── Split-diff rendering helpers ────────────────────────────────────────────

function _fillLine(
  buf: CellBuffer,
  x: number,
  y: number,
  w: number,
  char: string,
  fg: Color,
  bg: Color,
): void {
  for (let c = 0; c < w; c++) {
    buf.set(x + c, y, { char, fg, bg });
  }
}

function _drawNum(
  buf: CellBuffer,
  x: number,
  y: number,
  w: number,
  num: number | null,
  fg: Color,
  bg: Color,
): void {
  const text = num !== null ? String(num).padStart(4) + " " : "  -  ";
  for (let c = 0; c < w && c < text.length; c++) {
    buf.set(x + c, y, { char: text[c], fg, bg });
  }
}

function _drawText(
  buf: CellBuffer,
  x: number,
  y: number,
  w: number,
  text: string,
  fg: Color,
  bg: Color,
): void {
  const maxLen = Math.min(w, text.length);
  for (let c = 0; c < maxLen; c++) {
    buf.set(x + c, y, { char: text[c], fg, bg });
  }
}

// ─── DiffViewer widget (unified diff) ─────────────────────────────────────────

export class DiffViewer extends TextArea {
  /** Parsed diff lines — rebuilt whenever value changes. */
  private _parsed: DiffLine[] = [];

  /** Custom diff colour palette (defaults to defaultDiffTheme). */
  diffTheme: DiffTheme = { ...defaultDiffTheme };

  constructor(
    value = "",
    onChange?: (val: string) => void,
    maxLines?: number,
  ) {
    // burstThreshold high → no paste markers
    super("Edit the code on the left to see changes", value, onChange, maxLines ?? undefined, false, false, "Copied!", 9999);
    this._parseContent();

    // Override onPaint with diff-aware rendering
    this.onPaint = (buf, rect, theme) => {
      this._renderDiff(buf, rect, theme);
    };
  }

  /** Update value and re-parse the diff. */
  setDiffContent(content: string): void {
    this.value = content;
    this.cursorPos = 0; // cursor at start of diff content
    this._parseContent();
    this._onValueChanged();
  }

  private _parseContent(): void {
    this._parsed = parseDiff(this.value);
  }

  // ── Diff rendering ────────────────────────────────────────────

  private _renderDiff(
    buf: CellBuffer,
    rect: Rect,
    theme: Theme,
  ): void {
    const isFocused = this.focused;
    const showPlaceholder = !this.value;
    const bg = theme.panelBg;
    const ch = rect.height;
    const totalRows = this._lines().length;
    const sbX = rect.x + rect.width - 1;
    const cw = Math.max(0, rect.width - 1);

    // Scrollbar chars
    const sb = this.style.scrollbar ?? {};
    const showArrows = sb.showArrows ?? true;
    const vTrack = sb.verticalTrack ?? "│";
    const vThumb = sb.verticalThumb ?? "▌";
    const upArrow = sb.arrowUp ?? "↑";
    const downArrow = sb.arrowDown ?? "↓";

    const dt = this.diffTheme;

    // Clear text area
    for (let row = 0; row < ch; row++) {
      for (let col = 0; col < cw; col++) {
        buf.set(rect.x + col, rect.y + row, {
          char: " ",
          fg: theme.text,
          bg,
        });
      }
    }

    if (showPlaceholder) {
      for (let col = 0; col < cw && col < this.placeholder.length; col++) {
        const isCur = isFocused && col === this.cursorPos;
        buf.set(rect.x + col, rect.y, {
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
        buf.set(rect.x + this.cursorPos, rect.y, {
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
        ? Math.min(this._selStart!, this._selEnd!)
        : -1;
      const selMax = selActive
        ? Math.max(this._selStart!, this._selEnd!)
        : -1;

      for (let row = 0; row < ch; row++) {
        const lineIdx = this.scrollY + row;
        if (lineIdx >= lines.length) break;
        const rawLine = lines[lineIdx];

        // Determine diff type for this line
        const diffLine = lineIdx < this._parsed.length
          ? this._parsed[lineIdx]
          : null;
        const diffType = diffLine?.type ?? "context";

        // Compute display text and pick colours based on diff type
        let displayText: string;
        let lineFg: Color;
        let lineBg: Color;
        let lineBold = false;
        let hideLine = false;

        switch (diffType) {
          case "add":
            displayText = rawLine.slice(1); // strip + prefix
            lineFg = dt.addFg;
            lineBg = dt.addBg;
            break;
          case "del":
            displayText = rawLine.slice(1); // strip - prefix
            lineFg = dt.delFg;
            lineBg = dt.delBg;
            break;
          case "hunk":
            displayText = rawLine;
            lineFg = dt.hunkFg;
            lineBg = bg;
            lineBold = true;
            break;
          case "fileHeader":
            displayText = rawLine;
            lineFg = dt.fileHeaderFg;
            lineBg = bg;
            lineBold = dt.fileHeaderBold;
            break;
          default:
            displayText = rawLine.slice(1); // strip space prefix for context
            lineFg = theme.text;
            lineBg = bg;
            break;
        }

        for (let col = 0; col < cw; col++) {
          const charIdx = this._lineStart(lineIdx) + col;
          const inSel =
            selActive && charIdx >= selMin && charIdx < selMax;
          const isCur =
            isFocused && lineIdx === cursorRow && col === cursorCol;

          if (col < displayText.length) {
            if (inSel && isCur) {
              buf.set(rect.x + col, rect.y + row, {
                char: displayText[col],
                fg: bg,
                bg: theme.text,
                bold: true,
              });
            } else if (inSel) {
              buf.set(rect.x + col, rect.y + row, {
                char: displayText[col],
                fg: theme.bg,
                bg: theme.highlight,
              });
            } else if (isCur) {
              buf.set(rect.x + col, rect.y + row, {
                char: displayText[col],
                fg: bg,
                bg: theme.text,
                bold: true,
              });
            } else {
              buf.set(rect.x + col, rect.y + row, {
                char: displayText[col],
                fg: lineFg,
                bg: lineBg,
                bold: lineBold,
              });
            }
          } else if (isCur) {
            buf.set(rect.x + col, rect.y + row, {
              char: " ",
              fg: bg,
              bg: theme.highlight,
            });
          }
        }
      }
    }

    // ── Scrollbar ───────────────────────────────────────────────
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
