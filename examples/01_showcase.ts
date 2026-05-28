/**
 * 01_showcase.ts — tuix component showcase
 *
 * Uses the new layout defaults:
 *   • width  = { grow: 1 }  — every Box fills available width by default
 *   • height = { grow: 1 }  — every Box fills available height by default
 *   • height = {}           — hug: shrink-wrap to tallest child
 *   • overflow: "auto"      — scrollbars appear automatically when needed
 *
 * Because grow:1 is now the default, most explicit { grow: 1 } assignments
 * are removed.  Only fixed-size items, hugging containers, and non-default
 * grow ratios need explicit constraints.
 */

import {
  App,
  Box,
  Splitter,
  Button,
  Checkbox,
  TextInput,
  ListBox,
  Autocomplete,
  Tabs,
  RadioGroup,
  TextArea,
  Dropdown,
  ButtonGroup,
  ProgressBar,
  Dialog,
  Notification,
  FloatingWindow,

  Collapsible,
  CodeEditor,
  DiffViewer,
  SplitDiffViewer,
  computeDiff,
  computeSplitDiff,
  paintCenteredText,
  paintText,
  edgesAll,
  defaultTheme,
  vscodeDarkTheme,
  amberTheme,
  oneDarkTheme,
  solarizedDarkTheme,
  nordTheme,
  draculaTheme,
  catppuccinTheme,
} from "../src/mod.ts";
import type { ListBoxItem, Theme } from "../src/mod.ts";

// ─── State ────────────────────────────────────────────────────────────────────

let selectedFramework = "";
let selectedCommand = "";
let chkOptionA = false;
let chkOptionB = true;
let chkOptionC = false;
let selectedProfile = "Profile Alpha";
let selectedOption = "option_a";
let clickCount = 0;
let selectedTheme = "VS Code Dark";
let selectedAlign = "Left";

const themeMap: Record<string, Theme> = {
  "VS Code Dark": vscodeDarkTheme,
  "Amber": amberTheme,
  "One Dark": oneDarkTheme,
  "Solarized Dark": solarizedDarkTheme,
  "Nord": nordTheme,
  "Dracula": draculaTheme,
  "Catppuccin": catppuccinTheme,
};
let shortcutTarget = "";

const profiles: ListBoxItem[] = [
  "Profile Alpha",
  "Profile Beta",
  "Profile Gamma",
  "Profile Delta",
  { label: "Profile Locked", disabled: true },
];

// ─── Header ───────────────────────────────────────────────────────────────────

const header = Box.row("hdr");
header.height = { fixed: 3 };
header.style.bg = defaultTheme.toolbarBg;
header.style.align = "center";
header.style.padding = { top: 0, bottom: 0, left: 2, right: 1 };
header.style.gutter = 0;

const titleBox = new Box("title");
titleBox.onPaint = (buf, rect, theme) => {
  paintCenteredText(
    buf,
    rect,
    "✦  tuix Component Showcase  ✦",
    theme.toolbarText,
    null,
    true,
  );
};

const themeDropdown = new Dropdown(
  "Theme",
  ["VS Code Dark", "Amber", "One Dark", "Solarized Dark", "Nord", "Dracula", "Catppuccin"],
  0,
  (val) => {
    selectedTheme = val;
    const t = themeMap[val];
    if (t) {
      app.setTheme(t);
      header.style.bg = t.toolbarBg;
      titleBox.onPaint = (buf, rect, _theme) => {
        paintCenteredText(buf, rect, "✦  tuix Component Showcase  ✦", t.toolbarText, null, true);
      };
    }
  },
);
themeDropdown.width = { fixed: 22 };

header.add(titleBox, themeDropdown);

// ═══════════════════════════════════════════════════════════════════════════
// TAB: Layout — scroll demos
// ═══════════════════════════════════════════════════════════════════════════

const layoutTab = Box.col("Layout");
layoutTab.style.gutter = 1;
layoutTab.style.overflow = "scroll";
layoutTab.style.bg = defaultTheme.bg;

// ─── Row 1: fixed + grow layout demo ────────────────────────────────────────

function colorBox(
  lbl: string,
  color: { r: number; g: number; b: number },
  textColor: { r: number; g: number; b: number },
): Box {
  const b = new Box(lbl);
  b.style.bg = color;
  b.onPaint = (buf, rect) => paintCenteredText(buf, rect, lbl, textColor, null);
  return b;
}

const fixedGrowRow = Box.row("fixed-grow-row");
fixedGrowRow.style.border = "single";
fixedGrowRow.style.gutter = 1;
fixedGrowRow.style.padding = { top: 0, bottom: 0, left: 1, right: 1 };
fixedGrowRow.height = { fixed: 5 };

const fg1a = colorBox(
  "fixed 10",
  { r: 60, g: 60, b: 80 },
  { r: 200, g: 200, b: 220 },
);
fg1a.width = { fixed: 10 };
const fg1b = colorBox(
  "grow 1",
  { r: 70, g: 55, b: 50 },
  { r: 220, g: 200, b: 180 },
);
fg1b.width = { grow: 1 };
const fg1c = colorBox(
  "grow 2",
  { r: 50, g: 70, b: 60 },
  { r: 180, g: 220, b: 200 },
);
fg1c.width = { grow: 2 };
fixedGrowRow.add(fg1a, fg1b, fg1c);

const fixedGrowRow2 = Box.row("fixed-grow-row2");
fixedGrowRow2.style.border = "single";
fixedGrowRow2.style.gutter = 1;
fixedGrowRow2.style.padding = { top: 0, bottom: 0, left: 1, right: 1 };
fixedGrowRow2.height = { fixed: 5 };

const fg2a = colorBox(
  "grow 1",
  { r: 60, g: 70, b: 80 },
  { r: 200, g: 210, b: 230 },
);
fg2a.width = { grow: 1 };
const fg2b = colorBox(
  "fixed 12",
  { r: 70, g: 70, b: 60 },
  { r: 230, g: 230, b: 200 },
);
fg2b.width = { fixed: 12 };
const fg2c = colorBox(
  "grow 1",
  { r: 60, g: 60, b: 70 },
  { r: 210, g: 210, b: 230 },
);
fg2c.width = { grow: 1 };
fixedGrowRow2.add(fg2a, fg2b, fg2c);

// ─── Scroll demo: 3 sections (vertical · horizontal · both axes) ──────────────

const palette = [
  { r: 60, g: 60, b: 80 },
  { r: 70, g: 55, b: 50 },
  { r: 50, g: 70, b: 60 },
  { r: 65, g: 50, b: 75 },
  { r: 55, g: 65, b: 50 },
  { r: 75, g: 55, b: 60 },
  { r: 50, g: 60, b: 80 },
  { r: 70, g: 65, b: 50 },
  { r: 60, g: 50, b: 70 },
  { r: 55, g: 70, b: 65 },
  { r: 65, g: 60, b: 55 },
  { r: 50, g: 65, b: 75 },
  { r: 70, g: 55, b: 65 },
  { r: 60, g: 70, b: 55 },
  { r: 55, g: 55, b: 75 },
];

const scrollHint = new Box("scroll-hint");
scrollHint.height = { fixed: 1 };
scrollHint.onPaint = (buf, rect, theme) =>
  paintText(
    buf,
    rect,
    "  ↑/↓ vertical · ←/→ horizontal · Tab to focus · PageUp/Down fast scroll",
    0,
    theme.muted,
  );

// ── 1. Vertical scroll ────────────────────────────────────────────────────────

const vScrollLbl = new Box("vscroll-lbl");
vScrollLbl.height = { fixed: 1 };
vScrollLbl.onPaint = (buf, rect, theme) =>
  paintText(buf, rect, "  Vertical Scroll (overflow: scroll):", 0, theme.highlight);

const vScrollCol = Box.col("vscroll-col");
vScrollCol.style.border = "single";
vScrollCol.style.overflow = "scroll";
vScrollCol.style.gutter = 1;
vScrollCol.style.padding = edgesAll(1);

for (let i = 1; i <= 25; i++) {
  const item = colorBox(`Item ${i}`, palette[i % palette.length], {
    r: 200,
    g: 200,
    b: 220,
  });
  item.height = { fixed: 2 };
  if (i === 1 || i === 2) {
    item.focusable = true;
    item.tabIndex = 10 + i;
    const origBg = item.style.bg!;
    item.onPaint = (buf, rect, theme) => {
      if (item.focused) {
        for (let c = 0; c < rect.width; c++) {
          buf.set(rect.x + c, rect.y, {
            char: "▀",
            fg: theme.highlight,
            bg: origBg,
          });
          buf.set(rect.x + c, rect.y + rect.height - 1, {
            char: "▄",
            fg: theme.highlight,
            bg: origBg,
          });
        }
      }
      paintCenteredText(
        buf,
        rect,
        item.label,
        { r: 200, g: 200, b: 220 },
        null,
      );
    };
  }
  vScrollCol.add(item);
}

// ── 2. Horizontal scroll ──────────────────────────────────────────────────────

const hScrollLbl = new Box("hscroll-lbl");
hScrollLbl.height = { fixed: 1 };
hScrollLbl.onPaint = (buf, rect, theme) =>
  paintText(buf, rect, "  Horizontal Scroll (overflow: scroll):", 0, theme.highlight);

const hScrollContainer = Box.col("hscroll-container");
hScrollContainer.style.border = "single";
hScrollContainer.style.overflow = "scroll";
hScrollContainer.style.gutter = 1;
hScrollContainer.style.padding = { top: 0, bottom: 0, left: 1, right: 1 };

const hScrollInner = Box.row("hscroll-inner");
hScrollInner.height = { fixed: 4 };
hScrollInner.width = { min: 300 };
hScrollInner.style.gutter = 1;
hScrollInner.style.padding = edgesAll(1);

for (let i = 0; i < 20; i++) {
  const item = colorBox(`Item ${i}`, palette[i % palette.length], {
    r: 200,
    g: 200,
    b: 220,
  });
  item.width = { fixed: 12 };
  if (i === 0 || i === 1) {
    item.focusable = true;
    item.tabIndex = 30 + i;
    const origBg = item.style.bg!;
    item.onPaint = (buf, rect, theme) => {
      if (item.focused) {
        for (let c = 0; c < rect.width; c++) {
          buf.set(rect.x + c, rect.y, {
            char: "▀",
            fg: theme.highlight,
            bg: origBg,
          });
          buf.set(rect.x + c, rect.y + rect.height - 1, {
            char: "▄",
            fg: theme.highlight,
            bg: origBg,
          });
        }
      }
      paintCenteredText(
        buf,
        rect,
        item.label,
        { r: 200, g: 200, b: 220 },
        null,
      );
    };
  }
  hScrollInner.add(item);
}
hScrollContainer.add(hScrollInner);

// ── 3. Both axes scroll ───────────────────────────────────────────────────────

const bothLbl = new Box("both-lbl");
bothLbl.height = { fixed: 1 };
bothLbl.onPaint = (buf, rect, theme) =>
  paintText(buf, rect, "  Both Axes (overflow: scroll):", 0, theme.highlight);

const bothScroll = Box.col("both-scroll");
bothScroll.style.border = "single";
bothScroll.style.overflow = "scroll";
bothScroll.style.gutter = 1;
bothScroll.style.padding = edgesAll(1);

for (let r = 0; r < 12; r++) {
  const row = Box.row(`both-row-${r}`);
  row.height = { fixed: 2 };
  row.style.gutter = 1;
  row.width = { min: 200 };
  for (let c = 0; c < 12; c++) {
    const item = colorBox(
      `R${r}C${c}`,
      palette[(r * 3 + c) % palette.length],
      { r: 200, g: 200, b: 220 },
    );
    item.width = { fixed: 10 };
    row.add(item);
  }
  bothScroll.add(row);
}

const scrollRow = Box.row("scroll-row");
scrollRow.style.gutter = 2;

const vScrollSection = Box.col("vscroll-section");
vScrollSection.add(vScrollLbl, vScrollCol);

const hScrollSection = Box.col("hscroll-section");
hScrollSection.add(hScrollLbl, hScrollContainer);

const bothSection = Box.col("both-section");
bothSection.add(bothLbl, bothScroll);

scrollRow.add(vScrollSection, hScrollSection, bothSection);

layoutTab.add(fixedGrowRow, fixedGrowRow2, scrollHint, scrollRow);

// ═══════════════════════════════════════════════════════════════════════════
// TAB: Resizable — splitter panels
// ═══════════════════════════════════════════════════════════════════════════

function makeResizePanel(
  panelLabel: string,
  body: string[],
  tabIdx: number,
): Box {
  const container = new Box(panelLabel);
  container.style.border = "single";
  container.style.bg = defaultTheme.panelBg;
  container.focusable = true;
  container.tabIndex = tabIdx;
  // width/height default to grow:1 — fills splitter allocation

  const inner = Box.col(`${panelLabel}-inner`);
  inner.style.overflow = "auto";
  inner.style.gutter = 0;
  inner.style.padding = { top: 1, bottom: 1, left: 1, right: 1 };

  // Compute the longest line in the panel so we can set minimum widths
  // that trigger horizontal scroll when the panel is too narrow.
  const maxLineLen = Math.max(...body.map((l) => l.length), 0);

  const titleLine = new Box();
  titleLine.height = { fixed: 1 };
  titleLine.width = { min: Math.max(maxLineLen, panelLabel.trim().length + 2) };
  titleLine.onPaint = (buf, rect, theme) => {
    const tc = container.focused ? theme.highlight : theme.muted;
    paintText(buf, rect, ` ${panelLabel.trim()} `, 0, tc, container.focused);
  };
  inner.add(titleLine);

  for (const line of body) {
    const lb = new Box();
    lb.height = { fixed: 1 };
    lb.width = { min: line.length };
    lb.onPaint = (buf, rect, theme) =>
      paintText(buf, rect, line, 0, theme.text);
    inner.add(lb);
  }

  const infoLine = new Box();
  infoLine.height = { fixed: 1 };
  infoLine.width = { min: Math.max(maxLineLen, 22) };
  infoLine.onPaint = (buf, rect, theme) => {
    paintText(
      buf,
      rect,
      ` rect: ${container.rect.width}x${container.rect.height}`,
      0,
      theme.muted,
    );
  };
  inner.add(infoLine);
  container.add(inner);
  return container;
}

const fileExplorerLines = [
  "  src/",
  "    mod.ts",
  "    layout.ts",
  "    theme.ts",
  "    events.ts",
  "    focus.ts",
  "    splitter.ts",
  "    app.ts",
  "    terminal.ts",
  "  examples/",
  "    01_showcase.ts",
  "  docs/",
  "    PRD.md",
  "    DESIGN.md",
  "  deno.json",
  "  deno.lock",
  "  README.md",
];
const editorLines = [
  "  // Resizable panel demo",
  "  // Drag the ◈ handle",
  "  // to resize panels",
  "",
  "  const splitter = new",
  "    Splitter('horizontal',",
  "      panelA, panelB,",
  "      { initialSplit: 30 }",
  "    );",
  "",
  "  // Splitter supports:",
  "  //   - mouse drag resize",
  "  //   - keyboard nudge",
  "  //   - min/max constraints",
];
const termLines = [
  "  $ deno run 01_showcase.ts",
  "  tuix v0.2.0 - resizable panels",
  "  ✓ Layout engine initialized",
  "  ✓ Focus manager ready",
  "  ✓ Renderer started (30 fps)",
  "  ✓ Mouse enabled",
  "",
  "  Tab between panels to focus",
  "  Drag the ◈ handle to resize",
];

const rTopLeft = makeResizePanel("  File Explorer", fileExplorerLines, 1);
const rTopRight = makeResizePanel("  Editor", editorLines, 2);
const rBottom = makeResizePanel("  Terminal Output", termLines, 3);

const rHSplit = new Splitter("horizontal", rTopLeft, rTopRight, {
  initialSplit: "30%",
  minA: "10%",
  minB: "10%",
});
const rVSplit = new Splitter("vertical", rHSplit, rBottom, {
  initialSplit: "35%",
  minA: "15%",
  minB: "10%",
});

const resizableContent = Box.col("resize-content");
resizableContent.style.bg = defaultTheme.bg;
resizableContent.add(rVSplit);

// ═══════════════════════════════════════════════════════════════════════════
// TAB: Shortcuts
// ═══════════════════════════════════════════════════════════════════════════

const shortcutTab = Box.col("Shortcuts");
shortcutTab.style.gutter = 1;
shortcutTab.style.bg = defaultTheme.bg;

function makeZone(zoneLabel: string, key: string, tabIdx: number): Box {
  const z = new Box(zoneLabel);
  z.style.border = "single";
  z.focusable = true;
  z.tabIndex = tabIdx;
  z.shortcut = key;
  // width defaults to grow:1
  z.onPaint = (buf, rect, theme) =>
    paintCenteredText(
      buf,
      rect,
      `${zoneLabel}  [key: ${key}]`,
      theme.highlight,
      theme.panelBg,
    );
  return z;
}

const zone1 = makeZone("Zone 1", "1", 1);
const zone2 = makeZone("Zone 2", "2", 2);
const zone3 = makeZone("Zone 3", "3", 3);

const zonesRow = Box.row("zones");
// height defaults to grow:1
zonesRow.style.gutter = 2;
zonesRow.style.padding = edgesAll(1);
zonesRow.add(zone1, zone2, zone3);

const shortcutStatus = new Box("shortcut-status");
shortcutStatus.height = { fixed: 3 };
shortcutStatus.style.border = "single";
shortcutStatus.style.bg = defaultTheme.bg;
shortcutStatus.onPaint = (_buf, rect, theme) => {
  const text = shortcutTarget
    ? `  Last jump: ${shortcutTarget}`
    : "  Press 1, 2, or 3 to jump to a zone";
  paintCenteredText(_buf, rect, text, theme.text, theme.bg);
};
shortcutTab.add(zonesRow, shortcutStatus);

function onShortcutJump(box: Box): void {
  shortcutTarget = box.label;
}
const appShortcuts = new Map<string, Box>();
const reg = (k: string, b: Box) => appShortcuts.set(k, b);
reg("1", zone1);
reg("2", zone2);
reg("3", zone3);

// ═══════════════════════════════════════════════════════════════════════════
// TAB: Text — input widgets
// ═══════════════════════════════════════════════════════════════════════════

const textTab = Box.col("Text Input");
textTab.style.gutter = 1;
textTab.style.bg = defaultTheme.bg;
// Wrap in a scrollable column so contents don't get clipped
const textScroll = Box.col("text-scroll");
textScroll.style.overflow = "auto";
textScroll.style.gutter = 1;
textScroll.style.padding = { top: 0, bottom: 0, left: 1, right: 1 };
textScroll.style.border = "single";
// height defaults to grow:1

function lbl(text: string): Box {
  const b = new Box();
  b.height = { fixed: 1 };
  b.onPaint = (_buf, rect, theme) =>
    paintText(_buf, rect, text, 0, theme.highlight);
  return b;
}

const textInput = new TextInput("Type anything...");
const autoDropdown = new Autocomplete(
  "Search framework...",
  [
    "React",
    "Vue",
    "Angular",
    "Svelte",
    "Solid",
    "Deno",
    "Node.js",
    "Express",
    "Next.js",
    "Nuxt",
    "Remix",
    "Astro",
  ],
  (item) => {
    selectedFramework = item;
  },
);
autoDropdown.maxVisibleItems = 5;

const autoInline = new Autocomplete(
  "Type a command...",
  [
    "deploy",
    "deploy:prod",
    "deploy:staging",
    "build",
    "build:watch",
    "test",
    "test:watch",
    "lint",
    "lint:fix",
    "clean",
    "format",
    "typecheck",
  ],
  (item) => {
    selectedCommand = item;
  },
);
autoInline.mode = "inline";  const textArea = new TextArea("Type multi-line here...", "", undefined, 5);
  // Customize textarea scrollbar with arrows and different characters
  textArea.style.scrollbar = {
    showArrows: true,
    verticalTrack: "║",
    verticalThumb: "█",
    arrowUp: "▲",
    arrowDown: "▼",
  };

const longTextInput = new TextInput(
  "",
  "A very long text that overflows the input field width — use ArrowLeft/Right or Home/End to scroll through the content. The overflow shows ... at the start/end when text doesn't fit.",
);
const pasteThreshTextArea = new TextArea(
  "Paste >50 chars via terminal Ctrl+Shift+V to see marker...",
  "",
  undefined,
  3,
  false,
  false,
  "Copied!",
  50,
);

const copyInput = new TextInput("", "Select text with mouse — auto-copies to clipboard");
const pasteInput = new TextInput("Right-click here to paste from clipboard");

const copyOnSelectInput = new TextInput("", "Select me — auto-copies ✓", undefined, true, true, "✧ Copied!");

const cpHint = new Box("cp-hint");
cpHint.height = { fixed: 3 };
cpHint.onPaint = (_buf, rect, theme) => {
  paintText(
    _buf,
    rect,
    "  Select text → auto-copies · Right-click paste · Backspace/Delete deletes selection",
    0,
    theme.muted,
  );
  paintText(
    _buf,
    rect,
    "  Double-click to select a word · Triple-click to select the line · Arrow keys scroll overflow",
    1,
    theme.muted,
  );
  paintText(
    _buf,
    rect,
    "  Paste threshold — fast paste (Ctrl+Shift+V or right-click) > threshold inserts bold marker, edit/delete.",
    2,
    theme.muted,
  );
};

const textStatus = new Box("text-status");
textStatus.height = { fixed: 1 };
textStatus.onPaint = (_buf, rect, theme) => {
  const parts: string[] = [];
  if (textInput.value) parts.push(`Input: "${textInput.value}"`);
  if (selectedFramework) parts.push(`Framework: ${selectedFramework}`);
  if (selectedCommand) parts.push(`Command: ${selectedCommand}`);
  const text =
    parts.length > 0
      ? `  ${parts.join("  |  ")}`
      : "  Start typing to see results here";
  paintText(_buf, rect, text, 0, theme.muted);
};

textScroll.add(
  lbl("TextInput (overflow scrolls with ...):"),
  longTextInput,
  lbl("TextInput (standard):"),
  textInput,
  lbl("Autocomplete (dropdown mode):"),
  autoDropdown,
  lbl("Autocomplete (inline mode, Tab to complete):"),
  autoInline,
  lbl("TextArea (multi-line):"),
  textArea,
  lbl("TextArea (burstThreshold=50 — paste >50 chars creates shaded paste markers):"),
  pasteThreshTextArea,
  cpHint,
  lbl("Copy/Paste — select text with mouse (auto-copied) from here:"),
  copyInput,
  lbl("Then paste (right-click) here:"),
  pasteInput,
  lbl("Copy-on-select (TextInput with notifyOnCopy=true):"),
  copyOnSelectInput,
  textStatus,
);
textTab.add(textScroll);

// ═══════════════════════════════════════════════════════════════════════════
// TAB: Code — syntax-highlighted editor
// ═══════════════════════════════════════════════════════════════════════════

const codeTab = Box.col("Code");
codeTab.style.gutter = 1;
codeTab.style.bg = defaultTheme.bg;

// ─── CodeEditor (syntax highlighting) ───────────────────────────

const codeHeader = new Box("code-header");
codeHeader.height = { fixed: 1 };
codeHeader.onPaint = (buf, rect, theme) =>
  paintCenteredText(
    buf,
    rect,
    "Syntax-highlighted Code Editor (TypeScript) — keywords · strings · comments · numbers · types",
    theme.muted,
    theme.bg,
  );

const demoCode = `import { App, Box, Button } from "../src/mod.ts";
import { Theme } from "./theme.ts";

/**
 * Demonstrates a simple counter app.
 * This is a sample to show syntax highlighting
 * with keywords, strings, numbers, and comments.
 */

// ─── State ─────────────────────────────────────────────────────

let count: number = 0;
const MAX_COUNT = 100;

const root = Box.col("app");
root.style.bg = { r: 30, g: 30, b: 46 };
const label = new Box();

label.height = { fixed: 1 };
label.style.align = "center";
label.onPaint = (buf, rect, theme) => {
  const text = \`Count: \${count} / \${MAX_COUNT}\`;
  paintCenteredText(buf, rect, text, theme.highlight, null, true);
};

const btnRow = Box.row("btns");
btnRow.height = { fixed: 3 };
btnRow.style.gutter = 2;
btnRow.style.justify = "center";

const decBtn = new Button("-1", () => {
  if (count > 0) {
    count--;
  }
});

const incBtn = new Button("+1", () => {
  if (count < MAX_COUNT) {
    count++;
  }
});

const resetBtn = new Button("Reset", () => {
  count = 0;
});

btnRow.add(decBtn, incBtn, resetBtn);
root.add(label, btnRow);

// Launch the app
const app = new App(root, {
  fps: 30,
  mouse: true,
  theme: defaultTheme,
});

await app.run();
`;

const originalCode = demoCode; // baseline for real-time diffing

const diffViewer = new DiffViewer(
  "",
  undefined,
  16,
);

const splitDiffViewer = new SplitDiffViewer();

const codeEditor = new CodeEditor(
  "Type some code...",
  demoCode,
  (val: string) => {
    const d = computeDiff(originalCode, val);
    diffViewer.setDiffContent(d);
    splitDiffViewer.setDiffContent(originalCode, val);
  },
  "typescript",
);

// ─── DiffViewer (unified diff view) ─────────────────────────────

const unifiedHeader = new Box("unified-header");
unifiedHeader.height = { fixed: 1 };
unifiedHeader.onPaint = (buf, rect, theme) =>
  paintCenteredText(
    buf,
    rect,
    "Unified Diff (green: + · red: -)",
    theme.muted,
    theme.bg,
  );

// ─── SplitDiffViewer (side-by-side diff view) ───────────────────

const splitHeader = new Box("split-header");
splitHeader.height = { fixed: 1 };
splitHeader.onPaint = (buf, rect, theme) =>
  paintCenteredText(
    buf,
    rect,
    "Split Diff (original │ current)",
    theme.muted,
    theme.bg,
  );

// ─── Diff mode selector ────────────────────────────────────────────────
let diffMode: "both" | "unified" | "split" = "both";

const diffContent = Box.col("diff-content");
diffContent.style.gutter = 1;

function rebuildDiffContent() {
  // Clear children (orphan them safely; add() resets parent)
  for (const c of diffContent.children) c.parent = null;
  diffContent.children = [];

  if (diffMode === "both" || diffMode === "unified") {
    diffContent.add(unifiedPane);
  }
  if (diffMode === "both" || diffMode === "split") {
    diffContent.add(splitPane);
  }
}

const diffModeGroup = new ButtonGroup(
  "Diff:",
  ["Both", "Unified", "Split"],
  0,
  (val) => {
    diffMode = val.toLowerCase() as typeof diffMode;
    rebuildDiffContent();
  },
);

const diffModeRow = Box.row("diff-mode-row");
diffModeRow.style.padding = { top: 0, bottom: 0, left: 0, right: 0 };
diffModeRow.style.gutter = 2;
diffModeRow.height = { fixed: 3 };
diffModeRow.add(diffModeGroup);

// ─── Layout: Code Editor (left) | Diff views stacked (right) ───────────
const codeRow = Box.row("code-row");
codeRow.style.gutter = 2;
codeRow.style.padding = { top: 0, bottom: 0, left: 1, right: 1 };

const codePane = Box.col("code-pane");
codePane.style.gutter = 1;
codePane.add(codeHeader, codeEditor);

const diffStack = Box.col("diff-stack");
diffStack.style.gutter = 1;

const unifiedPane = Box.col("unified-pane");
unifiedPane.style.gutter = 1;
unifiedPane.add(unifiedHeader, diffViewer);

const splitPane = Box.col("split-pane");
splitPane.style.gutter = 1;
splitPane.add(splitHeader, splitDiffViewer);

// Initial build: show both
diffStack.add(diffModeRow, diffContent);
rebuildDiffContent();

codeRow.add(codePane, diffStack);
codeTab.add(codeRow);

// ═══════════════════════════════════════════════════════════════════════════
// TAB: UI Controls
// ═══════════════════════════════════════════════════════════════════════════

const uiTab = Box.col("UI Controls");
uiTab.style.gutter = 1;
uiTab.style.bg = defaultTheme.bg;

const uiHeader = new Box("ui-header");
uiHeader.height = { fixed: 1 };
uiHeader.onPaint = (_buf, rect, theme) =>
  paintCenteredText(
    _buf,
    rect,
    "Checkboxes | Radio | ListBox — Actions — ButtonGroup — Sort",
    theme.muted,
    theme.bg,
  );

const chk1 = new Checkbox("Enable Feature A", chkOptionA, (v) => {
  chkOptionA = v;
});
const chk2 = new Checkbox("Enable Feature B", chkOptionB, (v) => {
  chkOptionB = v;
});
const chk3 = new Checkbox("Enable Feature C", chkOptionC, (v) => {
  chkOptionC = v;
});
const chkDisabled = new Checkbox("Disabled Option", false);
chkDisabled.setDisabled(true);

const profileList = new ListBox(profiles, (item) => {
  selectedProfile = item;
});
profileList.selectedIndex = 0;
profileList.height = { fixed: 8 };

const radioGroup = new RadioGroup(
  "options",
  [
    { label: "Option Alpha", value: "option_a" },
    { label: "Option Beta", value: "option_b" },
    { label: "Option Gamma", value: "option_c" },
    { label: "Option Locked", value: "option_locked", disabled: true },
  ],
  selectedOption,
  (val) => {
    selectedOption = val;
  },
);

const btnRow = Box.row("actions");
btnRow.style.gutter = 1;
btnRow.height = { fixed: 3 };
const btnReset = new Button("Reset All", () => {
  chkOptionA = false;
  chkOptionB = false;
  chkOptionC = false;
  selectedOption = "option_a";
  radioGroup.select("option_a");
  selectedProfile = "Profile Alpha";
  profileList.selectedIndex = 0;
});
const btnToggle = new Button("Toggle Checkboxes", () => {
  chkOptionA = !chkOptionA;
  chkOptionB = !chkOptionB;
  chkOptionC = !chkOptionC;
  btnToggle.toggle();
});
btnToggle.flashOnClick = false;
const btnCount = new Button("Click Count", () => {
  clickCount++;
});
const btnDisabled = new Button("Locked");
btnDisabled.setDisabled(true);
btnRow.add(btnReset, btnToggle, btnCount, btnDisabled);

const sbtnReset = Button.small("Reset", () => {
  clickCount = 0;
});
const sbtnFlash = Button.small("Flash Me");
const sbtnLocked = Button.small("Locked");
sbtnLocked.setDisabled(true);
const smallBtns = Box.row("small-btns");
smallBtns.style.gutter = 1;
smallBtns.height = { fixed: 1 };
smallBtns.add(sbtnReset, sbtnFlash, sbtnLocked);

const alignGroup = new ButtonGroup(
  "Align",
  ["Left", "Center", "Right", "Justify"],
  0,
  (val) => {
    selectedAlign = val;
  },
);

let selectedSort = "Name";
const sortDropdown = new Dropdown(
  "Sort By",
  ["Name", "Date", "Size", "Type"],
  0,
  (val) => {
    selectedSort = val;
  },
);

const uiStatus = new Box("ui-status");
uiStatus.height = { fixed: 3 };
uiStatus.style.bg = defaultTheme.bg;
uiStatus.onPaint = (_buf, rect, theme) => {
  const parts = [
    `A:${chkOptionA ? "Y" : "N"}`,
    `B:${chkOptionB ? "Y" : "N"}`,
    `C:${chkOptionC ? "Y" : "N"}`,
    `Radio: ${selectedOption.replace("option_", "")}`,
    `Profile: ${selectedProfile}`,
    `Clicks: ${clickCount}`,
    `Align: ${selectedAlign}`,
    `Sort: ${selectedSort}`,
  ];
  paintText(_buf, rect, `  ${parts.join("  |  ")}`, 0, theme.muted);
};

// Three-column top row — each column defaults to grow:1
const chkCol = Box.col("chk-col");
chkCol.style.gutter = 1;
chkCol.add(lbl("Checkboxes:"), chk1, chk2, chk3, chkDisabled);

const radioCol = Box.col("radio-col");
radioCol.style.gutter = 1;
radioCol.add(lbl("RadioGroup:"), radioGroup);

const listCol = Box.col("list-col");
listCol.style.gutter = 1;
listCol.add(lbl("Profiles ListBox:"), profileList);

const topRow = Box.row("top-row");
topRow.style.gutter = 2;
topRow.height = {}; // hug — shrink-wrap to tallest child
// When there's not enough height, the row will hug to its tallest column
// content instead of collapsing to 0.
topRow.add(chkCol, radioCol, listCol);

// Fixed-height control rows (hug height via fixed)
const actionsRow = Box.col("actions-row");
actionsRow.style.gutter = 1;
actionsRow.height = { fixed: 5 };
actionsRow.add(lbl("Actions:"), btnRow);

const groupRow = Box.col("group-row");
groupRow.style.gutter = 1;
groupRow.height = { fixed: 5 };
groupRow.add(lbl("ButtonGroup (Align):"), alignGroup);

const smallBtnRow = Box.col("small-btn-row");
smallBtnRow.style.gutter = 1;
smallBtnRow.height = { fixed: 3 };
smallBtnRow.add(lbl("SmallButtons:"), smallBtns);

const sDefault = Button.withStyle("default", "Default");
const sSmall = Button.withStyle("small", "Small");
const sLarge = Button.withStyle("large", "Large");
const sGhost = Button.withStyle("ghost", "Ghost");
const sOutline = Button.withStyle("outline", "Outline");
const sToggle = Button.withStyle("default", "Toggle me");
sToggle.toggleOnClick = true;
sToggle.flashOnClick = false;
sToggle.onToggle = (v) => {
  sToggle.label = v ? "Toggled ✓" : "Toggle me";
};
const styleBtns = Box.row("style-btns");
styleBtns.style.gutter = 1;
styleBtns.style.align = "center";
styleBtns.add(sDefault, sSmall, sLarge, sGhost, sOutline, sToggle);
const styleDemoRow = Box.col("style-demo-row");
styleDemoRow.style.gutter = 1;
styleDemoRow.height = { fixed: 7 };
styleDemoRow.add(lbl("Button Styles:"), styleBtns);

const dropdownRow = Box.col("dropdown-row");
dropdownRow.style.gutter = 1;
dropdownRow.height = { fixed: 5 };
dropdownRow.add(lbl("Sort By Dropdown:"), sortDropdown);

// Scrollable container for UI controls
const uiScroll = Box.col("ui-scroll");
uiScroll.style.border = "single";
uiScroll.style.gutter = 1;
uiScroll.style.padding = { top: 0, bottom: 0, left: 1, right: 1 };
// height defaults to grow:1
// ─── Collapsible demo ────────────────────────────────────────────────────
const collapsibleDemo = new Collapsible("Advanced Options", true, (_collapsed) => {
  // state change handled internally
});

const extraChk1 = new Checkbox("Verbose Logging", false);
const extraChk2 = new Checkbox("Auto-save", true);
const extraChk3 = new Checkbox("Dark Mode", true);
collapsibleDemo.add(extraChk1, extraChk2, extraChk3);

uiScroll.add(topRow, actionsRow, groupRow, smallBtnRow, styleDemoRow, dropdownRow, collapsibleDemo);

uiTab.add(uiHeader, uiScroll, uiStatus);

// ═══════════════════════════════════════════════════════════════════════════
// TAB: Animation
// ═══════════════════════════════════════════════════════════════════════════

let animEnabled = true;
const SPINNER_SETS = [
  ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
  ["─", "╲", "│", "╱"],
  ["←", "↖", "↑", "↗", "→", "↘", "↓", "↙"],
  ["⣀", "⣄", "⣤", "⣦", "⣶", "⣷", "⣿", "⣾", "⣴"],
];
let spinnerTicks = [0, 0, 0, 0];
let cpuVal = 0.67,
  memVal = 0.45,
  dskVal = 0.92,
  netVal = 0.18;
let countdownSec = 300;

class SpinnerBox extends Box {
  private _frames: string[];
  private _idx: number;
  constructor(spinLabel: string, frames: string[], idx: number) {
    super(spinLabel);
    this._frames = frames;
    this._idx = idx;
    this.height = { fixed: 1 };
    this.onPaint = (buf, rect, theme) => {
      const ch = this._frames[spinnerTicks[this._idx] % this._frames.length];
      const text = ` ${ch}  ${spinLabel}`;
      for (let i = 0; i < text.length && i < rect.width; i++)
        buf.set(rect.x + i, rect.y, {
          char: text[i],
          fg: theme.highlight,
          bg: defaultTheme.panelBg,
        });
    };
  }
}

function makeMetricBar(
  metricLabel: string,
  color: { r: number; g: number; b: number },
  getVal: () => number,
): Box {
  const row = Box.row(`${metricLabel}-row`);
  row.height = { fixed: 1 };
  row.style.gutter = 1;
  const ml = new Box(`${metricLabel}-lbl`);
  ml.width = { fixed: 5 };
  ml.onPaint = (buf, rect) =>
    paintText(buf, rect, ` ${metricLabel} `, 0, defaultTheme.text);
  const bar = new Box(`${metricLabel}-bar`);
  // width defaults to grow:1
  bar.onPaint = (buf, rect, theme) => {
    const val = getVal();
    const filled = Math.floor(val * rect.width);
    for (let i = 0; i < rect.width; i++)
      buf.set(rect.x + i, rect.y, {
        char: i < filled ? "█" : "░",
        fg: i < filled ? color : theme.muted,
        bg: defaultTheme.panelBg,
      });
  };
  const pct = new Box(`${metricLabel}-pct`);
  pct.width = { fixed: 5 };
  pct.onPaint = (buf, rect, theme) =>
    paintText(
      buf,
      rect,
      `${(getVal() * 100).toFixed(0).padStart(3)}%`,
      0,
      theme.highlight,
      true,
    );
  row.add(ml, bar, pct);
  return row;
}

const animLabel = new Box("anim-label");
animLabel.height = { fixed: 1 };
animLabel.onPaint = (_buf, rect, theme) =>
  paintCenteredText(
    _buf,
    rect,
    "  Animation Dashboard — spinners · metrics · progress · countdown",
    theme.muted,
    theme.bg,
  );

// ─── Left column ──────────────────────────────────────────────────────────────

const spinnerBox = Box.col("spinner-col");
spinnerBox.style.border = "single";
spinnerBox.style.gutter = 1;
spinnerBox.style.padding = edgesAll(1);
// height defaults to grow:1

const spinnerHdr = new Box("spinner-hdr");
spinnerHdr.height = { fixed: 1 };
spinnerHdr.onPaint = (buf, rect, theme) =>
  paintText(buf, rect, " Spinners", 0, theme.muted);

const spinnerRow2 = Box.row("spinner-row");
spinnerRow2.height = { fixed: 1 };
spinnerRow2.style.gutter = 3;
spinnerRow2.add(
  new SpinnerBox("Loading", SPINNER_SETS[0], 0),
  new SpinnerBox("Processing", SPINNER_SETS[1], 1),
  new SpinnerBox("Syncing", SPINNER_SETS[2], 2),
  new SpinnerBox("Saving", SPINNER_SETS[3], 3),
);
spinnerBox.add(spinnerHdr, spinnerRow2);

// Countdown
const CD_DIGITS: Record<string, string[]> = {
  "0": ["███", "█ █", "█ █", "█ █", "███"],
  "1": ["  █", "  █", "  █", "  █", "  █"],
  "2": ["███", "  █", "███", "█  ", "███"],
  "3": ["███", "  █", "███", "  █", "███"],
  "4": ["█ █", "█ █", "███", "  █", "  █"],
  "5": ["███", "█  ", "███", "  █", "███"],
  "6": ["███", "█  ", "███", "█ █", "███"],
  "7": ["███", "  █", "  █", "  █", "  █"],
  "8": ["███", "█ █", "███", "█ █", "███"],
  "9": ["███", "█ █", "███", "  █", "███"],
  ":": ["   ", " █ ", "   ", " █ ", "   "],
};

const countdownBox = Box.col("countdown-col");
countdownBox.style.border = "single";
countdownBox.style.padding = edgesAll(1);
// height defaults to grow:1

const cdHeader = new Box("cd-hdr");
cdHeader.height = { fixed: 1 };
cdHeader.onPaint = (buf, rect, theme) =>
  paintText(buf, rect, " Countdown", 0, theme.muted);

const cdDisplay = new Box("cd-display");
cdDisplay.height = { fixed: 5 }; // digits render 5 rows tall
cdDisplay.onPaint = (buf, rect, theme) => {
  const m = Math.floor(countdownSec / 60);
  const s = countdownSec % 60;
  const timeStr = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  const totalW = timeStr.length * 4 - 1;
  if (timeStr === "00:00") {
    paintCenteredText(
      buf,
      rect,
      "  🎉 TIME'S UP! 🎉  ",
      theme.highlight,
      null,
      true,
    );
    return;
  }
  const low = countdownSec < 30;
  const flash = low && Math.floor(Date.now() / 500) % 2 === 0;
  const color = flash
    ? { r: 255, g: 40, b: 40 }
    : low
      ? { r: 255, g: 180, b: 40 }
      : theme.highlight;
  const startY = rect.y + Math.floor((rect.height - 5) / 2);
  const startX = rect.x + Math.floor((rect.width - totalW) / 2);
  for (let di = 0; di < timeStr.length; di++) {
    const pattern = CD_DIGITS[timeStr[di]] ?? CD_DIGITS["8"];
    const cx = startX + di * 4;
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 3; col++) {
        const px = cx + col,
          py = startY + row;
        if (
          px >= rect.x &&
          px < rect.x + rect.width &&
          py >= rect.y &&
          py < rect.y + rect.height
        ) {
          const ch = pattern[row][col];
          buf.set(px, py, {
            char: ch === " " ? " " : "█",
            fg: ch !== " " ? color : theme.panelBg,
            bg: theme.panelBg,
            bold: true,
          });
        }
      }
    }
  }
};
countdownBox.add(cdHeader, cdDisplay);

// ─── Right column ─────────────────────────────────────────────────────────────

const progressBar = new ProgressBar("Task Progress", 0.35);

const metricsBox = Box.col("metrics-col");
metricsBox.style.border = "single";
metricsBox.style.gutter = 1;
metricsBox.style.padding = edgesAll(1);
// height defaults to grow:1

const metricsHdr = new Box("metrics-hdr");
metricsHdr.height = { fixed: 1 };
metricsHdr.onPaint = (buf, rect, theme) =>
  paintText(buf, rect, " System Metrics", 0, theme.muted);
metricsBox.add(
  metricsHdr,
  makeMetricBar("CPU", { r: 100, g: 180, b: 255 }, () => cpuVal),
  makeMetricBar("MEM", { r: 100, g: 220, b: 140 }, () => memVal),
  makeMetricBar("DSK", { r: 255, g: 200, b: 100 }, () => dskVal),
  makeMetricBar("NET", { r: 255, g: 130, b: 130 }, () => netVal),
  progressBar,
);

// Content row — each column defaults to grow:1
const contentRow = Box.row("anim-content");
contentRow.style.gutter = 2;
contentRow.height = {}; // hug — shrink-wrap to tallest column

const leftCol = Box.col("anim-left");
leftCol.style.gutter = 1;
leftCol.add(spinnerBox, countdownBox);

const rightCol = Box.col("anim-right");
rightCol.style.gutter = 1;
rightCol.add(metricsBox);

contentRow.add(leftCol, rightCol);

const animBtnRow = Box.row("anim-btns");
animBtnRow.height = { fixed: 3 };
animBtnRow.style.gutter = 2;
const autoAnimBtn = new Button("Auto-Animate (toggle)", () => {
  animEnabled = !animEnabled;
});
autoAnimBtn.flashOnClick = false;
const resetAnimBtn = new Button("Reset All", () => {
  cpuVal = 0.67;
  memVal = 0.45;
  dskVal = 0.92;
  netVal = 0.18;
  countdownSec = 300;
});
const jumpBtn = new Button("Jump :30", () => {
  countdownSec = Math.max(0, countdownSec - 30);
});
animBtnRow.add(autoAnimBtn, resetAnimBtn, jumpBtn);

const animTab = Box.col("Animation");
animTab.style.gutter = 1;
animTab.style.bg = defaultTheme.bg;
animTab.add(animLabel, contentRow, animBtnRow);

// ═══════════════════════════════════════════════════════════════════════════
// TAB: Floating
// ═══════════════════════════════════════════════════════════════════════════

const floatTab = Box.col("Floating");
floatTab.style.gutter = 1;
floatTab.style.bg = defaultTheme.bg;

let notifCount = 0;

const floatLabel = new Box("float-label");
floatLabel.height = { fixed: 1 };
floatLabel.onPaint = (_buf, rect, theme) =>
  paintCenteredText(
    _buf,
    rect,
    "  Floating Widgets — Dialogs · Notifications · Draggable Window  ",
    theme.muted,
    theme.bg,
  );

const floatCtl = Box.col("float-ctl");
floatCtl.style.border = "single";
floatCtl.style.gutter = 1;
floatCtl.style.padding = edgesAll(1);
// height defaults to grow:1

const ctlLabel = new Box();
ctlLabel.height = { fixed: 1 };
ctlLabel.onPaint = (buf, rect, theme) =>
  paintText(
    buf,
    rect,
    " Show overlay widgets (click or press Enter on buttons):",
    0,
    theme.muted,
  );

const ctlRow = Box.row("ctl-row");
ctlRow.style.gutter = 2;
ctlRow.style.justify = "center";
ctlRow.height = { fixed: 3 };

const btnDialog = new Button("  Open Dialog  ", () => {
  const dialog = new Dialog(
    " Confirm Action ",
    [
      "This is a modal dialog demonstration.",
      "",
      "It has a title in the double border, body",
      "text, and action buttons below.",
      "",
      "Press Tab to cycle buttons, Enter to",
      "activate, or Escape to dismiss.",
    ],
    [
      { label: "Cancel", action: () => {} },
      { label: "Confirm", action: () => {}, default: true },
    ],
  );
  dialog.appRef = app;
  app.showOverlay(dialog, {
    modal: true,
    onClose: () => {
      notifCount++;
      const notif = new Notification("Dialog dismissed", "success", 2500);
      app.showOverlay(notif, { modal: false });
      notif.removeFn = () => app.removeOverlay(notif);
      notif.show();
    },
  });
});

const btnNotif = new Button("  Send Notification  ", () => {
  notifCount++;
  const types = ["info", "success", "warn", "error"] as const;
  const msgs = [
    "Build completed successfully",
    "Server running on port 8080",
    "Low disk space warning",
    "Connection lost to database",
  ];
  const positions: Array<
    "top-right" | "top-left" | "bottom-right" | "bottom-left"
  > = ["bottom-right", "bottom-left", "top-right", "top-left"];
  const t = types[notifCount % types.length];
  const m = msgs[notifCount % msgs.length];
  const pos = positions[notifCount % positions.length];
  const notif = new Notification(m, t, 3000, pos);
  app.showOverlay(notif, { modal: false });
  notif.removeFn = () => app.removeOverlay(notif);
  notif.show();
});

const btnWindow = new Button("  Open Window  ", () => {
  const win = new FloatingWindow("Draggable Window", {
    width: 48,
    height: 18,
    onClose: () => {
      const notif = new Notification("Window closed", "info", 2000);
      app.showOverlay(notif, { modal: false });
      notif.removeFn = () => app.removeOverlay(notif);
      notif.show();
    },
  });
  win.appRef = app;
  for (const line of [
    "This window can be dragged by clicking",
    "and holding the title bar.",
    "",
    "Drag the mouse to move the window",
    "anywhere on screen.",
    "",
    "Click [×] or press Escape to close.",
  ]) {
    const lb = new Box();
    lb.height = { fixed: 1 };
    lb.onPaint = (buf, rect, theme) =>
      paintCenteredText(buf, rect, line, theme.text, undefined);
    win.contentBox.add(lb);
  }
  app.showOverlay(win, { modal: false });
});

ctlRow.add(btnDialog, btnNotif, btnWindow);

function infoCard(title: string, lines: string[]): Box {
  const card = Box.col(`card-${title}`);
  card.style.border = "rounded";
  card.style.padding = edgesAll(1);
  card.style.bg = defaultTheme.panelBg;
  // width defaults to grow:1
  card.onPaint = (buf, rect, theme) =>
    paintText(buf, rect, ` ${title}`, 0, theme.highlight, true);
  for (const line of lines) {
    const lb = new Box();
    lb.height = { fixed: 1 };
    lb.onPaint = (buf, rect, th) =>
      paintText(buf, rect, `  ${line}`, 0, th.muted);
    card.add(lb);
  }
  return card;
}

const floatInfo = Box.row("float-info");
floatInfo.style.gutter = 2;
floatInfo.style.justify = "center";
floatInfo.style.align = "stretch";
// height defaults to grow:1
floatInfo.add(
  infoCard("Dialog", [
    "Modal dialog with",
    "double border, body",
    "text, and action buttons.",
    "",
    "Esc or action to close.",
  ]),
  infoCard("Notification", [
    "Auto-dismissing toast.",
    "Info / Success / Warn /",
    "Error — 4 types.",
    "",
    "Rotates through corners.",
  ]),
  infoCard("Window", [
    "Draggable window with",
    "title bar drag support.",
    "Close [×] button.",
    "",
    "Move anywhere on screen.",
  ]),
);

floatCtl.add(ctlLabel, ctlRow, floatInfo);
floatTab.add(floatLabel, floatCtl);

// ═══════════════════════════════════════════════════════════════════════════
// Tabs
// ═══════════════════════════════════════════════════════════════════════════

const tabs = new Tabs(
  [
    { label: "Layout", content: layoutTab },
    { label: "Resizable", content: resizableContent },
    { label: "Shortcuts", content: shortcutTab },
    { label: "Text", content: textTab },
    { label: "Code", content: codeTab },
    { label: "UI", content: uiTab },
    { label: "Animation", content: animTab },
    { label: "Floating", content: floatTab },
  ],
  0,
);
// height defaults to grow:1

// ═══════════════════════════════════════════════════════════════════════════
// Status bar
// ═══════════════════════════════════════════════════════════════════════════

const statusBar = new Box("status");
statusBar.height = { fixed: 1 };
statusBar.style.bg = defaultTheme.bg;
statusBar.onPaint = (_buf, rect, theme) => {
  _buf.fill(rect.x, rect.y, rect.width, 1, { char: " ", bg: theme.bg });
  const hint =
    " Tab: focus  |  ←/→: tabs  |  ↑/↓: scroll  |  Ctrl+←/→: h-scroll  |  Db-clk: word  |  Trpl-clk: line  |  Esc: close  |  Ctrl+C: quit";
  for (let i = 0; i < hint.length && i < rect.width; i++)
    _buf.set(rect.x + i, rect.y, {
      char: hint[i],
      fg: theme.muted,
      bg: theme.bg,
    });
};

// ═══════════════════════════════════════════════════════════════════════════
// Root
// ═══════════════════════════════════════════════════════════════════════════

const root = Box.col("root");
// height/width default to grow:1
root.style.bg = defaultTheme.bg;
root.add(header, tabs, statusBar);

// ═══════════════════════════════════════════════════════════════════════════
// App
// ═══════════════════════════════════════════════════════════════════════════

const app = new App(root, { theme: defaultTheme, fps: 30, mouse: true });

// Wire up appRef for widgets that show overlay notifications
copyOnSelectInput.appRef = app;
themeDropdown.appRef = app;
sortDropdown.appRef = app;
autoDropdown.appRef = app;
autoInline.appRef = app;

for (const [key, box] of appShortcuts) {
  app.shortcut(key, box);
  box.onKey = () => {
    onShortcutJump(box);
  };
}

// Animation ticker
let progressDir = 1;
setInterval(() => {
  if (!animEnabled) return;
  for (let i = 0; i < spinnerTicks.length; i++) spinnerTicks[i]++;
  cpuVal = Math.max(0.1, Math.min(0.95, cpuVal + (Math.random() - 0.5) * 0.04));
  memVal = Math.max(0.1, Math.min(0.95, memVal + (Math.random() - 0.5) * 0.03));
  dskVal = Math.max(0.1, Math.min(0.95, dskVal + (Math.random() - 0.5) * 0.02));
  netVal = Math.max(
    0.05,
    Math.min(0.95, netVal + (Math.random() - 0.5) * 0.06),
  );
  if (countdownSec > 0) countdownSec--;
  const step = 0.005 * progressDir;
  let next = progressBar.progress + step;
  if (next >= 1) {
    next = 1;
    progressDir = -1;
  } else if (next <= 0) {
    next = 0;
    progressDir = 1;
  }
  progressBar.progress = next;
}, 120);

await app.run();
