/**
 * collapsible.ts — A collapsible section widget for tuix.
 *
 * Usage:
 *   const sec = new Collapsible("Section Title", false, (collapsed) => { ... });
 *   sec.add(child1, child2);
 *
 * When collapsed the content is hidden and the header shows "▶ Section Title".
 * When expanded the content is visible and the header shows "▼ Section Title".
 * Click the header or press Enter/Space when focused to toggle.
 */

import { Box } from "../layout.ts";
import type { CellBuffer } from "../terminal.ts";
import type { Theme } from "../theme.ts";

export class Collapsible extends Box {
  /** Whether the section is currently collapsed (content hidden). */
  collapsed: boolean;

  /** Callback invoked whenever the collapsed state changes. */
  onChange: ((collapsed: boolean) => void) | null;

  /** The header bar — you can customise its style if desired. */
  readonly headerBox: Box;

  /** The content container — add children here or via .add(). */
  readonly contentBox: Box;

  /**
   * @param label     Display text in the header bar.
   * @param collapsed Initial collapsed state (default false).
   * @param onChange  Called whenever collapsed state changes.
   */
  constructor(
    label: string,
    collapsed = false,
    onChange?: (collapsed: boolean) => void,
  ) {
    super(`collapsible-${label}`);

    this.collapsed = collapsed;
    this.onChange = onChange ?? null;

    // The Collapsible itself is a column that hugs its content
    this.style.direction = "column";
    this.style.gutter = 0;
    this.width = { grow: 1 };
    this.height = {}; // hug to content

    // ─── Header bar ──────────────────────────────────────────────────────
    const header = Box.row(`header-${label}`);
    header.height = { fixed: 1 };
    header.style.gutter = 0;
    header.focusable = true;
    header.tabIndex = 0;

    header.onPaint = (buf, rect, theme) => {
      const isFocused = header.focused;
      const collapsed = this.collapsed;
      const indicator = collapsed ? "▶" : "▼";
      const text = ` ${indicator}  ${label}`;

      // Fill the header row background
      for (let col = 0; col < rect.width; col++) {
        buf.set(rect.x + col, rect.y, {
          char: " ",
          fg: null,
          bg: theme.primaryBg,
        });
      }

      // Draw the indicator and label
      for (let i = 0; i < text.length && i < rect.width; i++) {
        const isIndicator = i === 1; // the ▶/▼ character
        buf.set(rect.x + i, rect.y, {
          char: text[i],
          fg: isIndicator
            ? (isFocused ? theme.highlight : theme.muted)
            : (isFocused ? theme.highlight : theme.text),
          bg: theme.primaryBg,
          bold: isFocused || isIndicator,
        });
      }


    };

    header.onKey = (key) => {
      if (key === "Enter" || key === " ") {
        this.toggle();
      }
    };

    header.onMouse = (_col, _row, action) => {
      if (action === "press") {
        this.toggle();
      }
    };

    this.headerBox = header;

    // ─── Content wrapper ─────────────────────────────────────────────────
    const content = Box.col(`content-${label}`);
    content.style.gutter = 1;
    content.style.padding = { top: 1, bottom: 0, left: 1, right: 1 };
    content.width = { grow: 1 };
    content.height = collapsed ? { fixed: 0 } : {}; // hug when expanded

    this.contentBox = content;

    // Assemble: the collapsible (col) contains header + content
    super.add(header, content);
  }

  /** Toggle between collapsed and expanded. */
  toggle(): void {
    this.collapsed = !this.collapsed;
    this._syncContent();
    this.onChange?.(this.collapsed);
  }

  /** Expand to show content. */
  expand(): void {
    if (this.collapsed) this.toggle();
  }

  /** Collapse to hide content. */
  collapse(): void {
    if (!this.collapsed) this.toggle();
  }

  /**
   * Add children to the content area.
   * Overrides Box.add so that children go into the content wrapper.
   */
  override add(...children: Box[]): this {
    this.contentBox.add(...children);
    return this;
  }

  /**
   * Remove a child from the content area.
   */
  remove(child: Box): this {
    const idx = this.contentBox.children.indexOf(child);
    if (idx >= 0) {
      this.contentBox.children.splice(idx, 1);
      child.parent = null;
    }
    return this;
  }

  /** Synchronise the content box height to the collapsed state. */
  private _syncContent(): void {
    this.contentBox.height = this.collapsed ? { fixed: 0 } : {};
  }
}
