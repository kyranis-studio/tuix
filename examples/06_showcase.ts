/**
 * 06_showcase.ts
 *
 * Comprehensive component showcase dashboard.
 *
 * Demonstrates:
 *   • Button widget with press action
 *   • Checkbox widgets with toggles
 *   • TextInput widget with text edits and block cursor
 *   • Autocomplete widget — dropdown mode (filtered suggestion list)
 *   • Autocomplete widget — inline mode (ghost text, Tab to complete)
 *   • ListBox widget with Arrow/Vim key and scroll support
 *   • ProgressBar widget displaying real-time percentages
 *   • Live state monitor reflecting widget values dynamically
 *   • Fully resizable layout with mouse-draggable Splitter
 *
 * Controls:
 *   Tab / Shift+Tab   — cycle focus / accept inline completion
 *   Space / Enter     — toggle checkbox / click button / select dropdown
 *   ArrowUp/Down / j/k— navigate listbox items
 *   ArrowUp/Down      — navigate autocomplete dropdown
 *   Escape            — close dropdown
 *   Type characters   — write in text input / filter autocomplete
 *   Backspace         — erase characters
 *   Mouse Drag        — resize sidebar and dashboard panes
 *   Ctrl+C            — quit
 */

import {
  App, Box, Splitter, Button, Checkbox, TextInput, ListBox, ProgressBar, Autocomplete,
  paintCenteredText, paintText, edgesAll, defaultTheme,
} from "../src/mod.ts";

// ─── Reactive State ──────────────────────────────────────────────────────────

let username = "Guest Dev";
let selectedOption = "Option Alpha";
let analyticsEnabled = false;
let autoSaveEnabled = true;
let customColorEnabled = false;
let clickCount = 0;
let progressValue = 0.35;
let selectedFramework = "";
let selectedCommand = "";

// ─── Header ──────────────────────────────────────────────────────────────────

const header = new Box("hdr");
header.height = { fixed: 3 };
header.style.bg = defaultTheme.toolbarBg;
header.onPaint = (buf, rect, theme) => {
  buf.fill(rect.x, rect.y, rect.width, rect.height, { char: " ", bg: theme.toolbarBg });
  paintCenteredText(buf, rect,
    "✦  tuix Component Showcase Dashboard  ✦  VS Code Theme",
    theme.toolbarText, theme.toolbarBg, true);
};

// ─── Left Column (Sidebar Controls) ──────────────────────────────────────────

const sidebar = Box.col("Sidebar");
sidebar.style.border = "single";
sidebar.style.padding = edgesAll(1);
sidebar.style.bg = defaultTheme.panelBg;
sidebar.style.gutter = 1;
sidebar.width = { fixed: 32 };

// 1. Text Input Box
const textInput = new TextInput("Type your name...", username, (val) => {
  username = val || "Guest Dev";
});
textInput.tabIndex = 1;

// 2. Autocomplete
const frameworkAutocomplete = new Autocomplete(
  "Search framework...",
  ["React", "Vue", "Angular", "Svelte", "Solid", "Deno", "Node.js", "Express", "Next.js", "Nuxt", "Remix", "Astro"],
  (item) => { selectedFramework = item; },
);
frameworkAutocomplete.tabIndex = 2;
frameworkAutocomplete.maxVisibleItems = 6;

// 2b. Inline autocomplete (Tab to complete)
const cmdAutocomplete = new Autocomplete(
  "Type a command...",
  ["deploy", "deploy:prod", "deploy:staging", "build", "build:watch", "test", "test:watch", "lint", "lint:fix", "clean", "format", "typecheck"],
  (item) => { selectedCommand = item; },
);
cmdAutocomplete.tabIndex = 3;
cmdAutocomplete.mode = "inline";

// 3. Checkboxes
const chkAnalytics = new Checkbox("Enable Telemetry", analyticsEnabled, (checked) => {
  analyticsEnabled = checked;
});
chkAnalytics.tabIndex = 4;

const chkAutoSave = new Checkbox("Auto-Save Config", autoSaveEnabled, (checked) => {
  autoSaveEnabled = checked;
});
chkAutoSave.tabIndex = 5;

const chkCustomColor = new Checkbox("Green Tint Accent", customColorEnabled, (checked) => {
  customColorEnabled = checked;
});
chkCustomColor.tabIndex = 6;

// 5. List Box
const optionsList = new ListBox(
  ["Option Alpha", "Option Beta", "Option Gamma", "System Diagnostics"],
  (item, _idx) => {
    selectedOption = item;
  }
);
optionsList.selectedIndex = 0;
optionsList.tabIndex = 7;
optionsList.height = { fixed: 6 };

// 6. Action Button
const progressBtn = new Button("Advance Progress", () => {
  progressValue += 0.10;
  if (progressValue > 1.05) progressValue = 0.0;
  clickCount++;
});
progressBtn.tabIndex = 8;
function labelBox(text: string): Box {
  const b = new Box(text);
  b.style.fg = defaultTheme.highlight;
  return b;
}

sidebar.add(
  labelBox("Operator Information"),
  textInput,
  labelBox("Preferred Framework (dropdown)"),
  frameworkAutocomplete,
  labelBox("Command (inline, Tab to complete)"),
  cmdAutocomplete,
  labelBox("Global Configuration"),
  chkAnalytics,
  chkAutoSave,
  chkCustomColor,
  labelBox("Selectable Profiles"),
  optionsList,
  progressBtn
);

// ─── Right Column (Content Dashboard) ─────────────────────────────────────────

const content = Box.col("Dashboard Viewer");
content.style.border = "single";
content.style.padding = edgesAll(1);
content.style.gutter = 1;
content.style.bg = defaultTheme.bg;

// A custom dashboard monitor screen
const monitorView = new Box("Live Monitor");
monitorView.style.border = "none";
monitorView.style.bg = defaultTheme.bg;
monitorView.onPaint = (buf, rect, theme) => {
  const highlightColor = customColorEnabled ? { r: 100, g: 220, b: 120 } : theme.highlight;

  paintCenteredText(
    buf,
    { x: rect.x, y: rect.y, width: rect.width, height: 2 },
    "✦  LIVE COMPONENT STATE MONITOR  ✦",
    highlightColor,
    theme.bg,
    true
  );

  // Horizontal divider
  const divider = "═".repeat(rect.width);
  for (let i = 0; i < divider.length; i++) {
    buf.set(rect.x + i, rect.y + 2, { char: "═", fg: theme.border, bg: theme.bg });
  }

  // Dashboard parameters table
  const lines = [
    `  Active Operator :  ${username}`,
    `  Active Profile  :  ${selectedOption}`,
    `  Framework       :  ${selectedFramework || "—"}`,
    `  Command         :  ${selectedCommand || "—"}`,
    `  Telemetry Relay :  ${analyticsEnabled ? "ACTIVE (✓)" : "DISABLED (✗)"}`,
    `  Auto-Save Sync  :  ${autoSaveEnabled ? "SYNCHRONIZED (✓)" : "OFFLINE (✗)"}`,
    `  Color Theme Override :  ${customColorEnabled ? "ON (Green Theme)" : "OFF (VS Code Theme)"}`,
    `  Progress Actions     :  ${clickCount} clicks recorded`,
  ];

  for (let i = 0; i < lines.length; i++) {
    paintText(buf, { x: rect.x, y: rect.y + 4 + i * 2, width: rect.width, height: 1 }, lines[i], 0, theme.text);
  }
};
monitorView.height = { grow: 1 };

// ProgressBar at bottom
const pBar = new ProgressBar("Data Synchronization", progressValue);
pBar.height = { fixed: 1 };

content.add(monitorView, pBar);

// ─── Main Layout Splitter ───────────────────────────────────────────────────

const hSplit = new Splitter("horizontal", sidebar, content, {
  initialSplit: 34,
  minA: 30,
  minB: 20,
});

// ─── Bottom Status Bar ────────────────────────────────────────────────────────

const statusBar = new Box("status");
statusBar.height = { fixed: 1 };
statusBar.style.bg = defaultTheme.bg;
statusBar.onPaint = (buf, rect, theme) => {
  buf.fill(rect.x, rect.y, rect.width, 1, { char: " ", bg: theme.bg });
  const hint = " Tab: next focus / accept inline  │  Space/Enter: click/toggle  │  Arrows/j/k: list navigate  │  Escape: close dropdown  │  Ctrl+C: quit";
  for (let i = 0; i < hint.length && i < rect.width; i++) {
    buf.set(rect.x + i, rect.y, { char: hint[i], fg: theme.muted, bg: theme.bg });
  }
};

// ─── Assemble Root ────────────────────────────────────────────────────────────

const root = Box.col("root");
root.style.bg = defaultTheme.bg;
root.add(header, hSplit, statusBar);

// ─── Run Showcase App ─────────────────────────────────────────────────────────

const app = new App(root, { theme: defaultTheme, fps: 30, mouse: true });

// Sync progress bar state on each render frame
setInterval(() => {
  pBar.progress = progressValue;
}, 100);

await app.run();
