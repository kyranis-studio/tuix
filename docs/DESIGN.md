# Design Document - TUIX Architecture

## 1. Core Architecture

TUIX follows a hierarchical component-based architecture with a centralized event loop and a diff-based rendering engine.

### 1.1 Terminal Abstraction Layer (TAL)
- Handles raw ANSI escape sequences.
- Manages TTY modes (raw mode, mouse tracking, alternate screen).
- Parses input stream into high-level events (Key, Mouse, Resize).

### 1.2 Layout Engine (Flex-TUI)
- Implements a simplified flexbox model.
- Supports `direction` (row, column), `justify`, `align`, and `basis/grow/shrink`.
- **Gutter Support**: Automatically applies spacing between children.
- **Z-Index**: Uses a layered rendering approach where higher z-index components are rendered last.

### 1.3 Focus & Event System
- **Focus Tree**: Manages a hierarchy of focusable elements.
- **Navigation Controller**:
    - `Tab`: Depth-first search for the next focusable child within the active layout.
    - `Shift+Tab`/`Ctrl+Tab`: Jump between top-level focusable layouts.
- **Event Bubbling**: Mouse events bubble up from child to parent unless handled.

### 1.4 Rendering Engine
- **Virtual Console**: Maintains an internal buffer of the screen state.
- **Diffing**: Compares the new frame with the previous frame and only outputs ANSI sequences for changed cells.
- **Animations**: A tick-based system to update component properties over time.

## 2. Component Hierarchy

```text
App
└── Screen
    ├── Layer (Z-Index: 0)
    │   ├── Toolbar (Layout: Row)
    │   ├── Main (Layout: Row)
    │   │   ├── SidePanel (Resizable)
    │   │   └── Content (Scrollable)
    │   └── Statusbar
    └── Layer (Z-Index: 100)
        └── Dialog (Modal)
```

## 3. Data Flow
1. **Input**: User presses a key or moves the mouse.
2. **Event Parsing**: TAL converts raw bytes to `TUIEvent`.
3. **Propagation**: `FocusManager` or `Screen` dispatches the event to the targeted component.
4. **State Update**: Component updates its internal state (e.g., text content, focus state).
5. **Re-Layout**: If dimensions changed, the `LayoutEngine` recalculates positions.
6. **Render**: `Renderer` draws the updated component tree to the virtual console.
7. **Flush**: `TAL` writes the diff to the terminal.

## 4. Components Implementation
- **BaseComponent**: Abstract class with lifecycle methods (`onMount`, `onUnmount`, `onEvent`, `render`).
- **LayoutComponent**: Container that manages children positioning.
- **LeafComponents**: Specific UI elements (Button, Input, etc.).
