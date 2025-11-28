import { useState, useCallback } from 'react';
// @ts-ignore - inkjs type issues
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
        null, // sourceFilename
        [],   // pluginNames
        false, // countAllVisits
        (message: string, type: number) => {
          // type: 0 = Author, 1 = Warning, 2 = Error
          const errorType = type === 2 ? 'error' : type === 1 ? 'warning' : 'author';

          // Parse line number from message if present
          // inkjs error format: "ERROR: line X: message" or just the message
          const lineMatch = message.match(/line (\d+)/i);
          const lineNumber = lineMatch ? parseInt(lineMatch[1], 10) : undefined;

          errors.push({ message, type: errorType, lineNumber });
        }
      );

      const compiler = new Compiler(source, options);
      const story = compiler.Compile();

      // Check if there were any errors during compilation
      const hasErrors = errors.some(e => e.type === 'error');

      if (hasErrors || !story) {
        const errorMessages = errors
          .filter(e => e.type === 'error')
          .map(e => e.message)
          .join('\n');

        setError(errorMessages || 'Compilation failed');
        return null;
      }

      // Show warnings if any
      const warnings = errors.filter(e => e.type === 'warning');
      if (warnings.length > 0) {
        console.warn('Ink warnings:', warnings.map(w => w.message).join('\n'));
      }

      return story;
    } catch (e: any) {
      // If we caught errors via the handler, format those
      if (errors.length > 0) {
        const errorMessages = errors
          .filter(e => e.type === 'error')
          .map(e => e.message)
          .join('\n');
        setError(errorMessages || e.message || 'Failed to compile Ink story');
      } else {
        setError(e.message || 'Failed to compile Ink story');
      }
      return null;
    } finally {
      setIsParsing(false);
    }
  }, []);

  return { parse, isParsing, error, setError };
}
