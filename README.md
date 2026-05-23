# tuix — Reactive Terminal UI Layout Engine & Stateful Component Library

**tuix** is a premium, reactive terminal UI (TUI) layout engine and stateful component framework built for Deno and TypeScript. Drawing inspiration from modern web layout specs (like CSS Flexbox) and developer workspace styling (such as VS Code's Dark+ palette), **tuix** makes it simple to construct highly responsive, mouse-supported, and aesthetically striking terminal dashboard applications.

---

## Key Features

1. **Reactive Flex-Like Layout Engine**
   - Main-axis (`direction: "row" | "column"`) layout flows.
   - Cross-axis alignment (`align: "start" | "center" | "end" | "stretch"`).
   - Main-axis justification (`justify: "start" | "center" | "end" | "space-between" | "space-around"`).
   - Multi-dimensional spacing: margins, paddings, gutters, and borders (Rounded, Single, Double, Bold, None).
   - **Auto-scrolling containers**: when children overflow the viewport, a scrollbar appears automatically. Arrow keys / PageUp / PageDown scroll from any focused widget inside the container.

2. **Stateful TUI Component Library**
   - **`Button`**: Focus-sensitive actionable button with keyboard support (`Space`/`Enter`) and mouse-click bindings. Supports `disabled` state with dimmed appearance and no interaction.
   - **`ButtonGroup`**: Horizontal segmented control — multiple labeled options with single selection, arrow-key navigation, and mouse click.
   - **`Checkbox`**: Toggle check/uncheck indicator box (`☑` vs `☐`) supporting key triggers and mouse clicks. Supports `disabled` state with dimmed appearance and no interaction.
   - **`Dropdown`**: Combo-box style selector — shows current selection with `▼` indicator, opens scrollable list on activation, arrow-key navigation, Enter to select, Escape to close.
   - **`TextInput`**: Editable text input with `cursorPos`, arrow/Home/End navigation, character insertion at cursor, block cursor showing the character underneath, and placeholder shown when empty.
   - **`TextArea`**: Multi-line text editor with `\n`-delimited value, `maxLines` scroll cap with visual ▲/▼ indicators, vertical scrolling, arrow/Home/End navigation, Enter for newline, and mouse click to position cursor.
   - **`ListBox`**: Stateful list selector with Scroll Viewport offsets, Arrow/Vim key navigation (`j`/`k`), custom select prefixes (`▶ `), and click highlights. Supports per-item `disabled` via `ListBoxItem` objects (instead of plain strings) and full-widget `disabled` state.
   - **`ProgressBar`**: Stateful percentage loading bar utilizing character block levels (`█████░░░░░ 50%`).
   - **`Autocomplete`**: Dropdown and inline suggestion completion with keyboard/mouse filtering and selection, cursor position tracking with `cursorPos`.
   - **`RadioButton`** / **`RadioGroup`**: Mutually exclusive radio selection with `(•)` / `(○)` indicators, keyboard and mouse support. `RadioButton` supports `disabled` state with dimmed appearance and no interaction; `RadioGroup` accepts `RadioOption` objects with an optional `disabled` field for per-option disabling.
   - **`Tabs`**: Multi-tab container with keyboard (←/→) and mouse-driven tab switching.  

3. **Resizable Panel Splitters**
   - Horizontally and vertically draggable divider panes (`Splitter`).
   - Deepest-first/bottom-up layout recursive hit-testing, enabling fully nested multi-pane structures.
   - Min/max constraint support ensuring splitters respect panel size limits.

4. **Terminal I/O & Double-Buffer Rendering**
   - Seamless raw terminal mode toggling, capturing key actions, escape codes (arrows, modifiers), and SGR mouse reporting.
   - High-performance double-buffered cell grid that diffs layout changes and flushes only updated sections to stdout, eliminating screen flicker.
   - Reactive SIGWINCH resize listener that dynamically reflows layout boxes on terminal window resize.

5. **Focus Management & Theme Registry**
   - Centralized `FocusManager` managing Tab / Shift+Tab cycles, tab-indices, direct direct-jump shortcuts.
   - `Box.onFocus` callback fires when a widget gains focus, enabling cursor reset and other focus-side effects.
   - Built-in premium VS Code Dark+ theme (dark charcoal with rich yellow/gold highlights) activated by default, alongside classical secondary/named themes.

---

## Directory Structure

```
tuix/
  src/
    mod.ts              — Core public re-exports
    app.ts              — Main application loop, event loop, mouse/keyboard dispatcher
    terminal.ts         — Double-buffered CellBuffer renderer, raw mode setups, ANSI sequences
    layout.ts           — Box structure, recursive layout engine, coordinate positioning
    widgets/            — Individual widget files
      mod.ts            — Widget barrel re-export
      button.ts         — Clickable button (with disabled state)
      button_group.ts   — Horizontal segmented control
      checkbox.ts       — Toggle checkbox (with disabled state)
      dropdown.ts       — Combo-box selector with list
      text_input.ts     — Single-line text input
      textarea.ts       — Multi-line text editor with scroll
      listbox.ts        — Scrollable list selector (per-item disabled support via ListBoxItem)
      progress_bar.ts   — Percentage progress bar
      autocomplete.ts   — Dropdown/inline autocomplete
      radio.ts          — RadioButton (disabled state) & RadioGroup (per-option disabled via RadioOption)
      tabs.ts           — Multi-tab container
    splitter.ts         — Draggable horizontal & vertical panel splitter panes
    focus.ts            — Tab cycle focus management & keyboard shortcuts
    events.ts           — Async keyboard and SGR mouse event parser
    theme.ts            — Theme interfaces, registries, and default VS Code styling
  examples/
    01_center_text.ts   — Fixed-size box centering, text alignment, and window resize reflow
    02_focus_zones.ts   — Tab focus cycles, tab-indices, and keyboard shortcuts (1/2/3)
    03_resizable.ts     — Vertical/horizontal nested splitters with mouse resizing
    04_spacing.ts       — Spacing visualizations (gutter, padding, margin)
    05_borders.ts       — Visual preview of all border types (single, double, rounded, bold, none)
    06_showcase.ts      — 7-tab interactive showcase: Layout (scrollable column), Resizable, Shortcuts, Text (with TextArea), UI (Checkboxes, RadioGroup with disabled option, Buttons, Dropdown, ButtonGroup, ListBox with disabled items — includes disabled variants of checkbox, radio, listbox, and button), Animation (spinners, metric bars, countdown)
  deno.json             — Deno config and script tasks
```

---

## Getting Started

### Prerequisites

- **Deno** (v1.40.0 or higher recommended) installed on your system.

### Running the Showcase Dashboard

Execute the comprehensive, interactive showcase dashboard featuring all stateful widgets in real time:

```bash
deno task example:06
```

### Running Other Examples

Check out individual component demos by invoking Deno tasks:

```bash
# Example 01: Centered reactive layout
deno task example:01

# Example 02: Keyboard focus cycles & shortcuts
deno task example:02

# Example 03: Mouse draggable splitter panels
deno task example:03

# Example 04: Gutter, padding, and margin spacing
deno task example:04

# Example 05: Visual border styles side-by-side
deno task example:05
```

---

## Quick API Example

Below is a brief demonstration of how to instantiate a column box, add stateful components, and run a **tuix** application:

```typescript
import { App, Box, Button, TextInput, Checkbox, RadioGroup, defaultTheme } from "./src/mod.ts";

// 1. Create a column layout container
const container = Box.col("Main Layout");
container.style.border = "rounded";
container.style.padding = { top: 1, bottom: 1, left: 2, right: 2 };
container.style.bg = defaultTheme.panelBg;

// 2. Add some stateful TUI components
const inputField = new TextInput("Enter system key...", "", (val) => {
  console.log(`Key changed: ${val}`);
});
inputField.tabIndex = 1;

const telemetryChk = new Checkbox("Enable Remote Logs", false, (checked) => {
  console.log(`Telemetry toggled: ${checked}`);
});
telemetryChk.tabIndex = 2;

const modeGroup = new RadioGroup("Mode", [
  { label: "Automatic", value: "auto" },
  { label: "Manual", value: "manual" },
  { label: "Scheduled", value: "sched" },
], "auto", (val) => {
  console.log(`Mode: ${val}`);
});

const actionBtn = new Button("Apply System Settings", () => {
  console.log("Settings applied successfully!");
});
actionBtn.tabIndex = 3;

// Assemble layout hierarchy
container.add(
  new Box("System Profile"),
  inputField,
  telemetryChk,
  modeGroup,
  actionBtn
);

// 3. Bind to the Main App Loop
const app = new App(container, { theme: defaultTheme, fps: 30, mouse: true });
await app.run();
```

---

## Code Quality & Verification

The **tuix** codebase and all sample applications compile cleanly without any TypeScript errors. You can run automated verification checking via:

```bash
# Type check public modules
deno check src/mod.ts

# Type check all examples
deno check examples/*.ts
```
