import { useState, useCallback, useRef, useEffect } from 'react';
import type { Story } from 'inkjs/full';
import type { StoryState, StoryChoice, StoryLine } from '../types';

const INITIAL: StoryState = {
  story: null,
  lines: [],
  pendingLines: [],
  choices: [],
  currentKnot: null,
  variables: {},
  isEnded: false,
  error: null
};

const LINE_DELAY = 400;

function getVariables(story: Story): Record<string, unknown> {
  const vars: Record<string, unknown> = {};
  // @ts-ignore
  const globals = story.variablesState?._globalVariables;
  if (globals) {
    for (const key of globals.keys()) {
      vars[key] = story.variablesState.$(key);
    }
  }
  return vars;
}

function getCurrentKnot(story: Story): string | null {
  try {
    // @ts-ignore
    const path = story.state?.currentPointer?.path;
    if (path) {
      const pathStr = path.toString();
      const match = pathStr.match(/^([^.]+)/);
      if (match) return match[1];
    }
  } catch {
    // ignore
  }
  return null;
}

export function useInkRunner() {
  const [state, setState] = useState<StoryState>(INITIAL);
  const storyRef = useRef<Story | null>(null);
  const timerRef = useRef<number | null>(null);
  const lastKnotRef = useRef<string | null>(null);

  // Process pending lines one at a time, stop at knot change
  useEffect(() => {
    if (state.pendingLines.length === 0) return;

    const nextLine = state.pendingLines[0];

    // If knot changed, wait for user to click continue
    if (lastKnotRef.current !== null && nextLine.knot !== null && nextLine.knot !== lastKnotRef.current) {
      return; // Don't auto-advance, wait for continue
    }

    timerRef.current = window.setTimeout(() => {
      setState(s => {
        if (s.pendingLines.length === 0) return s;

        const [line, ...remaining] = s.pendingLines;
        lastKnotRef.current = line.knot;

        return {
          ...s,
          lines: [...s.lines, line],
          pendingLines: remaining,
          currentKnot: line.knot || s.currentKnot
        };
      });
    }, LINE_DELAY);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state.pendingLines, state.lines]);

  // Show choices when pending lines are done
  useEffect(() => {
    if (state.pendingLines.length === 0 && state.story) {
      const story = state.story;
      const choices: StoryChoice[] = (story.currentChoices || []).map(c => ({
        index: c.index,
        text: c.text
      }));
      const isEnded = !story.canContinue && choices.length === 0;

      setState(s => ({ ...s, choices, isEnded }));
    }
  }, [state.pendingLines.length, state.story]);

  const advance = useCallback(() => {
    const story = storyRef.current;
    if (!story) return;

    try {
      const newLines: StoryLine[] = [];

      while (story.canContinue) {
        const text = story.Continue();
        const knot = getCurrentKnot(story);

        if (text?.trim()) {
          text.split('\n').filter(Boolean).forEach(line => {
            newLines.push({ text: line.trim(), knot });
          });
        }
      }

      setState(s => ({
        ...s,
        story,
        pendingLines: newLines,
        choices: [],
        variables: getVariables(story),
        isEnded: false,
        error: null
      }));
    } catch (e) {
      setState(s => ({ ...s, error: (e as Error).message }));
    }
  }, []);

  const continueToNextKnot = useCallback(() => {
    // User clicked continue, allow the next line to show
    if (state.pendingLines.length === 0) return;

    const nextLine = state.pendingLines[0];
    lastKnotRef.current = nextLine.knot;

    setState(s => {
      const [line, ...remaining] = s.pendingLines;
      return {
        ...s,
        lines: [...s.lines, line],
        pendingLines: remaining,
        currentKnot: line.knot || s.currentKnot
      };
    });
  }, [state.pendingLines]);

  const needsContinue = state.pendingLines.length > 0 &&
    lastKnotRef.current !== null &&
    state.pendingLines[0].knot !== null &&
    state.pendingLines[0].knot !== lastKnotRef.current;

  const start = useCallback((story: Story) => {
    storyRef.current = story;
    lastKnotRef.current = null;
    story.onError = (msg: string) => setState(s => ({ ...s, error: msg }));
    setState({ ...INITIAL, story });
    advance();
  }, [advance]);

  const makeChoice = useCallback((index: number) => {
    if (state.pendingLines.length > 0) return;

    try {
      storyRef.current?.ChooseChoiceIndex(index);
      advance();
    } catch (e) {
      setState(s => ({ ...s, error: (e as Error).message }));
    }
  }, [advance, state.pendingLines.length]);

  const reset = useCallback(() => {
    const story = storyRef.current;
    if (!story) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    story.ResetState();
    lastKnotRef.current = null;
    setState({ ...INITIAL, story });
    advance();
  }, [advance]);

  return { state, start, makeChoice, reset, continueToNextKnot, needsContinue };
}
