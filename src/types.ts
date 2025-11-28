import type { Story } from 'inkjs/full';

export interface InkParseResult {
  story: Story | null;
  error: string | null;
  json?: string;
}

export interface StoryChoice {
  index: number;
  text: string;
}

export interface StoryState {
  story: Story | null;
  history: string[];
  choices: StoryChoice[];
  variables: Record<string, unknown>;
  canContinue: boolean;
  isEnded: boolean;
  error: string | null;
}
