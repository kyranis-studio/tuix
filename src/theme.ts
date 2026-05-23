/**
 * theme.ts — Theme types and the default "Amber" dark theme.
 */

export interface Color {
  r: number;
  g: number;
  b: number;
}

export function rgb(r: number, g: number, b: number): Color {
  return { r, g, b };
}

export function hex(h: string): Color {
  const s = h.replace("#", "");
  return {
    r: parseInt(s.slice(0, 2), 16),
    g: parseInt(s.slice(2, 4), 16),
    b: parseInt(s.slice(4, 6), 16),
  };
}

// ─── Border character sets ────────────────────────────────────────────────────

export interface BorderChars {
  topLeft: string;
  topRight: string;
  bottomLeft: string;
  bottomRight: string;
  horizontal: string;
  vertical: string;
  /** Splitter handle character */
  splitter: string;
}

export const BORDERS = {
  none: {
    topLeft: " ", topRight: " ", bottomLeft: " ", bottomRight: " ",
    horizontal: " ", vertical: " ", splitter: " ",
  } as BorderChars,
  single: {
    topLeft: "┌", topRight: "┐", bottomLeft: "└", bottomRight: "┘",
    horizontal: "─", vertical: "│", splitter: "┼",
  } as BorderChars,
  double: {
    topLeft: "╔", topRight: "╗", bottomLeft: "╚", bottomRight: "╝",
    horizontal: "═", vertical: "║", splitter: "╬",
  } as BorderChars,
  rounded: {
    topLeft: "╭", topRight: "╮", bottomLeft: "╰", bottomRight: "╯",
    horizontal: "─", vertical: "│", splitter: "┼",
  } as BorderChars,
  bold: {
    topLeft: "┏", topRight: "┓", bottomLeft: "┗", bottomRight: "┛",
    horizontal: "━", vertical: "┃", splitter: "╋",
  } as BorderChars,
} as const;

export type BorderStyle = keyof typeof BORDERS | BorderChars;

// ─── Theme definition ─────────────────────────────────────────────────────────

export interface Theme {
  /** Terminal background */
  bg: Color;
  /** Panel / container background */
  panelBg: Color;
  /** Default foreground text */
  text: Color;
  /** Muted / secondary text */
  muted: Color;
  /** Highlight / accent — yellowish */
  highlight: Color;
  /** Focus ring color */
  focus: Color;
  /** Border color */
  border: Color;
  /** Focused border color */
  focusBorder: Color;
  /** Non-focusable zone tint */
  disabled: Color;
  /** Header/toolbar background */
  toolbarBg: Color;
  /** Header/toolbar text */
  toolbarText: Color;
  /** Splitter color */
  splitter: Color;

  /** Default border style */
  defaultBorder: BorderStyle;
}

// ─── VS Code Dark+ theme ──────────────────────────────────────────────────────
//
// Colors sourced from the official VS Code Dark+ / Dark Modern theme:
//   bg        #1E1E1E  editor.background
//   panelBg   #252526  sideBar.background / panel.background
//   text      #D4D4D4  editor.foreground
//   muted     #6A6A6A  editorLineNumber.foreground (approx)
//   highlight #DCDCAA  → VS Code function yellow (editorTokenColorCustomizations)
//   focus     #FFD700  bright gold — focus ring
//   border    #3C3C3C  panel.border / editorGroup.border
//   focusBorder #FFD700  yellow glow when box is focused
//   disabled  #2D2D2D  disabledForeground background tint
//   toolbarBg #333333  activityBar.background
//   toolbarText #DCDCAA yellow on toolbar (echoes VS Code's yellow tokens)
//   splitter  #FFD700  sash.hoverBorder — bright yellow drag handle

export const vscodeDarkTheme: Theme = {
  bg:          hex("#1E1E1E"),   // editor.background
  panelBg:     hex("#252526"),   // sideBar.background
  text:        hex("#D4D4D4"),   // editor.foreground
  muted:       hex("#6A6A6A"),   // editorLineNumber.foreground
  highlight:   hex("#DCDCAA"),   // VS Code function/variable yellow
  focus:       hex("#FFD700"),   // bright gold focus indicator
  border:      hex("#3C3C3C"),   // panel.border
  focusBorder: hex("#FFD700"),   // sash.hoverBorder — yellow glow
  disabled:    hex("#2D2D2D"),   // disabled background tint
  toolbarBg:   hex("#333333"),   // activityBar.background
  toolbarText: hex("#DCDCAA"),   // yellow tokens on toolbar
  splitter:    hex("#FFD700"),   // bright yellow drag handle
  defaultBorder: "single",
};

// ─── Amber theme (kept as named alternative) ──────────────────────────────────

export const amberTheme: Theme = {
  bg:          hex("#1A1A2E"),
  panelBg:     hex("#16213E"),
  text:        hex("#E8E8F0"),
  muted:       hex("#6B6B8A"),
  highlight:   hex("#F5C518"),
  focus:       hex("#FFD700"),
  border:      hex("#3A3A5C"),
  focusBorder: hex("#F5C518"),
  disabled:    hex("#2A2A3E"),
  toolbarBg:   hex("#0F3460"),
  toolbarText: hex("#F5C518"),
  splitter:    hex("#E8A020"),
  defaultBorder: "single",
};

export const defaultTheme = vscodeDarkTheme;

// ─── Theme registry ───────────────────────────────────────────────────────────

const registry: Map<string, Theme> = new Map([
  ["vscode-dark", vscodeDarkTheme],
  ["amber", amberTheme],
]);
let _active = vscodeDarkTheme;

export const ThemeRegistry = {
  register(name: string, theme: Theme): void {
    registry.set(name, theme);
  },
  set(name: string): void {
    const t = registry.get(name);
    if (!t) throw new Error(`Theme "${name}" not found`);
    _active = t;
  },
  get active(): Theme {
    return _active;
  },
  setDirect(theme: Theme): void {
    _active = theme;
  },
};

export function getBorderChars(style: BorderStyle): BorderChars {
  if (typeof style === "string") return BORDERS[style] ?? BORDERS.single;
  return style;
}
