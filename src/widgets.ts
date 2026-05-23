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
  cursorPos = 0;
  onChange: ((val: string) => void) | null = null;
  onSubmit: ((val: string) => void) | null = null;

  constructor(placeholder = "", value = "", onChange?: (val: string) => void) {
    super("Input");
    this.focusable = true;
    this.tabIndex = 0;
    this.placeholder = placeholder;
    this.value = value;
    this.cursorPos = 0;
    this.onChange = onChange ?? null;

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
    };

    this.onKey = (key, modifiers) => {
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

// ─── Tabs Widget ──────────────────────────────────────────────────────────────

export interface TabDefinition {
  label: string;
  content: Box;
}

export class Tabs extends Box {
  tabs: TabDefinition[] = [];
  activeIndex = 0;
  onTabChange: ((index: number) => void) | null = null;

  constructor(tabs?: TabDefinition[], activeIndex = 0) {
    super("Tabs");
    this.focusable = true;
    this.tabIndex = 0;
    this.tabs = tabs ?? [];
    this.activeIndex = activeIndex;

    this.style.border = "single";
    this.style.padding = { top: 0, bottom: 0, left: 1, right: 1 };

    for (const tab of this.tabs) {
      this.add(tab.content);
    }

    this.onKey = (key) => {
      if (key === "ArrowRight") {
        if (this.activeIndex < this.tabs.length - 1) {
          this._activate(this.activeIndex + 1);
        }
      } else if (key === "ArrowLeft") {
        if (this.activeIndex > 0) {
          this._activate(this.activeIndex - 1);
        }
      }
    };

    this.onMouse = (col, row, action) => {
      if (action === "press") {
        const hasBorder = this.style.border !== "none";
        const bOff = hasBorder ? 1 : 0;
        const p = this.style.padding;
        const tabRow = this.rect.y + bOff + p.top;
        if (row === tabRow && col >= this.rect.x + bOff + p.left &&
          col < this.rect.x + this.rect.width - bOff - p.right) {
          let x = this.rect.x + bOff + p.left;
          for (let i = 0; i < this.tabs.length; i++) {
            const label = ` ${this.tabs[i].label} `;
            if (col >= x && col < x + label.length) {
              this._activate(i);
              return;
            }
            x += label.length;
          }
        }
      }
    };

    this.onPaint = (buf, rect, theme) => {
      let x = rect.x;
      for (let i = 0; i < this.tabs.length; i++) {
        const label = ` ${this.tabs[i].label} `;
        const isActive = i === this.activeIndex;
        const remaining = rect.x + rect.width - x;
        const len = Math.min(label.length, remaining);
        for (let c = 0; c < len; c++) {
          buf.set(x + c, rect.y, {
            char: label[c],
            fg: isActive ? theme.bg : theme.text,
            bg: isActive ? theme.highlight : theme.panelBg,
            bold: isActive,
          });
        }
        x += len;
      }
    };
  }

  private _activate(index: number): void {
    this.activeIndex = index;
    this._layoutChildren();
    if (this.onTabChange) this.onTabChange(index);
  }

  private _layoutChildren(): void {
    const hasBorder = this.style.border !== "none";
    const bOff = hasBorder ? 1 : 0;
    const p = this.style.padding;
    const contentX = this.rect.x + bOff + p.left;
    const contentY = this.rect.y + bOff + p.top;
    const contentW = Math.max(0, this.rect.width - bOff * 2 - p.left - p.right);
    const contentH = Math.max(0, this.rect.height - bOff * 2 - p.top - p.bottom);

    const tabBarH = Math.min(1, contentH);
    const areaY = contentY + tabBarH;
    const areaH = Math.max(0, contentH - tabBarH);

    for (let i = 0; i < this.children.length; i++) {
      if (i === this.activeIndex) {
        this.children[i].layout({
          x: contentX,
          y: areaY,
          width: contentW,
          height: areaH,
        });
      } else {
        this.children[i].rect = { x: 0, y: 0, width: 0, height: 0 };
      }
    }
  }

  override layout(parentRect: Rect): void {
    const m = this.style.margin;
    this.rect = {
      x: parentRect.x + m.left,
      y: parentRect.y + m.top,
      width: Math.max(1, parentRect.width - m.left - m.right),
      height: Math.max(1, parentRect.height - m.top - m.bottom),
    };
    this._layoutChildren();
  }

  override hitTest(col: number, row: number): Box | null {
    const r = this.rect;
    if (col < r.x || col >= r.x + r.width) return null;
    if (row < r.y || row >= r.y + r.height) return null;

    const hasBorder = this.style.border !== "none";
    const bOff = hasBorder ? 1 : 0;
    const p = this.style.padding;
    const tabRow = r.y + bOff + p.top;

    if (row === tabRow) return this;

    if (this.activeIndex < this.children.length) {
      const hit = this.children[this.activeIndex].hitTest(col, row);
      if (hit) return hit;
    }
    return this;
  }
}

// ─── Radio Button Widget ────────────────────────────────────────────────────

export class RadioButton extends Box {
  value: string;
  selected = false;
  onChange: ((value: string) => void) | null = null;

  constructor(label: string, value: string, selected = false) {
    super(label);
    this.focusable = true;
    this.tabIndex = 0;
    this.value = value;
    this.selected = selected;

    this.style.border = "none";
    this.height = { fixed: 1 };

    this.onPaint = (buf, rect, theme) => {
      const dot = this.selected ? "•" : "○";
      const fg = this.focused ? theme.highlight : theme.text;
      const text = ` ${dot} ${this.label}`;
      for (let i = 0; i < text.length && i < rect.width; i++) {
        buf.set(rect.x + i, rect.y, {
          char: text[i],
          fg: (i < 3 && this.focused) ? theme.highlight : fg,
          bg: theme.panelBg,
          bold: this.selected && this.focused,
        });
      }
    };

    this.onKey = (key) => {
      if (key === "Enter" || key === " ") {
        this.select();
      }
    };

    this.onMouse = (_col, _row, action) => {
      if (action === "press") {
        this.select();
      }
    };
  }

  select(): void {
    if (!this.selected) {
      this.selected = true;
      if (this.onChange) this.onChange(this.value);
    }
  }
}

// ─── Radio Group Widget ─────────────────────────────────────────────────────

export class RadioGroup extends Box {
  selectedValue: string;
  onChange: ((value: string) => void) | null = null;
  private _buttons: RadioButton[] = [];

  constructor(
    label: string,
    options: { label: string; value: string }[],
    selectedValue?: string,
    onChange?: (value: string) => void,
  ) {
    super(label);
    this.style.direction = "column";
    this.style.border = "single";
    this.style.padding = { top: 0, bottom: 0, left: 1, right: 1 };
    this.selectedValue = selectedValue ?? (options.length > 0 ? options[0].value : "");
    this.onChange = onChange ?? null;

    for (const opt of options) {
      const rb = new RadioButton(opt.label, opt.value, opt.value === this.selectedValue);
      rb.onChange = (val) => this._onChildChange(val);
      this._buttons.push(rb);
      this.add(rb);
    }

    this.height = { fixed: 2 + this._buttons.length };
  }

  select(value: string): void {
    this._onChildChange(value);
  }

  private _onChildChange(value: string): void {
    this.selectedValue = value;
    for (const rb of this._buttons) {
      rb.selected = rb.value === value;
    }
    if (this.onChange) this.onChange(value);
  }
}
