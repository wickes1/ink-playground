import { useEffect } from 'react';
import MonacoEditor, { type Monaco } from '@monaco-editor/react';
import { Play } from 'lucide-react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  isRunning: boolean;
  readOnly?: boolean;
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

export function Editor({ value, onChange, onRun, isRunning, readOnly = false }: Props) {
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

  return (
    <div className="editor">
      <div className="panel-header">
        <div className="panel-header-left">
          <span className="panel-title">Editor</span>
          {readOnly && <span className="badge badge-muted">Read-only</span>}
        </div>
        {!readOnly && (
          <button onClick={onRun} disabled={isRunning} className="btn btn-primary btn-sm">
            <Play size={12} />
            {isRunning ? 'Running...' : 'Run'}
          </button>
        )}
      </div>

      <div className="editor-content">
        <MonacoEditor
          height="100%"
          defaultLanguage="ink"
          theme="ink-light"
          value={value}
          onChange={v => !readOnly && onChange(v || '')}
          beforeMount={setupInkLanguage}
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
            renderLineHighlight: readOnly ? 'none' : 'line'
          }}
        />
      </div>

      <div className="footer-stats">
        {value.length} chars / {value.split('\n').length} lines
      </div>
    </div>
  );
}
