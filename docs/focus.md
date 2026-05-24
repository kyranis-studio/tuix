# Focus

The `FocusManager` (`src/focus.ts`) manages keyboard focus navigation across the widget tree.

---

## How It Works

The focus manager collects all `focusable` boxes across one or more root trees, sorts them by `tabIndex`, and provides next/previous cycling. It also supports direct shortcut jumps.

---

## Focusable Boxes

A box participates in focus navigation when `box.focusable = true`:

```typescript
const button = new Button("Click me");
button.focusable = true;
button.tabIndex = 0; // lower numbers come first
```

`tabIndex` determines focus order. Boxes are sorted ascending.

---

## Tab / Shift+Tab Cycling

The `App._handleEvent()` method intercepts Tab/Shift+Tab:

```typescript
// Tab — focus next
this.focus.focusNext();

// Shift+Tab — focus previous
this.focus.focusPrev();
```

The cycle wraps around — from the last element back to the first.

Tab can be consumed by a widget via `handleTab`:

```typescript
box.handleTab = () => {
  // Custom Tab handling (e.g., close dropdown)
  return true; // prevents focus navigation
};
```

---

## Shortcut Jumps

Register a key to jump focus directly to a box:

```typescript
app.shortcut("1", zone1Box);
app.shortcut("2", zone2Box);
```

Pressing the key jumps focus to that box. This calls `FocusManager.registerShortcut()` which also sets `box.shortcut`.

---

## FocusManager API

```typescript
const fm = app.focusManager;

fm.setRoot(rootBox, ...overlays);  // Set tree roots for focus collection
fm.registerShortcut("1", box);     // Register shortcut key
fm.current();                       // Currently focused box, or null
fm.focusBox(box);                   // Focus a specific box
fm.focusFirst();                    // Focus the first focusable box
fm.focusNext();                     // Cycle forward (returns true on success)
fm.focusPrev();                     // Cycle backward (returns true on success)
fm.handleShortcut("1");             // Try shortcut jump (returns true if handled)
fm.dispatchKey("Enter", mods);      // Send key to focused widget's onKey
```

---

## Focus Visuals

When a box gains focus, `box.focused` is set to `true` and `box.onFocus?.()` is called. Each widget uses this state to render differently — buttons get highlighted borders, inputs show a cursor, etc. The `theme.focusBorder` color is typically used for focused borders.
