# Tabs

A multi-tab container with keyboard and mouse tab switching. Each tab has a label and a content box — only the active tab's content is visible.

```typescript
import { Tabs } from "jsr:@kyranis-studio/tuix";
```

---

## Constructor

```typescript
const tabs = new Tabs(
  [
    { label: "Layout", content: layoutBox },
    { label: "Text", content: textBox },
    { label: "UI", content: uiBox },
  ],
  0, // active tab index
);
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `tabs` | `TabDefinition[]` | `[]` | Array of tab definitions |
| `activeIndex` | `number` | `0` | Initially active tab |

### TabDefinition

```typescript
interface TabDefinition {
  label: string;  // Tab label displayed in the tab bar
  content: Box;   // Content widget (shown when tab is active)
}
```

---

## Interaction

| Key | Action |
|-----|--------|
| `ArrowRight` | Switch to next tab |
| `ArrowLeft` | Switch to previous tab |
| Mouse click on tab label | Switch to clicked tab |

---

## Properties

```typescript
tabs.tabs;         // TabDefinition[] — all tabs
tabs.activeIndex;  // Currently active index
tabs.onTabChange;  // (index: number) => void
```

## Visual

The active tab label has `highlight` background with `bg` text. Inactive tabs use `toolbarBg` background with `toolbarText`. The tab bar is a single row at the top of the widget's content area.
