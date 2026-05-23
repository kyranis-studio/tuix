/**
 * 04_spacing.ts
 *
 * Gutter / Padding / Margin showcase.
 *
 * Demonstrates:
 *   • gutter  — spacing between children inside a container
 *   • padding — inner spacing between a box's border and its content
 *   • margin  — outer spacing between a box and its siblings / parent
 *
 * Each concept is shown with an annotated visual.
 *
 * Controls: Ctrl+C to quit.
 */

import {
  App, Box, paintCenteredText, paintText,
  edgesAll, edgesXY, edgesZero, defaultTheme,
} from "../src/mod.ts";
import type { Rect } from "../src/mod.ts";
import type { CellBuffer } from "../src/terminal.ts";
import type { Theme } from "../src/mod.ts";

// ─── Header ──────────────────────────────────────────────────────────────────

const header = new Box("hdr");
header.height = { fixed: 3 };
header.style.bg = defaultTheme.toolbarBg;
header.onPaint = (buf, rect, theme) => {
  buf.fill(rect.x, rect.y, rect.width, rect.height, { char: " ", bg: theme.toolbarBg });
  paintCenteredText(buf, rect,
    "✦  Spacing: Gutter · Padding · Margin",
    theme.toolbarText, theme.toolbarBg, true);
};

// ─── Section builder ─────────────────────────────────────────────────────────

function sectionTitle(text: string): Box {
  const b = new Box();
  b.height = { fixed: 2 };
  b.style.bg = defaultTheme.bg;
  b.onPaint = (buf, rect, theme) => {
    buf.fill(rect.x, rect.y, rect.width, rect.height, { char: " ", bg: theme.bg });
    for (let i = 0; i < text.length; i++) {
      buf.set(rect.x + 1 + i, rect.y, { char: text[i], fg: theme.highlight, bg: theme.bg, bold: true });
    }
    for (let i = 0; i < text.length + 2; i++) {
      buf.set(rect.x + i, rect.y + 1, { char: "─", fg: theme.border, bg: theme.bg });
    }
  };
  return b;
}

// ─── GUTTER section ──────────────────────────────────────────────────────────

const gutterSection = Box.col();
gutterSection.style.bg = defaultTheme.bg;
gutterSection.style.padding = { top: 0, bottom: 1, left: 2, right: 2 };

// Row of boxes with gutter=4
const gutterRow = Box.row();
gutterRow.style.gutter = 4;   // ← 4 chars between children
gutterRow.height = { fixed: 7 };

function gutterChild(label: string, color: { r: number; g: number; b: number }): Box {
  const b = new Box(label);
  b.style.border = "rounded";
  b.style.bg = defaultTheme.panelBg;
  b.onPaint = (buf, rect, theme) => {
    paintCenteredText(buf, rect, label, color, theme.panelBg, true);
    // Show gutter annotation
    if (label !== "C") {
      const gx = rect.x + rect.width;
      for (let row = rect.y + 1; row < rect.y + rect.height - 1; row++) {
        for (let c = gx; c < gx + 4 && c < buf.cols; c++) {
          buf.set(c, row, {
            char: c === gx || c === gx + 3 ? "│" : "·",
            fg: theme.highlight,
            bg: theme.bg,
          });
        }
      }
      // "gutter=4" label
      if (rect.height > 3) {
        const mid = rect.y + Math.floor(rect.height / 2);
        const g = "4";
        buf.set(gx + 1, mid, { char: g, fg: theme.highlight, bg: theme.bg, bold: true });
      }
    }
  };
  return b;
}

const gA = gutterChild("A", defaultTheme.highlight);
const gB = gutterChild("B", defaultTheme.focus);
const gC = gutterChild("C", defaultTheme.muted);
gutterRow.add(gA, gB, gC);

const gutterLabel = new Box();
gutterLabel.height = { fixed: 2 };
gutterLabel.style.bg = defaultTheme.bg;
gutterLabel.onPaint = (buf, rect, theme) => {
  paintText(buf, rect, "  gutter = 4  →  4-char gap between each child box", 0, theme.muted);
};

gutterSection.add(sectionTitle("① GUTTER — spacing between children"), gutterRow, gutterLabel);

// ─── PADDING section ─────────────────────────────────────────────────────────

const paddingSection = Box.col();
paddingSection.style.bg = defaultTheme.bg;
paddingSection.style.padding = { top: 0, bottom: 1, left: 2, right: 2 };

const paddingRow = Box.row();
paddingRow.style.gutter = 3;
paddingRow.height = { fixed: 10 };

function paddingDemo(label: string, pad: ReturnType<typeof edgesAll>): Box {
  const b = new Box(label);
  b.style.border = "single";
  b.style.bg = defaultTheme.panelBg;
  b.style.padding = pad;
  b.onPaint = (buf, rect, theme) => {
    // Content area shows as highlighted with a subtle yellow tint
    buf.fill(rect.x, rect.y, rect.width, rect.height,
      { char: "░", fg: { r: 65, g: 60, b: 15 }, bg: theme.panelBg });
    paintCenteredText(buf, rect, "content", theme.highlight, theme.panelBg, true);
  };
  return b;
}

// No padding
const p0 = paddingDemo("pad=0", edgesZero());
p0.width = { fixed: 16 };

// Symmetric padding
const p2 = paddingDemo("pad=2", edgesAll(2));
p2.width = { fixed: 22 };

// Asymmetric padding
const p3 = paddingDemo("padX=3,Y=1", edgesXY(3, 1));
p3.width = { fixed: 24 };

paddingRow.add(p0, p2, p3);

const paddingLabel = new Box();
paddingLabel.height = { fixed: 2 };
paddingLabel.style.bg = defaultTheme.bg;
paddingLabel.onPaint = (buf, rect, theme) => {
  paintText(buf, rect, "  ░ = content area   padding shifts content inward from the border", 0, theme.muted);
};

paddingSection.add(sectionTitle("② PADDING — inner spacing from border to content"), paddingRow, paddingLabel);

// ─── MARGIN section ──────────────────────────────────────────────────────────

const marginSection = Box.col();
marginSection.style.bg = defaultTheme.bg;
marginSection.style.padding = { top: 0, bottom: 1, left: 2, right: 2 };

const marginRow = Box.row();
marginRow.style.gutter = 0; // gutter=0, spacing comes from margin
marginRow.height = { fixed: 9 };
marginRow.style.bg = { r: 35, g: 35, b: 35 }; // show outer container (subtle VS Code gray)

function marginDemo(label: string, margin: ReturnType<typeof edgesAll>): Box {
  const b = new Box(label);
  b.style.border = "rounded";
  b.style.bg = defaultTheme.panelBg;
  b.style.margin = margin;
  b.onPaint = (buf, rect, theme) => {
    paintCenteredText(buf, rect, label, theme.highlight, theme.panelBg, true);
  };
  return b;
}

const m0 = marginDemo("margin=0", edgesZero());
const m2 = marginDemo("margin=2", edgesAll(2));
const m3 = marginDemo("marginL=4", { top: 1, bottom: 1, left: 4, right: 0 });

marginRow.add(m0, m2, m3);

const marginLabel = new Box();
marginLabel.height = { fixed: 2 };
marginLabel.style.bg = defaultTheme.bg;
marginLabel.onPaint = (buf, rect, theme) => {
  paintText(buf, rect, "  margin pushes the box outward from its allocated slot", 0, theme.muted);
};

marginSection.add(sectionTitle("③ MARGIN — outer spacing outside the border"), marginRow, marginLabel);

// ─── Root ─────────────────────────────────────────────────────────────────────

const statusBar = new Box();
statusBar.height = { fixed: 1 };
statusBar.onPaint = (buf, rect, theme) => {
  buf.fill(rect.x, rect.y, rect.width, 1, { char: " ", bg: theme.bg });
  const h = " Ctrl+C to quit";
  for (let i = 0; i < h.length; i++) {
    buf.set(rect.x + i, rect.y, { char: h[i], fg: theme.muted, bg: theme.bg });
  }
};

const root = Box.col("root");
root.style.bg = defaultTheme.bg;
root.add(header, gutterSection, paddingSection, marginSection, statusBar);

const app = new App(root, { theme: defaultTheme, fps: 30, mouse: false });
await app.run();
