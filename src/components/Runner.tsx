import { useRef, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import type { StoryState } from '../types';

interface RunnerProps {
  state: StoryState;
  onChoice: (index: number) => void;
  onReset: () => void;
  hasStory: boolean;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function Runner({ state, onChoice, onReset, hasStory }: RunnerProps) {
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [state.history, state.choices]);

  const renderWelcome = () => (
    <div className="info-panel">
      <p className="mb-3"><strong>Welcome to Ink Playground</strong></p>
      <ol className="list-decimal list-inside space-y-1">
        <li>Write or paste Ink script in the editor</li>
        <li>Click Run or press Cmd+Enter</li>
        <li>Make choices to progress the story</li>
      </ol>
    </div>
  );

  const renderStoryText = () => (
    <>
      {state.history.map((text, i) => (
        <div key={i} className="story-text">
          {text.split('\n').filter(p => p.trim()).map((p, j) => (
            <p key={j} dangerouslySetInnerHTML={{ __html: escapeHtml(p) }} />
          ))}
        </div>
      ))}
    </>
  );

  const renderChoices = () => {
    if (state.choices.length === 0) return null;

    return (
      <div className="choices-container">
        {state.choices.map((choice) => (
          <button
            key={choice.index}
            onClick={() => onChoice(choice.index)}
            className="choice"
          >
            <span className="choice-index">{choice.index + 1}.</span>
            {escapeHtml(choice.text)}
          </button>
        ))}
      </div>
    );
  };

  const renderVariables = () => {
    const varEntries = Object.entries(state.variables);
    if (varEntries.length === 0) return null;

    return (
      <div className="variable-display">
        <h3>Variables</h3>
        <div className="space-y-0.5">
          {varEntries.map(([key, value]) => (
            <div key={key} className="variable-item">
              <span className="variable-key">{key}</span>
              <span className="mx-1">=</span>
              <span className="variable-value">{JSON.stringify(value)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderEnded = () => (
    <div className="story-ended">
      <strong>End of story</strong>
    </div>
  );

  const renderError = () => {
    if (!state.error) return null;
    return (
      <div className="error-message">
        {state.error}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="panel-header">
        <span className="panel-title">Output</span>
        <button
          onClick={onReset}
          disabled={!hasStory}
          className="btn"
        >
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>
      </div>

      <div ref={outputRef} className="flex-1 overflow-y-auto p-4">
        {!hasStory && state.history.length === 0 ? (
          renderWelcome()
        ) : (
          <>
            {renderStoryText()}
            {renderError()}
            {renderChoices()}
            {state.isEnded && renderEnded()}
            {renderVariables()}
          </>
        )}
      </div>

      <div className="footer-stats flex justify-between">
        <span>
          {hasStory
            ? state.isEnded
              ? 'Story ended'
              : state.choices.length > 0
                ? `${state.choices.length} choice${state.choices.length > 1 ? 's' : ''}`
                : 'Ready'
            : 'Ready'}
        </span>
        <span>inkjs</span>
      </div>
    </div>
  );
}
