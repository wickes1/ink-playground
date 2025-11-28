import { useState } from 'react';
import { Editor } from './components/Editor';
import { Runner } from './components/Runner';
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
  const { parse, isParsing } = useInk();
  const { state, start, makeChoice, reset } = useInkRunner();

  const run = () => {
    const story = parse(code);
    if (story) start(story);
  };

  const loadExample = async (path: string) => {
    if (!path) return;
    const res = await fetch(path);
    if (res.ok) setCode(await res.text());
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="header">
        <span className="header-title">Ink Playground</span>
        <select className="select" onChange={e => loadExample(e.target.value)} defaultValue="">
          <option value="" disabled>Examples</option>
          {EXAMPLES.map(e => <option key={e.path} value={e.path}>{e.name}</option>)}
        </select>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1">
          <Editor value={code} onChange={setCode} onRun={run} isRunning={isParsing} />
        </div>
        <div className="flex-1">
          <Runner state={state} onChoice={makeChoice} onReset={reset} />
        </div>
      </main>
    </div>
  );
}
