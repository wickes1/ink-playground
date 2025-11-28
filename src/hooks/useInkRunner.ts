import { useState, useCallback, useRef } from 'react';
import type { Story } from 'inkjs/full';
import type { StoryState, StoryChoice } from '../types';

const INITIAL: StoryState = {
  story: null,
  history: [],
  choices: [],
  variables: {},
  isEnded: false,
  error: null
};

function getVariables(story: Story): Record<string, unknown> {
  const vars: Record<string, unknown> = {};
  // @ts-ignore - accessing internal state
  const globals = story.variablesState?._globalVariables;
  if (globals) {
    for (const key of globals.keys()) {
      vars[key] = story.variablesState.$(key);
    }
  }
  return vars;
}

export function useInkRunner() {
  const [state, setState] = useState<StoryState>(INITIAL);
  const storyRef = useRef<Story | null>(null);
  const historyRef = useRef<string[]>([]);

  const advance = useCallback(() => {
    const story = storyRef.current;
    if (!story) return;

    try {
      while (story.canContinue) {
        const text = story.Continue();
        if (text?.trim()) historyRef.current.push(text);
      }

      const choices: StoryChoice[] = (story.currentChoices || []).map(c => ({
        index: c.index,
        text: c.text
      }));

      setState({
        story,
        history: [...historyRef.current],
        choices,
        variables: getVariables(story),
        isEnded: !story.canContinue && choices.length === 0,
        error: null
      });
    } catch (e) {
      setState(s => ({ ...s, error: (e as Error).message }));
    }
  }, []);

  const start = useCallback((story: Story) => {
    storyRef.current = story;
    historyRef.current = [];
    story.onError = (msg: string) => setState(s => ({ ...s, error: msg }));
    setState({ ...INITIAL, story });
    advance();
  }, [advance]);

  const makeChoice = useCallback((index: number) => {
    try {
      storyRef.current?.ChooseChoiceIndex(index);
      advance();
    } catch (e) {
      setState(s => ({ ...s, error: (e as Error).message }));
    }
  }, [advance]);

  const reset = useCallback(() => {
    const story = storyRef.current;
    if (!story) return;
    story.ResetState();
    historyRef.current = [];
    setState({ ...INITIAL, story });
    advance();
  }, [advance]);

  return { state, start, makeChoice, reset };
}
