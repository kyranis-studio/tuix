# Collapsible

A collapsible section with a `▶`/`▼` header that shows or hides its content.

```typescript
import { Collapsible } from "../src/mod.ts";
```

---

## Constructor

```typescript
const section = new Collapsible(
  "Advanced Options",
  true,        // collapsed (default false)
  (collapsed) => console.log(`Collapsed: ${collapsed}`),
);
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `label` | `string` | — | Header text |
| `collapsed` | `boolean` | `false` | Initial collapsed state |
| `onChange` | `(collapsed) => void` | `null` | Called on toggle |

---

## Usage

```typescript
section.add(
  new Checkbox("Verbose Logging", false),
  new Checkbox("Auto-save", true),
);
```

Children are added to the content area via `section.add()`.

## Interaction

| Key | Action |
|-----|--------|
| `Enter` / `Space` | Toggle collapsed state |
| Mouse click on header | Toggle collapsed state |

## Properties

```typescript
section.collapsed;     // Current state
section.headerBox;     // Box — the header row (customise style)
section.contentBox;    // Box — the content container
section.onChange;      // (collapsed: boolean) => void
```

## Methods

```typescript
section.toggle();      // Toggle state
section.expand();      // Expand to show content
section.collapse();    // Collapse to hide content
```

## Visual

- Collapsed: `▶ Advanced Options` — content hidden
- Expanded: `▼ Advanced Options` — content visible below header
- Focused header uses `theme.highlight` for the indicator and text
