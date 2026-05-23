export type FlexDirection = "row" | "column";
export type JustifyContent = "start" | "center" | "end" | "space-between";
export type AlignItems = "start" | "center" | "end" | "stretch";

export interface LayoutOptions {
  flexDirection?: FlexDirection;
  justifyContent?: JustifyContent;
  alignItems?: AlignItems;
  gap?: number;
  width?: number | "auto" | string; // string for percentage like "50%"
  height?: number | "auto" | string;
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: number | "auto";
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class YogaNode {
  children: YogaNode[] = [];
  options: LayoutOptions;
  computedRect: Rect = { x: 0, y: 0, width: 0, height: 0 };

  constructor(options: LayoutOptions = {}) {
    this.options = {
      flexDirection: "column",
      justifyContent: "start",
      alignItems: "stretch",
      gap: 0,
      flexGrow: 0,
      flexShrink: 1,
      flexBasis: "auto",
      ...options,
    };
  }

  add(node: YogaNode) {
    this.children.push(node);
  }

  calculateLayout(parentWidth: number, parentHeight: number, offsetX = 0, offsetY = 0) {
    // Very simplified flex layout logic
    // In a real library, this would be much more complex or use a library like Yoga
    // For TUIX, we'll implement a basic version.

    const { flexDirection, gap = 0 } = this.options;
    
    this.computedRect.x = offsetX;
    this.computedRect.y = offsetY;
    
    // Determine own width/height
    this.computedRect.width = typeof this.options.width === "number" ? this.options.width : parentWidth;
    this.computedRect.height = typeof this.options.height === "number" ? this.options.height : parentHeight;

    if (flexDirection === "column") {
      let currentY = 0;
      const totalGaps = Math.max(0, this.children.length - 1) * gap;
      const availableHeight = this.computedRect.height - totalGaps;
      
      // Calculate total flex grow
      const totalGrow = this.children.reduce((sum, child) => sum + (child.options.flexGrow || 0), 0);
      
      for (const child of this.children) {
        const childHeight = totalGrow > 0 
          ? Math.floor((child.options.flexGrow || 0) / totalGrow * availableHeight)
          : Math.floor(availableHeight / this.children.length);
        
        child.calculateLayout(this.computedRect.width, childHeight, offsetX, offsetY + currentY);
        currentY += childHeight + gap;
      }
    } else {
      let currentX = 0;
      const totalGaps = Math.max(0, this.children.length - 1) * gap;
      const availableWidth = this.computedRect.width - totalGaps;
      
      const totalGrow = this.children.reduce((sum, child) => sum + (child.options.flexGrow || 0), 0);

      for (const child of this.children) {
        const childWidth = totalGrow > 0 
          ? Math.floor((child.options.flexGrow || 0) / totalGrow * availableWidth)
          : Math.floor(availableWidth / this.children.length);
        
        child.calculateLayout(childWidth, this.computedRect.height, offsetX + currentX, offsetY);
        currentX += childWidth + gap;
      }
    }
  }
}
