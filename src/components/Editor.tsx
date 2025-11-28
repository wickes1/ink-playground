import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import MonacoEditor, { type Monaco, type OnMount } from '@monaco-editor/react';

type MonacoEditor = Parameters<OnMount>[0];


interface Props {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  readOnly?: boolean;
  activeKnot?: string | null;
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
  { value, onChange, onRun, readOnly = false, activeKnot },
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

  // Highlight and scroll to active knot during playback
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !activeKnot) {
      // Clear decorations if no active knot
      if (editor && decorationsRef.current.length > 0) {
        decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
      }
      return;
    }

    const model = editor.getModel();
    if (!model) return;

    const knotRegex = new RegExp(`^===\\s*${activeKnot}\\s*===?`);
    const lines = model.getLinesContent();

    for (let i = 0; i < lines.length; i++) {
      if (knotRegex.test(lines[i])) {
        const lineNumber = i + 1;

        // Scroll to the knot line
        editor.revealLineInCenter(lineNumber);

        // Add decoration for the active knot line
        decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
          {
            range: {
              startLineNumber: lineNumber,
              startColumn: 1,
              endLineNumber: lineNumber,
              endColumn: model.getLineMaxColumn(lineNumber),
            },
            options: {
              isWholeLine: true,
              className: 'active-knot-line',
              glyphMarginClassName: 'active-knot-glyph',
            },
          },
        ]);
        break;
      }
    }
  }, [activeKnot]);

  return (
    <div className="editor">
      <div className="panel-header">
        <div className="panel-header-left">
          <span className="panel-title">Editor</span>
          {readOnly && <span className="badge badge-muted">Read-only</span>}
        </div>
      </div>

      <div className="editor-content">
        <MonacoEditor
          height="100%"
          defaultLanguage="ink"
          theme="ink-light"
          value={value}
          onChange={v => !readOnly && onChange(v || '')}
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
            readOnly,
            domReadOnly: readOnly,
            renderLineHighlight: readOnly ? 'none' : 'line',
            automaticLayout: true
          }}
        />
      </div>

      <div className="footer-stats">
        {value.length} chars / {value.split('\n').length} lines
      </div>
    </div>
  );
});
