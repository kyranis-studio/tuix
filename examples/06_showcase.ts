/**
 * 06_showcase.ts
 *
 * Comprehensive component showcase dashboard organized by tabs.
 *
 * Tabs:
 *   Basic       — Simple Box layout with row/column containers
 *   Responsive  — Flex grow/shrink layout adapting to space
 *   Resizable   — Mouse-draggable Splitter panels
 *   Shortcuts   — Direct-access key bindings
 *   Text        — TextInput and Autocomplete (dropdown + inline)
 *   UI          — Checkbox toggles and ListBox selection
 *   Animation   — ProgressBar with real-time updates
 *
 * Controls:
 *   Tab / Shift+Tab      — cycle focus
 *   ArrowLeft/ArrowRight — switch tabs
 *   ArrowUp/Down         — navigate lists / autocomplete
 *   Space / Enter        — toggle checkbox / select item
 *   Type characters      — write in text inputs
 *   Backspace            — erase characters
 *   Mouse Drag           — resize splitter panels
 *   Ctrl+C               — quit
 */

import {
  App,
  Box,
  Splitter,
  Button,
  Checkbox,
  TextInput,
  ListBox,
  ProgressBar,
  Autocomplete,
  Tabs,
  paintCenteredText,
  paintText,
  edgesAll,
  defaultTheme,
} from "../src/mod.ts";

// ─── Reactive State ──────────────────────────────────────────────────────────

let selectedFramework = "";
let selectedCommand = "";
let chkOptionA = false;
let chkOptionB = true;
let chkOptionC = false;
let selectedProfile = "Profile Alpha";
let progressValue = 0.35;
let shortcutTarget = "";

const profiles = [
  "Profile Alpha",
  "Profile Beta",
  "Profile Gamma",
  "Profile Delta",
];

// ─── Header ──────────────────────────────────────────────────────────────────

const header = new Box("hdr");
header.height = { fixed: 3 };
header.style.bg = defaultTheme.toolbarBg;
header.onPaint = (buf, rect, theme) => {
  buf.fill(rect.x, rect.y, rect.width, rect.height, {
    char: " ",
    bg: theme.toolbarBg,
  });
  paintCenteredText(
    buf,
    rect,
    "✦  tuix Component Showcase  ✦",
    theme.toolbarText,
    theme.toolbarBg,
    true,
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: Basic
// ═══════════════════════════════════════════════════════════════════════════════

const basicTab = Box.col("Basic Layout");
basicTab.style.gutter = 1;
basicTab.style.bg = defaultTheme.bg;
basicTab.onPaint = (_buf, rect, theme) => {
  paintCenteredText(
    _buf,
    { x: rect.x, y: rect.y, width: rect.width, height: 1 },
    "Row and column containers with fixed and grow sizing",
    theme.muted,
    theme.bg,
  );
};

const rowDemo = Box.row("row-demo");
rowDemo.style.border = "single";
rowDemo.style.gutter = 1;
rowDemo.style.padding = edgesAll(1);
rowDemo.height = { fixed: 7 };

const boxA = new Box("A");
boxA.style.bg = { r: 60, g: 60, b: 80 };
boxA.width = { fixed: 12 };
boxA.onPaint = (buf, rect, _theme) => {
  paintCenteredText(buf, rect, "Fixed 12", { r: 200, g: 200, b: 220 }, null);
};

const boxB = new Box("B");
boxB.style.bg = { r: 70, g: 55, b: 50 };
boxB.width = { grow: 1 };
boxB.onPaint = (buf, rect, _theme) => {
  paintCenteredText(buf, rect, "Grow 1", { r: 220, g: 200, b: 180 }, null);
};

const boxC = new Box("C");
boxC.style.bg = { r: 50, g: 70, b: 60 };
boxC.width = { grow: 2 };
boxC.onPaint = (buf, rect, _theme) => {
  paintCenteredText(buf, rect, "Grow 2", { r: 180, g: 220, b: 200 }, null);
};

rowDemo.add(boxA, boxB, boxC);

const colDemo = Box.col("col-demo");
colDemo.style.border = "single";
colDemo.style.gutter = 1;
colDemo.style.padding = edgesAll(1);
colDemo.height = { grow: 1 };

const boxTop = new Box("top");
boxTop.style.bg = { r: 55, g: 60, b: 70 };
boxTop.height = { fixed: 3 };
boxTop.onPaint = (buf, rect, _theme) => {
  paintCenteredText(buf, rect, "Fixed 3", { r: 200, g: 210, b: 230 }, null);
};

const boxMid = new Box("mid");
boxMid.style.bg = { r: 65, g: 55, b: 60 };
boxMid.height = { grow: 1 };
boxMid.onPaint = (buf, rect, _theme) => {
  paintCenteredText(buf, rect, "Grow", { r: 230, g: 200, b: 210 }, null);
};

const boxBot = new Box("bot");
boxBot.style.bg = { r: 55, g: 65, b: 55 };
boxBot.height = { fixed: 3 };
boxBot.onPaint = (buf, rect, _theme) => {
  paintCenteredText(buf, rect, "Fixed 3", { r: 200, g: 230, b: 200 }, null);
};

colDemo.add(boxTop, boxMid, boxBot);

basicTab.add(rowDemo, colDemo);

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: Responsive
// ═══════════════════════════════════════════════════════════════════════════════

const responsiveTab = Box.col("Responsive Layout");
responsiveTab.style.gutter = 1;
responsiveTab.style.bg = defaultTheme.bg;
responsiveTab.onPaint = (_buf, rect, theme) => {
  paintCenteredText(
    _buf,
    { x: rect.x, y: rect.y, width: rect.width, height: 1 },
    "Mix rows, columns, fixed & grow — resize terminal to see adapt",
    theme.muted,
    theme.bg,
  );
};

function colorBox(
  label: string,
  color: { r: number; g: number; b: number },
  textColor: { r: number; g: number; b: number },
): Box {
  const b = new Box(label);
  b.style.bg = color;
  b.onPaint = (buf, rect, _t) => {
    paintCenteredText(buf, rect, label, textColor, null);
  };
  return b;
}

// Row: fixed + grow + grow
const row1 = Box.row("row1");
row1.style.border = "single";
row1.style.gutter = 1;
row1.style.padding = { top: 0, bottom: 0, left: 1, right: 1 };
row1.height = { fixed: 5 };
const r1a = colorBox("fixed 10", { r: 60, g: 60, b: 80 }, { r: 200, g: 200, b: 220 });
r1a.width = { fixed: 10 };
const r1b = colorBox("grow 1", { r: 70, g: 55, b: 50 }, { r: 220, g: 200, b: 180 });
r1b.width = { grow: 1 };
const r1c = colorBox("grow 2", { r: 50, g: 70, b: 60 }, { r: 180, g: 220, b: 200 });
r1c.width = { grow: 2 };
row1.add(r1a, r1b, r1c);

// Column: fixed + grow + fixed
const col1 = Box.col("col1");
col1.style.border = "single";
col1.style.gutter = 1;
col1.style.padding = { top: 0, bottom: 0, left: 1, right: 1 };
col1.height = { grow: 1 };
const c1a = colorBox("fixed 2", { r: 55, g: 60, b: 70 }, { r: 200, g: 210, b: 230 });
c1a.height = { fixed: 2 };
const c1b = colorBox("grow 1", { r: 65, g: 55, b: 60 }, { r: 230, g: 200, b: 210 });
c1b.height = { grow: 1 };
const c1c = colorBox("fixed 2", { r: 55, g: 65, b: 55 }, { r: 200, g: 230, b: 200 });
c1c.height = { fixed: 2 };
col1.add(c1a, c1b, c1c);

// Row: grow + fixed + grow
const row2 = Box.row("row2");
row2.style.border = "single";
row2.style.gutter = 1;
row2.style.padding = { top: 0, bottom: 0, left: 1, right: 1 };
row2.height = { fixed: 5 };
const r2a = colorBox("grow 1", { r: 60, g: 70, b: 80 }, { r: 200, g: 210, b: 230 });
r2a.width = { grow: 1 };
const r2b = colorBox("fixed 12", { r: 70, g: 70, b: 60 }, { r: 230, g: 230, b: 200 });
r2b.width = { fixed: 12 };
const r2c = colorBox("grow 1", { r: 60, g: 60, b: 70 }, { r: 210, g: 210, b: 230 });
r2c.width = { grow: 1 };
row2.add(r2a, r2b, r2c);

responsiveTab.add(row1, col1, row2);

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: Resizable
// ═══════════════════════════════════════════════════════════════════════════════

function makeResizePanel(label: string, body: string[], tabIdx: number): Box {
  const box = new Box(label);
  box.style.border = "single";
  box.style.padding = { top: 1, bottom: 1, left: 1, right: 1 };
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
    const sizeStr = `rect: ${box.rect.width}×${box.rect.height}`;
    paintText(buf, rect, sizeStr, rect.height - 1, theme.muted);
  };
  return box;
}

const rTopLeft = makeResizePanel("◎ File Explorer", [
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

const rTopRight = makeResizePanel("◎ Editor", [
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

const rBottom = makeResizePanel("◎ Terminal Output", [
  "  $ deno run 06_showcase.ts",
  "  tuix v0.1.0 — resizable panels",
  "  Drag the ◈ handle to resize.",
  "  Tab to cycle panel focus.",
], 3);

const rHSplit = new Splitter("horizontal", rTopLeft, rTopRight, {
  initialSplit: 30,
  minA: 12,
  minB: 12,
});

const rVSplit = new Splitter("vertical", rHSplit, rBottom, {
  initialSplit: 12,
  minA: 8,
  minB: 5,
});

const resizableContent = Box.col("resize-content");
resizableContent.style.bg = defaultTheme.bg;
resizableContent.add(rVSplit);

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: Shortcuts
// ═══════════════════════════════════════════════════════════════════════════════

const shortcutTab = Box.col("Shortcuts");
shortcutTab.style.gutter = 1;
shortcutTab.style.bg = defaultTheme.bg;
shortcutTab.onPaint = (_buf, rect, theme) => {
  paintCenteredText(
    _buf,
    { x: rect.x, y: rect.y, width: rect.width, height: 1 },
    "Press a key to jump focus: [1] [2] [3]",
    theme.muted,
    theme.bg,
  );
};

const zone1 = new Box("Zone 1");
zone1.style.border = "single";
zone1.focusable = true;
zone1.tabIndex = 1;
zone1.shortcut = "1";
zone1.onPaint = (buf, rect, theme) => {
  paintCenteredText(buf, rect, "Zone 1  [key: 1]", theme.highlight, theme.panelBg);
};

const zone2 = new Box("Zone 2");
zone2.style.border = "single";
zone2.focusable = true;
zone2.tabIndex = 2;
zone2.shortcut = "2";
zone2.onPaint = (buf, rect, theme) => {
  paintCenteredText(buf, rect, "Zone 2  [key: 2]", theme.highlight, theme.panelBg);
};

const zone3 = new Box("Zone 3");
zone3.style.border = "single";
zone3.focusable = true;
zone3.tabIndex = 3;
zone3.shortcut = "3";
zone3.onPaint = (buf, rect, theme) => {
  paintCenteredText(buf, rect, "Zone 3  [key: 3]", theme.highlight, theme.panelBg);
};

const zonesRow = Box.row("zones");
zonesRow.style.gutter = 2;
zonesRow.style.padding = edgesAll(1);
zonesRow.add(zone1, zone2, zone3);

// Shared status display
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

// Track shortcut jumps via App.shortcut
function onShortcutJump(box: Box): void {
  shortcutTarget = box.label;
}

const appShortcuts = new Map<string, Box>();
function registerShortcut(key: string, box: Box): void {
  appShortcuts.set(key, box);
}

registerShortcut("1", zone1);
registerShortcut("2", zone2);
registerShortcut("3", zone3);

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: Text
// ═══════════════════════════════════════════════════════════════════════════════

const textTab = Box.col("Text Input");
textTab.style.gutter = 1;
textTab.style.bg = defaultTheme.bg;
textTab.onPaint = (_buf, rect, theme) => {
  paintCenteredText(
    _buf,
    { x: rect.x, y: rect.y, width: rect.width, height: 1 },
    "TextInput and Autocomplete — type to interact",
    theme.muted,
    theme.bg,
  );
};

const textInputLabel = new Box("text-label");
textInputLabel.style.fg = defaultTheme.highlight;
textInputLabel.height = { fixed: 1 };
textInputLabel.onPaint = (_buf, rect, theme) => {
  paintText(_buf, rect, "TextInput:", 0, theme.highlight);
};

const textInput = new TextInput("Type anything...");

const autoDropdownLabel = new Box("auto-dd-label");
autoDropdownLabel.style.fg = defaultTheme.highlight;
autoDropdownLabel.height = { fixed: 1 };
autoDropdownLabel.onPaint = (_buf, rect, theme) => {
  paintText(_buf, rect, "Autocomplete (dropdown mode):", 0, theme.highlight);
};

const autoDropdown = new Autocomplete(
  "Search framework...",
  ["React", "Vue", "Angular", "Svelte", "Solid", "Deno", "Node.js", "Express", "Next.js", "Nuxt", "Remix", "Astro"],
  (item) => { selectedFramework = item; },
);
autoDropdown.maxVisibleItems = 5;

const autoInlineLabel = new Box("auto-inline-label");
autoInlineLabel.style.fg = defaultTheme.highlight;
autoInlineLabel.height = { fixed: 1 };
autoInlineLabel.onPaint = (_buf, rect, theme) => {
  paintText(_buf, rect, "Autocomplete (inline mode, Tab to complete):", 0, theme.highlight);
};

const autoInline = new Autocomplete(
  "Type a command...",
  ["deploy", "deploy:prod", "deploy:staging", "build", "build:watch", "test", "test:watch", "lint", "lint:fix", "clean", "format", "typecheck"],
  (item) => { selectedCommand = item; },
);
autoInline.mode = "inline";

const textStatus = new Box("text-status");
textStatus.height = { fixed: 1 };
textStatus.style.bg = defaultTheme.bg;
textStatus.onPaint = (_buf, rect, theme) => {
  const parts: string[] = [];
  if (textInput.value) parts.push(`Input: "${textInput.value}"`);
  if (selectedFramework) parts.push(`Framework: ${selectedFramework}`);
  if (selectedCommand) parts.push(`Command: ${selectedCommand}`);
  const text = parts.length > 0 ? `  ${parts.join("  │  ")}` : "  Start typing to see results here";
  paintText(_buf, rect, text, 0, theme.muted);
};

textTab.add(
  textInputLabel,
  textInput,
  autoDropdownLabel,
  autoDropdown,
  autoInlineLabel,
  autoInline,
  textStatus,
);

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: UI (Checkbox + ListBox)
// ═══════════════════════════════════════════════════════════════════════════════

const uiTab = Box.col("UI Controls");
uiTab.style.gutter = 1;
uiTab.style.bg = defaultTheme.bg;
uiTab.onPaint = (_buf, rect, theme) => {
  paintCenteredText(
    _buf,
    { x: rect.x, y: rect.y, width: rect.width, height: 1 },
    "Checkboxes and ListBox — Space/Enter to toggle, Arrows to navigate",
    theme.muted,
    theme.bg,
  );
};

const chkLabel = new Box("chk-label");
chkLabel.style.fg = defaultTheme.highlight;
chkLabel.height = { fixed: 1 };
chkLabel.onPaint = (_buf, rect, theme) => {
  paintText(_buf, rect, "Checkboxes:", 0, theme.highlight);
};

const chk1 = new Checkbox("Enable Feature A", chkOptionA, (v) => { chkOptionA = v; });
const chk2 = new Checkbox("Enable Feature B", chkOptionB, (v) => { chkOptionB = v; });
const chk3 = new Checkbox("Enable Feature C", chkOptionC, (v) => { chkOptionC = v; });

const listLabel = new Box("list-label");
listLabel.style.fg = defaultTheme.highlight;
listLabel.height = { fixed: 1 };
listLabel.onPaint = (_buf, rect, theme) => {
  paintText(_buf, rect, "Profiles ListBox:", 0, theme.highlight);
};

const profileList = new ListBox(profiles, (item) => {
  selectedProfile = item;
});
profileList.selectedIndex = 0;
profileList.height = { fixed: 6 };

const uiStatus = new Box("ui-status");
uiStatus.height = { fixed: 1 };
uiStatus.style.bg = defaultTheme.bg;
uiStatus.onPaint = (_buf, rect, theme) => {
  const parts = [
    `A:${chkOptionA ? "✓" : "✗"}`,
    `B:${chkOptionB ? "✓" : "✗"}`,
    `C:${chkOptionC ? "✓" : "✗"}`,
    `Profile: ${selectedProfile}`,
  ];
  paintText(_buf, rect, `  ${parts.join("  │  ")}`, 0, theme.muted);
};

uiTab.add(chkLabel, chk1, chk2, chk3, listLabel, profileList, uiStatus);

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: Animation (ProgressBar)
// ═══════════════════════════════════════════════════════════════════════════════

const progressBtn = new Button("Advance Progress", () => {
  progressValue += 0.10;
  if (progressValue > 1.05) progressValue = 0.0;
});

const autoProgressBtn = new Button("Auto-Animate (toggle)", () => {
  isAutoAnimating = !isAutoAnimating;
});
let isAutoAnimating = false;

const pBar = new ProgressBar("Progress", progressValue);

const animTab = Box.col("Animation");
animTab.style.gutter = 1;
animTab.style.bg = defaultTheme.bg;
animTab.onPaint = (_buf, rect, theme) => {
  paintCenteredText(
    _buf,
    { x: rect.x, y: rect.y, width: rect.width, height: 1 },
    "ProgressBar with real-time updates — click or auto-animate",
    theme.muted,
    theme.bg,
  );
};

const btnRow = Box.row("btn-row");
btnRow.style.gutter = 2;
btnRow.add(progressBtn, autoProgressBtn);

const animStatus = new Box("anim-status");
animStatus.height = { fixed: 1 };
animStatus.style.bg = defaultTheme.bg;
animStatus.onPaint = (_buf, rect, theme) => {
  const pct = (progressValue * 100).toFixed(0);
  const mode = isAutoAnimating ? "AUTO ●" : "manual";
  paintText(_buf, rect, `  Progress: ${pct}%  [${mode}]`, 0, theme.muted);
};

animTab.add(btnRow, pBar, animStatus);

// ═══════════════════════════════════════════════════════════════════════════════
// Tabs Container
// ═══════════════════════════════════════════════════════════════════════════════

const tabs = new Tabs(
  [
    { label: "Basic", content: basicTab },
    { label: "Responsive", content: responsiveTab },
    { label: "Resizable", content: resizableContent },
    { label: "Shortcuts", content: shortcutTab },
    { label: "Text", content: textTab },
    { label: "UI", content: uiTab },
    { label: "Animation", content: animTab },
  ],
  0,
);

// ═══════════════════════════════════════════════════════════════════════════════
// Status Bar
// ═══════════════════════════════════════════════════════════════════════════════

const statusBar = new Box("status");
statusBar.height = { fixed: 1 };
statusBar.style.bg = defaultTheme.bg;
statusBar.onPaint = (_buf, rect, theme) => {
  _buf.fill(rect.x, rect.y, rect.width, 1, { char: " ", bg: theme.bg });
  const hint =
    " Tab: focus  │  ← →: tabs  │  ↑ ↓: list  │  Spc: toggle  │  Esc: close  │  Ctrl+C: quit";
  for (let i = 0; i < hint.length && i < rect.width; i++) {
    _buf.set(rect.x + i, rect.y, { char: hint[i], fg: theme.muted, bg: theme.bg });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// Root Assembly
// ═══════════════════════════════════════════════════════════════════════════════

const root = Box.col("root");
root.style.bg = defaultTheme.bg;
root.add(header, tabs, statusBar);

// ═══════════════════════════════════════════════════════════════════════════════
// App
// ═══════════════════════════════════════════════════════════════════════════════

const app = new App(root, { theme: defaultTheme, fps: 30, mouse: true });

// Register shortcuts
for (const [key, box] of appShortcuts) {
  app.shortcut(key, box);
  box.onKey = () => {
    onShortcutJump(box);
  };
}

// Auto-animate timer
setInterval(() => {
  if (isAutoAnimating) {
    progressValue += 0.02;
    if (progressValue > 1.0) progressValue = 0.0;
  }
  pBar.progress = progressValue;
}, 80);

await app.run();
