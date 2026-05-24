/**
 * floating_list.ts — A floating list box that appears as an overlay,
 * positioned either below or above a trigger widget depending on
 * available terminal space.
 */

import { Box } from "../layout.ts";
import { getTermSize } from "../terminal.ts";

export class FloatingListBox extends Box {
  items: string[] = [];
  selectedIndex = 0;
  maxVisible = 8;

  /** Called when the user selects an item */
  onItemSelect: ((item: string, index: number) => void) | null = null;
  /** Set by the parent to call removeOverlay */
  removeFn: (() => void) | null = null;

  private _scrollOffset = 0;

  constructor(
    items: string[],
    selectedIndex: number,
  ) {
    super("FloatingList");
    this.focusable = true;
    this.tabIndex = 0;
    this.items = items;
    this.selectedIndex = selectedIndex;

    this.style.border = "single";
    this.style.padding = { top: 0, bottom: 0, left: 1, right: 1 };
    this.style.overflow = "hidden";

    this.onPaint = (buf, rect, theme) => {
      const visibleCount = Math.min(this.items.length, rect.height, this.maxVisible);
      for (let i = 0; i < visibleCount; i++) {
        const itemIndex = i + this._scrollOffset;
        if (itemIndex >= this.items.length) break;
        const item = this.items[itemIndex];
        const isCur = itemIndex === this.selectedIndex;
        for (let col = 0; col < rect.width; col++) {
          const ch = col < item.length ? item[col] : " ";
          buf.set(rect.x + col, rect.y + i, {
            char: ch,
            fg: isCur ? theme.bg : theme.text,
            bg: isCur ? theme.highlight : theme.panelBg,
            bold: isCur,
          });
        }
      }
    };

    this.onKey = (key, _modifiers) => {
      if (key === "ArrowDown") {
        if (this.selectedIndex < this.items.length - 1) {
          this.selectedIndex++;
          this.clampScroll();
        }
      } else if (key === "ArrowUp") {
        if (this.selectedIndex > 0) {
          this.selectedIndex--;
          this.clampScroll();
        }
      } else if (key === "Enter" || key === " ") {
        if (this.selectedIndex >= 0 && this.selectedIndex < this.items.length) {
          this.onItemSelect?.(this.items[this.selectedIndex], this.selectedIndex);
          this.removeFn?.();
        }
      } else if (key === "Escape") {
        this.removeFn?.();
      } else if (key === "Tab") {
        // Tab closes the dropdown
        this.removeFn?.();
      }
    };

    this.onMouse = (_col, row, action) => {
      if (action === "press") {
        const r = this.rect;
        // Items are painted starting at r.y + 1 (due to single border)
        const itemIndex = row - (r.y + 1) + this._scrollOffset;
        if (itemIndex >= 0 && itemIndex < this.items.length) {
          this.selectedIndex = itemIndex;
          this.onItemSelect?.(this.items[itemIndex], itemIndex);
          this.removeFn?.();
        }
      }
    };

    this.handleTab = () => {
      this.removeFn?.();
      return true;
    };
  }

  /** Position the list relative to a trigger rect, flipping above if needed */
  positionRelativeTo(triggerRect: { x: number; y: number; width: number; height: number }): void {
    let rows = 40;
    try {
      rows = getTermSize().rows;
    } catch {
      // Fallback if not in a real terminal
    }
    const listH = this.height.fixed ?? (Math.min(this.items.length, this.maxVisible) + 2);

    this.rect.x = triggerRect.x;

    // Try below first
    const belowY = triggerRect.y + triggerRect.height;
    if (belowY + listH <= rows) {
      this.rect.y = belowY;
    } else {
      // Flip above
      const aboveY = triggerRect.y - listH;
      this.rect.y = Math.max(0, aboveY);
    }
  }

  private _maxItemWidth(): number {
    let max = 0;
    for (const item of this.items) {
      if (item.length > max) max = item.length;
    }
    return Math.max(max, 10);
  }

  /** Ensure the selected index is visible by adjusting scroll offset. */
  clampScroll(): void {
    if (this.selectedIndex < this._scrollOffset) {
      this._scrollOffset = this.selectedIndex;
    } else if (this.selectedIndex >= this._scrollOffset + this.maxVisible) {
      this._scrollOffset = this.selectedIndex - this.maxVisible + 1;
    }
    this._scrollOffset = Math.max(
      0,
      Math.min(this._scrollOffset, Math.max(0, this.items.length - this.maxVisible)),
    );
  }


}
