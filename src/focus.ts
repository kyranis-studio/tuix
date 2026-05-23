/**
 * focus.ts — Focus manager: Tab/Shift+Tab navigation and shortcut jumps.
 */

import { Box } from "./layout.ts";

export class FocusManager {
  private roots: Box[] = [];
  private shortcuts: Map<string, Box> = new Map();
  private focused: Box | null = null;

  /** Register the root box (walks tree to find focusable nodes). */
  setRoot(...roots: Box[]): void {
    this.roots = roots;
  }

  /** Register a shortcut key → Box mapping for direct-access. */
  registerShortcut(key: string, box: Box): void {
    box.shortcut = key;
    this.shortcuts.set(key, box);
  }

  /** Collect all focusable boxes in tab-index order. */
  private collectFocusable(): Box[] {
    const result: Box[] = [];
    const walk = (b: Box) => {
      if (b.focusable) result.push(b);
      for (const c of b.children) walk(c);
    };
    for (const r of this.roots) walk(r);
    result.sort((a, b) => a.tabIndex - b.tabIndex);
    return result;
  }

  current(): Box | null {
    return this.focused;
  }

  focusBox(box: Box): void {
    if (this.focused) {
      this.focused.focused = false;
    }
    this.focused = box;
    box.focused = true;
    box.onFocus?.();
  }

  focusFirst(): void {
    const list = this.collectFocusable();
    if (list.length > 0) this.focusBox(list[0]);
  }

  /** Move to the next focusable element. Returns true if focus changed. */
  focusNext(): boolean {
    const list = this.collectFocusable();
    if (list.length === 0) return false;
    if (!this.focused) {
      this.focusBox(list[0]);
      return true;
    }
    const idx = list.indexOf(this.focused);
    const next = list[(idx + 1) % list.length];
    this.focusBox(next);
    return true;
  }

  /** Move to the previous focusable element. */
  focusPrev(): boolean {
    const list = this.collectFocusable();
    if (list.length === 0) return false;
    if (!this.focused) {
      this.focusBox(list[list.length - 1]);
      return true;
    }
    const idx = list.indexOf(this.focused);
    const prev = list[(idx - 1 + list.length) % list.length];
    this.focusBox(prev);
    return true;
  }

  /** Handle a shortcut key. Returns true if handled. */
  handleShortcut(key: string): boolean {
    const box = this.shortcuts.get(key);
    if (box) {
      this.focusBox(box);
      return true;
    }
    return false;
  }

  /** Dispatch a key event to the currently focused box. */
  dispatchKey(
    key: string,
    modifiers: { ctrl: boolean; alt: boolean; shift: boolean },
  ): boolean {
    if (this.focused?.onKey) {
      this.focused.onKey(key, modifiers);
      return true;
    }
    return false;
  }
}
