import { useState, useCallback, useRef } from 'react';
import type { Story } from 'inkjs/full';
import type { StoryState, StoryChoice } from '../types';

const initialState: StoryState = {
  story: null,
  history: [],
  choices: [],
  variables: {},
  canContinue: false,
  isEnded: false,
  error: null
};

function getVariables(story: Story): Record<string, unknown> {
  const variables: Record<string, unknown> = {};
  const state = story.variablesState;

  // @ts-ignore - accessing internal state for display purposes
  if (state._globalVariables) {
    // @ts-ignore
    for (const key of state._globalVariables.keys()) {
      variables[key] = state.$(key);
    }
  }

  return variables;
}

export function useInkRunner() {
  const [state, setState] = useState<StoryState>(initialState);
  const storyRef = useRef<Story | null>(null);
  const historyRef = useRef<string[]>([]);

  const continueStory = useCallback(() => {
    const story = storyRef.current;
    if (!story) return;

    try {
      while (story.canContinue) {
        const text = story.Continue();
        if (text && text.trim()) {
          historyRef.current.push(text);
        }
      }

      const choices: StoryChoice[] = story.currentChoices?.map((choice) => ({
        index: choice.index,
        text: choice.text
      })) || [];

      const isEnded = !story.canContinue && choices.length === 0;

      setState({
        story,
        history: [...historyRef.current],
        choices,
        variables: getVariables(story),
        canContinue: story.canContinue,
        isEnded,
        error: null
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: (error as Error).message
      }));
    }
  }, []);

  const start = useCallback((story: Story) => {
    storyRef.current = story;
    historyRef.current = [];

    story.onError = (message: string) => {
      console.error('Ink runtime error:', message);
      setState(prev => ({
        ...prev,
        error: `Runtime: ${message}`
      }));
    };

    setState({
      story,
      history: [],
      choices: [],
      variables: {},
      canContinue: story.canContinue,
      isEnded: false,
      error: null
    });

    continueStory();
  }, [continueStory]);

  const makeChoice = useCallback((choiceIndex: number) => {
    const story = storyRef.current;
    if (!story) return;

    try {
      story.ChooseChoiceIndex(choiceIndex);
      continueStory();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: (error as Error).message
      }));
    }
  }, [continueStory]);

  const resetStory = useCallback(() => {
    const story = storyRef.current;
    if (!story) return;

    try {
      story.ResetState();
      historyRef.current = [];
      setState({
        story,
        history: [],
        choices: [],
        variables: {},
        canContinue: story.canContinue,
        isEnded: false,
        error: null
      });
      continueStory();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: (error as Error).message
      }));
    }
  }, [continueStory]);

  return {
    state,
    start,
    makeChoice,
    resetStory
  };
}
