/**
 * widgets.ts — Built-in interactive TUI components for tuix.
 */

import { Box, Rect, paintCenteredText, paintText } from "./layout.ts";
import { CellBuffer } from "./terminal.ts";
import { Theme } from "./theme.ts";

// ─── Button Widget ───────────────────────────────────────────────────────────

export class Button extends Box {
  onClick: (() => void) | null = null;

  constructor(label: string, onClick?: () => void) {
    super(label);
    this.focusable = true;
    this.tabIndex = 0;
    this.onClick = onClick ?? null;

    this.style.border = "single";
    this.style.padding = { top: 0, bottom: 0, left: 1, right: 1 };
    this.height = { fixed: 3 }; // typical button takes 3 rows (border + 1 text row)

    this.onPaint = (buf, rect, theme) => {
      const isFocused = this.focused;
      const textFg = isFocused ? theme.bg : theme.highlight;
      const textBg = isFocused ? theme.highlight : theme.panelBg;

      // Paint label centered
      paintCenteredText(buf, rect, this.label, textFg, textBg, isFocused);
    };

    this.onKey = (key) => {
      if (key === "Enter" || key === " ") {
        if (this.onClick) this.onClick();
      }
    };

    this.onMouse = (_col, _row, action) => {
      if (action === "press") {
        if (this.onClick) this.onClick();
      }
    };
  }
}

// ─── Checkbox Widget ─────────────────────────────────────────────────────────

export class Checkbox extends Box {
  checked = false;
  onChange: ((checked: boolean) => void) | null = null;

  constructor(label: string, checked = false, onChange?: (checked: boolean) => void) {
    super(label);
    this.focusable = true;
    this.tabIndex = 0;
    this.checked = checked;
    this.onChange = onChange ?? null;

    this.style.border = "none";
    this.height = { fixed: 1 };

    this.onPaint = (buf, rect, theme) => {
      const boxChar = this.checked ? "☑" : "☐";
      const boxColor = this.focused ? theme.highlight : theme.muted;
      const textColor = theme.text;
      const bg = theme.panelBg;

      const indicator = `${boxChar} ${this.label}`;

      for (let i = 0; i < indicator.length && i < rect.width; i++) {
        const char = indicator[i];
        let fg = textColor;
        if (i === 0) {
          fg = boxColor;
        } else if (this.focused) {
          fg = theme.highlight;
        }

        buf.set(rect.x + i, rect.y, {
          char,
          fg,
          bg,
          bold: this.focused,
        });
      }
    };

    this.onKey = (key) => {
      if (key === "Enter" || key === " ") {
        this.toggle();
      }
    };

    this.onMouse = (_col, _row, action) => {
      if (action === "press") {
        this.toggle();
      }
    };
  }

  toggle(): void {
    this.checked = !this.checked;
    if (this.onChange) this.onChange(this.checked);
  }
}

// ─── Text Input Widget ───────────────────────────────────────────────────────

export class TextInput extends Box {
  value = "";
  placeholder = "";
  onChange: ((val: string) => void) | null = null;
  onSubmit: ((val: string) => void) | null = null;

  constructor(placeholder = "", value = "", onChange?: (val: string) => void) {
    super("Input");
    this.focusable = true;
    this.tabIndex = 0;
    this.placeholder = placeholder;
    this.value = value;
    this.onChange = onChange ?? null;

    this.style.border = "single";
    this.style.padding = { top: 0, bottom: 0, left: 1, right: 1 };
    this.height = { fixed: 3 }; // typical input (border + 1 text row)

    this.onPaint = (buf, rect, theme) => {
      const isFocused = this.focused;
      const textVal = this.value || this.placeholder;
      const isPlaceholder = !this.value;
      const fg = isPlaceholder ? theme.muted : theme.text;
      const bg = theme.panelBg;

      // Draw the text value
      let col = rect.x;
      for (let i = 0; i < textVal.length && i < rect.width; i++) {
        buf.set(col, rect.y, {
          char: textVal[i],
          fg,
          bg,
        });
        col++;
      }

      // Draw block cursor if focused
      if (isFocused && col < rect.x + rect.width) {
        buf.set(col, rect.y, {
          char: " ",
          fg: theme.bg,
          bg: theme.highlight,
        });
      }
    };

    this.onKey = (key, modifiers) => {
      if (key === "Backspace") {
        if (this.value.length > 0) {
          this.value = this.value.slice(0, -1);
          if (this.onChange) this.onChange(this.value);
        }
      } else if (key === "Enter") {
        if (this.onSubmit) this.onSubmit(this.value);
      } else if (key.length === 1 && !modifiers.ctrl && !modifiers.alt) {
        this.value += key;
        if (this.onChange) this.onChange(this.value);
      }
    };
  }
}

// ─── List Box Widget ──────────────────────────────────────────────────────────

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

      // Keep active index centered or within visible window
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
        // Accounting for border offset
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

// ─── Progress Bar Widget ─────────────────────────────────────────────────────

export class ProgressBar extends Box {
  private _progress = 0; // scale 0 to 1

  constructor(label = "", progress = 0) {
    super(label);
    this.focusable = false;
    this._progress = progress;
    this.height = { fixed: 1 };

    this.onPaint = (buf, rect, theme) => {
      const bg = theme.panelBg;
      const labelSpace = 8;
      const barWidth = Math.max(0, rect.width - labelSpace);
      const filledWidth = Math.floor(this._progress * barWidth);

      for (let i = 0; i < barWidth; i++) {
        const char = i < filledWidth ? "█" : "░";
        const fg = i < filledWidth ? theme.highlight : theme.muted;
        buf.set(rect.x + i, rect.y, {
          char,
          fg,
          bg,
        });
      }

      const percentStr = ` ${(this._progress * 100).toFixed(0).padStart(3)}%`;
      for (let i = 0; i < percentStr.length && barWidth + i < rect.width; i++) {
        buf.set(rect.x + barWidth + i, rect.y, {
          char: percentStr[i],
          fg: theme.highlight,
          bg,
          bold: true,
        });
      }
    };
  }

  get progress(): number { return this._progress; }
  set progress(v: number) { this._progress = Math.max(0, Math.min(1, v)); }
}

// ─── Autocomplete Widget ──────────────────────────────────────────────────────

export type AutocompleteMode = "dropdown" | "inline";

export class Autocomplete extends Box {
  suggestions: string[] = [];
  filteredSuggestions: string[] = [];
  selectedIndex = 0;
  value = "";
  placeholder = "";
  dropdownOpen = false;
  maxVisibleItems = 6;
  mode: AutocompleteMode = "dropdown";
  onSelect: ((item: string) => void) | null = null;
  onChange: ((val: string) => void) | null = null;
  filterFn: ((val: string, suggestions: string[]) => string[]) | null = null;

  private _inputHeight = 3;
  private _lastDropdownHeight = 0;
  private _completion = "";

  constructor(
    placeholder = "",
    suggestions: string[] = [],
    onSelect?: (item: string) => void,
  ) {
    super("Autocomplete");
    this.focusable = true;
    this.tabIndex = 0;
    this.placeholder = placeholder;
    this.suggestions = suggestions;
    this.filteredSuggestions = [...suggestions];
    this.onSelect = onSelect ?? null;

    this.style.border = "single";
    this.style.padding = { top: 0, bottom: 0, left: 1, right: 1 };
    this.height = { fixed: this._inputHeight };

    this.onPaint = (buf, rect, theme) => {
      if (!this.focused) {
        this.dropdownOpen = false;
      }
      this._syncHeight();

      if (this.mode === "inline" && this.value.length > 0 && !this._completion) {
        this._completion = this._findCompletion();
      }

      const isFocused = this.focused;
      const textVal = this.value || this.placeholder;
      const isPlaceholder = !this.value;
      const fg = isPlaceholder ? theme.muted : theme.text;
      const bg = theme.panelBg;

      let col = rect.x;
      for (let i = 0; i < textVal.length && i < rect.width; i++) {
        buf.set(col, rect.y, { char: textVal[i], fg, bg });
        col++;
      }

      if (isFocused && col < rect.x + rect.width) {
        const completion = this._completion;
        if (this.mode === "inline" && completion && this.value.length > 0) {
          const ghostLen = Math.min(
            completion.length - 1,
            rect.x + rect.width - col - 1,
          );
          buf.set(col, rect.y, {
            char: completion[0],
            fg: theme.bg,
            bg: theme.highlight,
          });
          for (let i = 0; i < ghostLen; i++) {
            buf.set(col + 1 + i, rect.y, {
              char: completion[i + 1],
              fg: theme.muted,
              bg,
              dim: true,
            });
          }
        } else {
          buf.set(col, rect.y, {
            char: " ",
            fg: theme.bg,
            bg: theme.highlight,
          });
        }
      }

      if (this.mode === "dropdown" && this.dropdownOpen &&
        this.filteredSuggestions.length > 0) {
        const visibleCount = Math.min(
          this.filteredSuggestions.length,
          this.maxVisibleItems,
        );
        for (let i = 0; i < visibleCount; i++) {
          const itemY = rect.y + 1 + i;
          const item = this.filteredSuggestions[i];
          const isSelected = i === this.selectedIndex;

          for (let c = rect.x; c < rect.x + rect.width; c++) {
            const charIndex = c - rect.x;
            buf.set(c, itemY, {
              char: charIndex < item.length ? item[charIndex] : " ",
              fg: isSelected ? theme.bg : theme.text,
              bg: isSelected ? theme.highlight : theme.panelBg,
              bold: isSelected,
            });
          }
        }
      }
    };

    this.onKey = (key, modifiers) => {
      if (this.mode === "dropdown" && this.dropdownOpen) {
        if (key === "ArrowDown") {
          if (this.selectedIndex < this.filteredSuggestions.length - 1) {
            this.selectedIndex++;
          }
          return;
        }
        if (key === "ArrowUp") {
          if (this.selectedIndex > 0) {
            this.selectedIndex--;
          }
          return;
        }
        if (key === "Enter") {
          if (this.filteredSuggestions.length > 0) {
            this._select(this.filteredSuggestions[this.selectedIndex]);
          }
          return;
        }
        if (key === "Escape") {
          this.dropdownOpen = false;
          this._syncHeight();
          return;
        }
      }

      if (key === "Backspace") {
        if (this.value.length > 0) {
          this.value = this.value.slice(0, -1);
          this._updateFilter();
          if (this.onChange) this.onChange(this.value);
        }
      } else if (key.length === 1 && !modifiers.ctrl && !modifiers.alt) {
        this.value += key;
        this._updateFilter();
        if (this.onChange) this.onChange(this.value);
      }
    };

    this.onMouse = (_col, row, action) => {
      if (action === "press") {
        if (this.mode === "dropdown" && this.dropdownOpen &&
          this.filteredSuggestions.length > 0) {
          const visibleCount = Math.min(
            this.filteredSuggestions.length,
            this.maxVisibleItems,
          );
          const itemIndex = row - (this.rect.y + 1);
          if (itemIndex >= 0 && itemIndex < visibleCount) {
            this._select(this.filteredSuggestions[itemIndex]);
          }
        }
      }
    };

    this.handleTab = () => {
      if (this.mode === "inline" && this._completion && this.value.length > 0) {
        this.value += this._completion;
        this._completion = "";
        if (this.onSelect) this.onSelect(this.value);
        if (this.onChange) this.onChange(this.value);
        return true;
      }
      return false;
    };
  }

  private _dropdownItemCount(): number {
    if (this.mode !== "dropdown" || !this.dropdownOpen) return 0;
    const count = this.filteredSuggestions.length;
    if (count === 0) return 0;
    return Math.min(count, this.maxVisibleItems);
  }

  private _syncHeight(): void {
    const dropCount = this._dropdownItemCount();
    if (dropCount !== this._lastDropdownHeight) {
      this._lastDropdownHeight = dropCount;
      this.height = { fixed: this._inputHeight + dropCount };
    }
  }

  private _updateFilter(): void {
    if (this.filterFn) {
      this.filteredSuggestions = this.filterFn(this.value, this.suggestions);
    } else {
      const lowerVal = this.value.toLowerCase();
      this.filteredSuggestions = this.suggestions.filter(
        (s) => s.toLowerCase().includes(lowerVal),
      );
    }
    this.selectedIndex = 0;
    this.dropdownOpen = this.value.length > 0;

    if (this.mode === "inline" && this.value.length > 0) {
      this._completion = this._findCompletion();
    } else {
      this._completion = "";
    }

    this._syncHeight();
  }

  private _findCompletion(): string {
    const lower = this.value.toLowerCase();
    for (const s of this.suggestions) {
      if (s.toLowerCase().startsWith(lower) && s !== this.value) {
        return s.slice(this.value.length);
      }
    }
    return "";
  }

  private _select(item: string): void {
    this.value = item;
    this.dropdownOpen = false;
    this._completion = "";
    this._syncHeight();
    if (this.onSelect) this.onSelect(item);
    if (this.onChange) this.onChange(item);
  }

  override hitTest(col: number, row: number): Box | null {
    return super.hitTest(col, row);
  }
}
