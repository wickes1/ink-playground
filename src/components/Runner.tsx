import { useRef, useEffect, useState } from 'react';
import { RotateCcw, MessageSquare, Database } from 'lucide-react';
import type { StoryState } from '../types';

interface Props {
  state: StoryState;
  onChoice: (index: number) => void;
  onReset: () => void;
}

type Tab = 'story' | 'state';

export function Runner({ state, onChoice, onReset }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>('story');

  useEffect(() => {
    ref.current?.scrollTo(0, ref.current.scrollHeight);
  }, [state.history, state.choices]);

  const hasStory = state.story !== null;
  const showWelcome = !hasStory && state.history.length === 0;

  return (
    <div className="runner">
      <div className="panel-header">
        <span className="panel-title">Story Runner</span>
        <button onClick={onReset} disabled={!hasStory} className="btn btn-sm">
          <RotateCcw size={12} />
          Restart
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'story' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('story')}
        >
          <MessageSquare size={14} />
          Story
        </button>
        <button
          className={`tab ${activeTab === 'state' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('state')}
        >
          <Database size={14} />
          State
        </button>
      </div>

      {/* Story Tab */}
      {activeTab === 'story' && (
        <div ref={ref} className="runner-content">
          {showWelcome ? (
            <div className="info-panel">
              <p className="info-title">Welcome to Ink Playground</p>
              <ol className="info-list">
                <li>Write or load an Ink script</li>
                <li>Click Run to start the story</li>
                <li>Make choices to explore branches</li>
              </ol>
            </div>
          ) : (
            <>
              {state.history.map((text, i) => (
                <div key={i} className="story-block">
                  {text.split('\n').filter(Boolean).map((p, j) => (
                    <p key={j} className="story-text">{p}</p>
                  ))}
                </div>
              ))}

              {state.error && <div className="error-message">{state.error}</div>}

              {state.choices.length > 0 && (
                <div className="choices-container">
                  {state.choices.map(c => (
                    <button key={c.index} onClick={() => onChoice(c.index)} className="choice">
                      <span className="choice-index">{c.index + 1}</span>
                      <span className="choice-text">{c.text}</span>
                    </button>
                  ))}
                </div>
              )}

              {state.isEnded && (
                <div className="story-ended">
                  <strong>End of story</strong>
                  <p>The narrative has concluded.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* State Tab */}
      {activeTab === 'state' && (
        <div className="runner-content state-content">
          <div className="state-section">
            <h3 className="state-title">Global Variables</h3>
            {Object.keys(state.variables).length > 0 ? (
              <table className="variable-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Value</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(state.variables).map(([key, value]) => (
                    <tr key={key}>
                      <td className="var-name">{key}</td>
                      <td className={`var-value ${getValueClass(value)}`}>
                        {formatValue(value)}
                      </td>
                      <td className="var-type">{typeof value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="state-empty">No variables defined</p>
            )}
          </div>

          <div className="state-section">
            <h3 className="state-title">Execution State</h3>
            <div className="state-info">
              <div className="state-row">
                <span className="state-label">Status</span>
                <span className={`state-value ${state.isEnded ? 'status-ended' : 'status-active'}`}>
                  {state.isEnded ? 'Ended' : hasStory ? 'Running' : 'Idle'}
                </span>
              </div>
              <div className="state-row">
                <span className="state-label">Choices</span>
                <span className="state-value">{state.choices.length}</span>
              </div>
              <div className="state-row">
                <span className="state-label">History</span>
                <span className="state-value">{state.history.length} passages</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="footer-stats">
        {state.isEnded ? 'Ended' : state.choices.length > 0 ? `${state.choices.length} choices available` : 'Ready'}
      </div>
    </div>
  );
}

function getValueClass(value: unknown): string {
  if (typeof value === 'number') return value >= 50 ? 'value-positive' : 'value-warning';
  if (typeof value === 'boolean') return value ? 'value-positive' : 'value-negative';
  return '';
}

function formatValue(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'string') return `"${value}"`;
  return String(value);
}
