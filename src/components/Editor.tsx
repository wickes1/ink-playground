import { useRef, useEffect } from 'react';
import MonacoEditor, { type Monaco } from '@monaco-editor/react';
import { Play } from 'lucide-react';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  onCompile: () => void;
  isParsing: boolean;
}

function registerInkLanguage(monaco: Monaco) {
  monaco.languages.register({ id: 'ink' });

  monaco.languages.setLanguageConfiguration('ink', {
    comments: {
      lineComment: '//',
      blockComment: ['/*', '*/']
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')']
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' }
    ]
  });

  monaco.languages.setMonarchTokensProvider('ink', {
    defaultToken: '',
    tokenPostfix: '.ink',

    keywords: [
      'VAR', 'CONST', 'LIST', 'INCLUDE', 'EXTERNAL',
      'true', 'false', 'not', 'and', 'or', 'mod',
      'return', 'done', 'END', 'DONE'
    ],

    tokenizer: {
      root: [
        [/^===\s*\w+\s*===/, 'keyword'],
        [/^==\s*\w+\s*==/, 'keyword'],
        [/^=\s*\w+/, 'keyword'],
        [/->/, 'keyword'],
        [/<-/, 'keyword'],
        [/^\s*[*+]\s/, 'keyword'],
        [/^\s*-\s/, 'comment'],
        [/#[^\n]*/, 'comment'],
        [/\/\/.*$/, 'comment'],
        [/\/\*/, 'comment', '@comment'],
        [/\{/, 'delimiter', '@inlineLogic'],
        [/"([^"\\]|\\.)*"/, 'string'],
        [/\d+/, 'number'],
        [/[a-zA-Z_]\w*/, {
          cases: {
            '@keywords': 'keyword',
            '@default': 'identifier'
          }
        }]
      ],
      comment: [
        [/[^\/*]+/, 'comment'],
        [/\*\//, 'comment', '@pop'],
        [/[\/*]/, 'comment']
      ],
      inlineLogic: [
        [/\}/, 'delimiter', '@pop'],
        [/[|:]/, 'delimiter'],
        [/[a-zA-Z_]\w*/, 'variable'],
        [/\d+/, 'number'],
        [/"([^"\\]|\\.)*"/, 'string']
      ]
    }
  });

  monaco.editor.defineTheme('ink-minimal', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: '171717', fontStyle: 'bold' },
      { token: 'string', foreground: '059669' },
      { token: 'number', foreground: '2563eb' },
      { token: 'comment', foreground: 'a3a3a3', fontStyle: 'italic' },
      { token: 'variable', foreground: '7c3aed' },
      { token: 'delimiter', foreground: '737373' }
    ],
    colors: {
      'editor.background': '#fafafa',
      'editor.foreground': '#171717',
      'editor.lineHighlightBackground': '#f5f5f5',
      'editor.selectionBackground': '#e5e5e5',
      'editorCursor.foreground': '#171717',
      'editorLineNumber.foreground': '#d4d4d4',
      'editorLineNumber.activeForeground': '#737373'
    }
  });
}

export function Editor({ value, onChange, onCompile, isParsing }: EditorProps) {
  const monacoRef = useRef<Monaco | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        onCompile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCompile]);

  const handleEditorWillMount = (monaco: Monaco) => {
    monacoRef.current = monaco;
    registerInkLanguage(monaco);
  };

  const stats = {
    chars: value.length,
    lines: value.split('\n').length,
    words: value.trim() ? value.trim().split(/\s+/).length : 0
  };

  return (
    <div className="flex flex-col h-full border-r border-border">
      <div className="panel-header">
        <span className="panel-title">Editor</span>
        <button
          onClick={onCompile}
          disabled={isParsing}
          className="btn btn-primary"
        >
          <Play size={14} />
          <span>{isParsing ? 'Running...' : 'Run'}</span>
        </button>
      </div>

      <div className="flex-1">
        <MonacoEditor
          height="100%"
          defaultLanguage="ink"
          theme="ink-minimal"
          value={value}
          onChange={(v) => onChange(v || '')}
          beforeMount={handleEditorWillMount}
          options={{
            fontSize: 13,
            lineHeight: 20,
            fontFamily: "'JetBrains Mono', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            padding: { top: 12, bottom: 12 },
            renderLineHighlight: 'line',
            lineNumbers: 'on',
            folding: false,
            glyphMargin: false,
            lineDecorationsWidth: 0,
            lineNumbersMinChars: 3
          }}
        />
      </div>

      <div className="footer-stats">
        {stats.chars} chars / {stats.lines} lines / {stats.words} words
      </div>
    </div>
  );
}
