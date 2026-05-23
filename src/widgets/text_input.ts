import { Box } from "../layout.ts";

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
