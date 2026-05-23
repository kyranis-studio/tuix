import { YogaNode, LayoutOptions, Rect } from "../layout/engine.ts";
import { VirtualConsole, Cell } from "../core/console.ts";
import { TuiEvent } from "../core/terminal.ts";

export abstract class BaseComponent {
  protected node: YogaNode;
  protected children: BaseComponent[] = [];
  protected parent: BaseComponent | null = null;
  
  public zIndex = 0;
  public isFocusable = false;
  public isFocused = false;

  constructor(options: LayoutOptions = {}) {
    this.node = new YogaNode(options);
  }

  add(child: BaseComponent) {
    child.parent = this;
    this.children.push(child);
    this.node.add(child.node);
    return this;
  }

  get rect(): Rect {
    return this.node.computedRect;
  }

  calculateLayout(width: number, height: number, x = 0, y = 0) {
    this.node.calculateLayout(width, height, x, y);
    for (const child of this.children) {
      // Layout calculation is handled recursively by YogaNode
    }
  }

  render(console: VirtualConsole) {
    this.draw(console);
    // Sort children by z-index before rendering
    const sortedChildren = [...this.children].sort((a, b) => a.zIndex - b.zIndex);
    for (const child of sortedChildren) {
      child.render(console);
    }
  }

  abstract draw(console: VirtualConsole): void;

  onEvent(event: TuiEvent): boolean {
    // Bubble events down to children first (highest z-index first)
    const sortedChildren = [...this.children].sort((a, b) => b.zIndex - a.zIndex);
    for (const child of sortedChildren) {
      if (child.onEvent(event)) return true;
    }
    return this.handleEvent(event);
  }

  protected handleEvent(_event: TuiEvent): boolean {
    return false;
  }

  protected fill(console: VirtualConsole, cell: Partial<Cell>) {
    const { x, y, width, height } = this.rect;
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        console.set(x + j, y + i, cell);
      }
    }
  }

  protected writeText(console: VirtualConsole, tx: number, ty: number, text: string, cell: Partial<Cell> = {}) {
    const { x, y, width, height } = this.rect;
    if (ty < 0 || ty >= height) return;
    
    for (let i = 0; i < text.length; i++) {
      if (tx + i >= width) break;
      console.set(x + tx + i, y + ty, { ...cell, char: text[i] });
    }
  }
}
