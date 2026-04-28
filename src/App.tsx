import { useState, useRef, useCallback } from 'react';
import { Resizable } from 're-resizable';
import { Github } from 'lucide-react';
import { Editor, type EditorHandle } from './components/Editor';
import { Runner } from './components/Runner';
import { NodeGraph } from './components/NodeGraph';
import { Toast } from './components/Toast';
import { ThemeSelector } from './components/ThemeSelector';
import { useInk } from './hooks/useInk';
import { useInkRunner } from './hooks/useInkRunner';
import { useTheme } from './hooks/useTheme';
import { EXAMPLES, RESIZABLE_HANDLE_STYLE, RESIZABLE_HANDLE_CLASS } from './constants';

function updatePositionTag(code: string, knotName: string, x: number, y: number): string {
  const lines = code.split('\n');
  const knotRegex = new RegExp(`^===\\s*${knotName}\\s*===?$`);
  const posTagRegex = /^#\s*position:\s*-?\d+\s*,\s*-?\d+/;

  for (let i = 0; i < lines.length; i++) {
    if (knotRegex.test(lines[i])) {
      const newTag = `# position: ${x}, ${y}`;
      if (i + 1 < lines.length && posTagRegex.test(lines[i + 1])) {
        lines[i + 1] = newTag;
      } else {
        lines.splice(i + 1, 0, newTag);
      }
      break;
    }
  }
  return lines.join('\n');
}

export default function App() {
  const [code, setCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const runningCodeRef = useRef<string>('');
  const { parse, isParsing, error, setError } = useInk();
  const { state, start, makeChoice, reset, continueToNextKnot, needsContinue } = useInkRunner();
  const { editorTheme, canvasTheme, isDark } = useTheme();
  const editorRef = useRef<EditorHandle>(null);

  const handleNodeClick = useCallback((knotName: string) => {
    editorRef.current?.goToKnot(knotName);
  }, []);

  const handleNodePositionChange = useCallback((knotName: string, x: number, y: number) => {
    setCode(prevCode => updatePositionTag(prevCode, knotName, x, y));
  }, []);

  const handleAutoLayout = useCallback((positions: Map<string, { x: number; y: number }>) => {
    setCode(prevCode => {
      let newCode = prevCode;
      for (const [knotName, pos] of positions) {
        newCode = updatePositionTag(newCode, knotName, Math.round(pos.x), Math.round(pos.y));
      }
      return newCode;
    });
  }, []);

  const handleRun = () => {
    const story = parse(code);
    if (story) {
      start(story);
      runningCodeRef.current = code;
      setHasUnsavedChanges(false);
      setIsRunning(true);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    setHasUnsavedChanges(false);
    reset();
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    if (isRunning && newCode !== runningCodeRef.current) {
      setHasUnsavedChanges(true);
    }
  };

  const handleRestart = () => {
    const story = parse(code);
    if (story) {
      reset();
      start(story);
      runningCodeRef.current = code;
      setHasUnsavedChanges(false);
    }
  };

  const loadExample = async (path: string) => {
    if (!path) return;
    const res = await fetch(path);
    if (res.ok) {
      setCode(await res.text());
      setIsRunning(false);
      setHasUnsavedChanges(false);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--color-bg)' }}>
      <header className="header shrink-0">
        <div className="header-left">
          <span className="header-title">Ink Playground</span>
          <span className="header-version">{__APP_VERSION__}</span>
        </div>

        <div className="header-controls">
          <div className={`toggle-group ${!code.trim() || isParsing ? 'toggle-disabled' : ''}`}>
            <button
              onClick={handleStop}
              disabled={!isRunning}
              className={`toggle-btn ${!isRunning ? 'toggle-active' : ''}`}
            >
              Edit
            </button>
            <button
              onClick={handleRun}
              disabled={isRunning || isParsing || !code.trim()}
              className={`toggle-btn ${isRunning ? 'toggle-active' : ''}`}
            >
              Play
            </button>
          </div>
          <button onClick={handleRestart} disabled={!isRunning} className="btn btn-control">
            Restart
          </button>
        </div>

        <div className="header-right">
          <select className="select" onChange={e => loadExample(e.target.value)} defaultValue="">
            <option value="" disabled>Examples</option>
            {EXAMPLES.map(e => <option key={e.path} value={e.path}>{e.name}</option>)}
          </select>
          <ThemeSelector />
          <span className="header-divider" aria-hidden="true" />
          <a
            href="https://github.com/wickes1/ink-playground"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-icon"
            title="View source on GitHub"
            aria-label="View source on GitHub"
          >
            <Github size={16} />
          </a>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        {!isRunning ? (
          <div className="flex flex-1 w-full h-full">
            <Resizable
              defaultSize={{ width: '50%', height: '100%' }}
              minWidth={300}
              maxWidth="80%"
              enable={{ right: true }}
              handleStyles={{ right: RESIZABLE_HANDLE_STYLE.vertical }}
              handleClasses={{ right: RESIZABLE_HANDLE_CLASS.vertical }}
              className="flex flex-col"
              style={{ borderRight: '1px solid var(--color-border)' }}
            >
              <Editor
                ref={editorRef}
                value={code}
                onChange={handleCodeChange}
                onRun={handleRun}
                editorTheme={editorTheme}
                isDark={isDark}
              />
            </Resizable>
            <div className="flex-1 h-full overflow-hidden" style={{ background: 'var(--color-bg-secondary)' }}>
              <NodeGraph
                script={code}
                onNodeClick={handleNodeClick}
                onNodePositionChange={handleNodePositionChange}
                onAutoLayout={handleAutoLayout}
                activeKnot={state.currentKnot}
                canvasTheme={canvasTheme}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-1 w-full h-full">
            <Resizable
              defaultSize={{ width: '60%', height: '100%' }}
              minWidth={300}
              maxWidth="80%"
              enable={{ right: true }}
              handleStyles={{ right: RESIZABLE_HANDLE_STYLE.vertical }}
              handleClasses={{ right: RESIZABLE_HANDLE_CLASS.vertical }}
              className="flex flex-col"
              style={{ borderRight: '1px solid var(--color-border)' }}
            >
              <div className="h-full flex flex-col">
                <Resizable
                  defaultSize={{ width: '100%', height: '50%' }}
                  minHeight={100}
                  maxHeight="90%"
                  enable={{ bottom: true }}
                  handleStyles={{ bottom: RESIZABLE_HANDLE_STYLE.horizontal }}
                  handleClasses={{ bottom: RESIZABLE_HANDLE_CLASS.horizontal }}
                  className="flex flex-col"
                  style={{ borderBottom: '1px solid var(--color-border)' }}
                >
                  <Editor
                    ref={editorRef}
                    value={code}
                    onChange={handleCodeChange}
                    onRun={handleRestart}
                    activeKnot={state.currentKnot}
                    activeLine={state.currentLine}
                    activeText={state.currentText}
                    hasUnsavedChanges={hasUnsavedChanges}
                    editorTheme={editorTheme}
                    isDark={isDark}
                  />
                </Resizable>
                <div className="flex-1 overflow-hidden" style={{ background: 'var(--color-bg-secondary)' }}>
                  <NodeGraph
                    script={code}
                    onNodeClick={handleNodeClick}
                    onNodePositionChange={handleNodePositionChange}
                    onAutoLayout={handleAutoLayout}
                    activeKnot={state.currentKnot}
                    canvasTheme={canvasTheme}
                  />
                </div>
              </div>
            </Resizable>
            <div className="flex-1 h-full overflow-hidden" style={{ background: 'var(--color-bg)' }}>
              <Runner state={state} onChoice={makeChoice} onContinue={continueToNextKnot} needsContinue={needsContinue} />
            </div>
          </div>
        )}
      </main>

      <Toast message={error} onClose={() => setError(null)} />
    </div>
  );
}
