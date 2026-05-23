# Product Requirements Document: tuix

## Overview
A Deno-native Terminal User Interface (TUI) library that simulates a desktop environment within the terminal. The library provides responsive layouts, focus management, mouse interaction, and a rich set of prebuilt UI components.

## Core Requirements

### 1. Desktop Simulation
- The TUI renders a desktop-like environment with:
  - Taskbar/ toolbar area
  - Panels with distinct background colors
  - Floating windows / dialogs
  - Z-index layering (popups, modals, notifications rendered above base content)

### 2. Responsive Layout System
- A flex-like layout model (simpler than CSS flexbox) supporting:
  - Horizontal and vertical arrangement
  - Grow / shrink / basis sizing
  - Alignment (start, center, end, stretch)
  - Gutters (spacing between children)
- Layouts must recalculate when terminal dimensions change (SIGWINCH)

### 3. Focus Management
- Each layout / component can be **focusable** or **non-focusable**
- Focusable elements have a user-defined **tab index** to control navigation order
- Keyboard navigation:
  - `Tab` — move focus to the next focusable element in the current layout
  - `Shift+Tab` — jump to the next focusable layout (container)
  - `Ctrl+Tab` — jump to the previous focusable layout
- **Direct-access shortcuts**: users can bind key sequences to immediately jump to a section

### 4. Z-Index / Layering
- Every element has a `z_index` property (default 0)
- Higher values render on top
- Used for dialogs, popups, dropdowns, context menus, notifications

### 5. Resizable Layouts
- Splitters / draggable borders between panels
- Mouse-driven resize
- Minimum and maximum size constraints

### 6. Animation
- Smooth transitions for:
  - Show / hide (fade, slide)
  - Resize
  - Focus change (cursor movement)
- Configurable duration and easing (linear, ease-in, ease-out)

### 7. Theming & Styling
- **Color themes**: define foreground, background, accent, disabled, focus colors
- **Component-level backgrounds**: toolbar, panel, input, button each can have distinct colors
- **Borders**: configurable border characters (single `─│`, double `═║`, rounded `╭╮╰╯`, custom characters)
- **State-driven shading**: focused, disabled, hovered, active states each render with different visual styles
- Global theme registry with hot-swappable themes

### 8. Gutter & Spacing
- `gutter` property on containers defines spacing between children (in cells)
- `padding` and `margin` on individual elements

### 9. Predefined UI Components

| Component          | Description |
|--------------------|-------------|
| **Button**         | Clickable button with label, supports disabled state |
| **Checkbox**       | Single checkbox with label |
| **CheckboxList**   | Group of checkboxes with optional "select all" |
| **Radio**          | Single radio option |
| **RadioList**      | Mutually exclusive radio group |
| **Select**         | Dropdown selector with option list |
| **Autocomplete**   | Text input with inline suggestions or dropdown |
| **Tabs**           | Tabbed container with activatable headers |
| **TextInput**      | Single-line text entry with cursor, selection, clipboard |
| **TextArea**       | Multi-line resizable text area |
| **Dialog**         | Modal dialog with title, body, action buttons |
| **Notification**   | Auto-dismissing toast / notification banner |

### 10. Mouse Support
- Click detection on interactive elements (buttons, checkboxes, tabs, etc.)
- Text selection via click-and-drag (copy to system clipboard)
- Paste from clipboard
- Mouse-based resize of splitters and textarea
- Scroll wheel on scrollable containers

## Technical Constraints

### Platform
- **Runtime**: Deno (TypeScript / JavaScript)
- **Terminal**: xterm-compatible (kitty, alacritty, Windows Terminal, iTerm2, etc.)

### Dependencies
- Minimal external dependencies; prefer Deno standard library
- Raw terminal I/O via Deno.stdin / Deno.stdout
- ANSI escape code generation (no ncurses)

### Architecture
- **Virtual DOM**: in-memory representation diffed against previous frame; only changed cells are flushed to terminal
- **Event loop**: non-blocking input processing with async rendering at configurable FPS
- **Widget tree**: composable component tree with recursive layout + paint passes

### Performance Targets
- Render ≤ 16 ms per frame (60 FPS target)
- Support terminals up to 400×150 characters
- Memory: ~50 MB baseline for moderate UIs (50–100 components)

## Out of Scope (v1)
- Image rendering (sixels / kitty protocol)
- Hyperlinks
- GPU-accelerated rendering
- Native OS windowing integration
- Remote / SSH session awareness

## Success Criteria
1. All 12 UI components render correctly and respond to input
2. Focus navigation works across layouts with Tab / Shift+Tab / Ctrl+Tab
3. Mouse click targets are accurate within 1 cell
4. Responsive layout recalculates on terminal resize
5. Theming system allows complete visual overhaul via theme object
6. Z-index layering correctly stacks dialogs above base content
7. Resizable splitters update smoothly with mouse drag
