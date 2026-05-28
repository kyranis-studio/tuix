import {
  App,
  Box,
  Splitter,
  TextArea,
  Collapsible,
  FloatingListBox,
  InputPrimitive,
  paintText,
} from "../src/mod.ts";

// ── Fake file listing for @ mentions and file explorer ───────────
const FAKE_FILES = [
  "📁 src",
  "📁 src/components",
  "📁 src/utils",
  "📁 docs",
  "📁 tests",
  "📄 src/main.ts",
  "📄 src/app.ts",
  "📄 src/components/button.tsx",
  "📄 src/components/input.tsx",
  "📄 src/utils/helpers.ts",
  "📄 src/utils/validators.ts",
  "📄 docs/README.md",
  "📄 docs/guide.md",
  "📄 tests/main.test.ts",
  "📄 tests/helpers.test.ts",
  "📄 package.json",
  "📄 tsconfig.json",
  "📄 .gitignore",
];

const ASCII_LOGO = [
  " ██████╗  ██████╗  ██████╗  ███████╗ ██████╗",
  "██╔════╝ ██╔═══██╗ ██╔══██╗ ██╔════╝ ██╔══██║",
  "██║      ██║   ██║ ██║  ██║ █████╗   ██████╔╝",
  "██║      ██║   ██║ ██║  ██║ ██╔══╝   ██╔══██╗",
  " ██████╗  ██████╔╝ ██████╔╝ ███████╗ ██║  ██║",
  " ╚═════╝  ╚═════╝  ╚═════╝  ╚══════╝ ╚═╝  ╚═╝",
];

function setupPromptInput(promptInput: TextArea, app: App, modelState: { current: string }): void {
  // ── State for the slash/mention dropdown overlay ────────────
  let triggerType: "/" | "@" | null = null;
  let triggerPos = -1;
  let overlay: FloatingListBox | null = null;
  let filteredItems: string[] = [];
  let selectedIndex = 0;
  let files: string[] = [];
  // ── Selected files for @-mention tags ────────────────
  // Each entry tracks when it was added so we can fade in via RGB blending
  const FADE_DURATION = 150; // ms
  const selectedFiles: Array<{ display: string; stripped: string; chipAddedAt: number }> = [];

  // Linear interpolation between two RGB colors by fraction t (0..1)
  function lerpColor(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }, t: number): { r: number; g: number; b: number } {
    const clamped = Math.max(0, Math.min(1, t));
    return {
      r: Math.round(a.r + (b.r - a.r) * clamped),
      g: Math.round(a.g + (b.g - a.g) * clamped),
      b: Math.round(a.b + (b.b - a.b) * clamped),
    };
  }

  const COMMANDS = ["/new", "/help", "/clear", "/models"];
  const MODELS = ["claude-sonnet-4", "gpt-4o", "gpt-4o-mini", "deepseek-v3", "o3-mini"];

  files = FAKE_FILES;

  // ── Paste burst threshold support ───────────────────────────
  const pasteBurstHandler = InputPrimitive.createPasteBurstHandler({
    threshold: 50,
    trackEnter: true,
  });
  promptInput.clipboardPasteHandler = pasteBurstHandler.handleClipboardPaste;

  // ── Atomic range support for @-mentions ──────────────────────
  promptInput.getCustomAtomicRanges = () => {
    const ranges: Array<{ start: number; end: number }> = [];
    const val = promptInput.value;
    for (const tag of selectedFiles) {
      const searchStr = `@${tag.stripped}`;
      let pos = 0;
      while ((pos = val.indexOf(searchStr, pos)) >= 0) {
        if (!ranges.some((r) => r.start === pos)) {
          let end = pos + searchStr.length;
          // Include up to 2 trailing spaces
          if (val[end] === " ") end++;
          if (val[end] === " ") end++;
          ranges.push({ start: pos, end });
          break;
        }
        pos += searchStr.length;
      }
    }
    return ranges;
  };

  // ── Dropdown helpers ────────────────────────────────────────
  function closeDropdown(): void {
    if (overlay) {
      app.removeOverlay(overlay);
      overlay = null;
    }
    triggerType = null;
    triggerPos = -1;
    filteredItems = [];
    selectedIndex = 0;
  }

  function showDropdown(items: string[]): void {
    // Close existing overlay — but preserve triggerType since onClose nulls it
    if (overlay) {
      const savedType = triggerType;
      app.removeOverlay(overlay);
      triggerType = savedType;
      overlay = null;
    }

    const list = new FloatingListBox(items, selectedIndex);
    list.maxVisible = 8;
    list.focusable = false; // TextArea retains keyboard focus

    list.onItemSelect = (item: string) => {
      selectItem(item);
    };
    list.removeFn = () => {
      app.removeOverlay(list);
      overlay = null;
      triggerType = null;
    };

    const maxItemWidth = items.length > 0 ? Math.max(...items.map((s) => s.length)) : 0;
    const listWidth = Math.max(maxItemWidth + 4, promptInput.rect.width);
    list.width = { fixed: listWidth };
    const visRows = items.length > 0 ? Math.min(items.length, 8) : 1;
    list.height = { fixed: visRows + 2 };

    app.showOverlay(list, {
      modal: false,
      autoDismiss: true,
      triggerRect: promptInput.rect,
      reposition: () => {
        list.positionRelativeTo(promptInput.rect);
      },
      onClose: () => {
        overlay = null;
        triggerType = null;
      },
    });
    list.positionRelativeTo(promptInput.rect);
    overlay = list;
  }

  // ── Model dropdown state ─────────────────────────────────────
  let modelListOverlay: FloatingListBox | null = null;
  let selectedModelIndex = 0;
  let modelFilter = "";

  function selectModel(model: string): void {
    modelState.current = model;
    if (modelListOverlay) app.removeOverlay(modelListOverlay);
    modelListOverlay = null;
    modelFilter = "";
    // Clear the filter text from the textarea
    promptInput.value = "";
    promptInput.cursorPos = 0;
    (promptInput as any)._onValueChanged();
    if (promptInput.onChange) promptInput.onChange(promptInput.value);
  }

  // ── Show model selection dropdown ────────────────────────────
  function showModelDropdown(): void {
    selectedModelIndex = 0;
    modelFilter = "";
    const list = new FloatingListBox(MODELS, 0);
    list.maxVisible = 8;
    list.focusable = false;

    list.onItemSelect = (model: string) => {
      selectModel(model);
    };
    list.removeFn = () => {
      if (modelListOverlay) {
        app.removeOverlay(modelListOverlay);
        modelListOverlay = null;
      }
    };

    const maxItemWidth = Math.max(...MODELS.map((s) => s.length));
    const listWidth = Math.max(maxItemWidth + 4, promptInput.rect.width);
    list.width = { fixed: listWidth };
    // Fixed height — filtering may show fewer items but the box stays the same size
    list.height = { fixed: Math.min(MODELS.length, 8) + 2 };

    app.showOverlay(list, {
      modal: false,
      autoDismiss: true,
      triggerRect: promptInput.rect,
      reposition: () => {
        list.positionRelativeTo(promptInput.rect);
      },
      onClose: () => {
        modelListOverlay = null;
      },
    });
    list.positionRelativeTo(promptInput.rect);
    modelListOverlay = list;
  }

  function selectItem(item: string): void {
    // ── Intercept /models to show model picker instead ──────
    if (triggerType === "/" && item === "/models") {
      // Clear the /models text from the textarea
      promptInput.value = "";
      promptInput.cursorPos = 0;
      (promptInput as any)._onValueChanged();
      if (promptInput.onChange) promptInput.onChange(promptInput.value);
      closeDropdown();
      showModelDropdown();
      return;
    }

    // Strip icon prefix for @ mentions
    const stripped = item.replace(/^[📁📄]\s*/, "");
    // Use only the leaf (last segment) for the chip text so e.g.
    // "📁 src/components" becomes "@components" instead of "@src/components"
    const leaf = stripped.split("/").pop() ?? stripped;
    // Preserve @ prefix for file mentions so Backspace can detect the block
    const prefix = triggerType === "@" ? "@" : "";
    // Append two spaces after the chip so the cursor is clearly visible past the chip
    const suffix = triggerType === "@" ? "  " : "";
    // Replace everything from triggerPos with the selected item
    promptInput.value =
      promptInput.value.slice(0, triggerPos) +
      prefix + leaf + suffix;
    promptInput.cursorPos = triggerPos + prefix.length + leaf.length + suffix.length;
    // Trigger callbacks that the base handler normally fires
    (promptInput as any)._onValueChanged();
    if (promptInput.onChange) promptInput.onChange(promptInput.value);

    // Add to file tags BEFORE closeDropdown() clears filteredItems
    if (triggerType === "@") {
      const displayMatch = filteredItems.find((f) =>
        f.replace(/^[📁📄]\s*/, "") === stripped
      );
      selectedFiles.push({
        display: displayMatch ?? leaf,
        stripped: leaf,
        chipAddedAt: Date.now(),
      });
    }

    closeDropdown();
  }

  // ── Remove a file tag by index (chip click or keyboard) ──
  function removeFileTag(index: number): void {
    const tag = selectedFiles[index];
    if (!tag) return;

    // Count how many previous entries share the same stripped value
    let nth = 0;
    for (let i = 0; i < index; i++) {
      if (selectedFiles[i].stripped === tag.stripped) nth++;
    }

    // Splice from state first to avoid double-removal when onChange is triggered
    selectedFiles.splice(index, 1);

    // Find the @-mention in the textarea value and remove it
    const val = promptInput.value;
    const searchStr = `@${tag.stripped}`;
    const atIdx = findNthOccurrence(val, searchStr, nth);
    if (atIdx >= 0) {
      const endIdx = atIdx + searchStr.length;
      // Remove up to 2 trailing spaces (the ones added by selectItem)
      let afterEnd = endIdx;
      if (val[afterEnd] === " ") afterEnd++;
      if (val[afterEnd] === " ") afterEnd++;
      promptInput.value = val.slice(0, atIdx) + val.slice(afterEnd);
      promptInput.cursorPos = atIdx;
      (promptInput as any)._onValueChanged();
      if (promptInput.onChange) promptInput.onChange(promptInput.value);
    } else {
      // Just refresh the UI if text wasn't found (e.g. manually edited)
      (promptInput as any)._onValueChanged();
    }
  }

  // ── Inline chip rendering inside the textarea ──────────────
  // Store chip hit rects for mouse click detection (screen coordinates)
  const chipRects: Array<{ x: number; y: number; width: number; index: number }> = [];

  // Save a bound reference to the original renderContent
  const renderContent = promptInput.renderContent.bind(promptInput);

  // Helper: find the nth occurrence of search in text
  function findNthOccurrence(text: string, search: string, n: number): number {
    let pos = 0;
    let count = 0;
    while ((pos = text.indexOf(search, pos)) >= 0) {
      if (count === n) return pos;
      count++;
      pos += search.length;
    }
    return -1;
  }

  // Helper: which line does character position pos fall on?
  function rowFromPos(val: string, pos: number): number {
    return val.slice(0, pos).split("\n").length - 1;
  }

  // Override onPaint: normal text first, then overlay chip styling on @-mention blocks
  promptInput.onPaint = (buf, rect, theme) => {
    const hasBorder = promptInput.style.border !== "none";
    const bOff = hasBorder ? 1 : 0;
    const p = promptInput.style.padding;

    // Compute the padded content rect (accounting for border + padding)
    const contentRect = {
      x: rect.x + bOff + p.left,
      y: rect.y + bOff + p.top,
      width: Math.max(0, rect.width - bOff * 2 - p.left - p.right),
      height: Math.max(0, rect.height - bOff * 2 - p.top - p.bottom),
    };

    // Step 1: render normal text content into the padded content rect
    renderContent(buf, contentRect, theme);

    // Step 2: overlay chip styling on @-mention text ranges (like burstThreshold paste markers)
    chipRects.length = 0;
    if (selectedFiles.length === 0) return;

    const textW = contentRect.width - 1; // one column for scrollbar
    const scrollY = promptInput.scrollY;
    const val = promptInput.value;

    for (let ti = 0; ti < selectedFiles.length; ti++) {
      const tag = selectedFiles[ti];
      const searchStr = `@${tag.stripped}`;

      // Count how many previous entries share the same stripped value
      let nth = 0;
      for (let i = 0; i < ti; i++) {
        if (selectedFiles[i].stripped === tag.stripped) nth++;
      }

      const charPos = findNthOccurrence(val, searchStr, nth);
      if (charPos < 0) continue;

      const lineIdx = rowFromPos(val, charPos);
      if (lineIdx < scrollY || lineIdx >= scrollY + contentRect.height) continue;

      const lineStart = (promptInput as any)._lineStart(lineIdx) as number;
      const col = charPos - lineStart;

      // Need room for @-mention text + space + ✕
      if (col + searchStr.length + 2 > textW) continue;

      const screenX = contentRect.x + col;
      const screenY = contentRect.y + (lineIdx - scrollY);

      // ── Fade-in: blend from appBg to chip colors over ~150ms ──
      const age = Date.now() - tag.chipAddedAt;
      const fade = Math.min(1, age / FADE_DURATION);

      const xBg = lerpColor(theme.appBg, theme.elevatedBg, fade);
      const txtBg = lerpColor(theme.appBg, theme.elevatedBg, fade);
      const xFg = lerpColor(theme.text, theme.highlight, fade);

      // Overlay chip background on the @-mention text
      for (let i = 0; i < searchStr.length; i++) {
        buf.set(screenX + i, screenY, {
          char: searchStr[i],
          fg: theme.text,
          bg: txtBg,
        });
      }

      // Separator space before ✕
      buf.set(screenX + searchStr.length, screenY, {
        char: " ",
        fg: null,
        bg: xBg,
      });

      // Render ✕ at the end of the chip
      buf.set(screenX + searchStr.length + 1, screenY, {
        char: "✕",
        fg: xFg,
        bg: xBg,
        bold: true,
      });

      // Clickable area covers @-mention text + space + ✕ + trailing space
      chipRects.push({
        x: screenX,
        y: screenY,
        width: searchStr.length + 2 + 1,
        index: ti,
      });
    }
  };

  // ── Intercept mouse clicks for chip removal ────────────────
  const origOnMouse = promptInput.onMouse;
  promptInput.onMouse = (col, row, action, button) => {
    if (selectedFiles.length > 0 && action === "press" && button === 0) {
      // Check if click is on a chip rect (any row)
      for (const cr of chipRects) {
        if (row === cr.y && col >= cr.x && col < cr.x + cr.width) {
          removeFileTag(cr.index);
          return; // Consumed by chip
        }
      }
    }

    // Otherwise delegate to the textarea's mouse handler
    origOnMouse?.(col, row, action, button);
  };

  // ── onChange — close dropdown and sync chips ───────────────
  promptInput.onChange = (val: string) => {
    if (!val && triggerType) {
      closeDropdown();
    }

    // Sync selectedFiles: remove any tags that are no longer in the text.
    // We iterate backwards to safely splice while checking occurrences.
    for (let i = selectedFiles.length - 1; i >= 0; i--) {
      const tag = selectedFiles[i];
      const searchStr = `@${tag.stripped}`;
      let count = 0;
      for (let j = 0; j <= i; j++) {
        if (selectedFiles[j].stripped === tag.stripped) count++;
      }
      if (findNthOccurrence(val, searchStr, count - 1) < 0) {
        selectedFiles.splice(i, 1);
      }
    }
  };

  // ── onKeyPress hook ────────────────────────────────────────
  promptInput.onKeyPress = (key, modifiers, state) => {
    // ── Paste burst detection ────────────────────────────────
    const burstResult = (pasteBurstHandler.onKeyPress as any).call(
      promptInput,
      key,
      modifiers,
      state,
    );
    if (burstResult) return burstResult;

    // ── Model dropdown navigation & filter ───────────────────
    if (modelListOverlay) {
      if (key === "ArrowDown") {
        const items = modelListOverlay.items;
        if (selectedModelIndex < items.length - 1) {
          selectedModelIndex++;
          modelListOverlay.selectedIndex = selectedModelIndex;
          modelListOverlay.clampScroll();
        }
        return { consumed: true };
      }
      if (key === "ArrowUp") {
        if (selectedModelIndex > 0) {
          selectedModelIndex--;
          modelListOverlay.selectedIndex = selectedModelIndex;
          modelListOverlay.clampScroll();
        }
        return { consumed: true };
      }
      if (key === "Enter") {
        const items = modelListOverlay.items;
        if (selectedModelIndex < items.length && items.length > 0) {
          selectModel(items[selectedModelIndex]);
          return { consumed: true };
        }
        // No matching models — consume Enter (don't fall through to base handler)
        return { consumed: true };
      }
      if (key === "Escape") {
        app.removeOverlay(modelListOverlay);
        modelListOverlay = null;
        return { consumed: true };
      }
      if (key === "Backspace") {
        if (modelFilter.length > 0) {
          modelFilter = modelFilter.slice(0, -1);
          // Update textarea to show the filter
          promptInput.value = modelFilter;
          promptInput.cursorPos = modelFilter.length;
          (promptInput as any)._onValueChanged();
          if (promptInput.onChange) promptInput.onChange(promptInput.value);
          // Filter the model list
          const filtered = modelFilter
            ? MODELS.filter((m) => m.toLowerCase().includes(modelFilter.toLowerCase()))
            : [...MODELS];
          modelListOverlay.items = filtered;
          modelListOverlay.selectedIndex = 0;
          selectedModelIndex = 0;
          modelListOverlay.clampScroll();
        }
        // When filter is already empty, Backspace is a no-op (Escape closes the dropdown)
        return { consumed: true };
      }
      // Printable characters — filter the model list
      const isPrintable = !modifiers.ctrl && !modifiers.alt && key.length === 1;
      if (isPrintable) {
        modelFilter += key;
        promptInput.value = modelFilter;
        promptInput.cursorPos = modelFilter.length;
        (promptInput as any)._onValueChanged();
        if (promptInput.onChange) promptInput.onChange(promptInput.value);
        // Filter and update the dropdown
        const filtered = MODELS.filter((m) =>
          m.toLowerCase().includes(modelFilter.toLowerCase())
        );
        modelListOverlay.items = filtered;
        modelListOverlay.selectedIndex = 0;
        selectedModelIndex = 0;
        modelListOverlay.clampScroll();
        return { consumed: true };
      }
    }

    // ── Close dropdown if input is already empty ───────────
    if (triggerType && state.value.length === 0) {
      closeDropdown();
    }

    // ── Dropdown navigation (only when overlay is open) ─────
    if (overlay) {
      if (key === "ArrowDown") {
        if (selectedIndex < filteredItems.length - 1) {
          selectedIndex++;
          overlay.selectedIndex = selectedIndex;
          overlay.clampScroll();
        }
        return { consumed: true };
      }
      if (key === "ArrowUp") {
        if (selectedIndex > 0) {
          selectedIndex--;
          overlay.selectedIndex = selectedIndex;
          overlay.clampScroll();
        }
        return { consumed: true };
      }
      if (key === "Enter") {
        if (filteredItems.length > 0 && selectedIndex < filteredItems.length) {
          selectItem(filteredItems[selectedIndex]);
          return { consumed: true };
        }
        closeDropdown();
        return undefined;
      }
      if (key === "Escape") {
        closeDropdown();
        return { consumed: true };
      }
      if (key === " " || key === "Tab") {
        closeDropdown();
        return undefined; // Let the key be inserted normally
      }
    }

    // ── Trigger activation ───────────────────────────────────
    const isPrintable = !modifiers.ctrl && !modifiers.alt && key.length === 1;

    if (state.value.length === 0 && isPrintable && key === "/") {
      triggerType = "/";
      triggerPos = state.cursorPos;
      filteredItems = COMMANDS;
      selectedIndex = 0;
      showDropdown(COMMANDS);
      return undefined; // Let "/" be inserted
    }

    if (isPrintable && key === "@") {
      // Don't re-trigger if user types @ inside an existing @mention
      if (triggerType === "@") return undefined;
      triggerType = "@";
      triggerPos = state.cursorPos;
      filteredItems = files.slice(0, 50);
      selectedIndex = 0;
      showDropdown(filteredItems);
      return undefined; // Let "@" be inserted
    }

    // ── Filter suggestions as user types ─────────────────────
    if (triggerType && !overlay) {
      // Dropdown was closed (no matches) — check if we should re-open
      if (isPrintable) {
        const newQuery = state.value.slice(triggerPos) + key;
        const items = getFilteredItems(triggerType, newQuery);
        if (items.length > 0) {
          filteredItems = items;
          selectedIndex = 0;
          showDropdown(items);
        }
        return undefined;
      }
    }

    if (triggerType && overlay && isPrintable) {
      // Compute the text after the trigger after this key is inserted
      const newQuery =
        state.value.slice(triggerPos, state.cursorPos) +
        key +
        state.value.slice(state.cursorPos);
      const items = getFilteredItems(triggerType, newQuery);
      filteredItems = items;
      selectedIndex = 0;
      showDropdown(items);
      return undefined;
    }

    if (key === "Backspace" && triggerType) {
      if (state.cursorPos <= triggerPos + 1) {
        // Deleting the trigger character itself
        closeDropdown();
        return undefined;
      }
      // Re-filter after backspace
      if (state.cursorPos > 0) {
        const before = state.value.slice(0, state.cursorPos);
        const chars = [...before];
        chars.pop();
        const newBefore = chars.join("");
        const newValue = newBefore + state.value.slice(state.cursorPos);
        // If the value becomes empty, close the dropdown
        if (newValue.length === 0) {
          closeDropdown();
          return undefined;
        }
        const newQuery = newValue.slice(triggerPos);
        const items = getFilteredItems(triggerType, newQuery);
        filteredItems = items;
        selectedIndex = 0;
        showDropdown(items);
      }
      return undefined;
    }

    return undefined;
  };

  function getFilteredItems(
    type: "/" | "@",
    query: string,
  ): string[] {
    if (type === "/") {
      const search = query.slice(1).toLowerCase(); // Remove "/" prefix
      return COMMANDS.filter((c) => c.includes(search));
    }
    if (type === "@") {
      const search = query.slice(1).toLowerCase(); // Remove "@" prefix
      return files
        .filter((f) => {
          const name = f.replace(/^[📁📄]\s*/, "").toLowerCase();
          return name.includes(search);
        })
        .slice(0, 50);
    }
    return [];
  }
}

export function buildApp(): App {
  const root = Box.col("root");

  const modelState = { current: "claude-sonnet-4" };
  const { mainUI, promptInput } = buildMainUI(modelState);

  const splash = new Box("splash");
  splash.focusable = true;

  splash.onPaint = (buf, rect, theme) => {
    buf.fill(rect.x, rect.y, rect.width, rect.height, {
      char: " ",
      bg: theme.appBg,
      fg: null,
    });

    const logoHeight = ASCII_LOGO.length;
    const startY = rect.y + Math.floor((rect.height - logoHeight - 4) / 2);

    for (const line of ASCII_LOGO) {
      const x = rect.x + Math.floor((rect.width - line.length) / 2);
      const y = startY + ASCII_LOGO.indexOf(line);
      for (let j = 0; j < line.length; j++) {
        buf.set(x + j, y, { char: line[j], fg: theme.highlight, bold: true });
      }
    }

    const versionY = startY + logoHeight + 1;
    const versionText = "Coder 0.1.0";
    const versionX = rect.x + Math.floor((rect.width - versionText.length) / 2);
    for (let j = 0; j < versionText.length; j++) {
      buf.set(versionX + j, versionY, { char: versionText[j], fg: theme.text });
    }

    const hintText = "Press any key to continue";
    const hintY = versionY + 2;
    const hintX = rect.x + Math.floor((rect.width - hintText.length) / 2);
    for (let j = 0; j < hintText.length; j++) {
      buf.set(hintX + j, hintY, { char: hintText[j], fg: theme.muted });
    }
  };

  root.add(splash);

  const app = new App(root, { mouse: true });

  // Wire up slash commands and file mentions on the prompt textarea
  setupPromptInput(promptInput, app, modelState);


  splash.onKey = () => {
    root.children = [mainUI];
    app.focusManager?.focusFirst();
  };

  return app;
}

function buildExecutionInfo(modelState: { current: string }): Box {
  const panel = Box.col("execution-info");
  panel.style.border = "rounded";
  panel.style.padding = { top: 1, right: 1, bottom: 1, left: 1 };
  panel.style.gutter = 1;

  const appId = new Box("app-id");
  appId.height = { fixed: 3 };
  appId.onPaint = (buf, rect, theme) => {
    paintText(buf, rect, "Coder 0.1.0", 0, theme.highlight, true);
    paintText(buf, rect, "AI Code Assistant", 1, theme.muted);
  };

  const modelBox = new Box("model");
  modelBox.height = { fixed: 1 };
  modelBox.onPaint = (buf, rect, theme) => {
    paintText(buf, rect, `Model: ${modelState.current}`, 0, theme.text);
  };

  const toolBox = new Box("tool");
  toolBox.height = { fixed: 1 };
  toolBox.onPaint = (buf, rect, theme) => {
    paintText(buf, rect, "Tool: idle", 0, theme.muted);
  };

  const todoBox = new Box("todo");
  todoBox.style.border = "rounded";
  todoBox.style.overflow = "auto";
  todoBox.style.padding = { top: 1, right: 1, bottom: 1, left: 1 };
  todoBox.onPaint = (buf, rect, theme) => {
    paintText(buf, rect, "☑ Implement sorting function", 0, theme.text);
    paintText(buf, rect, "☐ Add tests", 1, theme.muted);
    paintText(buf, rect, "☐ Update documentation", 2, theme.muted);
    paintText(buf, rect, "☐ Review PR", 3, theme.muted);
  };

  const indicator = new Box("indicator");
  indicator.height = { fixed: 1 };
  indicator.onPaint = (buf, rect, theme) => {
    paintText(buf, rect, "✦ AI ready", 0, theme.muted);
  };

  panel.add(appId, modelBox, toolBox, todoBox, indicator);
  return panel;
}

function buildMainUI(modelState: { current: string }): { mainUI: Box; promptInput: TextArea; executionInfo: Box } {
  const mainCol = Box.col("main-ui");

  const mainRow = Box.row("main-row");
  const chatArea = buildChatArea();
  const executionInfo = buildExecutionInfo(modelState);
  const splitter = new Splitter("horizontal", chatArea, executionInfo, {
    initialSplit: "75%",
    minB: 50,
  });
  mainRow.add(splitter);

  const bottomBar = Box.col("bottom-bar");
  bottomBar.style.padding = { top: 0, right: 1, bottom: 1, left: 1 };
  bottomBar.style.gutter = 0;

  const promptInput = new TextArea("Prompt", "Type a message...");
  promptInput.tabIndex = 0;

  bottomBar.add(promptInput);

  const mainSplitter = new Splitter("vertical", mainRow, bottomBar, {
    initialSplit: "85%",
    minA: "50%",
    minB: 7,
  });

  mainCol.add(mainSplitter);
  return { mainUI: mainCol, promptInput, executionInfo };
}

function buildChatArea(): Box {
  const chatArea = Box.col("chat-area");
  chatArea.style.border = "rounded";

  const messages = Box.col("messages");
  messages.style.overflow = "auto";
  messages.style.gutter = 1;

  messages.add(
    createAssistantMsg(
      "Hello! I'm Coder, your AI coding assistant. I can help you write, refactor, and understand code. What are we working on today?",
    ),
  );

  const thinking = new Collapsible("Thought for 2.1s", true);
  const thinkingContent = new Box("thinking-content");
  thinkingContent.height = { fixed: 3 };
  thinkingContent.onPaint = (buf, rect, theme) => {
    paintText(
      buf,
      rect,
      "The user wants a sorting function. Checking existing codebase...",
      0,
      theme.muted,
    );
    paintText(
      buf,
      rect,
      "Found src/sort.ts with basic implementation. Analyzing...",
      1,
      theme.muted,
    );
    paintText(
      buf,
      rect,
      "Need to propose adding a descending order option.",
      2,
      theme.muted,
    );
  };
  thinking.add(thinkingContent);
  messages.add(thinking);

  const toolResult = new Collapsible("Tool: read_file", false);
  const toolContent = new Box("tool-content");
  toolContent.height = { fixed: 6 };
  toolContent.onPaint = (buf, rect, theme) => {
    paintText(buf, rect, "  File: src/sort.ts", 0, theme.highlight);
    paintText(buf, rect, "  Size: 156 bytes", 1, theme.muted);
    paintText(buf, rect, "  ─────────────────────────────────", 2, theme.muted);
    paintText(
      buf,
      rect,
      "  function sortArray(arr: number[]): number[] {",
      3,
      theme.text,
    );
    paintText(
      buf,
      rect,
      "    return arr.sort((a, b) => a - b);",
      4,
      theme.text,
    );
    paintText(buf, rect, "  }", 5, theme.text);
  };
  toolResult.add(toolContent);
  messages.add(toolResult);

  messages.add(
    createAssistantMsg(
      "I found the sorting function. It currently sorts in ascending order. I can add a descending option if you'd like.",
    ),
  );

  messages.add(createUserMsg("Can you add a descending order option?"));

  chatArea.add(messages);
  return chatArea;
}

function wordWrap(text: string, maxWidth: number): string[] {
  if (maxWidth < 1) return [];
  const result: string[] = [];
  const paragraphs = text.split("\n");
  for (let pi = 0; pi < paragraphs.length; pi++) {
    const para = paragraphs[pi];
    if (pi > 0) result.push("");
    if (para.length === 0) continue;

    let start = 0;
    while (start < para.length) {
      if (para.length - start <= maxWidth) {
        result.push(para.slice(start));
        break;
      }
      let end = start + maxWidth;
      if (end < para.length && para[end] !== " ") {
        const lastSpace = para.lastIndexOf(" ", end);
        if (lastSpace > start) end = lastSpace;
      }
      result.push(para.slice(start, end));
      start = end;
      while (start < para.length && para[start] === " ") start++;
    }
  }
  return result;
}

function createUserMsg(text: string): Box {
  const msg = Box.col("msg-user");
  msg.style.gutter = 0;
  msg.height = {};

  const label = new Box("bubble");
  label.height = { fixed: 1 };
  const userName = "  user   ";
  label.onPaint = (buf, rect, theme) => {
    const x = rect.x + rect.width - userName.length;
    for (let j = 0; j < userName.length; j++) {
      buf.set(x + j, rect.y, {
        char: userName[j],
        fg: theme.appBg,
        bg: theme.highlight,
        bold: true,
      });
    }
  };

  const response = new Box("response");
  response.height = { fixed: 1 };
  response.onPaint = (buf, rect, theme) => {
    const wrapWidth = Math.max(1, rect.width - 2);
    const wrapped = wordWrap(text, wrapWidth);
    const neededH = wrapped.length + 2;
    if (response.height.fixed !== neededH) {
      response.height.fixed = neededH;
    }
    for (let i = 0; i < rect.height; i++) {
      for (let j = 0; j < rect.width; j++) {
        const lineIdx = i - 1;
        const charIdx = j - 1;
        const char =
          lineIdx >= 0 &&
          lineIdx < wrapped.length &&
          charIdx >= 0 &&
          charIdx < wrapped[lineIdx].length
            ? wrapped[lineIdx][charIdx]
            : " ";
        buf.set(rect.x + j, rect.y + i, {
          char,
          fg:
            lineIdx >= 0 &&
            lineIdx < wrapped.length &&
            charIdx >= 0 &&
            charIdx < wrapped[lineIdx].length
              ? theme.text
              : theme.disabledBg,
          bg: theme.disabledBg,
        });
      }
    }
  };

  msg.add(label, response);
  return msg;
}

function createAssistantMsg(text: string): Box {
  const msg = Box.col("msg-assistant");
  msg.style.gutter = 0;
  msg.height = {};

  const label = new Box("bubble");
  label.height = { fixed: 1 };
  const assistantName = " Assistant ";
  label.onPaint = (buf, rect, theme) => {
    for (let j = 0; j < assistantName.length; j++) {
      buf.set(rect.x + j, rect.y, {
        char: assistantName[j],
        fg: theme.appBg,
        bg: theme.highlight,
        bold: true,
      });
    }
  };

  const response = new Box("response");
  response.height = { fixed: 1 };
  response.onPaint = (buf, rect, theme) => {
    const wrapWidth = Math.max(1, rect.width - 2);
    const wrapped = wordWrap(text, wrapWidth);
    const neededH = wrapped.length + 2;
    if (response.height.fixed !== neededH) {
      response.height.fixed = neededH;
    }
    for (let i = 0; i < rect.height; i++) {
      for (let j = 0; j < rect.width; j++) {
        const lineIdx = i - 1;
        const charIdx = j - 1;
        const char =
          lineIdx >= 0 &&
          lineIdx < wrapped.length &&
          charIdx >= 0 &&
          charIdx < wrapped[lineIdx].length
            ? wrapped[lineIdx][charIdx]
            : " ";
        buf.set(rect.x + j, rect.y + i, {
          char,
          fg:
            lineIdx >= 0 &&
            lineIdx < wrapped.length &&
            charIdx >= 0 &&
            charIdx < wrapped[lineIdx].length
              ? theme.text
              : theme.disabledBg,
          bg: theme.disabledBg,
        });
      }
    }
  };

  msg.add(label, response);
  return msg;
}

if (import.meta.main) {
  const app = buildApp();
  await app.run();
}
