import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import type { ThemeMetadata } from '../lib/themes';

interface ThemeDropdownProps {
  themes: ThemeMetadata[];
  selectedTheme: ThemeMetadata | null;
  onSelect: (themeId: string) => void;
  onPreview: (themeId: string) => void;
  onPreviewEnd: () => void;
}

export function ThemeDropdown({
  themes,
  selectedTheme,
  onSelect,
  onPreview,
  onPreviewEnd,
}: ThemeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        onPreviewEnd();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onPreviewEnd]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (isOpen) {
      onPreviewEnd();
    }
  };

  const handleSelect = (themeId: string) => {
    onSelect(themeId);
    setIsOpen(false);
  };

  const handleMouseEnter = (themeId: string) => {
    onPreview(themeId);
  };

  const handleMouseLeave = () => {
    onPreviewEnd();
  };

  return (
    <div className="theme-dropdown" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="theme-dropdown-trigger"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="theme-dropdown-value">{selectedTheme?.name ?? 'Select theme'}</span>
        <ChevronDown size={14} className={`theme-dropdown-icon ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="theme-dropdown-menu"
          role="listbox"
          onMouseLeave={handleMouseLeave}
        >
          {themes.map((theme) => (
            <button
              key={theme.id}
              className={`theme-dropdown-item ${selectedTheme?.id === theme.id ? 'selected' : ''}`}
              onClick={() => handleSelect(theme.id)}
              onMouseEnter={() => handleMouseEnter(theme.id)}
              role="option"
              aria-selected={selectedTheme?.id === theme.id}
            >
              <span>{theme.name}</span>
              {selectedTheme?.id === theme.id && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
