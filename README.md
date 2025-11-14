# Ink Explorer

Interactive Fiction Parser and Runtime for the Ink scripting language.

## Overview

Ink Explorer is a web-based tool for writing, testing, and exploring Ink scripts. It provides a split-view interface with a code editor on the left and an interactive story runtime on the right, similar to the Yarn Explorer implementation.

## Features

- **Real-time Compilation**: Write Ink scripts and compile them instantly
- **Interactive Runtime**: Play through your stories with an interactive choice system
- **Variable Tracking**: Watch your story variables update in real-time
- **Sample Stories**: Pre-loaded examples demonstrating Ink features
- **Export Functionality**: Export story state and history as JSON
- **Keyboard Shortcuts**: Quick compile with Ctrl+Enter
- **Error Handling**: Clear error messages for debugging

## Technology Stack

- **TypeScript**: Type-safe development
- **Vite**: Fast development server and build tool
- **inkjs**: JavaScript port of the Ink scripting language
- **Vanilla JS/CSS**: No framework dependencies, keeping it lightweight

## Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

## Usage

1. **Write Ink Script**: Use the left editor panel to write or paste your Ink script
2. **Compile & Run**: Click "Compile & Run" or press Ctrl+Enter to start the story
3. **Make Choices**: Click on choices to progress through the narrative
4. **Watch Variables**: See your story variables update in real-time
5. **Export State**: Save the current story state and history as JSON

## Sample Stories

The explorer includes several example Ink scripts:

- **hello-world.ink**: Simple introduction to Ink basics
- **choices-demo.ink**: Demonstrates branching narratives
- **variables-demo.ink**: Shows variable tracking and conditional logic
- **knots-demo.ink**: Explores knots and stitches for story structure
- **advanced-demo.ink**: Advanced features including character classes and state management

## Ink Language Features Supported

- ✅ Basic narrative text
- ✅ Choices and branching
- ✅ Variables (VAR)
- ✅ Conditionals
- ✅ Knots and Stitches
- ✅ Diverts (->)
- ✅ Gathers and Weaves
- ✅ Logic and expressions
- ✅ String interpolation

## Project Structure

```
ink-explorer/
├── src/
│   └── app.ts          # Main TypeScript application
├── index.html          # Main HTML file with UI
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite configuration
├── *.ink               # Sample Ink scripts
└── README.md           # This file
```

## Development

The application uses:
- **Vite** for development server (port 8081)
- **TypeScript** for type safety
- **inkjs** for Ink compilation and runtime

### Architecture

The app follows a simple architecture inspired by Yarn Explorer:

1. **Editor Panel**: Code editor for writing Ink scripts
2. **Runtime Panel**: Interactive story player with choice system
3. **Compiler**: Uses inkjs Compiler to convert Ink source to JSON
4. **Story Engine**: Uses inkjs Story class to run the compiled story
5. **State Management**: Tracks story history and variables

## Comparison with Yarn Explorer

| Feature | Yarn Explorer | Ink Explorer |
|---------|---------------|--------------|
| Language | Yarn Spinner | Ink |
| Backend | C# WebAssembly | JavaScript (inkjs) |
| Parser | Native C# | Pure JavaScript |
| Runtime | Yes | Yes |
| Variables | Yes | Yes |
| Examples | 5+ | 5+ |
| Port | 8080 | 8081 |

## Resources

- [Ink Language](https://www.inklestudios.com/ink/)
- [inkjs GitHub](https://github.com/y-lohse/inkjs)
- [Ink Documentation](https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md)

## License

MIT

## Credits

- **Ink**: Created by inkle Studios
- **inkjs**: JavaScript port by Yannick Lohse
- **UI Design**: Inspired by Yarn Explorer
