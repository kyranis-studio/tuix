/**
 * notification.ts — Auto-dismissing toast / notification banner for tuix.
 *
 * Displays a floating notification at a chosen corner of the terminal with a
 * message and close button. Auto-dismisses after a configurable duration.
 * Multiple notifications stack from their corner position.
 *
 * By default notifications appear at the **bottom-right**. Pass `position`
 * to place them elsewhere. Click anywhere on the notification to dismiss.
 */

import { Box, paintCenteredText, paintText, edgesAll, Rect } from "../layout.ts";
import { CellBuffer, getTermSize } from "../terminal.ts";
import { Theme, defaultTheme } from "../theme.ts";

export type NotificationType = "info" | "success" | "warn" | "error";

export type NotificationPosition =
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left";

/**
 * Colours for each notification type.
 * All use the VS Code Dark+ `panelBg` for background; only fg and accent
 * change per type to distinguish info/success/warn/error.
 */
const PANEL_BG = defaultTheme.elevatedBg;

const COLORS: Record<
  NotificationType,
  { fg: { r: number; g: number; b: number }; bg: { r: number; g: number; b: number }; accent: { r: number; g: number; b: number } }
> = {
  info: {
    fg: { r: 160, g: 200, b: 255 },
    bg: PANEL_BG,
    accent: { r: 90, g: 150, b: 255 },
  },
  success: {
    fg: { r: 150, g: 245, b: 160 },
    bg: PANEL_BG,
    accent: { r: 70, g: 210, b: 90 },
  },
  warn: {
    fg: { r: 255, g: 200, b: 130 },
    bg: PANEL_BG,
    accent: { r: 255, g: 180, b: 50 },
  },
  error: {
    fg: { r: 255, g: 140, b: 140 },
    bg: PANEL_BG,
    accent: { r: 255, g: 70, b: 70 },
  },
};

/**
 * A floating notification toast.
 *
 * Usage:
 * ```ts
 * const notif = new Notification("Server started", "success", 4000);
 * app.showOverlay(notif, { modal: false });
 * notif.removeFn = () => app.removeOverlay(notif);
 * notif.show();
 * ```
 */
export class Notification extends Box {
  private _message: string;
  private _nType: NotificationType;
  private _duration: number;
  private _position: NotificationPosition;
  private _timer: number | null = null;
  private _dismissed = false;
  private _removeFn: (() => void) | null = null;

  /**
   * @param message   Notification text to display
   * @param type      Visual style: "info" | "success" | "warn" | "error"
   * @param duration  Auto-dismiss timeout in ms (default 4000, 0 = no auto-dismiss)
   * @param position  Screen corner (default "bottom-right")
   */
  constructor(
    message: string,
    type: NotificationType = "info",
    duration = 4000,
    position: NotificationPosition = "bottom-right",
  ) {
    super("notification");
    this._message = message;
    this._nType = type;
    this._duration = duration;
    this._position = position;

    const colors = COLORS[type];
    this.width = { fixed: 44 };
    this.height = { fixed: 3 };
    this.style.border = "single";
    this.style.bg = colors.bg;
    this.style.padding = edgesAll(0);
    this.focusable = true;
    this.tabIndex = 9999;

    // Inner row: message text (left) | close button (right)
    // Note: don't set a fixed height — let it match the notification's
    // content area height (1 row after border). The items have fixed:1 so
    // they fit naturally in this single row.
    const inner = Box.row("notif-inner");
    inner.style.gutter = 1;
    inner.style.align = "center";

    // Message text area (grows)
    const msgBox = new Box("notif-msg");
    msgBox.width = { grow: 1 };
    msgBox.onPaint = (buf, rect, _t) => {
      const text = this._message.length > rect.width - 2
        ? this._message.slice(0, rect.width - 5) + "..."
        : this._message;
      paintCenteredText(buf, rect, text, colors.fg, defaultTheme.appBg);
    };
    inner.add(msgBox);

    // Close button — labeled "Close" (red on hover/focus)
    const closeBox = new Box("notif-close");
    closeBox.width = { fixed: 7 };
    closeBox.onPaint = (buf, rect, _t) => {
      const hover = closeBox.focused;
      paintCenteredText(
        buf, rect,
        " Close ",
        hover ? { r: 255, g: 80, b: 80 } : colors.accent,
        defaultTheme.appBg,
        true,
      );
    };
    closeBox.onMouse = (_col, _row, action) => {
      if (action === "press") this._dismiss();
    };
    closeBox.focusable = true;
    closeBox.tabIndex = 9998;
    inner.add(closeBox);

    this.add(inner);

    // Click anywhere on the notification to dismiss (not just the Close button)
    this.onMouse = (_col, _row, action) => {
      if (action === "press") this._dismiss();
    };
  }

  /** Set the function to call to remove this notification from the overlay stack. */
  set removeFn(fn: () => void) {
    this._removeFn = fn;
  }

  /** Get the current position. */
  get position(): NotificationPosition {
    return this._position;
  }

  /**
   * Show the notification: start the auto-dismiss timer and position at
   * the configured screen corner.
   */
  show(): void {
    if (this._duration > 0 && !this._dismissed) {
      this._timer = setTimeout(() => this._dismiss(), this._duration);
    }
    this._reposition();
  }

  /** Reposition at the currently configured corner (useful after terminal resize). */
  private _reposition(): void {
    const { cols, rows } = getTermSize();
    const margin = 2;
    switch (this._position) {
      case "top-right":
        this.rect.x = cols - this.rect.width - margin;
        this.rect.y = margin;
        break;
      case "top-left":
        this.rect.x = margin;
        this.rect.y = margin;
        break;
      case "bottom-right":
        this.rect.x = cols - this.rect.width - margin;
        this.rect.y = rows - this.rect.height - margin;
        break;
      case "bottom-left":
        this.rect.x = margin;
        this.rect.y = rows - this.rect.height - margin;
        break;
    }
  }

  /**
   * Dismiss the notification immediately.
   * Safe to call multiple times.
   */
  private _dismiss(): void {
    if (this._dismissed) return;
    this._dismissed = true;
    if (this._timer !== null) {
      clearTimeout(this._timer);
      this._timer = null;
    }
    this._removeFn?.();
  }

  /** Cancel the auto-dismiss timer (for cleanup without dismissing). */
  cancel(): void {
    if (this._timer !== null) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }
}
