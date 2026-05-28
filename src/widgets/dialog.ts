/**
 * dialog.ts — Modal dialog widget for tuix.
 *
 * Renders a centered floating dialog with a border, title, body text,
 * and action buttons. Supports keyboard (Tab/Enter/Escape) and mouse interaction.
 */

import { Box, paintCenteredText, paintText, edgesAll, edgesZero, Rect } from "../layout.ts";
import { CellBuffer } from "../terminal.ts";
import { Theme, defaultTheme } from "../theme.ts";
import { Button } from "./button.ts";

export interface DialogButton {
  label: string;
  /** Called when the button is activated. The dialog closes automatically after this fires. */
  action: () => void;
  /** If true, this button is the default (activated by Enter when no button is focused) */
  default?: boolean;
}

/**
 * Creates a modal dialog box.
 *
 * The dialog is a floating Box with double border, title rendered in the
 * top border, body text, and a row of action buttons.
 *
 * Use with `app.showOverlay(dialog)` to display it.
 */
export class Dialog extends Box {
  private _buttons: Button[] = [];
  private _appRef: { removeOverlay: (box: Box) => void; startDrag?: (box: Box, col: number, row: number) => void } | null = null;

  /**
   * @param title     Dialog title (rendered in the top border)
   * @param body      Body text lines
   * @param buttons   Action button definitions
   * @param options
   *   - width: dialog width in chars (default 48)
   */
  constructor(
    title: string,
    body: string[],
    buttons: DialogButton[],
    options?: { width?: number },
  ) {
    super(title);

    const dialogW = options?.width ?? 48;
    // Estimate height: top border (1) + title spacing (2) + body lines + button row (4) + bottom border (1)
    const bodyH = Math.max(body.length, 1);
    const dialogH = 1 + 1 + bodyH + 1 + 4 + 1;

    this.width = { fixed: dialogW };
    this.height = { fixed: dialogH };
    this.style.border = "double";
    this.style.padding = edgesAll(1);
    this.style.bg = defaultTheme.primaryBg; // match VS Code Dark+ panel background

    // Build button row
    const btnRow = Box.row("dialog-btns");
    btnRow.style.justify = "center";
    btnRow.style.gutter = 3;
    btnRow.height = { fixed: 3 };

    for (const def of buttons) {
      const btn = new Button(def.label, def.action);
      btnRow.add(btn);
      this._buttons.push(btn);
    }

    // Build layout: spacer | body | spacer | btnRow
    const layout = Box.col("dialog-layout");
    layout.style.gutter = 0;
    layout.height = { grow: 1 };

    // Top spacer
    const topSpacer = new Box();
    topSpacer.height = { fixed: 1 };

    // Body container
    const bodyBox = Box.col("dialog-body");
    bodyBox.style.gutter = 0;
    bodyBox.height = { grow: 1 };
    for (const line of body) {
      const lb = new Box();
      lb.height = { fixed: 1 };
      lb.onPaint = (buf, rect, theme) => {
        paintCenteredText(buf, rect, line, theme.text, undefined);
      };
      bodyBox.add(lb);
    }

    // Bottom spacer before buttons
    const botSpacer = new Box();
    botSpacer.height = { fixed: 1 };

    layout.add(topSpacer, bodyBox, botSpacer, btnRow);
    this.add(layout);

    // Make first button the default focused
    if (this._buttons.length > 0) {
      this._buttons[0].focusable = true;
      this._buttons[0].tabIndex = 0;
    }
    for (let i = 1; i < this._buttons.length; i++) {
      this._buttons[i].focusable = true;
      this._buttons[i].tabIndex = i;
    }

    // Override button handlers to close the dialog after the button action fires
    for (const btn of this._buttons) {
      const origOnKey = btn.onKey;
      btn.onKey = (key, mods) => {
        origOnKey?.call(btn, key, mods);
        // Button's own onKey calls onClick (the action) — close dialog afterwards
        if (key === "Enter" || key === " ") {
          this.close();
        }
      };
      const origOnMouse = btn.onMouse;
      btn.onMouse = (col, row, action, button) => {
        origOnMouse?.call(btn, col, row, action, button);
        // Button's own onMouse calls onClick (the action) — close dialog afterwards
        if (action === "press") {
          this.close();
        }
      };
    }
  }

  /** Connect the dialog to an App so it can call removeOverlay. */
  set appRef(ref: { removeOverlay: (box: Box) => void; startDrag?: (box: Box, col: number, row: number) => void }) {
    this._appRef = ref;
  }

  /** Close the dialog: removes the overlay (which fires the onClose callback passed to showOverlay). */
  close(): void {
    this._appRef?.removeOverlay(this);
  }

  /** Custom paint for the dialog backdrop and title */
  override paint(buf: CellBuffer, theme: Theme): void {
    const r = this.rect;
    if (r.width <= 0 || r.height <= 0) return;

    // Draw a dim backdrop behind the dialog (semi-transparent tint)
    const { cols, rows } = buf;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Only tint cells outside the dialog rect
        if (col < r.x || col >= r.x + r.width || row < r.y || row >= r.y + r.height) {
          const existing = buf.get(col, row);
          if (existing) {
            // Darken by blending with a dark overlay
            const fg = existing.fg
              ? {
                r: Math.floor(existing.fg.r * 0.3),
                g: Math.floor(existing.fg.g * 0.3),
                b: Math.floor(existing.fg.b * 0.3),
              }
              : undefined;
            buf.set(col, row, {
              char: existing.char,
              fg: fg ?? null,
              bg: existing.bg
                ? {
                  r: Math.floor(existing.bg.r * 0.4),
                  g: Math.floor(existing.bg.g * 0.4),
                  b: Math.floor(existing.bg.b * 0.4),
                }
                : undefined,
            });
          }
        }
      }
    }

    // Let normal paint handle border & children (buttons)
    super.paint(buf, theme);
  }
}
