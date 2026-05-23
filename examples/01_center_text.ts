/**
 * 01_center_text.ts
 *
 * Reactive layout — Fixed-size centered panel with text.
 *
 * Demonstrates:
 *   • Fixed width/height constraints on a Box
 *   • Centering via justify/align on the root
 *   • Text centered inside the box via paintCenteredText
 *   • Auto-reflow when terminal is resized (SIGWINCH / resize polling)
 *
 * Controls: Ctrl+C or Ctrl+Q to quit.
 */

import { App, Box, paintCenteredText, edgesAll, defaultTheme } from "../src/mod.ts";

// ─── Root: full-screen column, centers child ──────────────────────────────────
const root = Box.col("root");
root.style.justify = "center";
root.style.align = "center";
root.style.bg = defaultTheme.bg;

// ─── Fixed-size panel (40 wide × 12 tall) ────────────────────────────────────
const panel = new Box("Welcome");
panel.width = { fixed: 44 };
panel.height = { fixed: 14 };
panel.style.border = "rounded";
panel.style.bg = defaultTheme.panelBg;
panel.style.padding = edgesAll(1);
panel.focusable = true;
panel.tabIndex = 0;

panel.onPaint = (buf, rect, theme) => {
  // Title
  paintCenteredText(
    buf, { x: rect.x, y: rect.y, width: rect.width, height: 2 },
    "✦  tuix",
    theme.highlight,
    theme.panelBg,
    true,
  );

  // Subtitle
  paintCenteredText(
    buf, { x: rect.x, y: rect.y + 2, width: rect.width, height: 1 },
    "Terminal UI Library",
    theme.muted,
    theme.panelBg,
    false,
  );

  // Divider
  const divider = "─".repeat(rect.width);
  for (let i = 0; i < divider.length; i++) {
    buf.set(rect.x + i, rect.y + 3, { char: "─", fg: theme.border, bg: theme.panelBg });
  }

  // Body lines
  const lines = [
    "  Fixed-size layout: 44 × 14 chars  ",
    "  Resize the terminal — layout reflows  ",
    "  Border: rounded  ╭─────╮  ",
    "  Highlight color: vscode yellow  ",
  ];

  for (let i = 0; i < lines.length; i++) {
    paintCenteredText(
      buf,
      { x: rect.x, y: rect.y + 5 + i, width: rect.width, height: 1 },
      lines[i],
      i === 3 ? theme.highlight : theme.text,
      theme.panelBg,
      i === 3,
    );
  }

  // Footer hint
  paintCenteredText(
    buf,
    { x: rect.x, y: rect.y + rect.height - 1, width: rect.width, height: 1 },
    "Ctrl+C to quit",
    theme.muted,
    theme.panelBg,
  );
};

root.add(panel);

// ─── Background fill ─────────────────────────────────────────────────────────
// Fill root background
root.onPaint = (buf, rect, theme) => {
  // Draw a subtle dot-grid background
  for (let row = rect.y; row < rect.y + rect.height; row++) {
    for (let col = rect.x; col < rect.x + rect.width; col++) {
      if (row % 4 === 0 && col % 8 === 0) {
        buf.set(col, row, { char: "·", fg: { r: 35, g: 35, b: 60 }, bg: theme.bg });
      }
    }
  }
};

// ─── Run ─────────────────────────────────────────────────────────────────────
const app = new App(root, { theme: defaultTheme, fps: 30, mouse: true });
await app.run();
