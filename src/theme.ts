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

// ─── One Dark (Atom) ──────────────────────────────────────────────────────────

export const oneDarkTheme: Theme = {
  bg:          hex("#282C34"),
  panelBg:     hex("#21252B"),
  text:        hex("#ABB2BF"),
  muted:       hex("#5C6370"),
  highlight:   hex("#E5C07B"),
  focus:       hex("#528BFF"),
  border:      hex("#3E4452"),
  focusBorder: hex("#528BFF"),
  disabled:    hex("#2C323C"),
  toolbarBg:   hex("#181A1F"),
  toolbarText: hex("#E5C07B"),
  splitter:    hex("#528BFF"),
  defaultBorder: "rounded",
};

// ─── Solarized Dark ───────────────────────────────────────────────────────────

export const solarizedDarkTheme: Theme = {
  bg:          hex("#002B36"),
  panelBg:     hex("#073642"),
  text:        hex("#93A1A1"),
  muted:       hex("#657B83"),
  highlight:   hex("#B58900"),
  focus:       hex("#268BD2"),
  border:      hex("#073642"),
  focusBorder: hex("#268BD2"),
  disabled:    hex("#00212B"),
  toolbarBg:   hex("#00161D"),
  toolbarText: hex("#B58900"),
  splitter:    hex("#268BD2"),
  defaultBorder: "single",
};

// ─── Nord ─────────────────────────────────────────────────────────────────────

export const nordTheme: Theme = {
  bg:          hex("#2E3440"),
  panelBg:     hex("#3B4252"),
  text:        hex("#D8DEE9"),
  muted:       hex("#616E88"),
  highlight:   hex("#88C0D0"),
  focus:       hex("#81A1C1"),
  border:      hex("#4C566A"),
  focusBorder: hex("#81A1C1"),
  disabled:    hex("#363C49"),
  toolbarBg:   hex("#242933"),
  toolbarText: hex("#88C0D0"),
  splitter:    hex("#81A1C1"),
  defaultBorder: "single",
};

// ─── Dracula ──────────────────────────────────────────────────────────────────

export const draculaTheme: Theme = {
  bg:          hex("#282A36"),
  panelBg:     hex("#1E1F29"),
  text:        hex("#F8F8F2"),
  muted:       hex("#6272A4"),
  highlight:   hex("#BD93F9"),
  focus:       hex("#FF79C6"),
  border:      hex("#44475A"),
  focusBorder: hex("#FF79C6"),
  disabled:    hex("#21222C"),
  toolbarBg:   hex("#191A21"),
  toolbarText: hex("#BD93F9"),
  splitter:    hex("#FF79C6"),
  defaultBorder: "rounded",
};

// ─── Catppuccin Mocha ─────────────────────────────────────────────────────────

export const catppuccinTheme: Theme = {
  bg:          hex("#1E1E2E"),
  panelBg:     hex("#181825"),
  text:        hex("#CDD6F4"),
  muted:       hex("#6C7086"),
  highlight:   hex("#F9E2AF"),
  focus:       hex("#89B4FA"),
  border:      hex("#45475A"),
  focusBorder: hex("#89B4FA"),
  disabled:    hex("#313244"),
  toolbarBg:   hex("#11111B"),
  toolbarText: hex("#F9E2AF"),
  splitter:    hex("#89B4FA"),
  defaultBorder: "rounded",
};

export const defaultTheme = vscodeDarkTheme;

// ─── Theme registry ───────────────────────────────────────────────────────────

const registry: Map<string, Theme> = new Map([
  ["vscode-dark", vscodeDarkTheme],
  ["amber", amberTheme],
  ["one-dark", oneDarkTheme],
  ["solarized-dark", solarizedDarkTheme],
  ["nord", nordTheme],
  ["dracula", draculaTheme],
  ["catppuccin", catppuccinTheme],
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
