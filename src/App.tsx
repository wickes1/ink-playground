import { useState, useCallback } from 'react';
import { Editor } from './components/Editor';
import { Runner } from './components/Runner';
import { useInk } from './hooks/useInk';
import { useInkRunner } from './hooks/useInkRunner';

const SAMPLE_FILES = [
  { value: 'examples/hello-world.ink', label: 'Hello World' },
  { value: 'examples/choices-demo.ink', label: 'Choices' },
  { value: 'examples/variables-demo.ink', label: 'Variables' },
  { value: 'examples/knots-demo.ink', label: 'Knots' },
  { value: 'examples/advanced-demo.ink', label: 'Advanced' }
];

export default function App() {
  const [editorContent, setEditorContent] = useState('');
  const { parse, isParsing } = useInk();
  const { state: runnerState, start, makeChoice, resetStory } = useInkRunner();

  const handleCompile = useCallback(() => {
    const story = parse(editorContent);
    if (story) {
      start(story);
    }
  }, [editorContent, parse, start]);

  const handleLoadSample = useCallback(async (fileName: string) => {
    if (!fileName) return;
    try {
      const response = await fetch(`./${fileName}`);
      if (response.ok) {
        const text = await response.text();
        setEditorContent(text);
      }
    } catch (error) {
      console.error('Error loading sample:', error);
    }
  }, []);

  const hasStory = runnerState.story !== null;

  return (
    <div className="h-screen flex flex-col">
      <header className="header">
        <div className="header-title">
          Ink Playground
        </div>
        <div className="header-controls">
          <select
            className="select"
            onChange={(e) => handleLoadSample(e.target.value)}
            defaultValue=""
          >
            <option value="" disabled>
              Examples
            </option>
            {SAMPLE_FILES.map((file) => (
              <option key={file.value} value={file.value}>
                {file.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1">
          <Editor
            value={editorContent}
            onChange={setEditorContent}
            onCompile={handleCompile}
            isParsing={isParsing}
          />
        </div>
        <div className="flex-1">
          <Runner
            state={runnerState}
            onChoice={makeChoice}
            onReset={resetStory}
            hasStory={hasStory}
          />
        </div>
      </main>
    </div>
  );
}
