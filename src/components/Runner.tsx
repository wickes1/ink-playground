import { useRef, useEffect, useMemo } from 'react';
import type { StoryState, StoryLine } from '../types';

interface Props {
  state: StoryState;
  onChoice: (index: number) => void;
  onContinue: () => void;
  needsContinue: boolean;
}

interface KnotGroup {
  knot: string | null;
  lines: StoryLine[];
}

function groupLinesByKnot(lines: StoryLine[]): KnotGroup[] {
  const groups: KnotGroup[] = [];
  let currentGroup: KnotGroup | null = null;

  for (const line of lines) {
    if (!currentGroup || currentGroup.knot !== line.knot) {
      currentGroup = { knot: line.knot, lines: [] };
      groups.push(currentGroup);
    }
    currentGroup.lines.push(line);
  }

  return groups;
}

export function Runner({ state, onChoice, onContinue, needsContinue }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);

  const groups = useMemo(() => groupLinesByKnot(state.lines), [state.lines]);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: contentRef.current.scrollHeight, behavior: 'smooth' });
  }, [state.lines, state.choices, needsContinue]);

  const hasStory = state.story !== null;
  const showWelcome = !hasStory && state.lines.length === 0;
  const showChoices = !needsContinue && state.choices.length > 0 && state.pendingLines.length === 0;

  return (
    <div className="runner">
      <div className="panel-header">
        <span className="panel-title">Story Runner</span>
      </div>

      <div ref={contentRef} className="runner-content">
        {showWelcome ? (
          <div className="welcome-panel">
            <p>Write an Ink script and click Run to begin</p>
          </div>
        ) : (
          <>
            {groups.map((group, gi) => (
              <div key={gi} className="knot-group">
                {group.knot && (
                  <div className="knot-label">{group.knot}</div>
                )}
                <div className="knot-content">
                  {group.lines.map((line, li) => (
                    <p key={li} className="story-line">{line.text}</p>
                  ))}
                </div>
              </div>
            ))}

            {state.error && (
              <div className="error-message">
                <span>{state.error}</span>
              </div>
            )}

            {needsContinue && (
              <button onClick={onContinue} className="continue-btn">
                Continue
              </button>
            )}

            {showChoices && (
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
                <p>End of story</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
