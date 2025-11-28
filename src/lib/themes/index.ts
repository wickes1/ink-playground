import defaultTheme from "./default.json";
import vintagePaperTheme from "./vintage-paper.json";
import oceanBreezeTheme from "./ocean-breeze.json";

export interface EditorThemeColors {
  base: "vs" | "vs-dark";
  background: string;
  lineHighlight: string;
  lineNumber: string;
  lineNumberActive: string;
  selection: string;
  tokens: {
    keyword: { foreground: string; fontStyle?: string };
    string: { foreground: string; fontStyle?: string };
    number: { foreground: string; fontStyle?: string };
    comment: { foreground: string; fontStyle?: string };
    variable: { foreground: string; fontStyle?: string };
  };
}

export interface CanvasThemeColors {
  background: string;
  grid: string;
  nodeDefault: string;
  nodeStart: string;
  nodeActive: { fill: string; stroke: string };
  nodeHover: { fill: string; stroke: string };
  nodeConnected: { fill: string; stroke: string };
  nodeBorder: string;
  textDefault: string;
  textActive: string;
  textHover: string;
  connectionDefault: string;
  connectionHighlight: string;
  dotDefault: string;
  dotActive: string;
  dotHover: string;
}

export interface ThemeSchema {
  name: string;
  cssVars: {
    theme?: Record<string, string>;
    light: Record<string, string>;
    dark: Record<string, string>;
  };
  editor: {
    light: EditorThemeColors;
    dark: EditorThemeColors;
  };
  canvas: {
    light: CanvasThemeColors;
    dark: CanvasThemeColors;
  };
}

export interface ThemeMetadata {
  id: string;
  name: string;
  schema: ThemeSchema;
}

export const AVAILABLE_THEMES: ThemeMetadata[] = [
  {
    id: "default",
    name: "Default",
    schema: defaultTheme as ThemeSchema,
  },
  {
    id: "vintage-paper",
    name: "Vintage Paper",
    schema: vintagePaperTheme as ThemeSchema,
  },
  {
    id: "ocean-breeze",
    name: "Ocean Breeze",
    schema: oceanBreezeTheme as ThemeSchema,
  },
];

export function getThemeById(id: string): ThemeMetadata | undefined {
  return AVAILABLE_THEMES.find((t) => t.id === id);
}

function parseColorValue(value: string): { colorFunction: string | null; rawValue: string } {
  const match = value.match(/^(hsl|oklch|rgb|hwb|lab|lch)\((.*)\)$/);
  if (match) {
    return { colorFunction: match[1], rawValue: match[2] };
  }
  return { colorFunction: "hsl", rawValue: value };
}

const COLOR_VARS = [
  "background",
  "background-secondary",
  "background-tertiary",
  "foreground",
  "foreground-secondary",
  "foreground-muted",
  "border",
  "border-dark",
  "accent",
  "accent-hover",
  "accent-light",
  "success",
  "success-hover",
  "success-bg",
  "error",
  "error-hover",
  "error-bg",
  "warning",
  "warning-bg",
];

export function applyTheme(themeMetadata: ThemeMetadata, isDark: boolean = false) {
  const root = document.documentElement;
  const { cssVars } = themeMetadata.schema;

  // Apply theme-level variables (fonts, radius, etc)
  if (cssVars.theme) {
    Object.entries(cssVars.theme).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
  }

  // Determine which color mode to use
  const colorMode = isDark ? "dark" : "light";
  const colors = cssVars[colorMode];

  if (colors) {
    Object.entries(colors).forEach(([key, value]) => {
      const { colorFunction, rawValue } = parseColorValue(value);

      // Set raw value for @theme block
      root.style.setProperty(`--${key}`, rawValue);

      // For color variables, also set the final --color-* variable
      if (COLOR_VARS.includes(key) && colorFunction) {
        root.style.setProperty(`--color-${key}`, `${colorFunction}(${rawValue})`);
      }
    });
  }

  // Update dark class on root
  if (isDark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function getEditorTheme(
  themeMetadata: ThemeMetadata,
  isDark: boolean
): EditorThemeColors {
  return isDark
    ? themeMetadata.schema.editor.dark
    : themeMetadata.schema.editor.light;
}

export function getCanvasTheme(
  themeMetadata: ThemeMetadata,
  isDark: boolean
): CanvasThemeColors {
  return isDark
    ? themeMetadata.schema.canvas.dark
    : themeMetadata.schema.canvas.light;
}
