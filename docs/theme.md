# Theme

The theme system (`src/theme.ts`) defines colors, border characters, and a registry for named themes.

---

## Theme Interface

```typescript
interface Theme {
  bg: Color;          // Terminal background
  panelBg: Color;     // Panel/container background
  text: Color;        // Default foreground text
  muted: Color;       // Secondary/muted text
  highlight: Color;   // Accent/highlight color (yellow-ish)
  focus: Color;       // Focus ring color
  border: Color;      // Default border color
  focusBorder: Color; // Border color when focused
  disabled: Color;    // Disabled element tint
  toolbarBg: Color;   // Header/toolbar background
  toolbarText: Color; // Header/toolbar text
  splitter: Color;    // Splitter drag handle color
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
import { rgb, hex } from "../src/mod.ts";

const red = rgb(255, 0, 0);
const bg = hex("#1E1E1E");
```

---

## Built-in Themes

| Theme | Export | Description |
|-------|--------|-------------|
| VS Code Dark+ | `vscodeDarkTheme` | Dark charcoal with yellow/gold highlights (default) |
| Amber | `amberTheme` | Dark blue/purple with amber accents |
| One Dark | `oneDarkTheme` | Atom One Dark palette with blue focus |
| Solarized Dark | `solarizedDarkTheme` | Solarized Dark with cyan/blue |
| Nord | `nordTheme` | Frosty blue/green palette |
| Dracula | `draculaTheme` | Purple/pink accents on dark |
| Catppuccin | `catppuccinTheme` | Catppuccin Mocha with mauve/pink |

```typescript
import { defaultTheme, vscodeDarkTheme, amberTheme, nordTheme } from "../src/mod.ts";
// defaultTheme === vscodeDarkTheme
```

---

## Theme Registry

Named theme registry for global access:

```typescript
import { ThemeRegistry } from "../src/mod.ts";

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
import { BORDERS, getBorderChars, BorderStyle } from "../src/mod.ts";

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
import { Theme, hex } from "../src/mod.ts";

const myTheme: Theme = {
  bg:          hex("#000000"),
  panelBg:     hex("#111111"),
  text:        hex("#FFFFFF"),
  muted:       hex("#666666"),
  highlight:   hex("#FFD700"),
  focus:       hex("#00FF00"),
  border:      hex("#333333"),
  focusBorder: hex("#00FF00"),
  disabled:    hex("#222222"),
  toolbarBg:   hex("#0A0A0A"),
  toolbarText: hex("#FFD700"),
  splitter:    hex("#00FF00"),
  defaultBorder: "rounded",
};
```
