import { useState, useEffect, useCallback, useMemo, createContext, useContext, type ReactNode } from "react";
import {
  AVAILABLE_THEMES,
  applyTheme,
  getThemeById,
  getEditorTheme,
  getCanvasTheme,
  type ThemeMetadata,
  type EditorThemeColors,
  type CanvasThemeColors,
} from "../lib/themes";

const STORAGE_KEY_THEME_ID = "ink-playground-theme-id";
const STORAGE_KEY_THEME_MODE = "ink-playground-theme-mode";

interface ThemeContextValue {
  theme: ThemeMetadata | null;
  themes: ThemeMetadata[];
  isDark: boolean;
  switchTheme: (themeId: string) => void;
  toggleDarkMode: () => void;
  previewTheme: (themeId: string) => void;
  restoreTheme: () => void;
  editorTheme: EditorThemeColors | null;
  canvasTheme: CanvasThemeColors | null;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ThemeMetadata | null>(() => {
    if (typeof window === "undefined") return null;
    const savedThemeId = localStorage.getItem(STORAGE_KEY_THEME_ID) || "default";
    return getThemeById(savedThemeId) ?? getThemeById("default") ?? null;
  });

  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem(STORAGE_KEY_THEME_MODE);
    if (saved) return saved === "dark";
    // Check system preference
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });

  // Preview state - separate from actual theme selection
  const [previewedTheme, setPreviewedTheme] = useState<ThemeMetadata | null>(null);

  // The effective theme is the previewed one if set, otherwise the current one
  const effectiveTheme = previewedTheme ?? currentTheme;

  // Apply theme on mount and when it changes
  useEffect(() => {
    if (effectiveTheme) {
      applyTheme(effectiveTheme, isDark);
    }
  }, [effectiveTheme, isDark]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't explicitly set a preference
      if (!localStorage.getItem(STORAGE_KEY_THEME_MODE)) {
        setIsDark(e.matches);
      }
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const switchTheme = useCallback(
    (themeId: string) => {
      const theme = getThemeById(themeId);
      if (theme) {
        setPreviewedTheme(null); // Clear preview
        setCurrentTheme(theme);
        localStorage.setItem(STORAGE_KEY_THEME_ID, themeId);
      }
    },
    []
  );

  const toggleDarkMode = useCallback(() => {
    setIsDark(prev => {
      const newIsDark = !prev;
      localStorage.setItem(STORAGE_KEY_THEME_MODE, newIsDark ? "dark" : "light");
      return newIsDark;
    });
  }, []);

  const previewTheme = useCallback(
    (themeId: string) => {
      const theme = getThemeById(themeId);
      if (theme) {
        setPreviewedTheme(theme);
      }
    },
    []
  );

  const restoreTheme = useCallback(() => {
    setPreviewedTheme(null);
  }, []);

  const editorTheme: EditorThemeColors | null = useMemo(() => {
    if (!effectiveTheme) return null;
    return getEditorTheme(effectiveTheme, isDark);
  }, [effectiveTheme, isDark]);

  const canvasTheme: CanvasThemeColors | null = useMemo(() => {
    if (!effectiveTheme) return null;
    return getCanvasTheme(effectiveTheme, isDark);
  }, [effectiveTheme, isDark]);

  const value: ThemeContextValue = useMemo(() => ({
    theme: currentTheme,
    themes: AVAILABLE_THEMES,
    isDark,
    switchTheme,
    toggleDarkMode,
    previewTheme,
    restoreTheme,
    editorTheme,
    canvasTheme,
  }), [currentTheme, isDark, switchTheme, toggleDarkMode, previewTheme, restoreTheme, editorTheme, canvasTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
