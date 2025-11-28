import { useState, useCallback } from 'react';
// @ts-ignore - inkjs type issues
import { Compiler } from 'inkjs/full';

export function useInk() {
  const [isParsing, setIsParsing] = useState(false);

  const parse = useCallback((source: string) => {
    if (!source.trim()) return null;

    setIsParsing(true);
    try {
      const story = new Compiler(source).Compile();
      return story || null;
    } catch (e) {
      console.error('Ink compile error:', e);
      return null;
    } finally {
      setIsParsing(false);
    }
  }, []);

  return { parse, isParsing };
}
