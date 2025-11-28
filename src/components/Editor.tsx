import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import MonacoEditor, { type Monaco, type OnMount } from '@monaco-editor/react';

type MonacoEditor = Parameters<OnMount>[0];


interface Props {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  activeKnot?: string | null;
  activeLine?: number | null;
  activeText?: string | null;
  hasUnsavedChanges?: boolean;
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

  monaco.editor.defineTheme('ink-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: '5a6e55', fontStyle: 'bold' },
      { token: 'string', foreground: '7a9973' },
      { token: 'number', foreground: '8b7355' },
      { token: 'comment', foreground: 'b5a99a', fontStyle: 'italic' },
      { token: 'variable', foreground: '8b7355' }
    ],
    colors: {
      'editor.background': '#fafafa',
      'editor.lineHighlightBackground': '#f5f0eb',
      'editorLineNumber.foreground': '#c4b9aa',
      'editorLineNumber.activeForeground': '#8b7355',
      'editor.selectionBackground': '#e5ddd4'
    }
  });
}

export const Editor = forwardRef<EditorHandle, Props>(function Editor(
  { value, onChange, onRun, activeKnot, activeLine, activeText, hasUnsavedChanges = false },
  ref
) {
  const editorRef = useRef<MonacoEditor | null>(null);
  const decorationsRef = useRef<string[]>([]);

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
      // Clear decorations if nothing active
      if (editor && decorationsRef.current.length > 0) {
        decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
      }
      return;
    }

    const model = editor.getModel();
    if (!model) return;

    let targetLine: number | null = null;
    const lines = model.getLinesContent();

    // Priority 1: Use precise line number from inkjs debug metadata
    if (hasActiveLine) {
      targetLine = activeLine;
    }
    // Priority 2: Search for the output text in the source code
    else if (hasActiveText) {
      const searchText = activeText.trim();
      for (let i = 0; i < lines.length; i++) {
        // Check if the line contains the output text (ignoring leading/trailing whitespace)
        if (lines[i].trim().includes(searchText) || lines[i].includes(searchText)) {
          targetLine = i + 1;
          break;
        }
      }
    }
    // Priority 3: Fall back to finding the knot definition line
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
      // Scroll to the target line
      editor.revealLineInCenter(targetLine);

      // Add decoration for the active line
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
          theme="ink-light"
          value={value}
          onChange={v => onChange(v || '')}
          beforeMount={setupInkLanguage}
          onMount={editor => { editorRef.current = editor; }}
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
