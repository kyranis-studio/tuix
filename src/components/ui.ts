import { BaseComponent } from "./base.ts";
import { VirtualConsole } from "../core/console.ts";
import { LayoutOptions } from "../layout/engine.ts";

export interface BoxOptions extends LayoutOptions {
  border?: boolean;
  title?: string;
  bg?: string;
  fg?: string;
}

export class Box extends BaseComponent {
  private boxOptions: BoxOptions;

  constructor(options: BoxOptions = {}) {
    super(options);
    this.boxOptions = { border: true, ...options };
  }

  draw(console: VirtualConsole) {
    const { width, height, x, y } = this.rect;
    
    // Fill background
    if (this.boxOptions.bg) {
      this.fill(console, { bg: this.boxOptions.bg, char: " " });
    }

    if (this.boxOptions.border) {
      // Draw corners
      console.set(x, y, { char: "┌" });
      console.set(x + width - 1, y, { char: "┐" });
      console.set(x, y + height - 1, { char: "└" });
      console.set(x + width - 1, y + height - 1, { char: "┘" });

      // Draw sides
      for (let i = 1; i < width - 1; i++) {
        console.set(x + i, y, { char: "─" });
        console.set(x + i, y + height - 1, { char: "─" });
      }
      for (let i = 1; i < height - 1; i++) {
        console.set(x, y + i, { char: "│" });
        console.set(x + width - 1, y + i, { char: "│" });
      }

      if (this.boxOptions.title) {
        this.writeText(console, 2, 0, ` ${this.boxOptions.title} `);
      }
    }
  }
}

export class Label extends BaseComponent {
  constructor(private text: string, options: LayoutOptions = {}) {
    super({ height: 1, ...options });
  }

  draw(console: VirtualConsole) {
    this.writeText(console, 0, 0, this.text);
  }
}

export class Button extends BaseComponent {
  private label: string;
  private onClick?: () => void;

  constructor(label: string, onClick?: () => void, options: LayoutOptions = {}) {
    super({ width: label.length + 4, height: 3, ...options });
    this.label = label;
    this.onClick = onClick;
    this.isFocusable = true;
  }

  draw(console: VirtualConsole) {
    const { width, height } = this.rect;
    const bg = this.isFocused ? "\x1b[48;5;240m" : "\x1b[48;5;236m";
    const fg = "\x1b[38;5;255m";

    this.fill(console, { bg, fg, char: " " });
    
    // Simple border
    this.writeText(console, 0, 0, "┌" + "─".repeat(width - 2) + "┐", { bg, fg });
    this.writeText(console, 0, 1, "│ " + this.label + " │", { bg, fg });
    this.writeText(console, 0, 2, "└" + "─".repeat(width - 2) + "┘", { bg, fg });
  }

  protected handleEvent(event: any): boolean {
    if (this.isFocused && event.type === 0 && event.key === "enter") {
      this.onClick?.();
      return true;
    }
    return false;
  }
}
