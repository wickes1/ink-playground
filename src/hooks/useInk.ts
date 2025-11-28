import { useState, useCallback } from 'react';
// @ts-ignore - inkjs has some type issues with module resolution
import { Compiler } from 'inkjs/full';
import type { InkParseResult } from '../types';

export function useInk() {
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<InkParseResult | null>(null);

  const parse = useCallback((inkSource: string) => {
    if (!inkSource.trim()) {
      setParseResult({ story: null, error: 'Editor is empty' });
      return null;
    }

    setIsParsing(true);
    setParseResult(null);

    try {
      const compiler = new Compiler(inkSource);
      const story = compiler.Compile();

      if (!story) {
        const result: InkParseResult = {
          story: null,
          error: 'Compilation failed - no story generated'
        };
        setParseResult(result);
        setIsParsing(false);
        return null;
      }

      // Try to get JSON representation for debugging
      let json: string | undefined;
      try {
        const result = story.ToJson();
        json = result || undefined;
      } catch {
        // JSON serialization may fail, that's okay
      }

      const result: InkParseResult = {
        story,
        error: null,
        json
      };

      setParseResult(result);
      setIsParsing(false);
      return story;
    } catch (error) {
      const result: InkParseResult = {
        story: null,
        error: (error as Error).message
      };
      setParseResult(result);
      setIsParsing(false);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setParseResult(null);
    setIsParsing(false);
  }, []);

  return {
    parse,
    reset,
    isParsing,
    parseResult
  };
}
