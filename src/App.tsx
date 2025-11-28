import { useState, useRef, useCallback } from 'react';
import { Resizable } from 're-resizable';
import { Editor, type EditorHandle } from './components/Editor';
import { Runner } from './components/Runner';
import { NodeGraph } from './components/NodeGraph';
import { Toast } from './components/Toast';
import { useInk } from './hooks/useInk';
import { useInkRunner } from './hooks/useInkRunner';
import { EXAMPLES, RESIZABLE_HANDLE_STYLE, RESIZABLE_HANDLE_CLASS } from './constants';

export default function App() {
  const [code, setCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const runningCodeRef = useRef<string>('');
  const { parse, isParsing, error, setError } = useInk();
  const { state, start, makeChoice, reset, continueToNextKnot, needsContinue } = useInkRunner();
  const editorRef = useRef<EditorHandle>(null);

  const handleNodeClick = useCallback((knotName: string) => {
    editorRef.current?.goToKnot(knotName);
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
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <header className="header shrink-0">
        <div className="header-left">
          <span className="header-title">Ink Playground</span>
          <span className="header-version">v0.1.0</span>
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
              className="flex flex-col border-r border-slate-200"
            >
              <Editor ref={editorRef} value={code} onChange={handleCodeChange} onRun={handleRun} />
            </Resizable>
            <div className="flex-1 h-full overflow-hidden bg-slate-50">
              <NodeGraph script={code} onNodeClick={handleNodeClick} activeKnot={state.currentKnot} />
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
              className="flex flex-col border-r border-slate-200"
            >
              <div className="h-full flex flex-col">
                <Resizable
                  defaultSize={{ width: '100%', height: '50%' }}
                  minHeight={100}
                  maxHeight="90%"
                  enable={{ bottom: true }}
                  handleStyles={{ bottom: RESIZABLE_HANDLE_STYLE.horizontal }}
                  handleClasses={{ bottom: RESIZABLE_HANDLE_CLASS.horizontal }}
                  className="flex flex-col border-b border-slate-200"
                >
                  <Editor ref={editorRef} value={code} onChange={handleCodeChange} onRun={handleRestart} activeKnot={state.currentKnot} hasUnsavedChanges={hasUnsavedChanges} />
                </Resizable>
                <div className="flex-1 overflow-hidden bg-slate-50">
                  <NodeGraph script={code} onNodeClick={handleNodeClick} activeKnot={state.currentKnot} />
                </div>
              </div>
            </Resizable>
            <div className="flex-1 h-full overflow-hidden bg-white">
              <Runner state={state} onChoice={makeChoice} onContinue={continueToNextKnot} needsContinue={needsContinue} />
            </div>
          </div>
        )}
      </main>

      <Toast message={error} onClose={() => setError(null)} />
    </div>
  );
}
