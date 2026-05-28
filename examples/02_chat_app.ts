import {
  App,
  Box,
  Splitter,
  TextArea,
  Collapsible,
  FloatingListBox,
  paintText,
} from "../src/mod.ts";

const ASCII_LOGO = [
  " ██████╗  ██████╗  ██████╗  ███████╗ ██████╗",
  "██╔════╝ ██╔═══██╗ ██╔══██╗ ██╔════╝ ██╔══██║",
  "██║      ██║   ██║ ██║  ██║ █████╗   ██████╔╝",
  "██║      ██║   ██║ ██║  ██║ ██╔══╝   ██╔══██╗",
  " ██████╗  ██████╔╝ ██████╔╝ ███████╗ ██║  ██║",
  " ╚═════╝  ╚═════╝  ╚═════╝  ╚══════╝ ╚═╝  ╚═╝",
];

function setupPromptInput(promptInput: TextArea, app: App, fileTagsBar: Box): void {
  // ── State for the slash/mention dropdown overlay ────────────
  let triggerType: "/" | "@" | null = null;
  let triggerPos = -1;
  let overlay: FloatingListBox | null = null;
  let filteredItems: string[] = [];
  let selectedIndex = 0;
  let files: string[] = [];
  // ── Selected files for @-mention tags ────────────────
  const selectedFiles: Array<{ display: string; stripped: string }> = [];

  const COMMANDS = ["/new", "/help", "/clear", "/models"];

  // ── Fake file listing for @ mentions ───────────────────────
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
  files = FAKE_FILES;

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
    // Close existing overlay
    if (overlay) {
      app.removeOverlay(overlay);
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

    const maxItemWidth = Math.max(...items.map((s) => s.length));
    const listWidth = Math.max(maxItemWidth + 4, promptInput.rect.width);
    list.width = { fixed: listWidth };
    list.height = { fixed: Math.min(items.length, 8) + 2 };

    app.showOverlay(list, {
      modal: false,
      autoDismiss: true,
      triggerRect: {
        x: promptInput.rect.x,
        y: fileTagsBar.rect.y,
        width: promptInput.rect.width,
        height: promptInput.rect.y + promptInput.rect.height - fileTagsBar.rect.y,
      },
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

  function selectItem(item: string): void {
    // Strip icon prefix for @ mentions
    const stripped = item.replace(/^[📁📄]\s*/, "");
    // Preserve @ prefix for file mentions so Backspace can detect the block
    const prefix = triggerType === "@" ? "@" : "";
    // Replace everything from triggerPos with the selected item
    promptInput.value =
      promptInput.value.slice(0, triggerPos) +
      prefix + stripped;
    promptInput.cursorPos = triggerPos + prefix.length + stripped.length;
    // Trigger callbacks that the base handler normally fires
    (promptInput as any)._onValueChanged();
    if (promptInput.onChange) promptInput.onChange(promptInput.value);

    // Add to file tags BEFORE closeDropdown() clears filteredItems
    if (triggerType === "@") {
      const displayMatch = filteredItems.find((f) =>
        f.replace(/^[📁📄]\s*/, "") === stripped
      );
      selectedFiles.push({
        display: displayMatch ?? stripped,
        stripped,
      });
      updateFileTagsBar();
    }

    closeDropdown();
  }

  // ── File tags bar (show selected files with x to remove) ────
  const fileTagXPositions: number[] = [];

  function removeFileTag(index: number): void {
    const file = selectedFiles[index];
    if (!file) return;
    selectedFiles.splice(index, 1);
    // Remove the @mention from the prompt value
    const atPattern = `@${file.stripped}`;
    const val = promptInput.value;
    const atIdx = val.indexOf(atPattern);
    if (atIdx >= 0) {
      promptInput.value = val.slice(0, atIdx) + val.slice(atIdx + atPattern.length);
      promptInput.cursorPos = Math.min(atIdx, promptInput.value.length);
      (promptInput as any)._onValueChanged();
      if (promptInput.onChange) promptInput.onChange(promptInput.value);
    }
    updateFileTagsBar();
  }

  function updateFileTagsBar(): void {
    fileTagsBar.height.fixed = selectedFiles.length > 0 ? 1 : 0;
  }

  fileTagsBar.onPaint = (buf, rect, theme) => {
    fileTagXPositions.length = 0;
    if (selectedFiles.length === 0) return;
    // Fill background
    buf.fill(rect.x, rect.y, rect.width, rect.height, {
      char: " ",
      bg: theme.secondaryBg,
      fg: null,
    });
    // Paint tags
    let x = rect.x;
    for (let i = 0; i < selectedFiles.length; i++) {
      const tag = ` ${selectedFiles[i].display} ✕`;
      const chars = [...tag];
      for (let ci = 0; ci < chars.length; ci++) {
        buf.set(x + ci, rect.y, {
          char: chars[ci],
          fg: ci === chars.length - 1 ? theme.highlight : theme.text,
          bg: theme.secondaryBg,
          bold: ci === chars.length - 1,
        });
      }
      fileTagXPositions.push(x + chars.length - 1);
      x += chars.length + 1; // tag width + separator
      if (x >= rect.x + rect.width) break;
    }
  };

  fileTagsBar.onMouse = (col, row, action, button) => {
    if (action === "press" && button === 0 && selectedFiles.length > 0) {
      for (let i = 0; i < fileTagXPositions.length; i++) {
        if (col === fileTagXPositions[i]) {
          removeFileTag(i);
          return;
        }
      }
    }
  };

  // ── onKeyPress hook ────────────────────────────────────────
  promptInput.onKeyPress = (key, modifiers, state) => {
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

    if (isPrintable && key === "/") {
      triggerType = "/";
      triggerPos = state.cursorPos;
      filteredItems = COMMANDS;
      selectedIndex = 0;
      showDropdown(COMMANDS);
      return undefined; // Let "/" be inserted
    }

    if (isPrintable && key === "@") {
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
      if (items.length > 0) {
        filteredItems = items;
        selectedIndex = 0;
        showDropdown(items);
      } else {
        closeDropdown();
      }
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
        const newQuery = newValue.slice(triggerPos);
        const items = getFilteredItems(triggerType, newQuery);
        if (items.length > 0) {
          filteredItems = items;
          selectedIndex = 0;
          showDropdown(items);
        } else {
          closeDropdown();
        }
      }
      return undefined;
    }

    // ── Delete entire @-mention block on Backspace ──────────────
    if (key === "Backspace" && state.cursorPos > 0) {
      const val = state.value;
      const cur = state.cursorPos;
      // Scan backwards from cursor for '@' with no spaces/newlines in between
      let atIdx = -1;
      for (let i = cur - 1; i >= 0; i--) {
        if (val[i] === "@") { atIdx = i; break; }
        if (val[i] === " " || val[i] === "\n") break;
      }
      if (atIdx >= 0 && cur > atIdx) {
        return {
          value: val.slice(0, atIdx) + val.slice(cur),
          cursorPos: atIdx,
        };
      }
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

  const { mainUI, promptInput, fileTagsBar } = buildMainUI();

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
  setupPromptInput(promptInput, app, fileTagsBar);

  splash.onKey = () => {
    root.children = [mainUI];
    app.focusManager?.focusFirst();
  };

  return app;
}

function buildMainUI(): { mainUI: Box; promptInput: TextArea; fileTagsBar: Box } {
  const mainCol = Box.col("main-ui");

  const mainRow = Box.row("main-row");
  const chatArea = buildChatArea();
  const rightPanel = buildExecutionInfo();
  const splitter = new Splitter("horizontal", chatArea, rightPanel, {
    initialSplit: "75%",
    minB: 50,
  });
  mainRow.add(splitter);

  const bottomBar = Box.col("bottom-bar");
  bottomBar.style.padding = { top: 0, right: 1, bottom: 1, left: 1 };
  bottomBar.style.gutter = 0;

  const fileTagsBar = new Box("file-tags");
  fileTagsBar.height = { fixed: 0 };
  fileTagsBar.width = { grow: 1 };

  const promptInput = new TextArea("Prompt", "Type a message...");
  promptInput.tabIndex = 0;

  bottomBar.add(fileTagsBar, promptInput);

  const mainSplitter = new Splitter("vertical", mainRow, bottomBar, {
    initialSplit: "85%",
    minA: "50%",
    minB: 7,
  });

  mainCol.add(mainSplitter);
  return { mainUI: mainCol, promptInput, fileTagsBar };
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

function buildExecutionInfo(): Box {
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
    paintText(buf, rect, "Model: claude-sonnet-4", 0, theme.text);
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

if (import.meta.main) {
  const app = buildApp();
  await app.run();
}
