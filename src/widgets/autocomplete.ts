import { Box, Rect } from "../layout.ts";
import { FloatingListBox } from "./floating_list.ts";

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
  private _completion = "";
  private _listOverlay: FloatingListBox | null = null;
  private _appRef: {
    showOverlay: (box: Box, opts?: { modal?: boolean; autoDismiss?: boolean; triggerRect?: Rect; reposition?: () => void; onClose?: () => void }) => void;
    removeOverlay: (box: Box) => void;
  } | null = null;

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
      // Place cursor at end of existing value when gaining focus.
      // Don't reset to 0 — that would break typing because
      // _closeDropdown() → removeOverlay() restores focus and
      // triggers onFocus on every keystroke.
      this.cursorPos = this.value.length;
    };

    this.onPaint = (buf, rect, theme) => {
      // Close dropdown when autocomplete loses focus
      // (keyboard goes to autocomplete, not the overlay, so
      //  !this.focused means the user genuinely moved focus away)
      if (!this.focused) {
        this._closeDropdown();
      }

      if (this.mode === "inline" && this.value.length > 0 && !this._completion) {
        this._completion = this._findCompletion();
      }

      const isFocused = this.focused;
      const showPlaceholder = !this.value;
      const displayText = showPlaceholder ? this.placeholder : this.value;
      const fg = showPlaceholder ? theme.muted : theme.text;
      const bg = theme.primaryBg;

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

      // Inline completion ghost text
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
    };

    this.onKey = (key, modifiers) => {
      // ── Dropdown navigation ──────────────────────────────────────────
      if (this.mode === "dropdown" && this.dropdownOpen) {
        if (key === "ArrowDown") {
          if (this.selectedIndex < this.filteredSuggestions.length - 1) {
            this.selectedIndex++;
            if (this._listOverlay) {
              this._listOverlay.selectedIndex = this.selectedIndex;
              this._listOverlay.clampScroll();
            }
          }
          return;
        }
        if (key === "ArrowUp") {
          if (this.selectedIndex > 0) {
            this.selectedIndex--;
            if (this._listOverlay) {
              this._listOverlay.selectedIndex = this.selectedIndex;
              this._listOverlay.clampScroll();
            }
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
          this._closeDropdown();
          return;
        }
      }

      // ── Text input handling ─────────────────────────────────────────
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

    this.onMouse = () => {
      // Mouse clicks on list items are handled by the overlay
    };

    this.handleTab = () => {
      if (this.mode === "dropdown" && this.dropdownOpen) {
        this._closeDropdown();
        return true;
      }
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

    if (this.mode === "dropdown" && this.value.length > 0 && this.filteredSuggestions.length > 0) {
      this._showDropdown();
    } else {
      this._closeDropdown();
    }

    if (this.mode === "inline" && this.value.length > 0) {
      this._completion = this._findCompletion();
    } else {
      this._completion = "";
    }
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

  private _showDropdown(): void {
    if (!this._appRef) return;

    // Close existing overlay first
    this._closeDropdown();

    // Re-open state after _closeDropdown() cleared it
    this.dropdownOpen = true;

    const list = new FloatingListBox(this.filteredSuggestions.slice(), this.selectedIndex);
    list.maxVisible = this.maxVisibleItems;

    // Non-focusable overlay — the autocomplete retains keyboard focus
    // and handles all key events itself, syncing state to the overlay.
    list.focusable = false;

    list.onItemSelect = (item, _index) => {
      this._select(item);
    };
    list.removeFn = () => {
      this._appRef?.removeOverlay(list);
    };

    // Size the list
    const maxItemWidth = Math.max(...this.filteredSuggestions.map(s => s.length));
    const listWidth = Math.max(maxItemWidth + 4, this.rect.width);
    const itemCount = Math.min(this.filteredSuggestions.length, this.maxVisibleItems);
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
        this.dropdownOpen = false;
      },
    });
    list.positionRelativeTo(this.rect);
    this._listOverlay = list;
  }

  private _closeDropdown(): void {
    if (this._listOverlay) {
      this._appRef?.removeOverlay(this._listOverlay);
      this._listOverlay = null;
    }
    this.dropdownOpen = false;
  }

  private _select(item: string): void {
    this.value = item;
    this.cursorPos = item.length;
    this._closeDropdown();
    this._completion = "";
    if (this.onSelect) this.onSelect(item);
    if (this.onChange) this.onChange(item);
  }
}
