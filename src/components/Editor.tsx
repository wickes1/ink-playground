import { useEffect } from 'react';
import MonacoEditor, { type Monaco } from '@monaco-editor/react';
import { Play } from 'lucide-react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  isRunning: boolean;
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

  monaco.editor.defineTheme('ink', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: '171717', fontStyle: 'bold' },
      { token: 'string', foreground: '059669' },
      { token: 'number', foreground: '2563eb' },
      { token: 'comment', foreground: 'a3a3a3', fontStyle: 'italic' },
      { token: 'variable', foreground: '7c3aed' }
    ],
    colors: {
      'editor.background': '#fafafa',
      'editor.lineHighlightBackground': '#f5f5f5',
      'editorLineNumber.foreground': '#d4d4d4'
    }
  });
}

export function Editor({ value, onChange, onRun, isRunning }: Props) {
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
    <div className="flex flex-col h-full border-r border-border">
      <div className="panel-header">
        <span className="panel-title">Editor</span>
        <button onClick={onRun} disabled={isRunning} className="btn btn-primary">
          <Play size={14} />
          {isRunning ? 'Running...' : 'Run'}
        </button>
      </div>

      <div className="flex-1">
        <MonacoEditor
          height="100%"
          defaultLanguage="ink"
          theme="ink"
          value={value}
          onChange={v => onChange(v || '')}
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
            glyphMargin: false
          }}
        />
      </div>

      <div className="footer-stats">
        {value.length} chars / {value.split('\n').length} lines
      </div>
    </div>
  );
}
