import { Box } from "../layout.ts";

export type AutocompleteMode = "dropdown" | "inline";

export class Autocomplete extends Box {
  suggestions: string[] = [];
  filteredSuggestions: string[] = [];
  selectedIndex = 0;
  value = "";
  placeholder = "";
  cursorPos = 0;
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

    this.onFocus = () => {
      this.cursorPos = 0;
    };

    this.onPaint = (buf, rect, theme) => {
      if (!this.focused) {
        this.dropdownOpen = false;
      }
      this._syncHeight();

      if (this.mode === "inline" && this.value.length > 0 && !this._completion) {
        this._completion = this._findCompletion();
      }

      const isFocused = this.focused;
      const showPlaceholder = !this.value;
      const displayText = showPlaceholder ? this.placeholder : this.value;
      const fg = showPlaceholder ? theme.muted : theme.text;
      const bg = theme.panelBg;

      for (let i = 0; i < rect.width; i++) {
        if (i < displayText.length) {
          const isCursorHere = isFocused && i === this.cursorPos;
          buf.set(rect.x + i, rect.y, {
            char: displayText[i],
            fg: isCursorHere ? bg : fg,
            bg: isCursorHere ? fg : bg,
            bold: isCursorHere,
          });
        } else if (isFocused && i === this.cursorPos) {
          buf.set(rect.x + i, rect.y, {
            char: " ",
            fg: bg,
            bg: theme.highlight,
          });
        } else {
          buf.set(rect.x + i, rect.y, { char: " ", fg, bg });
        }
      }

      if (isFocused && this.mode === "inline" && this._completion && this.value.length > 0) {
        const ghostStart = rect.x + this.value.length;
        const ghostLen = Math.min(
          this._completion.length,
          rect.x + rect.width - ghostStart,
        );
        if (ghostLen > 0) {
          buf.set(ghostStart, rect.y, {
            char: this._completion[0],
            fg: bg,
            bg: theme.highlight,
          });
          for (let i = 1; i < ghostLen; i++) {
            buf.set(ghostStart + i, rect.y, {
              char: this._completion[i],
              fg: theme.muted,
              bg,
              dim: true,
            });
          }
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
        if (this.cursorPos > 0) {
          this.value = this.value.slice(0, this.cursorPos - 1) + this.value.slice(this.cursorPos);
          this.cursorPos--;
          this._updateFilter();
          if (this.onChange) this.onChange(this.value);
        }
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
        this.cursorPos = this.value.length;
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
