/**
 * mod.ts — Public API surface of tuix.
 */

export { App } from "./app.ts";
export type { AppOptions } from "./app.ts";

export { Box, paintCenteredText, paintText, edgesZero, edgesAll, edgesXY } from "./layout.ts";
export type { Rect, SizeConstraint, Edges, BoxStyle, Direction, Align, Justify } from "./layout.ts";

export { Splitter } from "./splitter.ts";
export type { SplitDirection } from "./splitter.ts";

export { FocusManager } from "./focus.ts";

export { Button, Checkbox, TextInput, ListBox, ProgressBar, Autocomplete, Tabs, RadioButton, RadioGroup, TextArea } from "./widgets/mod.ts";
export type { AutocompleteMode, TabDefinition } from "./widgets/mod.ts";

export {
  vscodeDarkTheme,
  amberTheme,
  defaultTheme,
  ThemeRegistry,
  BORDERS,
  getBorderChars,
  rgb,
  hex,
} from "./theme.ts";
export type { Theme, Color, BorderChars, BorderStyle } from "./theme.ts";

export { getTermSize, ansi } from "./terminal.ts";
export type { TermSize, Cell } from "./terminal.ts";

export type { TuixEvent, KeyEvent, MouseEvent, KeyModifiers } from "./events.ts";
