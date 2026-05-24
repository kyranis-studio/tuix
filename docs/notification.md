# Notification

An auto-dismissing toast notification that floats at a terminal corner. Supports info, success, warn, and error types.

```typescript
import { Notification } from "../src/mod.ts";
```

---

## Constructor

```typescript
const notif = new Notification(
  "Build completed successfully",
  "success",
  3000,
  "bottom-right",
);
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `message` | `string` | — | Notification text |
| `type` | `NotificationType` | `"info"` | Visual style |
| `duration` | `number` | `4000` | Auto-dismiss timeout (ms, 0 = no dismiss) |
| `position` | `NotificationPosition` | `"bottom-right"` | Screen corner |

### Types

```typescript
type NotificationType = "info" | "success" | "warn" | "error";
```

Each type has a unique foreground and accent color:
- **info** — blue tones
- **success** — green tones
- **warn** — orange/yellow tones
- **error** — red tones

### Positions

```typescript
type NotificationPosition = "top-right" | "top-left" | "bottom-right" | "bottom-left";
```

---

## Usage

```typescript
notif.removeFn = () => app.removeOverlay(notif);
app.showOverlay(notif, { modal: false });
notif.show();
```

The `show()` method starts the auto-dismiss timer and positions the notification at the configured corner.

## Interaction

| Action | Behavior |
|--------|----------|
| Click anywhere | Dismiss immediately |
| Click "Close" button | Dismiss immediately |

## Properties

```typescript
notif.position;  // Get current position
notif.removeFn;  // Set the removal function
```

## Methods

```typescript
notif.show();    // Display + start auto-dismiss timer
notif.cancel();  // Cancel auto-dismiss without removing
```

## Visual

- Single border with type-specific accent color
- Message on the left, "Close" button on the right
- The "Close" button turns red on hover/focus
