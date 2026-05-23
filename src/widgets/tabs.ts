import { Box, Rect } from "../layout.ts";

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
