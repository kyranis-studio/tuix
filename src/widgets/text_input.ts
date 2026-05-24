import { Box } from "../layout.ts";
import { copyToClipboard, pasteFromClipboard } from "../clipboard.ts";
import { Notification } from "./notification.ts";

export class TextInput extends Box {
  value = "";
  placeholder = "";
  cursorPos = 0;
  onChange: ((val: string) => void) | null = null;
  onSubmit: ((val: string) => void) | null = null;
  copyOnSelect: boolean;
  notifyOnCopy: boolean;
  copyNotificationMessage: string;
  private _appRef: {
    showOverlay: (box: Box, opts?: { modal?: boolean; onClose?: () => void }) => void;
    removeOverlay: (box: Box) => void;
  } | null = null;

  // Selection state for mouse drag-to-select
  private _selStart = -1;
  private _selEnd = -1;

  constructor(
    placeholder = "",
    value = "",
    onChange?: (val: string) => void,
    copyOnSelect = false,
    notifyOnCopy = false,
    copyNotificationMessage = "Copied!",
  ) {
    super("Input");
    this.focusable = true;
    this.tabIndex = 0;
    this.placeholder = placeholder;
    this.value = value;
    this.cursorPos = 0;
    this.onChange = onChange ?? null;
    this.copyOnSelect = copyOnSelect;
    this.notifyOnCopy = notifyOnCopy;
    this.copyNotificationMessage = copyNotificationMessage;

    this.style.border = "single";
    this.style.padding = { top: 0, bottom: 0, left: 1, right: 1 };
    this.height = { fixed: 3 };

    this.onFocus = () => {
      this.cursorPos = 0;
    };

    this.onPaint = (buf, rect, theme) => {
      const isFocused = this.focused;
      const showPlaceholder = !this.value;
      const displayText = showPlaceholder ? this.placeholder : this.value;
      const fg = showPlaceholder ? theme.muted : theme.text;
      const bg = theme.panelBg;

      const selActive = this._selStart >= 0 && this._selEnd >= 0 && this._selStart !== this._selEnd;
      const selMin = selActive ? Math.min(this._selStart, this._selEnd) : -1;
      const selMax = selActive ? Math.max(this._selStart, this._selEnd) : -1;

      for (let i = 0; i < rect.width; i++) {
        const inSel = selActive && i >= selMin && i < selMax;
        const isCursorHere = isFocused && i === this.cursorPos;

        if (i < displayText.length) {
          if (inSel && isCursorHere) {
            // Cursor within selection: brighter block
            buf.set(rect.x + i, rect.y, {
              char: displayText[i],
              fg: theme.highlight,
              bg: theme.text,
              bold: true,
            });
          } else if (inSel) {
            buf.set(rect.x + i, rect.y, {
              char: displayText[i],
              fg: theme.bg,
              bg: theme.highlight,
            });
          } else if (isCursorHere) {
            buf.set(rect.x + i, rect.y, {
              char: displayText[i],
              fg: bg,
              bg: fg,
              bold: true,
            });
          } else {
            buf.set(rect.x + i, rect.y, {
              char: displayText[i],
              fg,
              bg,
            });
          }
        } else if (isCursorHere) {
          buf.set(rect.x + i, rect.y, {
            char: " ",
            fg: bg,
            bg: theme.highlight,
          });
        } else {
          buf.set(rect.x + i, rect.y, { char: " ", fg, bg });
        }
      }
    };

    this.onKey = (key, modifiers) => {
      // Save selection before clearing (copy handler needs it)
      const selStart = this._selStart;
      const selEnd = this._selEnd;

      // Any keyboard input clears the text selection
      this._selStart = -1;
      this._selEnd = -1;

      // Ctrl+Shift+C: copy selected text (or whole value) to clipboard
      if (key === "c" && modifiers.ctrl && modifiers.shift) {
        if (selStart >= 0 && selEnd >= 0 && selStart !== selEnd) {
          const start = Math.min(selStart, selEnd);
          const end = Math.max(selStart, selEnd);
          copyToClipboard(this.value.slice(start, end));
        } else {
          copyToClipboard(this.value);
        }
        return;
      }

      // Ctrl+Shift+V: paste from clipboard at cursor
      if (key === "v" && modifiers.ctrl && modifiers.shift) {
        pasteFromClipboard().then((text) => {
          if (text) {
            this.value =
              this.value.slice(0, this.cursorPos) +
              text +
              this.value.slice(this.cursorPos);
            this.cursorPos += text.length;
            if (this.onChange) this.onChange(this.value);
          }
        });
        return;
      }

      if (key === "Backspace") {
        if (this.cursorPos > 0) {
          this.value = this.value.slice(0, this.cursorPos - 1) + this.value.slice(this.cursorPos);
          this.cursorPos--;
          if (this.onChange) this.onChange(this.value);
        }
      } else if (key === "Enter") {
        if (this.onSubmit) this.onSubmit(this.value);
      } else if (key === "ArrowLeft") {
        if (this.cursorPos > 0) this.cursorPos--;
      } else if (key === "ArrowRight") {
        if (this.cursorPos < this.value.length) this.cursorPos++;
      } else if (key === "Home") {
        this.cursorPos = 0;
      } else if (key === "End") {
        this.cursorPos = this.value.length;
      } else if (key.length === 1 && !modifiers.ctrl && !modifiers.alt) {
        this.value = this.value.slice(0, this.cursorPos) + key + this.value.slice(this.cursorPos);
        this.cursorPos++;
        if (this.onChange) this.onChange(this.value);
      }
    };

    this.onMouse = (col, row, action, button) => {
      const hasBorder = this.style.border !== "none";
      const bOff = hasBorder ? 1 : 0;
      const p = this.style.padding;
      const contentX = this.rect.x + bOff + p.left;
      const contentY = this.rect.y + bOff + p.top;

      // Right-click: paste from clipboard at cursor position
      if (button === 2 && action === "release") {
        pasteFromClipboard().then((text) => {
          if (text) {
            this.value =
              this.value.slice(0, this.cursorPos) +
              text +
              this.value.slice(this.cursorPos);
            this.cursorPos += text.length;
            if (this.onChange) this.onChange(this.value);
          }
        });
        return;
      }

      if (button !== 0) return;

      const relCol = col - contentX;
      const pos = Math.max(0, Math.min(relCol, this.value.length));
      this.cursorPos = pos;

      if (action === "press") {
        this._selStart = pos;
        this._selEnd = pos;
      } else if (action === "move") {
        this._selEnd = pos;
      } else if (action === "release") {
        if (this.copyOnSelect && this._selStart >= 0 && this._selEnd >= 0 && this._selStart !== this._selEnd) {
          const start = Math.min(this._selStart, this._selEnd);
          const end = Math.max(this._selStart, this._selEnd);
          const selected = this.value.slice(start, end);
          copyToClipboard(selected);
          if (this.notifyOnCopy && this._appRef) {
            const notif = new Notification(this.copyNotificationMessage, "info", 1500);
            this._appRef.showOverlay(notif, { modal: false });
            notif.removeFn = () => this._appRef!.removeOverlay(notif);
            notif.show();
          }
        }
      }
    };
  }

  /** Reference to the App for showing overlay notifications on copy. */
  set appRef(
    ref: {
      showOverlay: (box: Box, opts?: { modal?: boolean; onClose?: () => void }) => void;
      removeOverlay: (box: Box) => void;
    } | null,
  ) {
    this._appRef = ref;
  }
}
