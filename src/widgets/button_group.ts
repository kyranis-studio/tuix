import { Box } from "../layout.ts";
import type { CellBuffer } from "../terminal.ts";
import type { Theme } from "../theme.ts";
import { getBorderChars } from "../theme.ts";

export class ButtonGroup extends Box {
  options: string[] = [];
  selectedIndex = 0;
  focusedIndex = 0;
  onChange: ((value: string, index: number) => void) | null = null;

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
    this.focusedIndex = selectedIndex;
    this.onChange = onChange ?? null;

    this.height = { fixed: 3 };

    this.paint = (buf: CellBuffer, theme: Theme) => {
      const r = this.rect;
      if (r.width <= 0 || r.height <= 0) return;

      const isFocused = this.focused;
      const count = this.options.length;
      if (count === 0) return;

      const sep = "  ";
      const sepW = sep.length;
      const totalSepW = sepW * (count - 1);
      const btnW = Math.max(3, Math.floor((r.width - totalSepW) / count));

      const chars = getBorderChars("single");

      buf.fill(r.x, r.y, r.width, 3, { char: " ", fg: null, bg: theme.panelBg });

      // top border
      buf.set(r.x, r.y, { char: chars.topLeft, fg: theme.border, bg: theme.panelBg });
      buf.set(r.x + r.width - 1, r.y, { char: chars.topRight, fg: theme.border, bg: theme.panelBg });
      for (let col = r.x + 1; col < r.x + r.width - 1; col++) {
        buf.set(col, r.y, { char: chars.horizontal, fg: theme.border, bg: theme.panelBg });
      }

      // left/right vertical borders
      buf.set(r.x, r.y + 1, { char: chars.vertical, fg: theme.border, bg: theme.panelBg });
      buf.set(r.x + r.width - 1, r.y + 1, { char: chars.vertical, fg: theme.border, bg: theme.panelBg });

      // bottom border — underline under focused option
      const underX = r.x + this.focusedIndex * (btnW + sepW);
      const underEnd = underX + btnW;
      buf.set(r.x, r.y + 2, { char: chars.bottomLeft, fg: theme.border, bg: theme.panelBg });
      buf.set(r.x + r.width - 1, r.y + 2, { char: chars.bottomRight, fg: theme.border, bg: theme.panelBg });
      for (let col = r.x + 1; col < r.x + r.width - 1; col++) {
        buf.set(col, r.y + 2, {
          char: chars.horizontal,
          fg: col >= underX && col < underEnd ? theme.highlight : theme.border,
          bg: theme.panelBg,
        });
      }

      // option texts
      for (let i = 0; i < count; i++) {
        const x = r.x + i * (btnW + sepW);
        const isActive = i === this.selectedIndex;
        const text = this.options[i];
        const textOffset = Math.max(0, Math.floor((btnW - text.length) / 2));
        for (let col = 0; col < btnW; col++) {
          buf.set(x + col, r.y + 1, {
            char: col >= textOffset && col - textOffset < text.length ? text[col - textOffset] : " ",
            fg: isActive ? theme.highlight : theme.text,
            bg: theme.panelBg,
            bold: isActive,
          });
        }
      }
    };

    this.onKey = (key) => {
      if (key === "ArrowRight") {
        if (this.focusedIndex < this.options.length - 1) {
          this.focusedIndex++;
        }
      } else if (key === "ArrowLeft") {
        if (this.focusedIndex > 0) {
          this.focusedIndex--;
        }
      } else if (key === "Enter" || key === " ") {
        if (this.focusedIndex !== this.selectedIndex) {
          this.selectedIndex = this.focusedIndex;
          if (this.onChange) this.onChange(this.options[this.selectedIndex], this.selectedIndex);
        }
      } else if (key === "Home") {
        this.focusedIndex = 0;
      } else if (key === "End") {
        this.focusedIndex = this.options.length - 1;
      }
    };

    this.onMouse = (col, _row, action) => {
      if (action === "press") {
        const count = this.options.length;
        if (count === 0) return;
        const sep = " ";
        const sepW = sep.length;
        const totalW = this.rect.width;
        const btnW = Math.max(1, Math.floor((totalW - sepW * (count - 1)) / count));
        const relX = col - this.rect.x;
        const index = Math.floor(relX / (btnW + sepW));
        if (index >= 0 && index < count) {
          this.focusedIndex = index;
          if (index !== this.selectedIndex) {
            this.selectedIndex = index;
            if (this.onChange) this.onChange(this.options[index], index);
          }
        }
      }
    };
  }
}
