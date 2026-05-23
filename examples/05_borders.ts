/**
 * 05_borders.ts
 *
 * Border styles showcase: none, single, double, rounded, bold.
 *
 * Demonstrates:
 *   • All built-in border character sets side by side
 *   • Focus-sensitive border coloring (yellow glow when focused)
 *   • Label rendering in the top border edge
 *   • Tab to cycle through panels
 *
 * Controls:
 *   Tab / Shift+Tab — cycle focus (border highlights yellow)
 *   Ctrl+C          — quit
 */

import {
  App, Box, paintCenteredText, paintText,
  edgesAll, defaultTheme, BORDERS,
} from "../src/mod.ts";
import type { BorderStyle } from "../src/mod.ts";

// ─── Header ──────────────────────────────────────────────────────────────────

const header = new Box("hdr");
header.height = { fixed: 3 };
header.style.bg = defaultTheme.toolbarBg;
header.onPaint = (buf, rect, theme) => {
  buf.fill(rect.x, rect.y, rect.width, rect.height, { char: " ", bg: theme.toolbarBg });
  paintCenteredText(buf, rect,
    "✦  Border Styles  —  Tab to focus · watch the border glow ✦",
    theme.toolbarText, theme.toolbarBg, true);
};

// ─── Border demo builder ──────────────────────────────────────────────────────

function borderBox(
  borderStyle: BorderStyle,
  styleName: string,
  chars: string,
  tabIdx: number,
): Box {
  const box = new Box(styleName);
  box.style.border = borderStyle;
  box.style.bg = defaultTheme.panelBg;
  box.style.padding = edgesAll(1);
  box.focusable = true;
  box.tabIndex = tabIdx;

  box.onPaint = (buf, rect, theme) => {
    // Style name
    paintCenteredText(
      buf, { x: rect.x, y: rect.y, width: rect.width, height: 1 },
      styleName,
      box.focused ? theme.highlight : theme.focus,
      theme.panelBg,
      true,
    );

    // Border chars preview
    const preview = `  ${chars}`;
    paintText(buf, rect, preview, 2, theme.text);

    // Description
    const desc: Record<string, string[]> = {
      "none":    ["  No border characters.", "  Content uses full rect."],
      "single":  ["  Classic box-drawing.", "  ─│ thin lines."],
      "double":  ["  Double-stroke lines.", "  ═║ heavy look."],
      "rounded": ["  Rounded corners.", "  ╭╮╰╯ softer feel."],
      "bold":    ["  Bold/thick strokes.", "  ┏┓┗┛━┃ strong."],
    };
    const lines = desc[styleName] ?? [];
    for (let i = 0; i < lines.length; i++) {
      paintText(buf, rect, lines[i], 4 + i, theme.muted);
    }

    // Focus hint
    if (box.focused) {
      paintCenteredText(
        buf,
        { x: rect.x, y: rect.y + rect.height - 1, width: rect.width, height: 1 },
        "◆ focused ◆",
        theme.highlight, theme.panelBg, true,
      );
    }
  };

  return box;
}

// ─── Create all border boxes ─────────────────────────────────────────────────

// "none" border: use a wrapper to show visually distinct background (subtle VS Code dark gray)
const noneBox = borderBox("none", "none", "  (no box chars)", 1);
noneBox.style.bg = { r: 35, g: 35, b: 35 };

const singleBox = borderBox("single", "single", "┌─┐ │ │ └─┘", 2);
const doubleBox = borderBox("double", "double", "╔═╗ ║ ║ ╚═╝", 3);
const roundedBox = borderBox("rounded", "rounded", "╭─╮ │ │ ╰─╯", 4);
const boldBox   = borderBox("bold",   "bold",   "┏━┓ ┃ ┃ ┗━┛", 5);

// ─── Top row (none, single, double) ─────────────────────────────────────────

const topRow = Box.row("top");
topRow.style.gutter = 2;
topRow.style.padding = { top: 1, left: 2, right: 2, bottom: 0 };
topRow.height = { fixed: 14 };
topRow.add(noneBox, singleBox, doubleBox);

// ─── Bottom row (rounded, bold) + info box ───────────────────────────────────

const infoBox = new Box("tuix Border System");
infoBox.style.border = "rounded";
infoBox.style.bg = { r: 25, g: 25, b: 25 };
infoBox.style.padding = edgesAll(1);
infoBox.onPaint = (buf, rect, theme) => {
  const lines = [
    "Border characters are drawn",
    "using Unicode box-drawing.",
    "",
    "Focused boxes glow yellow.",
    "Labels appear in top edge.",
    "",
    "Custom BorderChars structs",
    "are also supported.",
  ];
  for (let i = 0; i < lines.length; i++) {
    paintText(buf, rect, lines[i], i, theme.muted);
  }
};
infoBox.width = { fixed: 30 };

const bottomRow = Box.row("bottom");
bottomRow.style.gutter = 2;
bottomRow.style.padding = { top: 1, left: 2, right: 2, bottom: 1 };
bottomRow.height = { fixed: 14 };
bottomRow.add(roundedBox, boldBox, infoBox);

// ─── Status bar ───────────────────────────────────────────────────────────────

const statusBar = new Box("status");
statusBar.height = { fixed: 1 };
statusBar.onPaint = (buf, rect, theme) => {
  buf.fill(rect.x, rect.y, rect.width, 1, { char: " ", bg: theme.bg });
  const hint = " Tab: next panel  │  Shift+Tab: prev  │  Ctrl+C: quit";
  for (let i = 0; i < hint.length && i < rect.width; i++) {
    buf.set(rect.x + i, rect.y, { char: hint[i], fg: theme.muted, bg: theme.bg });
  }
};

// ─── Root ─────────────────────────────────────────────────────────────────────

const root = Box.col("root");
root.style.bg = defaultTheme.bg;
root.add(header, topRow, bottomRow, statusBar);

const app = new App(root, { theme: defaultTheme, fps: 30, mouse: true });
await app.run();
