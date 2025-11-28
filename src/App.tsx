import { useState } from 'react';
import { Resizable } from 're-resizable';
import { Editor } from './components/Editor';
import { Runner } from './components/Runner';
import { NodeGraph } from './components/NodeGraph';
import { Toast } from './components/Toast';
import { useInk } from './hooks/useInk';
import { useInkRunner } from './hooks/useInkRunner';

const EXAMPLES = [
  { path: 'examples/hello-world.ink', name: 'Hello World' },
  { path: 'examples/choices-demo.ink', name: 'Choices' },
  { path: 'examples/variables-demo.ink', name: 'Variables' },
  { path: 'examples/knots-demo.ink', name: 'Knots' },
  { path: 'examples/advanced-demo.ink', name: 'Advanced' }
];

export default function App() {
  const [code, setCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const { parse, isParsing, error, setError } = useInk();
  const { state, start, makeChoice, reset, continueToNextKnot, needsContinue } = useInkRunner();

  const handleRun = () => {
    const story = parse(code);
    if (story) {
      start(story);
      setIsRunning(true);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    reset();
  };

  const handleRestart = () => {
    reset();
  };

  const loadExample = async (path: string) => {
    if (!path) return;
    const res = await fetch(path);
    if (res.ok) {
      setCode(await res.text());
      setIsRunning(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <header className="header shrink-0">
        <div className="header-left">
          <span className="header-title">Ink Playground</span>
          <span className="header-version">v0.1.0</span>
        </div>

        {/* Run/Stop Controls */}
        <div className="header-controls">
          {isRunning ? (
            <button onClick={handleStop} className="btn btn-control btn-stop">
              Stop
            </button>
          ) : (
            <button onClick={handleRun} disabled={isParsing || !code.trim()} className="btn btn-control btn-run">
              Start
            </button>
          )}
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

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">
        {!isRunning ? (
          // Edit Mode: Editor + Graph side by side
          <div className="flex flex-1 w-full h-full">
            <Resizable
              defaultSize={{ width: '50%', height: '100%' }}
              minWidth={300}
              maxWidth="80%"
              enable={{ right: true }}
              handleStyles={{
                right: {
                  width: '10px',
                  right: '-5px',
                  cursor: 'col-resize',
                  zIndex: 40
                }
              }}
              handleClasses={{ right: 'resize-handle-vertical hover:bg-indigo-500/20 active:bg-indigo-500/40' }}
              className="flex flex-col border-r border-slate-200"
            >
              <Editor value={code} onChange={setCode} onRun={handleRun} />
            </Resizable>
            <div className="flex-1 h-full overflow-hidden bg-slate-50">
              <NodeGraph script={code} activeKnot={null} />
            </div>
          </div>
        ) : (
          // Run Mode: Editor + Graph (stacked) + Runner
          <div className="flex flex-1 w-full h-full">
            <Resizable
              defaultSize={{ width: '60%', height: '100%' }}
              minWidth={300}
              maxWidth="80%"
              enable={{ right: true }}
              handleStyles={{
                right: {
                  width: '10px',
                  right: '-5px',
                  cursor: 'col-resize',
                  zIndex: 40
                }
              }}
              handleClasses={{ right: 'resize-handle-vertical hover:bg-indigo-500/20 active:bg-indigo-500/40' }}
              className="flex flex-col border-r border-slate-200"
            >
              <div className="h-full flex flex-col">
                <Resizable
                  defaultSize={{ width: '100%', height: '50%' }}
                  minHeight={100}
                  maxHeight="90%"
                  enable={{ bottom: true }}
                  handleStyles={{
                    bottom: {
                      height: '10px',
                      bottom: '-5px',
                      cursor: 'row-resize',
                      zIndex: 40
                    }
                  }}
                  handleClasses={{ bottom: 'resize-handle-horizontal hover:bg-indigo-500/20 active:bg-indigo-500/40' }}
                  className="flex flex-col border-b border-slate-200"
                >
                  <Editor value={code} onChange={setCode} onRun={handleRun} readOnly />
                </Resizable>
                <div className="flex-1 overflow-hidden bg-slate-50">
                  <NodeGraph script={code} activeKnot={null} />
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
