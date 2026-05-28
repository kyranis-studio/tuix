import {
  App,
  Box,
  Splitter,
  TextArea,
  Collapsible,
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

export function buildApp(): App {
  const root = Box.col("root");

  const mainUI = buildMainUI();

  const splash = new Box("splash");
  splash.focusable = true;

  splash.onPaint = (buf, rect, theme) => {
    buf.fill(rect.x, rect.y, rect.width, rect.height, {
      char: " ",
      bg: theme.bg,
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

  splash.onKey = () => {
    root.children = [mainUI];
    app.focusManager?.focusFirst();
  };

  return app;
}

function buildMainUI(): Box {
  const mainCol = Box.col("main-ui");

  const mainRow = Box.row("main-row");
  const chatArea = buildChatArea();
  const rightPanel = buildExecutionInfo();
  const splitter = new Splitter("horizontal", chatArea, rightPanel, {
    initialSplit: "75%",
    minB: 50,
  });
  mainRow.add(splitter);

  const bottomBar = Box.row("bottom-bar");
  bottomBar.style.padding = { top: 1, right: 1, bottom: 1, left: 1 };
  const promptInput = new TextArea("Prompt", "Type a message...");
  promptInput.tabIndex = 0;

  bottomBar.add(promptInput);

  const mainSplitter = new Splitter("vertical", mainRow, bottomBar, {
    initialSplit: "85%",
    minA: "50%",
    minB: 7,
  });

  mainCol.add(mainSplitter);
  return mainCol;
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
        fg: theme.bg,
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
              : theme.disabled,
          bg: theme.disabled,
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
        fg: theme.bg,
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
              : theme.disabled,
          bg: theme.disabled,
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
