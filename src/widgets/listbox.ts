import { Box } from "../layout.ts";

export class ListBox extends Box {
  items: string[] = [];
  selectedIndex = 0;
  onSelect: ((item: string, index: number) => void) | null = null;
  onSelectChange: ((item: string, index: number) => void) | null = null;

  constructor(items: string[] = [], onSelect?: (item: string, index: number) => void) {
    super("ListBox");
    this.focusable = true;
    this.tabIndex = 0;
    this.items = items;
    this.onSelect = onSelect ?? null;

    this.style.border = "single";
    this.style.padding = { top: 0, bottom: 0, left: 1, right: 1 };

    this.onPaint = (buf, rect, theme) => {
      const bg = theme.panelBg;
      const visibleCount = rect.height;

      let scrollOffset = 0;
      if (this.selectedIndex >= visibleCount) {
        scrollOffset = this.selectedIndex - visibleCount + 1;
      }

      for (let i = 0; i < visibleCount; i++) {
        const itemIndex = i + scrollOffset;
        if (itemIndex >= this.items.length) break;

        const item = this.items[itemIndex];
        const isSelected = itemIndex === this.selectedIndex;
        const rowY = rect.y + i;

        const prefix = isSelected ? "▶ " : "  ";
        const displayText = prefix + item;

        const itemFg = isSelected
          ? (this.focused ? theme.bg : theme.highlight)
          : theme.text;
        const itemBg = isSelected
          ? (this.focused ? theme.highlight : theme.border)
          : bg;

        for (let col = rect.x; col < rect.x + rect.width; col++) {
          const charIndex = col - rect.x;
          const char = charIndex < displayText.length ? displayText[charIndex] : " ";
          buf.set(col, rowY, {
            char,
            fg: itemFg,
            bg: itemBg,
            bold: isSelected,
          });
        }
      }
    };

    this.onKey = (key) => {
      if (key === "ArrowDown" || key === "j") {
        if (this.selectedIndex < this.items.length - 1) {
          this.selectedIndex++;
          if (this.onSelectChange) {
            this.onSelectChange(this.items[this.selectedIndex], this.selectedIndex);
          }
        }
      } else if (key === "ArrowUp" || key === "k") {
        if (this.selectedIndex > 0) {
          this.selectedIndex--;
          if (this.onSelectChange) {
            this.onSelectChange(this.items[this.selectedIndex], this.selectedIndex);
          }
        }
      } else if (key === "Enter" || key === " ") {
        if (this.onSelect) {
          this.onSelect(this.items[this.selectedIndex], this.selectedIndex);
        }
      }
    };

    this.onMouse = (_col, row, action) => {
      if (action === "press") {
        const clickedRow = row - this.rect.y - 1;
        const visibleCount = this.rect.height - 2;

        let scrollOffset = 0;
        if (this.selectedIndex >= visibleCount) {
          scrollOffset = this.selectedIndex - visibleCount + 1;
        }

        const itemIndex = clickedRow + scrollOffset;
        if (itemIndex >= 0 && itemIndex < this.items.length) {
          this.selectedIndex = itemIndex;
          if (this.onSelectChange) {
            this.onSelectChange(this.items[itemIndex], itemIndex);
          }
          if (this.onSelect) {
            this.onSelect(this.items[itemIndex], itemIndex);
          }
        }
      }
    };
  }
}
