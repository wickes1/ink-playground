import { useRef, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import type { StoryState } from '../types';

interface Props {
  state: StoryState;
  onChoice: (index: number) => void;
  onReset: () => void;
}

export function Runner({ state, onChoice, onReset }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollTo(0, ref.current.scrollHeight);
  }, [state.history, state.choices]);

  const hasStory = state.story !== null;
  const showWelcome = !hasStory && state.history.length === 0;

  return (
    <div className="flex flex-col h-full">
      <div className="panel-header">
        <span className="panel-title">Output</span>
        <button onClick={onReset} disabled={!hasStory} className="btn">
          <RotateCcw size={14} />
          Reset
        </button>
      </div>

      <div ref={ref} className="flex-1 overflow-y-auto p-4">
        {showWelcome ? (
          <div className="info-panel">
            <p className="mb-3"><strong>Ink Playground</strong></p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Write Ink script in the editor</li>
              <li>Click Run or press Cmd+Enter</li>
              <li>Make choices to continue</li>
            </ol>
          </div>
        ) : (
          <>
            {state.history.map((text, i) => (
              <div key={i} className="story-text">
                {text.split('\n').filter(Boolean).map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
              </div>
            ))}

            {state.error && <div className="error-message">{state.error}</div>}

            {state.choices.length > 0 && (
              <div className="choices-container">
                {state.choices.map(c => (
                  <button key={c.index} onClick={() => onChoice(c.index)} className="choice">
                    <span className="choice-index">{c.index + 1}.</span>
                    {c.text}
                  </button>
                ))}
              </div>
            )}

            {state.isEnded && (
              <div className="story-ended"><strong>End of story</strong></div>
            )}

            {Object.keys(state.variables).length > 0 && (
              <div className="variable-display">
                <h3>Variables</h3>
                {Object.entries(state.variables).map(([k, v]) => (
                  <div key={k} className="variable-item">
                    <span className="variable-key">{k}</span> = <span className="variable-value">{JSON.stringify(v)}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="footer-stats">
        {state.isEnded ? 'Ended' : state.choices.length > 0 ? `${state.choices.length} choices` : 'Ready'}
      </div>
    </div>
  );
}
