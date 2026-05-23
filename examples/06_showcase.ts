/**
 * 06_showcase.ts
 *
 * Comprehensive component showcase dashboard organized by tabs.
 *
 * Tabs:
 *   Layout      — Flex grow/shrink layout adapting to space
 *   Resizable   — Mouse-draggable Splitter panels
 *   Shortcuts   — Direct-access key bindings
 *   Text        — TextInput, Autocomplete, and TextArea (multi-line)
 *   UI          — Checkbox toggles and ListBox selection
 *   Animation   — Spinners, metric bars, countdown
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
  RadioGroup,
  TextArea,
  Dropdown,
  ButtonGroup,
  paintCenteredText,
  paintText,
  edgesAll,
  defaultTheme,
} from "../src/mod.ts";
import { SmallButton } from "../src/mod.ts";
import type { ListBoxItem } from "../src/mod.ts";

// ─── Reactive State ──────────────────────────────────────────────────────────

let selectedFramework = "";
let selectedCommand = "";
let chkOptionA = false;
let chkOptionB = true;
let chkOptionC = false;
let selectedProfile: string = "Profile Alpha";
let selectedOption = "option_a";
let clickCount = 0;
let selectedTheme = "VS Code Dark";
let selectedAlign = "Left";
let progressValue = 0.35;
let shortcutTarget = "";

const profiles: ListBoxItem[] = [
  "Profile Alpha",
  "Profile Beta",
  "Profile Gamma",
  "Profile Delta",
  { label: "Profile Locked", disabled: true },
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
    "Scrollable column — Arrow keys to scroll, PageUp/Down for fast scroll",
    theme.muted,
    theme.bg,
  );
};

const scrollCol = Box.col("scroll-col");
scrollCol.style.border = "single";
scrollCol.style.gutter = 1;
scrollCol.style.padding = edgesAll(1);

for (let i = 1; i <= 20; i++) {
  const item = new Box(`item-${i}`);
  const r = Math.floor(40 + Math.sin(i * 1.5) * 20);
  const g = Math.floor(50 + Math.cos(i * 0.7) * 15);
  const b = Math.floor(60 + Math.sin(i * 0.3) * 25);
  item.style.bg = { r, g, b };
  item.height = { fixed: 3 };
  const itemColors = [
    "Crimson",
    "Amber",
    "Forest",
    "Ocean",
    "Plum",
    "Slate",
    "Teal",
    "Rose",
    "Gold",
    "Coral",
  ];
  const name = itemColors[i % itemColors.length];
  item.onPaint = (buf, rect, _t) => {
    paintCenteredText(
      buf,
      rect,
      `${i}. ${name} (fixed 3)`,
      { r: 220, g: 220, b: 230 },
      null,
    );
  };
  scrollCol.add(item);
}

basicTab.add(scrollCol);

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
const r1a = colorBox(
  "fixed 10",
  { r: 60, g: 60, b: 80 },
  { r: 200, g: 200, b: 220 },
);
r1a.width = { fixed: 10 };
const r1b = colorBox(
  "grow 1",
  { r: 70, g: 55, b: 50 },
  { r: 220, g: 200, b: 180 },
);
r1b.width = { grow: 1 };
const r1c = colorBox(
  "grow 2",
  { r: 50, g: 70, b: 60 },
  { r: 180, g: 220, b: 200 },
);
r1c.width = { grow: 2 };
row1.add(r1a, r1b, r1c);

// Column: fixed + grow + fixed
const col1 = Box.col("col1");
col1.style.border = "single";
col1.style.gutter = 1;
col1.style.padding = { top: 0, bottom: 0, left: 1, right: 1 };
col1.height = { grow: 1 };
const c1a = colorBox(
  "fixed 2",
  { r: 55, g: 60, b: 70 },
  { r: 200, g: 210, b: 230 },
);
c1a.height = { fixed: 2 };
const c1b = colorBox(
  "grow 1",
  { r: 65, g: 55, b: 60 },
  { r: 230, g: 200, b: 210 },
);
c1b.height = { grow: 1 };
const c1c = colorBox(
  "fixed 2",
  { r: 55, g: 65, b: 55 },
  { r: 200, g: 230, b: 200 },
);
c1c.height = { fixed: 2 };
col1.add(c1a, c1b, c1c);

// Row: grow + fixed + grow
const row2 = Box.row("row2");
row2.style.border = "single";
row2.style.gutter = 1;
row2.style.padding = { top: 0, bottom: 0, left: 1, right: 1 };
row2.height = { fixed: 5 };
const r2a = colorBox(
  "grow 1",
  { r: 60, g: 70, b: 80 },
  { r: 200, g: 210, b: 230 },
);
r2a.width = { grow: 1 };
const r2b = colorBox(
  "fixed 12",
  { r: 70, g: 70, b: 60 },
  { r: 230, g: 230, b: 200 },
);
r2b.width = { fixed: 12 };
const r2c = colorBox(
  "grow 1",
  { r: 60, g: 60, b: 70 },
  { r: 210, g: 210, b: 230 },
);
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
        buf.set(c, rect.y + 1, {
          char: "▔",
          fg: theme.highlight,
          bg: theme.panelBg,
        });
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

const rTopLeft = makeResizePanel(
  "◎ File Explorer",
  [
    "  src/",
    "    mod.ts",
    "    layout.ts",
    "    theme.ts",
    "    events.ts",
    "    focus.ts",
    "    splitter.ts",
    "    app.ts",
    "  examples/",
  ],
  1,
);

const rTopRight = makeResizePanel(
  "◎ Editor",
  [
    "  // Resizable panel demo",
    "  // Drag the ◈ handle",
    "  // to resize panels",
    "",
    "  const splitter = new",
    "    Splitter('horizontal',",
    "      panelA, panelB,",
    "      { initialSplit: 30 }",
    "    );",
  ],
  2,
);

const rBottom = makeResizePanel(
  "◎ Terminal Output",
  [
    "  $ deno run 06_showcase.ts",
    "  tuix v0.1.0 — resizable panels",
    "  Drag the ◈ handle to resize.",
    "  Tab to cycle panel focus.",
  ],
  3,
);

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
  paintCenteredText(
    buf,
    rect,
    "Zone 1  [key: 1]",
    theme.highlight,
    theme.panelBg,
  );
};

const zone2 = new Box("Zone 2");
zone2.style.border = "single";
zone2.focusable = true;
zone2.tabIndex = 2;
zone2.shortcut = "2";
zone2.onPaint = (buf, rect, theme) => {
  paintCenteredText(
    buf,
    rect,
    "Zone 2  [key: 2]",
    theme.highlight,
    theme.panelBg,
  );
};

const zone3 = new Box("Zone 3");
zone3.style.border = "single";
zone3.focusable = true;
zone3.tabIndex = 3;
zone3.shortcut = "3";
zone3.onPaint = (buf, rect, theme) => {
  paintCenteredText(
    buf,
    rect,
    "Zone 3  [key: 3]",
    theme.highlight,
    theme.panelBg,
  );
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
    "TextInput, Autocomplete, and TextArea — type to interact",
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

const autoInlineLabel = new Box("auto-inline-label");
autoInlineLabel.style.fg = defaultTheme.highlight;
autoInlineLabel.height = { fixed: 1 };
autoInlineLabel.onPaint = (_buf, rect, theme) => {
  paintText(
    _buf,
    rect,
    "Autocomplete (inline mode, Tab to complete):",
    0,
    theme.highlight,
  );
};

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
autoInline.mode = "inline";

const textStatus = new Box("text-status");
textStatus.height = { fixed: 1 };
textStatus.style.bg = defaultTheme.bg;
textStatus.onPaint = (_buf, rect, theme) => {
  const parts: string[] = [];
  if (textInput.value) parts.push(`Input: "${textInput.value}"`);
  if (selectedFramework) parts.push(`Framework: ${selectedFramework}`);
  if (selectedCommand) parts.push(`Command: ${selectedCommand}`);
  const text =
    parts.length > 0
      ? `  ${parts.join("  │  ")}`
      : "  Start typing to see results here";
  paintText(_buf, rect, text, 0, theme.muted);
};

const textAreaLabel = new Box("textarea-label");
textAreaLabel.style.fg = defaultTheme.highlight;
textAreaLabel.height = { fixed: 1 };
textAreaLabel.onPaint = (_buf, rect, theme) => {
  paintText(_buf, rect, "TextArea (multi-line):", 0, theme.highlight);
};

const textArea = new TextArea("Type multi-line here...", "", undefined, 5);

textTab.add(
  textInputLabel,
  textInput,
  autoDropdownLabel,
  autoDropdown,
  autoInlineLabel,
  autoInline,
  textAreaLabel,
  textArea,
  textStatus,
);

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: UI (Checkboxes, Radio, Buttons, Dropdown, ButtonGroup, ListBox)
// ═══════════════════════════════════════════════════════════════════════════════

const uiTab = Box.col("UI Controls");
uiTab.style.gutter = 1;
uiTab.style.bg = defaultTheme.bg;

// Header label as a real child so layout accounts for its height
const uiHeader = new Box("ui-header");
uiHeader.height = { fixed: 1 };
uiHeader.style.bg = defaultTheme.bg;
uiHeader.onPaint = (_buf, rect, theme) => {
  paintCenteredText(
    _buf,
    rect,
    "Checkboxes | Radio | ListBox — Actions — ButtonGroup — Dropdown",
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
profileList.height = { fixed: 8 };

const radioLabel = new Box("radio-label");
radioLabel.style.fg = defaultTheme.highlight;
radioLabel.height = { fixed: 1 };
radioLabel.onPaint = (_buf, rect, theme) => {
  paintText(_buf, rect, "RadioGroup:", 0, theme.highlight);
};

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

const btnLabel = new Box("btn-label");
btnLabel.style.fg = defaultTheme.highlight;
btnLabel.height = { fixed: 1 };
btnLabel.onPaint = (_buf, rect, theme) => {
  paintText(_buf, rect, "Actions:", 0, theme.highlight);
};

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
  btnToggle.toggled = !btnToggle.toggled;
});
btnToggle.flashOnClick = false;
const btnCount = new Button("Click Count", () => {
  clickCount++;
});
const btnDisabled = new Button("Locked");
btnDisabled.setDisabled(true);
btnRow.add(btnReset, btnToggle, btnCount, btnDisabled);

const smallBtnLabel = new Box("small-btn-label");
smallBtnLabel.style.fg = defaultTheme.highlight;
smallBtnLabel.height = { fixed: 1 };
smallBtnLabel.onPaint = (_buf, rect, theme) => {
  paintText(_buf, rect, "SmallButtons:", 0, theme.highlight);
};

const sbtnReset = new SmallButton("Reset", () => {
  clickCount = 0;
});
const sbtnFlash = new SmallButton("Flash Me");
const sbtnLocked = new SmallButton("Locked");
sbtnLocked.setDisabled(true);

const smallBtns = Box.row("small-btns");
smallBtns.style.gutter = 1;
smallBtns.height = { fixed: 1 };
smallBtns.add(sbtnReset, sbtnFlash, sbtnLocked);

const dropdownLabel = new Box("dropdown-label");
dropdownLabel.style.fg = defaultTheme.highlight;
dropdownLabel.height = { fixed: 1 };
dropdownLabel.onPaint = (_buf, rect, theme) => {
  paintText(_buf, rect, "Dropdown:", 0, theme.highlight);
};

const themeDropdown = new Dropdown(
  "Theme",
  ["VS Code Dark", "Amber", "Monokai", "Solarized", "Nord"],
  0,
  (val) => {
    selectedTheme = val;
  },
);

const groupLabel = new Box("group-label");
groupLabel.style.fg = defaultTheme.highlight;
groupLabel.height = { fixed: 1 };
groupLabel.onPaint = (_buf, rect, theme) => {
  paintText(_buf, rect, "ButtonGroup (Align):", 0, theme.highlight);
};

const alignGroup = new ButtonGroup(
  "Align",
  ["Left", "Center", "Right", "Justify"],
  0,
  (val) => {
    selectedAlign = val;
  },
);

const uiStatus = new Box("ui-status");
uiStatus.height = { fixed: 3 };
uiStatus.style.bg = defaultTheme.bg;
uiStatus.onPaint = (_buf, rect, theme) => {
  const parts = [
    `A:${chkOptionA ? "✓" : "✗"}`,
    `B:${chkOptionB ? "✓" : "✗"}`,
    `C:${chkOptionC ? "✓" : "✗"}`,
    `Radio: ${selectedOption.replace("option_", "")}`,
    `Profile: ${selectedProfile}`,
    `Clicks: ${clickCount}`,
    `Theme: ${selectedTheme}`,
    `Align: ${selectedAlign}`,
  ];
  paintText(_buf, rect, `  ${parts.join("  │  ")}`, 0, theme.muted);
};

// Row 1: 3 columns — checkboxes, radio group, listbox (all with disabled items)
const chkCol = Box.col("chk-col");
chkCol.style.gutter = 1;
chkCol.height = { grow: 1 };
chkCol.add(chkLabel, chk1, chk2, chk3, chkDisabled);

const radioCol = Box.col("radio-col");
radioCol.style.gutter = 1;
radioCol.height = { grow: 1 };
radioCol.add(radioLabel, radioGroup);

const listCol = Box.col("list-col");
listCol.style.gutter = 1;
listCol.height = { grow: 1 };
listCol.add(listLabel, profileList);

const topRow = Box.row("top-row");
topRow.style.gutter = 2;
topRow.height = { grow: 1 };
topRow.add(chkCol, radioCol, listCol);

// Row 2: Actions
const actionsRow = Box.col("actions-row");
actionsRow.style.gutter = 1;
actionsRow.height = { fixed: 5 };
actionsRow.add(btnLabel, btnRow);

// Row 3: ButtonGroup
const groupRow = Box.col("group-row");
groupRow.style.gutter = 1;
groupRow.height = { fixed: 5 };
groupRow.add(groupLabel, alignGroup);

// Row 3b: SmallButtons
const smallBtnRow = Box.col("small-btn-row");
smallBtnRow.style.gutter = 1;
smallBtnRow.height = { fixed: 3 };
smallBtnRow.add(smallBtnLabel, smallBtns);

// Row 4: Dropdown
const dropdownRow = Box.col("dropdown-row");
dropdownRow.style.gutter = 1;
dropdownRow.height = { fixed: 5 };
dropdownRow.add(dropdownLabel, themeDropdown);

// Wrap all controls in a scrollable bordered column
const uiScroll = Box.col("ui-scroll");
uiScroll.style.border = "single";
uiScroll.style.gutter = 1;
uiScroll.style.padding = { top: 0, bottom: 0, left: 1, right: 1 };
uiScroll.add(topRow, actionsRow, groupRow, smallBtnRow, dropdownRow);

uiTab.add(uiHeader, uiScroll, uiStatus);

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: Animation Dashboard
// ═══════════════════════════════════════════════════════════════════════════════

// ─── State ────────────────────────────────────────────────────────────────────

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

// ─── Spinner Widget ──────────────────────────────────────────────────────────

class SpinnerBox extends Box {
  private _frames: string[];
  private _idx: number;
  constructor(label: string, frames: string[], idx: number) {
    super(label);
    this._frames = frames;
    this._idx = idx;
    this.height = { fixed: 1 };
    this.onPaint = (buf, rect, theme) => {
      const ch = this._frames[spinnerTicks[this._idx] % this._frames.length];
      const text = ` ${ch}  ${label}`;
      for (let i = 0; i < text.length && i < rect.width; i++) {
        buf.set(rect.x + i, rect.y, {
          char: text[i],
          fg: theme.highlight,
          bg: defaultTheme.panelBg,
        });
      }
    };
  }
}

// ─── Metric Bar ──────────────────────────────────────────────────────────────

function makeMetricBar(
  label: string,
  color: { r: number; g: number; b: number },
  getVal: () => number,
): Box {
  const row = Box.row(`${label}-row`);
  row.height = { fixed: 1 };
  row.style.gutter = 1;

  const lbl = new Box(`${label}-lbl`);
  lbl.width = { fixed: 5 };
  lbl.onPaint = (buf, rect, _t) => {
    paintText(buf, rect, ` ${label} `, 0, defaultTheme.text);
  };

  const bar = new Box(`${label}-bar`);
  bar.onPaint = (buf, rect, theme) => {
    const val = getVal();
    const filled = Math.floor(val * rect.width);
    for (let i = 0; i < rect.width; i++) {
      const ch = i < filled ? "█" : "░";
      const fg = i < filled ? color : theme.muted;
      buf.set(rect.x + i, rect.y, { char: ch, fg, bg: defaultTheme.panelBg });
    }
  };

  const pct = new Box(`${label}-pct`);
  pct.width = { fixed: 5 };
  pct.onPaint = (buf, rect, theme) => {
    const val = getVal();
    const s = `${(val * 100).toFixed(0).padStart(3)}%`;
    paintText(buf, rect, s, 0, theme.highlight, true);
  };

  row.add(lbl, bar, pct);
  return row;
}

// ─── Build Animation Tab ─────────────────────────────────────────────────────

const animLabel = new Box("anim-label");
animLabel.height = { fixed: 1 };
animLabel.style.bg = defaultTheme.bg;
animLabel.onPaint = (_buf, rect, theme) => {
  paintCenteredText(
    _buf,
    rect,
    "✦  Animation Dashboard  —  real-time metrics",
    theme.muted,
    theme.bg,
  );
};

// ── Spinners ──
const spinnerBox = Box.col("spinner-col");
spinnerBox.style.border = "single";
spinnerBox.style.gutter = 1;
spinnerBox.style.padding = edgesAll(1);

const spinnerHeader = new Box("spinner-hdr");
spinnerHeader.height = { fixed: 1 };
spinnerHeader.onPaint = (buf, rect, theme) => {
  paintText(buf, rect, " Spinners", 0, theme.muted);
};

const spinnerRow = Box.row("spinner-row");
spinnerRow.style.gutter = 3;
spinnerRow.add(
  new SpinnerBox("Loading", SPINNER_SETS[0], 0),
  new SpinnerBox("Processing", SPINNER_SETS[1], 1),
  new SpinnerBox("Syncing", SPINNER_SETS[2], 2),
  new SpinnerBox("Saving", SPINNER_SETS[3], 3),
);
spinnerBox.add(spinnerHeader, spinnerRow);

// ── Metrics ──
const metricsBox = Box.col("metrics-col");
metricsBox.style.border = "single";
metricsBox.style.gutter = 1;
metricsBox.style.padding = edgesAll(1);

const metricsHeader = new Box("metrics-hdr");
metricsHeader.height = { fixed: 1 };
metricsHeader.onPaint = (buf, rect, theme) => {
  paintText(buf, rect, " System Metrics", 0, theme.muted);
};

const cpuBar = makeMetricBar("CPU", { r: 100, g: 180, b: 255 }, () => cpuVal);
const memBar = makeMetricBar("MEM", { r: 100, g: 220, b: 140 }, () => memVal);
const dskBar = makeMetricBar("DSK", { r: 255, g: 200, b: 100 }, () => dskVal);
const netBar = makeMetricBar("NET", { r: 255, g: 130, b: 130 }, () => netVal);
metricsBox.add(metricsHeader, cpuBar, memBar, dskBar, netBar);

// ── Countdown ──
const countdownBox = Box.col("countdown-col");
countdownBox.style.border = "single";
countdownBox.style.gutter = 0;
countdownBox.style.padding = edgesAll(1);
countdownBox.height = { fixed: 6 };

const cdHeader = new Box("cd-hdr");
cdHeader.height = { fixed: 1 };
cdHeader.onPaint = (buf, rect, theme) => {
  paintText(buf, rect, " Countdown", 0, theme.muted);
};

const cdDisplay = new Box("cd-display");
cdDisplay.onPaint = (buf, rect, theme) => {
  const m = Math.floor(countdownSec / 60);
  const s = countdownSec % 60;
  const timeStr = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  paintCenteredText(buf, rect, timeStr, theme.highlight, null, true);
};
countdownBox.add(cdHeader, cdDisplay);

// ── Controls ──
const animBtnRow = Box.row("anim-btns");
animBtnRow.style.gutter = 2;
const autoAnimBtn = new Button("Auto-Animate (toggle)", () => {
  animEnabled = !animEnabled;
});
autoAnimBtn.flashOnClick = false;
const resetBtn = new Button("Reset All", () => {
  cpuVal = 0.67;
  memVal = 0.45;
  dskVal = 0.92;
  netVal = 0.18;
  countdownSec = 300;
});
animBtnRow.add(autoAnimBtn, resetBtn);

// ── Assemble Tab ──
const animTab = Box.col("Animation");
animTab.style.gutter = 1;
animTab.style.bg = defaultTheme.bg;
animTab.add(animLabel, spinnerBox, metricsBox, countdownBox, animBtnRow);

// ═══════════════════════════════════════════════════════════════════════════════
// Tabs Container
// ═══════════════════════════════════════════════════════════════════════════════

const tabs = new Tabs(
  [
    { label: "Layout", content: responsiveTab },
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
    _buf.set(rect.x + i, rect.y, {
      char: hint[i],
      fg: theme.muted,
      bg: theme.bg,
    });
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
  if (!animEnabled) return;
  for (let i = 0; i < spinnerTicks.length; i++) spinnerTicks[i]++;
  cpuVal += (Math.random() - 0.5) * 0.04;
  cpuVal = Math.max(0.1, Math.min(0.95, cpuVal));
  memVal += (Math.random() - 0.5) * 0.03;
  memVal = Math.max(0.1, Math.min(0.95, memVal));
  dskVal += (Math.random() - 0.5) * 0.02;
  dskVal = Math.max(0.1, Math.min(0.95, dskVal));
  netVal += (Math.random() - 0.5) * 0.06;
  netVal = Math.max(0.05, Math.min(0.95, netVal));
  if (countdownSec > 0) countdownSec--;
}, 120);

await app.run();
