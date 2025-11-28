import type { Story } from 'inkjs/full';

export interface StoryChoice {
  index: number;
  text: string;
}

export interface StoryState {
  story: Story | null;
  history: string[];
  choices: StoryChoice[];
  variables: Record<string, unknown>;
  isEnded: boolean;
  error: string | null;
}
