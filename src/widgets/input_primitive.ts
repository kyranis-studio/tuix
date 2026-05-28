import { Box, Rect } from "../layout.ts";
import { CellBuffer } from "../terminal.ts";
import { Theme } from "../theme.ts";
import { copyToClipboard, pasteFromClipboard } from "../clipboard.ts";
import { Notification } from "./notification.ts";

export type AppOverlayRef = {
  showOverlay: (box: Box, opts?: { modal?: boolean; onClose?: () => void }) => void;
  removeOverlay: (box: Box) => void;
};

/** Result returned by a KeyPressHandler to control input behavior. */
export type KeyPressResult = {
  /** New value for the input (replaces current value). */
  value?: string;
  /** New cursor position. */
  cursorPos?: number;
  /** If true, the key event is consumed and no further processing occurs. */
  consumed?: boolean;
};

/** Handler invoked on every key press before the default processing.
 *  Return a KeyPressResult to modify the value, cursor position, or consume the event entirely.
 *  Return undefined/void to let the default processing take effect. */
export type KeyPressHandler = (
  key: string,
  modifiers: { ctrl: boolean; alt: boolean; shift: boolean },
  state: { value: string; cursorPos: number },
) => KeyPressResult | void;

export abstract class InputPrimitive extends Box {
  value = "";
  placeholder = "";
  cursorPos = 0;
  onChange: ((val: string) => void) | null = null;
  onSubmit: ((val: string) => void) | null = null;
  copyOnSelect: boolean;
  notifyOnCopy: boolean;
  copyNotificationMessage: string;

  /** External hook fired on each key press. Allows modifying value, cursor, or blocking input. */
  onKeyPress: KeyPressHandler | null = null;

  /** Handler for clipboard paste operations (set by createPasteBurstHandler).
   *  Called from _pasteAtCursor() after text is inserted. */
  clipboardPasteHandler: ((widget: InputPrimitive, insertPos: number, text: string) => void) | null = null;

  protected _appRef: AppOverlayRef | null = null;

  /** Instance-level paste shade palette (overrides static default if set). */
  pasteShades: Array<{ r: number; g: number; b: number }> | null = null;

  // Palette of foreground colors for paste marker shading (cycles)
  private static _DEFAULT_PASTE_SHADES: Array<{ r: number; g: number; b: number }> = [
    { r: 160, g: 120, b: 255 },   // purple
    { r: 255, g: 170, b: 80 },    // orange
    { r: 80, g: 180, b: 255 },    // blue
    { r: 255, g: 130, b: 170 },   // pink
    { r: 120, g: 230, b: 120 },   // green
    { r: 255, g: 210, b: 80 },    // gold
    { r: 200, g: 140, b: 220 },   // lavender
    { r: 100, g: 220, b: 220 },   // teal
  ];

  /** Get the shade color for a paste marker by its 1-based paste index.
   *  Uses the instance-level `pasteShades` if set, otherwise falls back to the static default palette. */
  getPasteShade(index: number): { r: number; g: number; b: number } {
    const palette = this.pasteShades ?? InputPrimitive._DEFAULT_PASTE_SHADES;
    return palette[(index - 1) % palette.length];
  }

  /** Create a KeyPressHandler that detects terminal paste bursts (fast-arriving key events)
   *  and replaces them with colored paste markers. Use with `widget.onKeyPress = ...`.
   *
   *  Also returns a `handleClipboardPaste` helper for clipboard paste operations.
   */
  static createPasteBurstHandler(config?: {
    threshold?: number;
    trackEnter?: boolean;
  }): {
    onKeyPress: KeyPressHandler;
    /** Apply a paste marker after clipboard paste. Call after inserting text into the widget. */
    handleClipboardPaste: (widget: InputPrimitive, insertPos: number, text: string) => void;
  } {
    const threshold = config?.threshold ?? 50;
    const trackEnter = config?.trackEnter ?? false;
    const BURST_MS = 80;

    let burstPos = -1;
    let burstText = "";
    let lastKeyTime = 0;
    let burstReplaced = false;
    let burstTimer: number | null = null;
    let pasteCount = 0;

    function finalizeBurst(widget: InputPrimitive): void {
      if (burstTimer !== null) {
        clearTimeout(burstTimer);
        burstTimer = null;
      }
      if (burstPos < 0) return;

      if (!burstReplaced && burstText.length > threshold) {
        pasteCount++;
        const lineCount = burstText.split("\n").length;
        const marker = `copied text ${pasteCount} [${lineCount} line]`;
        const valBefore = widget.value;
        const actualText = valBefore.slice(burstPos, burstPos + burstText.length);
        if (actualText === burstText) {
          widget.value =
            valBefore.slice(0, burstPos) +
            marker +
            valBefore.slice(burstPos + burstText.length);
          widget.cursorPos = burstPos + marker.length;
          burstText = marker;
          burstReplaced = true;
          widget._onValueChanged();
          if (widget.onChange) widget.onChange(widget.value);
        }
      }
      burstPos = -1;
      burstText = "";
    }

    function scheduleFinalize(widget: InputPrimitive): void {
      if (burstTimer) clearTimeout(burstTimer);
      burstTimer = setTimeout(() => {
        finalizeBurst(widget);
        burstTimer = null;
      }, BURST_MS);
    }

    const handler: KeyPressHandler = function(
      this: InputPrimitive,
      key,
      modifiers,
      state,
    ) {
      const isPrintable = !modifiers.ctrl && !modifiers.alt && key.length === 1;
      const shouldTrack = isPrintable || (trackEnter && key === "Enter");

      if (!shouldTrack) {
        finalizeBurst(this);
        return;
      }

      if (burstTimer !== null) {
        clearTimeout(burstTimer);
        burstTimer = null;
      }

      const now = Date.now();
      const inBurst = burstPos >= 0 &&
        now - lastKeyTime < BURST_MS &&
        state.cursorPos === burstPos + burstText.length;

      if (!inBurst) {
        finalizeBurst(this);
        burstPos = state.cursorPos;
        burstText = key === "Enter" ? "\n" : key;
        burstReplaced = false;
      } else {
        burstText += key === "Enter" ? "\n" : key;
      }
      lastKeyTime = now;

      scheduleFinalize(this);
      return; // Let default processing continue
    };

    function handleClipboardPaste(
      widget: InputPrimitive,
      insertPos: number,
      text: string,
    ): void {
      if (text.length > threshold) {
        pasteCount++;
        const lineCount = text.split("\n").length;
        const marker = `copied text ${pasteCount} [${lineCount} line]`;
        widget.value =
          widget.value.slice(0, insertPos) +
          marker +
          widget.value.slice(insertPos + text.length);
        widget.cursorPos = insertPos + marker.length;
      }
    }

    return { onKeyPress: handler, handleClipboardPaste };
  }

  // Selection state for mouse drag-to-select
  protected _selStart = -1;
  protected _selEnd = -1;

  // Double/triple click tracking
  private _lastClickTime = 0;
  private _lastClickPos = -1;
  private _clickCount = 0;

  constructor(
    label: string,
    placeholder = "",
    value = "",
    onChange?: ((val: string) => void) | null,
    copyOnSelect = false,
    notifyOnCopy = false,
    copyNotificationMessage = "Copied!",
  ) {
    super(label);
    this.focusable = true;
    this.tabIndex = 0;
    this.placeholder = placeholder;
    this.value = value;
    this.cursorPos = value.length;
    this.onChange = onChange ?? null;
    this.copyOnSelect = copyOnSelect;
    this.notifyOnCopy = notifyOnCopy;
    this.copyNotificationMessage = copyNotificationMessage;

    this.style.border = "single";
    this.style.padding = { top: 0, bottom: 0, left: 1, right: 1 };

    this.onKey = (key, modifiers) => this._handleKey(key, modifiers);
    this.onMouse = (col, row, action, button) => this._handleMouse(col, row, action, button);
  }

  /** Reference to the App for showing overlay notifications on copy. */
  set appRef(ref: AppOverlayRef | null) {
    this._appRef = ref;
  }

  // ────────────────────────────────────────────────────────────
  //  Key handling
  // ────────────────────────────────────────────────────────────

  private _handleKey(
    key: string,
    modifiers: { ctrl: boolean; alt: boolean; shift: boolean },
  ): void {
    const isPrintable = this._isPrintable(key, modifiers);

    // ── Selection deletion ──
    if (this._hasSelection()) {
      if (key === "Backspace" || key === "Delete") {
        this._deleteSelection();
        return;
      }
      if (isPrintable) {
        const start = Math.min(this._selStart, this._selEnd);
        const end = Math.max(this._selStart, this._selEnd);
        this.value = this.value.slice(0, start) + key + this.value.slice(end);
        this.cursorPos = start + key.length;
        this._clearSelection();
        this._onValueChanged();
        if (this.onChange) this.onChange(this.value);
        return;
      }
    }

    this._clearSelection();

    // ── External onKeyPress hook ──
    if (this.onKeyPress) {
      const result = this.onKeyPress(key, modifiers, {
        value: this.value,
        cursorPos: this.cursorPos,
      });
      if (result) {
        if (result.consumed) return;
        if (result.value !== undefined) {
          this.value = result.value;
        }
        if (result.cursorPos !== undefined) {
          this.cursorPos = result.cursorPos;
        }
      }
    }

    if (this._onBeforeKey(key, modifiers)) return;

    // Clipboard
    if (this._handleClipboardKeys(key, modifiers)) return;

    // Core keys
    if (key === "Backspace") {
      if (this.cursorPos > 0) {
        // Special: delete entire paste range if cursor is at the end of one
        const ranges = this._findPasteRanges();
        const at = ranges.find((r) => r.end === this.cursorPos);
        if (at) {
          this.value =
            this.value.slice(0, at.start) + this.value.slice(at.end);
          this.cursorPos = at.start;
          this._onValueChanged();
          if (this.onChange) this.onChange(this.value);
          return;
        }

        // Correctly handle backspacing multi-byte characters
        const before = this.value.slice(0, this.cursorPos);
        const chars = [...before];
        if (chars.length > 0) {
          const lastChar = chars.pop()!;
          this.value = chars.join("") + this.value.slice(this.cursorPos);
          this.cursorPos -= lastChar.length;
          this._onValueChanged();
          if (this.onChange) this.onChange(this.value);
        }
      }
    } else if (key === "Delete") {
      if (this.cursorPos < this.value.length) {
        // Special: delete entire paste range if cursor is at the start of one
        const ranges = this._findPasteRanges();
        const at = ranges.find((r) => r.start === this.cursorPos);
        if (at) {
          this.value =
            this.value.slice(0, at.start) + this.value.slice(at.end);
          this.cursorPos = at.start;
          this._onValueChanged();
          if (this.onChange) this.onChange(this.value);
          return;
        }

        // Correctly handle deleting multi-byte characters
        const after = this.value.slice(this.cursorPos);
        const chars = [...after];
        if (chars.length > 0) {
          const firstChar = chars.shift()!;
          this.value = this.value.slice(0, this.cursorPos) + chars.join("");
          this._onValueChanged();
          if (this.onChange) this.onChange(this.value);
        }
      }
    } else if (key === "Enter") {
      this._onEnter();
    } else if (key === "ArrowLeft") {
      if (this.cursorPos > 0) {
        const before = this.value.slice(0, this.cursorPos);
        const chars = [...before];
        if (chars.length > 0) {
          this.cursorPos -= chars.pop()!.length;
        }
      }
    } else if (key === "ArrowRight") {
      if (this.cursorPos < this.value.length) {
        const after = this.value.slice(this.cursorPos);
        const chars = [...after];
        if (chars.length > 0) {
          this.cursorPos += chars[0].length;
        }
      }
    } else if (key === "ArrowUp") {
      this._onArrowUp();
    } else if (key === "ArrowDown") {
      this._onArrowDown();
    } else if (key === "Home") {
      this._onHome(modifiers);
    } else if (key === "End") {
      this._onEnd(modifiers);
    } else if (isPrintable) {
      this.value =
        this.value.slice(0, this.cursorPos) +
        key +
        this.value.slice(this.cursorPos);
      this.cursorPos += key.length;
      this._onValueChanged();
      if (this.onChange) this.onChange(this.value);
    }
  }

  protected _isPrintable(key: string, modifiers: { ctrl: boolean; alt: boolean; shift: boolean }): boolean {
    if (modifiers.ctrl || modifiers.alt) return false;
    const specials = [
      "Enter", "Tab", "Backspace", "Delete", "Escape", "Insert",
      "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
      "Home", "End", "PageUp", "PageDown",
      "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12"
    ];
    return key.length > 0 && !specials.includes(key);
  }

  private _handleClipboardKeys(
    key: string,
    modifiers: { ctrl: boolean; alt: boolean; shift: boolean },
  ): boolean {
    // Copy: Ctrl+Shift+C (terminal default)
    if (key === "c" && modifiers.ctrl && modifiers.shift) {
      if (this._hasSelection()) {
        const start = Math.min(this._selStart, this._selEnd);
        const end = Math.max(this._selStart, this._selEnd);
        copyToClipboard(this.value.slice(start, end));
      } else {
        copyToClipboard(this.value);
      }
      if (this.notifyOnCopy && this._appRef) {
        const notif = new Notification(
          this.copyNotificationMessage,
          "info",
          1500,
        );
        this._appRef.showOverlay(notif, { modal: false });
        notif.removeFn = () => this._appRef!.removeOverlay(notif);
        notif.show();
      }
      return true;
    }

    // Paste: Ctrl+V or Ctrl+Shift+V (terminal default)
    if (key === "v" && modifiers.ctrl) {
      this._pasteAtCursor();
      return true;
    }

    return false;
  }

  // ────────────────────────────────────────────────────────────
  //  Mouse handling
  // ────────────────────────────────────────────────────────────

  private _handleMouse(
    col: number,
    row: number,
    action: string,
    button: number,
  ): void {
    const hasBorder = this.style.border !== "none";
    const bOff = hasBorder ? 1 : 0;
    const p = this.style.padding;
    const contentX = this.rect.x + bOff + p.left;
    const contentY = this.rect.y + bOff + p.top;

    if (button === 2 && action === "release") {
      this._pasteAtCursor();
      return;
    }

    if (button !== 0) return;

    const pos = this._mouseToCursor(col, row, contentX, contentY);
    if (pos === null) return;

    this.cursorPos = pos;

    if (action === "press") {
      const now = Date.now();
      if (now - this._lastClickTime < 300 && pos === this._lastClickPos) {
        this._clickCount++;
      } else {
        this._clickCount = 1;
      }
      this._lastClickTime = now;
      this._lastClickPos = pos;

      if (this._clickCount >= 3) {
        this._selectLine();
      } else if (this._clickCount === 2) {
        this._selectWord();
      } else {
        this._selStart = pos;
        this._selEnd = pos;
      }
    } else if (action === "move") {
      this._selEnd = pos;
    } else if (action === "release") {
      if (this._hasSelection()) {
        this._autoCopySelection();
      }
    }
  }

  /** Convert terminal coordinates to a cursor position in the value string.
   *  Returns null if the click is outside the content area (subclass may
   *  still have handled it). */
  protected _mouseToCursor(
    col: number,
    row: number,
    contentX: number,
    contentY: number,
  ): number | null {
    const relCol = col - contentX;
    return Math.max(0, Math.min(relCol, this.value.length));
  }

  // ────────────────────────────────────────────────────────────
  //  Selection helpers
  // ────────────────────────────────────────────────────────────

  protected _hasSelection(): boolean {
    return (
      this._selStart >= 0 &&
      this._selEnd >= 0 &&
      this._selStart !== this._selEnd
    );
  }

  protected _clearSelection(): void {
    this._selStart = -1;
    this._selEnd = -1;
  }

  protected _deleteSelection(): void {
    const start = Math.min(this._selStart, this._selEnd);
    const end = Math.max(this._selStart, this._selEnd);
    this.value =
      this.value.slice(0, start) + this.value.slice(end);
    this.cursorPos = start;
    this._clearSelection();
    this._onValueChanged();
    if (this.onChange) this.onChange(this.value);
  }

  protected _autoCopySelection(): void {
    const start = Math.min(this._selStart, this._selEnd);
    const end = Math.max(this._selStart, this._selEnd);
    const selected = this.value.slice(start, end);
    copyToClipboard(selected);
    if (this.notifyOnCopy && this._appRef) {
      const notif = new Notification(
        this.copyNotificationMessage,
        "info",
        1500,
      );
      this._appRef.showOverlay(notif, { modal: false });
      notif.removeFn = () => this._appRef!.removeOverlay(notif);
      notif.show();
    }
  }

  /** Select the word at the current cursor position. */
  protected _selectWord(): void {
    if (!this.value) return;
    const pos = Math.min(this.cursorPos, this.value.length - 1);

    let start = pos;
    while (start > 0 && /\w/.test(this.value[start - 1])) start--;
    if (start === pos) {
      while (start > 0 && !/\w/.test(this.value[start - 1])) start--;
    }

    let end = pos;
    while (end < this.value.length && /\w/.test(this.value[end])) end++;
    if (end === pos) {
      while (end < this.value.length && !/\w/.test(this.value[end])) end++;
    }

    this._selStart = start;
    this._selEnd = end;
    this.cursorPos = end;
  }

  /** Select the entire line. Overridden in TextArea for multi-line. */
  protected _selectLine(): void {
    this._selStart = 0;
    this._selEnd = this.value.length;
    this.cursorPos = this.value.length;
  }

  // ────────────────────────────────────────────────────────────
  //  Paste
  // ────────────────────────────────────────────────────────────

  protected _pasteAtCursor(): void {
    pasteFromClipboard().then((text) => {
      if (!text) return;

      const insertPos = this._hasSelection()
        ? Math.min(this._selStart, this._selEnd)
        : this.cursorPos;

      if (this._hasSelection()) {
        const end = Math.max(this._selStart, this._selEnd);
        this.value =
          this.value.slice(0, insertPos) + this.value.slice(end);
        this.cursorPos = insertPos;
        this._clearSelection();
      }

      this.value =
        this.value.slice(0, insertPos) +
        text +
        this.value.slice(insertPos);
      this.cursorPos = insertPos + text.length;

      if (this.clipboardPasteHandler) {
        this.clipboardPasteHandler(this, insertPos, text);
      }

      this._onValueChanged();
      if (this.onChange) this.onChange(this.value);
    });
  }

  /** Scan the value for paste marker blocks. */
  protected _findPasteRanges(): Array<{start: number; end: number; pasteIndex: number}> {
    const ranges: Array<{start: number; end: number; pasteIndex: number}> = [];
    const re = /copied text (\d+) \[(\d+) line]/g;
    let match;
    while ((match = re.exec(this.value)) !== null) {
      ranges.push({
        start: match.index,
        end: match.index + match[0].length,
        pasteIndex: parseInt(match[1], 10),
      });
    }
    return ranges;
  }

  // ────────────────────────────────────────────────────────────
  //  Override points for subclasses
  // ────────────────────────────────────────────────────────────

  /** Called before each key event in the base handler.
   *  Return true to consume the event and prevent further processing. */
  protected _onBeforeKey(
    _key: string,
    _modifiers: { ctrl: boolean; alt: boolean; shift: boolean },
  ): boolean {
    return false;
  }

  /** Called when Enter is pressed. */
  protected _onEnter(): void {
    if (this.onSubmit) this.onSubmit(this.value);
  }

  /** Called when ArrowUp is pressed. */
  protected _onArrowUp(): void {}

  /** Called when ArrowDown is pressed. */
  protected _onArrowDown(): void {}

  /** Called when Home is pressed. */
  protected _onHome(
    _modifiers: { ctrl: boolean; alt: boolean; shift: boolean },
  ): void {
    this.cursorPos = 0;
  }

  /** Called when End is pressed. */
  protected _onEnd(
    _modifiers: { ctrl: boolean; alt: boolean; shift: boolean },
  ): void {
    this.cursorPos = this.value.length;
  }

  /** Called after the value changes (for side effects like height sync). */
  protected _onValueChanged(): void {}

  /** Return the display character for a given character from the input value.
   *  Override in subclasses (e.g. PasswordInput) to mask the displayed text. */
  protected _getDisplayChar(ch: string): string {
    return ch;
  }

  /** Subclasses must render their content here. */
  abstract renderContent(
    buf: CellBuffer,
    rect: Rect,
    theme: Theme,
  ): void;
}
