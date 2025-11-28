import { useState } from 'react';
import { Resizable } from 're-resizable';
import { Play, Square, RotateCcw } from 'lucide-react';
import { Editor } from './components/Editor';
import { Runner } from './components/Runner';
import { NodeGraph } from './components/NodeGraph';
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
  const { parse, isParsing } = useInk();
  const { state, start, makeChoice, reset } = useInkRunner();

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
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <span className="header-title">Ink Playground</span>
          <span className="header-version">v0.1.0</span>
        </div>

        {/* Run/Stop Controls */}
        <div className="header-controls">
          {!isRunning ? (
            <button onClick={handleRun} disabled={isParsing || !code.trim()} className="btn btn-run">
              <Play size={14} />
              <span>Run</span>
            </button>
          ) : (
            <>
              <button onClick={handleStop} className="btn btn-stop">
                <Square size={14} />
                <span>Stop</span>
              </button>
              <button onClick={handleRestart} className="btn">
                <RotateCcw size={14} />
                <span>Restart</span>
              </button>
            </>
          )}
        </div>

        <div className="header-right">
          <select className="select" onChange={e => loadExample(e.target.value)} defaultValue="">
            <option value="" disabled>Examples</option>
            {EXAMPLES.map(e => <option key={e.path} value={e.path}>{e.name}</option>)}
          </select>
          <div className="status-indicator">
            <div className={`status-dot ${isRunning ? 'status-running' : ''}`} />
            <span className="status-text">{isRunning ? 'Running' : 'Ready'}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {!isRunning ? (
          // Edit Mode: Editor + Graph side by side
          <div className="flex flex-1">
            <Resizable
              defaultSize={{ width: '50%', height: '100%' }}
              minWidth="30%"
              maxWidth="70%"
              enable={{ right: true }}
              handleStyles={{ right: { width: '8px', right: '-4px', cursor: 'col-resize' } }}
              handleClasses={{ right: 'resize-handle-vertical' }}
            >
              <Editor value={code} onChange={setCode} onRun={handleRun} isRunning={isParsing} />
            </Resizable>
            <div className="flex-1">
              <NodeGraph script={code} activeKnot={null} />
            </div>
          </div>
        ) : (
          // Run Mode: Editor + Graph (stacked) + Runner
          <div className="flex flex-1">
            <Resizable
              defaultSize={{ width: 'calc(100% - 380px)', height: '100%' }}
              minWidth="40%"
              maxWidth="75%"
              enable={{ right: true }}
              handleStyles={{ right: { width: '8px', right: '-4px', cursor: 'col-resize' } }}
              handleClasses={{ right: 'resize-handle-vertical' }}
            >
              <div className="h-full flex flex-col">
                <Resizable
                  defaultSize={{ width: '100%', height: '50%' }}
                  minHeight="25%"
                  maxHeight="75%"
                  enable={{ bottom: true }}
                  handleStyles={{ bottom: { height: '8px', bottom: '-4px', cursor: 'row-resize' } }}
                  handleClasses={{ bottom: 'resize-handle-horizontal' }}
                >
                  <Editor value={code} onChange={setCode} onRun={handleRun} isRunning={isParsing} readOnly />
                </Resizable>
                <div className="flex-1">
                  <NodeGraph script={code} activeKnot={null} />
                </div>
              </div>
            </Resizable>
            <div className="flex-1">
              <Runner state={state} onChoice={makeChoice} onReset={handleRestart} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
