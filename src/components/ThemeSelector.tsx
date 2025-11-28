import { Moon, Sun, Palette } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { ThemeDropdown } from './ThemeDropdown';

export function ThemeSelector() {
  const { theme, themes, isDark, switchTheme, toggleDarkMode, previewTheme, restoreTheme } =
    useTheme();

  return (
    <div className="theme-selector">
      <Palette size={14} className="text-text-muted" />

      <ThemeDropdown
        themes={themes}
        selectedTheme={theme}
        onSelect={switchTheme}
        onPreview={previewTheme}
        onPreviewEnd={restoreTheme}
      />

      <button
        onClick={toggleDarkMode}
        className="btn btn-icon"
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </div>
  );
}
