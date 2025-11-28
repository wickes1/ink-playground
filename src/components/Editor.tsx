import { useEffect, useLayoutEffect, useRef, useImperativeHandle, forwardRef, useMemo, useState } from 'react';
import MonacoEditor, { type Monaco, type OnMount } from '@monaco-editor/react';
import type { EditorThemeColors } from '../lib/themes';

type MonacoEditor = Parameters<OnMount>[0];

interface Props {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  activeKnot?: string | null;
  activeLine?: number | null;
  activeText?: string | null;
  hasUnsavedChanges?: boolean;
  editorTheme?: EditorThemeColors | null;
  isDark?: boolean;
}

export interface EditorHandle {
  goToKnot: (knotName: string) => void;
}

function setupInkLanguage(monaco: Monaco) {
  monaco.languages.register({ id: 'ink' });

  monaco.languages.setMonarchTokensProvider('ink', {
    defaultToken: '',
    keywords: ['VAR', 'CONST', 'LIST', 'INCLUDE', 'EXTERNAL', 'true', 'false', 'not', 'and', 'or', 'return', 'done', 'END'],
    tokenizer: {
      root: [
        [/^={1,3}\s*\w+/, 'keyword'],
        [/->|<-/, 'keyword'],
        [/^\s*[*+]\s/, 'keyword'],
        [/\/\/.*$/, 'comment'],
        [/#[^\n]*/, 'comment'],
        [/\{/, 'delimiter', '@logic'],
        [/"[^"]*"/, 'string'],
        [/\d+/, 'number'],
        [/[a-zA-Z_]\w*/, { cases: { '@keywords': 'keyword', '@default': '' } }]
      ],
      logic: [
        [/\}/, 'delimiter', '@pop'],
        [/[a-zA-Z_]\w*/, 'variable'],
        [/\d+/, 'number'],
        [/"[^"]*"/, 'string']
      ]
    }
  });
}

function registerTheme(monaco: Monaco, themeName: string, themeColors: EditorThemeColors) {
  monaco.editor.defineTheme(themeName, {
    base: themeColors.base,
    inherit: true,
    rules: [
      { token: 'keyword', foreground: themeColors.tokens.keyword.foreground, fontStyle: themeColors.tokens.keyword.fontStyle || '' },
      { token: 'string', foreground: themeColors.tokens.string.foreground, fontStyle: themeColors.tokens.string.fontStyle || '' },
      { token: 'number', foreground: themeColors.tokens.number.foreground, fontStyle: themeColors.tokens.number.fontStyle || '' },
      { token: 'comment', foreground: themeColors.tokens.comment.foreground, fontStyle: themeColors.tokens.comment.fontStyle || '' },
      { token: 'variable', foreground: themeColors.tokens.variable.foreground, fontStyle: themeColors.tokens.variable.fontStyle || '' }
    ],
    colors: {
      'editor.background': themeColors.background,
      'editor.lineHighlightBackground': themeColors.lineHighlight,
      'editorLineNumber.foreground': themeColors.lineNumber,
      'editorLineNumber.activeForeground': themeColors.lineNumberActive,
      'editor.selectionBackground': themeColors.selection
    }
  });
}

// Default light theme colors as fallback
const defaultLightTheme: EditorThemeColors = {
  base: 'vs',
  background: '#fafafa',
  lineHighlight: '#f5f0eb',
  lineNumber: '#c4b9aa',
  lineNumberActive: '#8b7355',
  selection: '#e5ddd4',
  tokens: {
    keyword: { foreground: '5a6e55', fontStyle: 'bold' },
    string: { foreground: '7a9973' },
    number: { foreground: '8b7355' },
    comment: { foreground: 'b5a99a', fontStyle: 'italic' },
    variable: { foreground: '8b7355' }
  }
};

// Default dark theme colors as fallback
const defaultDarkTheme: EditorThemeColors = {
  base: 'vs-dark',
  background: '#1a1a2e',
  lineHighlight: '#252545',
  lineNumber: '#5a5a7a',
  lineNumberActive: '#8a8aaa',
  selection: '#3a3a5a',
  tokens: {
    keyword: { foreground: '7dd3fc', fontStyle: 'bold' },
    string: { foreground: '86efac' },
    number: { foreground: 'c4b5fd' },
    comment: { foreground: '6b7280', fontStyle: 'italic' },
    variable: { foreground: 'a5b4fc' }
  }
};

export const Editor = forwardRef<EditorHandle, Props>(function Editor(
  { value, onChange, onRun, activeKnot, activeLine, activeText, hasUnsavedChanges = false, editorTheme, isDark = false },
  ref
) {
  const editorRef = useRef<MonacoEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorationsRef = useRef<string[]>([]);
  const [isMonacoReady, setIsMonacoReady] = useState(false);

  // Create a stable theme name based on the theme configuration
  // Include a hash of the theme colors to ensure re-registration when theme changes
  const themeName = useMemo(() => {
    if (!editorTheme) return isDark ? 'ink-dark' : 'ink-light';
    // Create a simple hash from theme colors to ensure uniqueness
    const themeKey = JSON.stringify({
      bg: editorTheme.background,
      base: editorTheme.base,
      keyword: editorTheme.tokens.keyword.foreground,
    });
    // Use unsigned right shift to ensure positive number
    const hash = (themeKey.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0) >>> 0).toString(16);
    return isDark ? `ink-dark-${hash}` : `ink-light-${hash}`;
  }, [isDark, editorTheme]);

  // Register and apply theme when it changes - use useLayoutEffect to ensure
  // the theme is registered before Monaco tries to use it during render
  useLayoutEffect(() => {
    const monaco = monacoRef.current;
    if (!monaco || !isMonacoReady) return;

    const theme = editorTheme || (isDark ? defaultDarkTheme : defaultLightTheme);
    const currentThemeName = themeName;

    // Always re-register theme when editorTheme or themeName changes
    registerTheme(monaco, currentThemeName, theme);
    monaco.editor.setTheme(currentThemeName);
  }, [editorTheme, themeName, isMonacoReady, isDark]);

  useImperativeHandle(ref, () => ({
    goToKnot(knotName: string) {
      const editor = editorRef.current;
      if (!editor) return;

      const model = editor.getModel();
      if (!model) return;

      const knotRegex = new RegExp(`^===\\s*${knotName}\\s*===?`);
      const lines = model.getLinesContent();

      for (let i = 0; i < lines.length; i++) {
        if (knotRegex.test(lines[i])) {
          const lineNumber = i + 1;
          editor.revealLineInCenter(lineNumber);
          editor.setPosition({ lineNumber, column: 1 });
          editor.focus();
          break;
        }
      }
    }
  }));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        onRun();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onRun]);

  // Highlight and scroll to active line during playback
  useEffect(() => {
    const editor = editorRef.current;
    const hasActiveLine = activeLine !== null && activeLine !== undefined;
    const hasActiveText = activeText !== null && activeText !== undefined && activeText.trim() !== '';

    if (!editor || (!hasActiveLine && !hasActiveText && !activeKnot)) {
      if (editor && decorationsRef.current.length > 0) {
        decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
      }
      return;
    }

    const model = editor.getModel();
    if (!model) return;

    let targetLine: number | null = null;
    const lines = model.getLinesContent();

    if (hasActiveLine) {
      targetLine = activeLine;
    } else if (hasActiveText) {
      const searchText = activeText.trim();
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().includes(searchText) || lines[i].includes(searchText)) {
          targetLine = i + 1;
          break;
        }
      }
    }

    if (!targetLine && activeKnot) {
      const knotRegex = new RegExp(`^===\\s*${activeKnot}\\s*===?`);
      for (let i = 0; i < lines.length; i++) {
        if (knotRegex.test(lines[i])) {
          targetLine = i + 1;
          break;
        }
      }
    }

    if (targetLine && targetLine <= model.getLineCount()) {
      editor.revealLineInCenter(targetLine);

      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
        {
          range: {
            startLineNumber: targetLine,
            startColumn: 1,
            endLineNumber: targetLine,
            endColumn: model.getLineMaxColumn(targetLine),
          },
          options: {
            isWholeLine: true,
            className: 'active-knot-line',
            glyphMarginClassName: 'active-knot-glyph',
          },
        },
      ]);
    }
  }, [activeLine, activeText, activeKnot]);

  const handleBeforeMount = (monaco: Monaco) => {
    setupInkLanguage(monaco);
    monacoRef.current = monaco;

    // Register initial theme
    const theme = editorTheme || (isDark ? defaultDarkTheme : defaultLightTheme);
    registerTheme(monaco, themeName, theme);
  };

  const handleMount = (editor: MonacoEditor) => {
    editorRef.current = editor;
    setIsMonacoReady(true);
  };

  return (
    <div className="editor">
      <div className="panel-header">
        <div className="panel-header-left">
          <span className="panel-title">Editor</span>
          {hasUnsavedChanges && (
            <span className="badge badge-warning">Modified - Press Restart to apply</span>
          )}
        </div>
      </div>

      <div className="editor-content">
        <MonacoEditor
          height="100%"
          defaultLanguage="ink"
          theme={themeName}
          value={value}
          onChange={v => onChange(v || '')}
          beforeMount={handleBeforeMount}
          onMount={handleMount}
          options={{
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            padding: { top: 12 },
            lineNumbers: 'on',
            folding: false,
            glyphMargin: false,
            automaticLayout: true,
            find: {
              addExtraSpaceOnTop: true,
              autoFindInSelection: 'never',
              seedSearchStringFromSelection: 'selection'
            },
            fixedOverflowWidgets: true
          }}
        />
      </div>

      <div className="footer-stats">
        {value.length} chars / {value.split('\n').length} lines
      </div>
    </div>
  );
});
