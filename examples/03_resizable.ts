/**
 * 03_resizable.ts
 *
 * Resizable panels with a horizontal and vertical splitter.
 *
 * Demonstrates:
 *   • Splitter widget (horizontal and vertical)
 *   • Mouse drag to resize panels
 *   • Min/max size constraints on panels
 *   • Keyboard ← → ↑ ↓ on focused splitter to nudge it
 *
 * Controls:
 *   Mouse drag on ┃ or ━ handle — resize panels
 *   Tab          — cycle focus between panels
 *   Ctrl+C       — quit
 */

import {
  App, Box, Splitter, paintCenteredText, paintText,
  edgesAll, defaultTheme,
} from "../src/mod.ts";

// ─── Header ──────────────────────────────────────────────────────────────────

const header = new Box("hdr");
header.height = { fixed: 3 };
header.style.bg = defaultTheme.toolbarBg;
header.onPaint = (buf, rect, theme) => {
  buf.fill(rect.x, rect.y, rect.width, rect.height, { char: " ", bg: theme.toolbarBg });
  paintCenteredText(buf, rect,
    "✦  Resizable Panels  —  Drag  ◈  handles with mouse",
    theme.toolbarText, theme.toolbarBg, true);
};

// ─── Content panels ───────────────────────────────────────────────────────────

function makePanel(label: string, body: string[], tabIdx: number): Box {
  const box = new Box(label);
  box.style.border = "single";
  box.style.padding = edgesAll(1);
  box.style.bg = defaultTheme.panelBg;
  box.focusable = true;
  box.tabIndex = tabIdx;
  box.onPaint = (buf, rect, theme) => {
    const titleColor = box.focused ? theme.highlight : theme.muted;
    paintText(buf, rect, label, 0, titleColor, box.focused);
    if (box.focused) {
      for (let c = rect.x; c < rect.x + label.length; c++) {
        buf.set(c, rect.y + 1, { char: "▔", fg: theme.highlight, bg: theme.panelBg });
      }
    }
    for (let i = 0; i < body.length; i++) {
      paintText(buf, rect, body[i], 2 + i, theme.text);
    }
    // Show size
    const sizeStr = `rect: ${box.rect.width}×${box.rect.height}`;
    paintText(buf, rect, sizeStr, rect.height - 1, theme.muted);
  };
  return box;
}

const topLeft = makePanel("◎ File Explorer", [
  "  src/",
  "    mod.ts",
  "    layout.ts",
  "    theme.ts",
  "    events.ts",
  "    focus.ts",
  "    splitter.ts",
  "    app.ts",
  "  examples/",
], 1);

const topRight = makePanel("◎ Editor", [
  "  // Resizable panel demo",
  "  // Drag the ◈ handle",
  "  // to resize panels",
  "",
  "  const splitter = new",
  "    Splitter('horizontal',",
  "      panelA, panelB,",
  "      { initialSplit: 30 }",
  "    );",
], 2);

const bottomPanel = makePanel("◎ Terminal Output", [
  "  $ deno run examples/03_resizable.ts",
  "  tuix v0.1.0 — resizable panels",
  "  Drag the ◈ handle to resize.",
  "  Tab to cycle panel focus.",
], 3);

// ─── Splitters ────────────────────────────────────────────────────────────────

// Horizontal splitter divides top-left and top-right
const hSplit = new Splitter("horizontal", topLeft, topRight, {
  initialSplit: 30,
  minA: 12,
  minB: 12,
});

// Vertical splitter divides top row and bottom panel
const vSplit = new Splitter("vertical", hSplit, bottomPanel, {
  initialSplit: 12,
  minA: 8,
  minB: 5,
});

// ─── Status bar ───────────────────────────────────────────────────────────────

const statusBar = new Box("status");
statusBar.height = { fixed: 1 };
statusBar.onPaint = (buf, rect, theme) => {
  buf.fill(rect.x, rect.y, rect.width, 1, { char: " ", bg: theme.bg });
  const hint = " Drag ◈ to resize  │  Tab: focus  │  Ctrl+C: quit";
  for (let i = 0; i < hint.length && i < rect.width; i++) {
    buf.set(rect.x + i, rect.y, { char: hint[i], fg: theme.muted, bg: theme.bg });
  }
};

// ─── Root ─────────────────────────────────────────────────────────────────────

const root = Box.col("root");
root.style.bg = defaultTheme.bg;
root.add(header, vSplit, statusBar);

const app = new App(root, { theme: defaultTheme, fps: 30, mouse: true });
await app.run();
