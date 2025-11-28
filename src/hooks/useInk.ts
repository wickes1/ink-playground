import { useState, useCallback } from 'react';
import { Compiler, CompilerOptions } from 'inkjs/full';

interface CompileError {
  message: string;
  type: 'error' | 'warning' | 'author';
  lineNumber?: number;
}

export function useInk() {
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parse = useCallback((source: string) => {
    setError(null);
    if (!source.trim()) return null;

    setIsParsing(true);
    const errors: CompileError[] = [];

    try {
      const options = new CompilerOptions(
        null,
        [],
        false,
        (message: string, type: number) => {
          const errorType = type === 2 ? 'error' : type === 1 ? 'warning' : 'author';
          const lineMatch = message.match(/line (\d+)/i);
          const lineNumber = lineMatch ? parseInt(lineMatch[1], 10) : undefined;
          errors.push({ message, type: errorType, lineNumber });
        }
      );

      const compiler = new Compiler(source, options);
      const story = compiler.Compile();

      const hasErrors = errors.some(e => e.type === 'error');

      if (hasErrors || !story) {
        const errorMessages = errors
          .filter(e => e.type === 'error')
          .map(e => e.message)
          .join('\n');

        setError(errorMessages || 'Compilation failed');
        return null;
      }

      const warnings = errors.filter(e => e.type === 'warning');
      if (warnings.length > 0) {
        console.warn('Ink warnings:', warnings.map(w => w.message).join('\n'));
      }

      return story;
    } catch (e: unknown) {
      if (errors.length > 0) {
        const errorMessages = errors
          .filter(e => e.type === 'error')
          .map(e => e.message)
          .join('\n');
        const fallbackMessage = e instanceof Error ? e.message : 'Failed to compile Ink story';
        setError(errorMessages || fallbackMessage);
      } else {
        setError(e instanceof Error ? e.message : 'Failed to compile Ink story');
      }
      return null;
    } finally {
      setIsParsing(false);
    }
  }, []);

  return { parse, isParsing, error, setError };
}
