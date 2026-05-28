import { Box, Rect } from "../layout.ts";
import { FloatingListBox } from "./floating_list.ts";

export class Dropdown extends Box {
  options: string[] = [];
  selectedIndex = 0;
  open = false;
  onChange: ((value: string, index: number) => void) | null = null;
  maxVisible = 6;

  private _listOverlay: FloatingListBox | null = null;
  private _appRef: {
    showOverlay: (box: Box, opts?: { modal?: boolean; autoDismiss?: boolean; triggerRect?: Rect; reposition?: () => void; onClose?: () => void }) => void;
    removeOverlay: (box: Box) => void;
  } | null = null;

  constructor(
    label = "",
    options: string[] = [],
    selectedIndex = 0,
    onChange?: (value: string, index: number) => void,
  ) {
    super(label);
    this.focusable = true;
    this.tabIndex = 0;
    this.options = options;
    this.selectedIndex = selectedIndex;
    this.onChange = onChange ?? null;

    this.style.border = "single";
    this.style.padding = { top: 0, bottom: 0, left: 1, right: 1 };
    this.height = { fixed: 3 };

    this.onPaint = (buf, rect, theme) => {
      const isFocused = this.focused;
      const selected = this.options[this.selectedIndex] ?? "";
      const arrow = this.open ? "▲" : "▼";
      const text = `${selected} ${arrow}`;
      const fg = isFocused ? theme.highlight : theme.text;

      for (let i = 0; i < rect.width && i < text.length; i++) {
        buf.set(rect.x + i, rect.y, {
          char: text[i],
          fg,
          bg: theme.panelBg,
          bold: isFocused,
        });
      }
    };

    // ── Keyboard ────────────────────────────────────────────────────────

    this.onKey = (key) => {
      if (this.open) {
        // When open, keyboard events go to the floating list overlay
        // (which is focusable). But if we get here somehow, close.
        if (key === "Escape") {
          this._close();
        }
        return;
      }

      if (key === "Enter" || key === " ") {
        this._open();
      } else if (key === "ArrowDown") {
        if (this.selectedIndex < this.options.length - 1) {
          this._select(this.selectedIndex + 1);
        }
      } else if (key === "ArrowUp") {
        if (this.selectedIndex > 0) {
          this._select(this.selectedIndex - 1);
        }
      } else if (key === "Home") {
        this._select(0);
      } else if (key === "End") {
        this._select(this.options.length - 1);
      }
    };

    // ── Mouse ───────────────────────────────────────────────────────────

    this.onMouse = (_col, _row, action) => {
      if (action === "press") {
        if (this.open) {
          this._close();
        } else {
          this._open();
        }
      }
    };

    this.handleTab = () => {
      if (this.open) {
        this._close();
        return true;
      }
      return false;
    };
  }

  /** Reference to the App for showing/removing overlay lists. */
  set appRef(
    ref: {
      showOverlay: (box: Box, opts?: { modal?: boolean; autoDismiss?: boolean; triggerRect?: Rect; reposition?: () => void; onClose?: () => void }) => void;
      removeOverlay: (box: Box) => void;
    } | null,
  ) {
    this._appRef = ref;
  }

  // ── Internal helpers ──────────────────────────────────────────────────

  private _open(): void {
    if (this.options.length === 0 || !this._appRef) return;
    this.open = true;

    const list = new FloatingListBox(this.options.slice(), this.selectedIndex);
    list.maxVisible = this.maxVisible;

    list.onItemSelect = (_item, index) => {
      this._select(index);
    };
    list.removeFn = () => {
      this._appRef?.removeOverlay(list);
    };

    // Size the list
    const maxItemWidth = this._maxOptionWidth();
    const listWidth = Math.max(maxItemWidth + 4, this.rect.width);
    const itemCount = Math.min(this.options.length, this.maxVisible);
    list.width = { fixed: listWidth };
    list.height = { fixed: itemCount + 2 };

    this._appRef.showOverlay(list, {
      modal: false,
      autoDismiss: true,
      triggerRect: this.rect,
      reposition: () => {
        list.positionRelativeTo(this.rect);
      },
      onClose: () => {
        this._listOverlay = null;
        this.open = false;
      },
    });
    list.positionRelativeTo(this.rect);
    this._listOverlay = list;
  }

  private _close(): void {
    if (this._listOverlay) {
      this._appRef?.removeOverlay(this._listOverlay);
      this._listOverlay = null;
    }
    this.open = false;
  }

  private _select(index: number): void {
    if (index < 0 || index >= this.options.length) return;
    this.selectedIndex = index;
    this._close();
    if (this.onChange) this.onChange(this.options[index], index);
  }

  private _maxOptionWidth(): number {
    let max = 0;
    for (const opt of this.options) {
      if (opt.length > max) max = opt.length;
    }
    return max;
  }
}
