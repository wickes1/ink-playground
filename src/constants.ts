// Resizable panel configuration
export const RESIZABLE_HANDLE_STYLE = {
  vertical: {
    width: '10px',
    right: '-5px',
    cursor: 'col-resize',
    zIndex: 40,
  },
  horizontal: {
    height: '10px',
    bottom: '-5px',
    cursor: 'row-resize',
    zIndex: 40,
  },
} as const;

export const RESIZABLE_HANDLE_CLASS = {
  vertical: 'resize-handle-vertical hover:bg-indigo-500/20 active:bg-indigo-500/40',
  horizontal: 'resize-handle-horizontal hover:bg-indigo-500/20 active:bg-indigo-500/40',
} as const;

// Story runner timing
export const LINE_DELAY_MS = 0;

// Node graph layout
export const NODE_GRAPH = {
  nodeWidth: 140,
  nodeHeight: 44,
  nodeRadius: 8,
  gridSize: 24,
  startX: 100,
  startY: 80,
  spacingX: 180,
  spacingY: 100,
} as const;

// Example stories
export const EXAMPLES = [
  { path: 'examples/hello-world.ink', name: 'Hello World' },
  { path: 'examples/choices-demo.ink', name: 'Choices' },
  { path: 'examples/variables-demo.ink', name: 'Variables' },
  { path: 'examples/knots-demo.ink', name: 'Knots' },
  { path: 'examples/advanced-demo.ink', name: 'Advanced' },
  { path: 'examples/ink-tutorial.ink', name: 'Tutorial' },
] as const;
