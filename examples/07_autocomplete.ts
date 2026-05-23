/**
 * 07_autocomplete.ts
 *
 * Autocomplete component demo with inline suggestion dropdown.
 *
 * Demonstrates:
 *   • Autocomplete widget with text input and filtered suggestions
 *   • Arrow key navigation through suggestions
 *   • Enter to select a suggestion, Escape to close dropdown
 *   • Mouse click to pick a suggestion
 *   • Custom filter function support
 *   • onChange and onSelect callbacks
 *
 * Controls:
 *   Tab / Shift+Tab   — cycle focus
 *   Type characters   — filter suggestions
 *   ArrowUp/Down      — navigate suggestions
 *   Enter             — select highlighted suggestion
 *   Escape            — close dropdown
 *   Mouse click       — select suggestion
 *   Ctrl+C            — quit
 */

import {
  App,
  Box,
  Autocomplete,
  Button,
  Checkbox,
  paintCenteredText,
  paintText,
  edgesAll,
  defaultTheme,
} from "../src/mod.ts";

// ─── Suggestions Data ─────────────────────────────────────────────────────────

const programmingLanguages = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Rust",
  "Go",
  "Java",
  "JavaScript",
  "Kotlin",
  "Swift",
  "C",
  "C++",
  "C#",
  "Ruby",
  "PHP",
  "Perl",
  "Lua",
  "Zig",
  "Haskell",
  "Elixir",
  "Clojure",
  "Dart",
  "Deno",
  "Node.js",
  "React",
  "Vue",
  "Angular",
  "Svelte",
];

const fruits = [
  "Apple",
  "Apricot",
  "Avocado",
  "Banana",
  "Blackberry",
  "Blueberry",
  "Cherry",
  "Coconut",
  "Date",
  "Elderberry",
  "Fig",
  "Grape",
  "Grapefruit",
  "Guava",
  "Kiwi",
  "Lemon",
  "Lime",
  "Mango",
  "Melon",
  "Orange",
  "Papaya",
  "Peach",
  "Pear",
  "Pineapple",
  "Plum",
  "Pomegranate",
  "Raspberry",
  "Strawberry",
  "Watermelon",
];

const countries = [
  "Argentina",
  "Australia",
  "Austria",
  "Belgium",
  "Brazil",
  "Canada",
  "China",
  "Colombia",
  "Denmark",
  "Egypt",
  "Finland",
  "France",
  "Germany",
  "Greece",
  "India",
  "Indonesia",
  "Ireland",
  "Israel",
  "Italy",
  "Japan",
  "Mexico",
  "Netherlands",
  "New Zealand",
  "Norway",
  "Poland",
  "Portugal",
  "Singapore",
  "South Korea",
  "Spain",
  "Sweden",
  "Switzerland",
  "Thailand",
  "Turkey",
  "United Kingdom",
  "United States",
];

// ─── State ────────────────────────────────────────────────────────────────────

let selectedLang = "";
let selectedFruit = "";
let selectedCountry = "";
let strictMode = false;

// ─── Header ───────────────────────────────────────────────────────────────────

const header = new Box("hdr");
header.height = { fixed: 3 };
header.style.bg = defaultTheme.toolbarBg;
header.onPaint = (buf, rect, theme) => {
  buf.fill(rect.x, rect.y, rect.width, rect.height, {
    char: " ",
    bg: theme.toolbarBg,
  });
  paintCenteredText(
    buf,
    rect,
    "✦  tuix Autocomplete Demo  ✦  VS Code Theme",
    theme.toolbarText,
    theme.toolbarBg,
    true,
  );
};

// ─── Main Content ────────────────────────────────────────────────────────────

const content = Box.col("Autocomplete Demo");
content.style.border = "single";
content.style.padding = edgesAll(2);
content.style.gutter = 1;
content.style.bg = defaultTheme.bg;

// Autocomplete for programming languages
const langLabel = new Box("Language");
langLabel.style.fg = defaultTheme.highlight;
langLabel.height = { fixed: 1 };

const langAutocomplete = new Autocomplete(
  "Type to search languages...",
  programmingLanguages,
  (item) => {
    selectedLang = item;
  },
);
langAutocomplete.tabIndex = 1;
langAutocomplete.maxVisibleItems = 8;

// Autocomplete for fruits
const fruitLabel = new Box("Fruit");
fruitLabel.style.fg = defaultTheme.highlight;
fruitLabel.height = { fixed: 1 };

const fruitAutocomplete = new Autocomplete(
  "Type to search fruits...",
  fruits,
  (item) => {
    selectedFruit = item;
  },
);
fruitAutocomplete.tabIndex = 2;
fruitAutocomplete.maxVisibleItems = 6;

// Autocomplete for countries
const countryLabel = new Box("Country");
countryLabel.style.fg = defaultTheme.highlight;
countryLabel.height = { fixed: 1 };

const countryAutocomplete = new Autocomplete(
  "Start typing a country name...",
  countries,
  (item) => {
    selectedCountry = item;
  },
);
countryAutocomplete.tabIndex = 3;
countryAutocomplete.maxVisibleItems = 6;

// Custom filter example: strict prefix matching
const strictToggle = new Checkbox(
  "Strict Prefix Mode",
  strictMode,
  (checked) => {
    strictMode = checked;
    if (strictMode) {
      langAutocomplete.filterFn = (val, suggestions) => {
        if (!val) return [];
        return suggestions.filter((s) =>
          s.toLowerCase().startsWith(val.toLowerCase()),
        );
      };
      fruitAutocomplete.filterFn = (val, suggestions) => {
        if (!val) return [];
        return suggestions.filter((s) =>
          s.toLowerCase().startsWith(val.toLowerCase()),
        );
      };
      countryAutocomplete.filterFn = (val, suggestions) => {
        if (!val) return [];
        return suggestions.filter((s) =>
          s.toLowerCase().startsWith(val.toLowerCase()),
        );
      };
    } else {
      langAutocomplete.filterFn = null;
      fruitAutocomplete.filterFn = null;
      countryAutocomplete.filterFn = null;
    }
  },
);
strictToggle.tabIndex = 4;

content.add(
  langLabel,
  langAutocomplete,
  fruitLabel,
  fruitAutocomplete,
  countryLabel,
  countryAutocomplete,
  strictToggle,
);

// ─── Status Bar ─────────────────────────────────────────────────────────────

const statusBar = new Box("status");
statusBar.height = { fixed: 1 };
statusBar.style.bg = defaultTheme.bg;
statusBar.onPaint = (buf, rect, theme) => {
  buf.fill(rect.x, rect.y, rect.width, 1, { char: " ", bg: theme.bg });

  const selections = [
    `Language: ${selectedLang || "—"}`,
    `Fruit: ${selectedFruit || "—"}`,
    `Country: ${selectedCountry || "—"}`,
  ].join("  │  ");
  const hint = `  ${selections}  │  Tab: next focus  │  Ctrl+C: quit`;

  for (let i = 0; i < hint.length && i < rect.width; i++) {
    buf.set(rect.x + i, rect.y, {
      char: hint[i],
      fg: theme.muted,
      bg: theme.bg,
    });
  }
};

// ─── Assemble Root ──────────────────────────────────────────────────────────

const root = Box.col("root");
root.style.bg = defaultTheme.bg;
root.add(header, content, statusBar);

// ─── Run ─────────────────────────────────────────────────────────────────────

const app = new App(root, { theme: defaultTheme, fps: 30, mouse: true });
await app.run();
