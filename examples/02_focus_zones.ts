/**
 * 02_focus_zones.ts
 *
 * Focusable vs non-focusable zones, keyboard shortcuts.
 *
 * Demonstrates:
 *   • Multiple focusable panels with tab-order (tabIndex)
 *   • Non-focusable zones that Tab skips entirely
 *   • Keyboard shortcuts (1/2/3) to jump directly to panels
 *   • Visual difference: focused border turns gold/yellow, unfocused stays dim
 *   • Shift+Tab goes backward through focusable zones
 *
 * Controls:
 *   Tab / Shift+Tab — cycle focus
 *   1 / 2 / 3      — jump directly to panel 1, 2, or 3
 *   Ctrl+C / Ctrl+Q — quit
 */

import {
  App, Box, paintCenteredText, paintText,
  edgesAll, edgesXY, defaultTheme,
} from "../src/mod.ts";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeInfoBox(
  label: string,
  focusable: boolean,
  tabIdx: number,
  description: string[],
  shortcutHint = "",
): Box {
  const box = new Box(label);
  box.style.border = "single";
  box.style.padding = edgesAll(1);
  box.style.bg = defaultTheme.panelBg;
  box.focusable = focusable;
  box.tabIndex = tabIdx;

  box.onPaint = (buf, rect, theme) => {
    // Status badge
    const badge = focusable ? "[ FOCUSABLE ]" : "[ LOCKED ]";
    const badgeColor = focusable
      ? (box.focused ? theme.highlight : theme.focus)
      : theme.muted;
    paintCenteredText(buf, { x: rect.x, y: rect.y, width: rect.width, height: 1 },
      badge, badgeColor, theme.panelBg, focusable);

    // Description lines
    for (let i = 0; i < description.length; i++) {
      paintText(buf, rect, description[i], 2 + i, theme.text);
    }

    // Shortcut hint
    if (shortcutHint) {
      paintCenteredText(
        buf,
        { x: rect.x, y: rect.y + rect.height - 1, width: rect.width, height: 1 },
        shortcutHint, theme.muted, theme.panelBg,
      );
    }

    // Focus indicator bar at bottom
    if (box.focused) {
      for (let c = rect.x; c < rect.x + rect.width; c++) {
        buf.set(c, rect.y + rect.height - 2, {
          char: "▁", fg: theme.highlight, bg: theme.panelBg,
        });
      }
    }
  };

  return box;
}

// ─── Header ──────────────────────────────────────────────────────────────────

const header = new Box("header");
header.height = { fixed: 3 };
header.style.bg = defaultTheme.toolbarBg;
header.style.border = "none";
header.onPaint = (buf, rect, theme) => {
  buf.fill(rect.x, rect.y, rect.width, rect.height, { char: " ", bg: theme.toolbarBg });
  paintCenteredText(buf, rect,
    "✦  Focus Demo  —  Tab/Shift+Tab to cycle  •  1 2 3 to jump directly",
    theme.toolbarText, theme.toolbarBg, true);
};

// ─── Status bar ──────────────────────────────────────────────────────────────

const statusBar = new Box("status");
statusBar.height = { fixed: 1 };
statusBar.style.bg = defaultTheme.bg;
statusBar.onPaint = (buf, rect, theme) => {
  buf.fill(rect.x, rect.y, rect.width, 1, { char: " ", bg: theme.bg });
  const hint = " Tab: next focus  │  Shift+Tab: prev  │  1/2/3: jump  │  Ctrl+C: quit";
  for (let i = 0; i < hint.length && i < rect.width; i++) {
    buf.set(rect.x + i, rect.y, { char: hint[i], fg: theme.muted, bg: theme.bg });
  }
};

// ─── Panels row ──────────────────────────────────────────────────────────────

const panelsRow = Box.row("panels");
panelsRow.style.gutter = 1;
panelsRow.style.align = "stretch";

const panel1 = makeInfoBox(
  "Panel 1 — Editor",
  true, 1,
  [
    "  This panel is focusable.",
    "  Tab stops here.",
    "  Press 1 to jump here",
    "  directly via shortcut.",
  ],
  "  shortcut: [ 1 ]  ",
);

const panel2 = makeInfoBox(
  "Panel 2 — Status (non-focusable)",
  false, 0,
  [
    "  This panel is NOT focusable.",
    "  Tab navigation skips it.",
    "  It shows status info only.",
    "  No shortcut needed.",
  ],
  "",
);
// Make it visually distinct using theme's disabled color
panel2.style.bg = defaultTheme.disabled;
panel2.style.border = "single";

const panel3 = makeInfoBox(
  "Panel 3 — Terminal",
  true, 2,
  [
    "  This panel is focusable.",
    "  Tab stops here (index 2).",
    "  Press 3 to jump here",
    "  directly via shortcut.",
  ],
  "  shortcut: [ 3 ]  ",
);

const panel4 = makeInfoBox(
  "Panel 4 — Sidebar",
  true, 3,
  [
    "  Focusable, tab index 3.",
    "  Press 2 to jump here",
    "  (shortcuts are arbitrary).",
    "  Shift+Tab goes backward.",
  ],
  "  shortcut: [ 2 ]  ",
);
panel4.width = { fixed: 28 };

panelsRow.add(panel1, panel2, panel3, panel4);

// ─── Root layout ─────────────────────────────────────────────────────────────

const root = Box.col("root");
root.style.bg = defaultTheme.bg;
root.style.gutter = 0;
root.add(header, panelsRow, statusBar);

// ─── App + shortcuts ─────────────────────────────────────────────────────────

const app = new App(root, { theme: defaultTheme, fps: 30, mouse: true });
app.shortcut("1", panel1);
app.shortcut("2", panel4); // "2" jumps to sidebar (panel4) intentionally
app.shortcut("3", panel3);
await app.run();
