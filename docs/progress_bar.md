# ProgressBar

A percentage progress bar using `█`/`░` block characters with a percentage label.

```typescript
import { ProgressBar } from "jsr:@kyranis-studio/tuix";
```

---

## Constructor

```typescript
const bar = new ProgressBar("Task Progress", 0.35);
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `label` | `string` | `""` | Not rendered visually (available as Box label) |
| `progress` | `number` | `0` | Initial progress (0.0 – 1.0) |

---

## Properties

```typescript
bar.progress;        // get/set — 0.0 to 1.0
bar.progress = 0.75; // Update value
```

The setter clamps values to `[0, 1]`.

## Visual

The bar fills from left to right with `highlight`-colored `█` blocks. Unfilled space uses `muted`-colored `░`. The percentage label (e.g. ` 35%`) is displayed at the right, bold in `highlight`.

```
████████░░░░░░░░░░  50%
```

## Height

Fixed height of 1 row, not focusable.
