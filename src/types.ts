import type { Story } from 'inkjs/full';

export interface StoryChoice {
  index: number;
  text: string;
}

export interface StoryLine {
  text: string;
  knot: string | null;
}

export interface StoryState {
  story: Story | null;
  lines: StoryLine[];
  pendingLines: StoryLine[];
  choices: StoryChoice[];
  currentKnot: string | null;
  variables: Record<string, unknown>;
  isEnded: boolean;
  error: string | null;
}
