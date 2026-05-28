# Theme

The theme system (`src/theme.ts`) defines colors, border characters, and a registry for named themes.

---

## Theme Interface

```typescript
interface Theme {
  appBg: Color;         // Application / default background
  primaryBg: Color;     // Primary panel / container background
  secondaryBg: Color;   // Secondary background (slightly distinct)
  elevatedBg: Color;    // Elevated surface (toolbars, etc.)
  inputBg: Color;       // Input field background
  inputFocusBg: Color;  // Focused input field background
  focusBg: Color;       // Focus indicator fill / outline for controls
  disabledBg: Color;    // Disabled state background
  text: Color;          // Default foreground text
  muted: Color;         // Secondary / muted text
  highlight: Color;     // Accent / highlight color
  border: Color;        // Default border color
  focusBorder: Color;   // Border color when focused
  toolbarText: Color;   // Header / toolbar text
  splitter: Color;      // Splitter drag handle color
  defaultBorder: BorderStyle; // Default border ("single", "double", etc.)
}
```

Colors use the `Color` type with `r`, `g`, `b` fields (0–255):

```typescript
interface Color { r: number; g: number; b: number; }
```

---

## Color Helpers

```typescript
import { rgb, hex } from "jsr:@kyranis-studio/tuix";

const red = rgb(255, 0, 0);
const bg = hex("#1E1E1E");
```

---

## Built-in Themes

| Theme | Export | Description |
|-------|--------|-------------|
| Modern Dark | `modernDarkTheme` | Dark charcoal with yellow/gold highlights (default) |
| Amber | `amberTheme` | Dark blue/purple with amber accents |
| One Dark | `oneDarkTheme` | Atom One Dark palette with blue focus |
| Solarized Dark | `solarizedDarkTheme` | Solarized Dark with cyan/blue |
| Nord | `nordTheme` | Frosty blue/green palette |
| Dracula | `draculaTheme` | Purple/pink accents on dark |
| Catppuccin | `catppuccinTheme` | Catppuccin Mocha with mauve/pink |

```typescript
import { defaultTheme, modernDarkTheme, amberTheme, nordTheme } from "jsr:@kyranis-studio/tuix";
// defaultTheme === modernDarkTheme
```

---

## Theme Registry

Named theme registry for global access:

```typescript
import { ThemeRegistry } from "jsr:@kyranis-studio/tuix";

// Register a custom theme
ThemeRegistry.register("my-theme", { ... });

// Switch active theme by name
ThemeRegistry.set("nord");

// Get current
const current = ThemeRegistry.active;

// Set directly
ThemeRegistry.setDirect(myTheme);
```

The registry is not used by `App` internally — each `App` instance holds its own theme reference. Use `app.setTheme()` to change it at runtime.

---

## Border Styles

Five built-in border styles:

| Style | Characters |
|-------|-----------|
| `"none"` | (no border) |
| `"single"` | `┌─┐│└─┘` |
| `"double"` | `╔═╗║╚═╝` |
| `"rounded"` | `╭─╮│╰─╯` |
| `"bold"` | `┏━┓┃┗━┛` |

```typescript
import { BORDERS, getBorderChars, BorderStyle } from "jsr:@kyranis-studio/tuix";

// Get characters for a style
const chars = getBorderChars("rounded");
// chars.topLeft, chars.topRight, chars.horizontal, etc.

// Use a custom set
box.style.border = { topLeft: "╔", topRight: "╗", ... };

// Access all built-in sets
BORDERS.single, BORDERS.double, BORDERS.rounded, BORDERS.bold, BORDERS.none
```

---

## Creating a Custom Theme

```typescript
import { Theme, hex } from "jsr:@kyranis-studio/tuix";

const myTheme: Theme = {
  appBg:        hex("#000000"),
  primaryBg:    hex("#111111"),
  secondaryBg:  hex("#1A1A1A"),
  elevatedBg:   hex("#0A0A0A"),
  inputBg:      hex("#050505"),
  inputFocusBg: hex("#111111"),
  focusBg:      hex("#00FF00"),
  disabledBg:   hex("#222222"),
  text:         hex("#FFFFFF"),
  muted:        hex("#666666"),
  highlight:    hex("#FFD700"),
  border:       hex("#333333"),
  focusBorder:  hex("#00FF00"),
  toolbarText:  hex("#FFD700"),
  splitter:     hex("#00FF00"),
  defaultBorder: "rounded",
};
```
