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
  /** Application / default background */
  appBg: Color;
  /** Primary panel / container background */
  primaryBg: Color;
  /** Secondary background (slightly distinct from primary) */
  secondaryBg: Color;
  /** Elevated surface background (toolbars, etc.) */
  elevatedBg: Color;
  /** Input field background */
  inputBg: Color;
  /** Focused input field background */
  inputFocusBg: Color;
  /** Focus indicator fill / outline for controls */
  focusBg: Color;
  /** Disabled state background */
  disabledBg: Color;
  /** Default foreground text */
  text: Color;
  /** Muted / secondary text */
  muted: Color;
  /** Highlight / accent */
  highlight: Color;
  /** Border color */
  border: Color;
  /** Focused border color */
  focusBorder: Color;
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
//   appBg        #1E1E1E  editor.background
//   primaryBg    #252526  sideBar.background / panel.background
//   secondaryBg  #2A2D2E  slightly between primary and elevated
//   elevatedBg   #333333  activityBar.background
//   inputBg      #1E1E1E  editor.background
//   inputFocusBg #252526  like panel bg on focus
//   focusBg      #FFD700  bright gold — focus indicator
//   disabledBg   #2D2D2D  disabled background tint
//   text         #D4D4D4  editor.foreground
//   muted        #6A6A6A  editorLineNumber.foreground (approx)
//   highlight    #DCDCAA  → VS Code function yellow
//   border       #3C3C3C  panel.border / editorGroup.border
//   focusBorder  #FFD700  yellow glow when box is focused
//   toolbarText  #DCDCAA  yellow on toolbar
//   splitter     #FFD700  sash.hoverBorder — bright yellow drag handle

export const vscodeDarkTheme: Theme = {
  appBg:        hex("#1E1E1E"),   // editor.background
  primaryBg:    hex("#252526"),   // sideBar.background
  secondaryBg:  hex("#2A2D2E"),   // between primary and elevated
  elevatedBg:   hex("#333333"),   // activityBar.background
  inputBg:      hex("#1E1E1E"),   // editor.background
  inputFocusBg: hex("#252526"),   // like panel bg on focus
  focusBg:      hex("#FFD700"),   // bright gold focus indicator
  disabledBg:   hex("#2D2D2D"),   // disabled background tint
  text:         hex("#D4D4D4"),   // editor.foreground
  muted:        hex("#6A6A6A"),   // editorLineNumber.foreground
  highlight:    hex("#DCDCAA"),   // VS Code function/variable yellow
  border:       hex("#3C3C3C"),   // panel.border
  focusBorder:  hex("#FFD700"),   // sash.hoverBorder — yellow glow
  toolbarText:  hex("#DCDCAA"),   // yellow tokens on toolbar
  splitter:     hex("#FFD700"),   // bright yellow drag handle
  defaultBorder: "single",
};

// ─── Amber theme (kept as named alternative) ──────────────────────────────────

export const amberTheme: Theme = {
  appBg:        hex("#1A1A2E"),
  primaryBg:    hex("#16213E"),
  secondaryBg:  hex("#1A2744"),
  elevatedBg:   hex("#0F3460"),
  inputBg:      hex("#1A1A2E"),
  inputFocusBg: hex("#16213E"),
  focusBg:      hex("#FFD700"),
  disabledBg:   hex("#2A2A3E"),
  text:         hex("#E8E8F0"),
  muted:        hex("#6B6B8A"),
  highlight:    hex("#F5C518"),
  border:       hex("#3A3A5C"),
  focusBorder:  hex("#F5C518"),
  toolbarText:  hex("#F5C518"),
  splitter:     hex("#E8A020"),
  defaultBorder: "single",
};

// ─── One Dark (Atom) ──────────────────────────────────────────────────────────

export const oneDarkTheme: Theme = {
  appBg:        hex("#282C34"),
  primaryBg:    hex("#21252B"),
  secondaryBg:  hex("#2C323C"),
  elevatedBg:   hex("#181A1F"),
  inputBg:      hex("#1E2227"),
  inputFocusBg: hex("#282C34"),
  focusBg:      hex("#528BFF"),
  disabledBg:   hex("#2C323C"),
  text:         hex("#ABB2BF"),
  muted:        hex("#5C6370"),
  highlight:    hex("#E5C07B"),
  border:       hex("#3E4452"),
  focusBorder:  hex("#528BFF"),
  toolbarText:  hex("#E5C07B"),
  splitter:     hex("#528BFF"),
  defaultBorder: "rounded",
};

// ─── Solarized Dark ───────────────────────────────────────────────────────────

export const solarizedDarkTheme: Theme = {
  appBg:        hex("#002B36"),
  primaryBg:    hex("#073642"),
  secondaryBg:  hex("#003B46"),
  elevatedBg:   hex("#00161D"),
  inputBg:      hex("#00212B"),
  inputFocusBg: hex("#073642"),
  focusBg:      hex("#268BD2"),
  disabledBg:   hex("#00212B"),
  text:         hex("#93A1A1"),
  muted:        hex("#657B83"),
  highlight:    hex("#B58900"),
  border:       hex("#073642"),
  focusBorder:  hex("#268BD2"),
  toolbarText:  hex("#B58900"),
  splitter:     hex("#268BD2"),
  defaultBorder: "single",
};

// ─── Nord ─────────────────────────────────────────────────────────────────────

export const nordTheme: Theme = {
  appBg:        hex("#2E3440"),
  primaryBg:    hex("#3B4252"),
  secondaryBg:  hex("#434C5E"),
  elevatedBg:   hex("#242933"),
  inputBg:      hex("#2E3440"),
  inputFocusBg: hex("#3B4252"),
  focusBg:      hex("#81A1C1"),
  disabledBg:   hex("#363C49"),
  text:         hex("#D8DEE9"),
  muted:        hex("#616E88"),
  highlight:    hex("#88C0D0"),
  border:       hex("#4C566A"),
  focusBorder:  hex("#81A1C1"),
  toolbarText:  hex("#88C0D0"),
  splitter:     hex("#81A1C1"),
  defaultBorder: "single",
};

// ─── Dracula ──────────────────────────────────────────────────────────────────

export const draculaTheme: Theme = {
  appBg:        hex("#282A36"),
  primaryBg:    hex("#1E1F29"),
  secondaryBg:  hex("#343746"),
  elevatedBg:   hex("#191A21"),
  inputBg:      hex("#21222C"),
  inputFocusBg: hex("#282A36"),
  focusBg:      hex("#FF79C6"),
  disabledBg:   hex("#21222C"),
  text:         hex("#F8F8F2"),
  muted:        hex("#6272A4"),
  highlight:    hex("#BD93F9"),
  border:       hex("#44475A"),
  focusBorder:  hex("#FF79C6"),
  toolbarText:  hex("#BD93F9"),
  splitter:     hex("#FF79C6"),
  defaultBorder: "rounded",
};

// ─── Catppuccin Mocha ─────────────────────────────────────────────────────────

export const catppuccinTheme: Theme = {
  appBg:        hex("#1E1E2E"),
  primaryBg:    hex("#181825"),
  secondaryBg:  hex("#232337"),
  elevatedBg:   hex("#11111B"),
  inputBg:      hex("#1E1E2E"),
  inputFocusBg: hex("#181825"),
  focusBg:      hex("#89B4FA"),
  disabledBg:   hex("#313244"),
  text:         hex("#CDD6F4"),
  muted:        hex("#6C7086"),
  highlight:    hex("#F9E2AF"),
  border:       hex("#45475A"),
  focusBorder:  hex("#89B4FA"),
  toolbarText:  hex("#F9E2AF"),
  splitter:     hex("#89B4FA"),
  defaultBorder: "rounded",
};

export const defaultTheme: Theme = vscodeDarkTheme;

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

export interface ThemeRegistryInterface {
  register(name: string, theme: Theme): void;
  set(name: string): void;
  readonly active: Theme;
  setDirect(theme: Theme): void;
}

export const ThemeRegistry: ThemeRegistryInterface = {
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
