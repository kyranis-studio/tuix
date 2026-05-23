import { Box } from "../layout.ts";

export class Dropdown extends Box {
  options: string[] = [];
  selectedIndex = 0;
  open = false;
  onChange: ((value: string, index: number) => void) | null = null;
  maxVisible = 6;

  private _cursorIndex = 0;
  private _scrollOffset = 0;

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
    this._cursorIndex = selectedIndex;
    this.onChange = onChange ?? null;

    this.style.border = "single";
    this.style.padding = { top: 0, bottom: 0, left: 1, right: 1 };
    this.height = { fixed: 3 };

    this.onPaint = (buf, rect, theme) => {
      this._syncHeight();

      const isFocused = this.focused;
      const selected = this.options[this.selectedIndex] ?? "";
      const arrow = this.open ? "▲" : "▼";
      const text = `${selected} ${arrow}`;
      const fg = isFocused ? theme.highlight : theme.text;

      // ── Trigger row (first content row) ────────────────────────────────
      for (let i = 0; i < rect.width && i < text.length; i++) {
        buf.set(rect.x + i, rect.y, {
          char: text[i],
          fg,
          bg: theme.panelBg,
          bold: isFocused,
        });
      }

      // ── Dropdown list items when open ──────────────────────────────────
      if (this.open && this.options.length > 0) {
        const visible = Math.min(this.options.length - this._scrollOffset, this.maxVisible);

        for (let i = 0; i < visible; i++) {
          const itemIndex = i + this._scrollOffset;
          if (itemIndex >= this.options.length) break;

          const itemY = rect.y + 1 + i; // directly below the trigger row
          if (itemY >= rect.y + rect.height) break;

          const item = this.options[itemIndex];
          const isCur = itemIndex === this._cursorIndex;

          for (let col = 0; col < rect.width; col++) {
            const ch = col < item.length ? item[col] : " ";
            buf.set(rect.x + col, itemY, {
              char: ch,
              fg: isCur ? theme.bg : theme.text,
              bg: isCur ? theme.highlight : theme.panelBg,
              bold: isCur,
            });
          }
        }
      }
    };

    // ── Keyboard ────────────────────────────────────────────────────────

    this.onKey = (key) => {
      if (this.open) {
        if (key === "ArrowDown") {
          if (this._cursorIndex < this.options.length - 1) {
            this._cursorIndex++;
            this._clampScroll();
          }
        } else if (key === "ArrowUp") {
          if (this._cursorIndex > 0) {
            this._cursorIndex--;
            this._clampScroll();
          }
        } else if (key === "Enter") {
          this._select(this._cursorIndex);
        } else if (key === "Escape") {
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

    this.onMouse = (_col, row, action) => {
      if (action === "press") {
        if (this.open) {
          const r = this.rect;
          const bOff = this.style.border !== "none" ? 1 : 0;
          const triggerRow = r.y + bOff + this.style.padding.top; // the trigger content row

          if (row === triggerRow) {
            // Click on trigger row → close
            this._close();
          } else if (row > triggerRow && row < r.y + r.height - bOff) {
            // Click on a list item
            const itemIndex = row - triggerRow - 1 + this._scrollOffset;
            if (itemIndex >= 0 && itemIndex < this.options.length) {
              this._select(itemIndex);
            } else {
              this._close();
            }
          } else {
            this._close();
          }
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

  // ── Internal helpers ──────────────────────────────────────────────────

  private _syncHeight(): void {
    if (this.open && this.options.length > 0) {
      const visible = Math.min(this.options.length - this._scrollOffset, this.maxVisible);
      const target = 3 + visible; // border-top + content (trigger + items) + border-bottom
      if (this.height.fixed !== target) {
        this.height = { fixed: target };
      }
    } else {
      if (this.height.fixed !== 3) {
        this.height = { fixed: 3 };
      }
    }
  }

  private _clampScroll(): void {
    if (this._cursorIndex < this._scrollOffset) {
      this._scrollOffset = this._cursorIndex;
    } else if (this._cursorIndex >= this._scrollOffset + this.maxVisible) {
      this._scrollOffset = this._cursorIndex - this.maxVisible + 1;
    }
    this._scrollOffset = Math.max(
      0,
      Math.min(this._scrollOffset, Math.max(0, this.options.length - this.maxVisible)),
    );
  }

  private _open(): void {
    if (this.options.length === 0) return;
    this.open = true;
    this._cursorIndex = this.selectedIndex;
    this._scrollOffset = 0;
    this._clampScroll();
    this._syncHeight();
  }

  private _close(): void {
    this.open = false;
    this._syncHeight();
  }

  private _select(index: number): void {
    if (index < 0 || index >= this.options.length) return;
    this.selectedIndex = index;
    this.open = false;
    this._syncHeight();
    if (this.onChange) this.onChange(this.options[index], index);
  }
}
