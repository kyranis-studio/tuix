import { Box } from "../layout.ts";

export type ListBoxItem = string | { label: string; disabled?: boolean };

function normalizeItem(item: ListBoxItem): { label: string; disabled: boolean } {
  if (typeof item === "string") return { label: item, disabled: false };
  return { label: item.label, disabled: item.disabled ?? false };
}

export class ListBox extends Box {
  items: ListBoxItem[] = [];
  selectedIndex = 0;
  disabled = false;
  onSelect: ((item: string, index: number) => void) | null = null;
  onSelectChange: ((item: string, index: number) => void) | null = null;

  constructor(items: ListBoxItem[] = [], onSelect?: (item: string, index: number) => void) {
    super("ListBox");
    this.focusable = true;
    this.tabIndex = 0;
    this.items = items;
    this.onSelect = onSelect ?? null;

    this.style.border = "single";
    this.style.padding = { top: 0, bottom: 0, left: 1, right: 1 };

    this.onPaint = (buf, rect, theme) => {
      const isDisabled = this.disabled;
      const isFocused = this.focused && !isDisabled;
      const bg = theme.primaryBg;
      const visibleCount = rect.height;

      let scrollOffset = 0;
      if (this.selectedIndex >= visibleCount) {
        scrollOffset = this.selectedIndex - visibleCount + 1;
      }

      for (let i = 0; i < visibleCount; i++) {
        const itemIndex = i + scrollOffset;
        if (itemIndex >= this.items.length) break;

        const item = normalizeItem(this.items[itemIndex]);
        const isItemDisabled = item.disabled;
        const isSelected = itemIndex === this.selectedIndex && !isItemDisabled;
        const rowY = rect.y + i;

        const prefix = isSelected ? "▶ " : "  ";
        const displayText = prefix + item.label;

        const itemFg = isDisabled || isItemDisabled
          ? theme.muted
          : (isSelected
            ? (isFocused ? theme.appBg : theme.highlight)
            : theme.text);
        const itemBg = isDisabled || isItemDisabled
          ? theme.disabledBg
          : (isSelected
            ? (isFocused ? theme.highlight : theme.border)
            : bg);

        for (let col = rect.x; col < rect.x + rect.width; col++) {
          const charIndex = col - rect.x;
          const char = charIndex < displayText.length ? displayText[charIndex] : " ";
          buf.set(col, rowY, {
            char,
            fg: itemFg,
            bg: itemBg,
            bold: isSelected && !isDisabled,
          });
        }
      }
    };

    this.onKey = (key) => {
      if (this.disabled) return;
      if (key === "ArrowDown" || key === "j") {
        let next = this.selectedIndex;
        while (next < this.items.length - 1) {
          next++;
          if (!normalizeItem(this.items[next]).disabled) break;
        }
        if (next !== this.selectedIndex) {
          this.selectedIndex = next;
          const item = normalizeItem(this.items[next]).label;
          if (this.onSelectChange) this.onSelectChange(item, next);
        }
      } else if (key === "ArrowUp" || key === "k") {
        let prev = this.selectedIndex;
        while (prev > 0) {
          prev--;
          if (!normalizeItem(this.items[prev]).disabled) break;
        }
        if (prev !== this.selectedIndex) {
          this.selectedIndex = prev;
          const item = normalizeItem(this.items[prev]).label;
          if (this.onSelectChange) this.onSelectChange(item, prev);
        }
      } else if (key === "Enter" || key === " ") {
        const item = normalizeItem(this.items[this.selectedIndex]);
        if (item.disabled) return;
        if (this.onSelect) {
          this.onSelect(item.label, this.selectedIndex);
        }
      }
    };

    this.onMouse = (_col, row, action) => {
      if (this.disabled) return;
      if (action === "press") {
        const clickedRow = row - this.rect.y - 1;
        const visibleCount = this.rect.height - 2;

        let scrollOffset = 0;
        if (this.selectedIndex >= visibleCount) {
          scrollOffset = this.selectedIndex - visibleCount + 1;
        }

        const itemIndex = clickedRow + scrollOffset;
        if (itemIndex >= 0 && itemIndex < this.items.length) {
          const item = normalizeItem(this.items[itemIndex]);
          if (item.disabled) return;
          this.selectedIndex = itemIndex;
          if (this.onSelectChange) {
            this.onSelectChange(item.label, itemIndex);
          }
          if (this.onSelect) {
            this.onSelect(item.label, itemIndex);
          }
        }
      }
    };
  }

  setDisabled(v: boolean): void {
    this.disabled = v;
    this.focusable = !v;
  }
}
