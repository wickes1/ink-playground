# Ink Explorer - Project Summary

## Overview

**Ink Explorer** is a web-based interactive fiction development tool for the Ink scripting language, created as a parallel implementation to the Yarn Explorer project. It provides a split-view interface for writing, compiling, and playing Ink stories in real-time.

## Project Structure

```
ink-explorer/
├── src/
│   └── app.ts              # Main application logic
├── index.html              # UI with split-view editor/runtime
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite bundler configuration
├── .gitignore              # Git ignore patterns
├── README.md               # Full documentation
├── PROJECT_SUMMARY.md      # This file
└── Sample Ink Scripts:
    ├── hello-world.ink     # Basic introduction
    ├── choices-demo.ink    # Branching narratives
    ├── variables-demo.ink  # Variable tracking
    ├── knots-demo.ink      # Knots & stitches
    └── advanced-demo.ink   # Advanced features
```

## Key Features

1. **Split-View Interface**
   - Left panel: Code editor for Ink scripts
   - Right panel: Interactive story runtime

2. **Real-Time Compilation**
   - Compiles Ink source code using inkjs Compiler
   - Instant error feedback
   - Ctrl+Enter keyboard shortcut

3. **Interactive Runtime**
   - Click-to-choose interface
   - Variable tracking display
   - Story history
   - Reset functionality

4. **Sample Stories**
   - 5 pre-loaded examples demonstrating Ink features
   - Progressive complexity from basic to advanced

5. **Export Functionality**
   - Export story state as JSON
   - Includes history, variables, and metadata

## Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Language | TypeScript | 5.9.3 |
| Build Tool | Vite | 7.2.2 |
| Ink Engine | inkjs | 2.3.2 |
| UI | Vanilla HTML/CSS | - |
| Package Manager | pnpm | 10.20.0 |

## Comparison: Yarn Explorer vs Ink Explorer

| Aspect | Yarn Explorer | Ink Explorer |
|--------|---------------|--------------|
| **Language** | Yarn Spinner | Ink |
| **Parser Backend** | C# WebAssembly | JavaScript (inkjs) |
| **Compilation** | Native C# binary | Pure JavaScript |
| **Runtime** | Interactive | Interactive |
| **Port** | 8080 | 8081 |
| **Dependencies** | .NET WebAssembly | inkjs (zero deps) |
| **Build Process** | C# → WASM → JS | TypeScript → JS |
| **Variables** | Supported | Supported |
| **Examples** | 5 .yarn files | 5 .ink files |

## Setup & Development

### Installation
```bash
pnpm install
```

### Development Server
```bash
pnpm run dev
# Opens at http://localhost:8081/
```

### Build for Production
```bash
pnpm run build
# Output: dist/
```

### Type Checking
```bash
pnpm run typecheck
```

## Architecture

### Frontend Architecture
1. **Editor Panel** (`#inkEditor`)
   - Plain textarea for code editing
   - Syntax highlighting via CSS
   - Character/line/word count

2. **Runtime Panel** (`#outputContainer`)
   - Story text display
   - Choice buttons
   - Variable display
   - Error messages

3. **Compiler Integration**
   - Uses `inkjs/full` for full compilation support
   - Compiles Ink source → JSON bytecode
   - Story class executes the compiled bytecode

### Data Flow
```
User writes Ink script
    ↓
Click "Compile & Run"
    ↓
Compiler converts to JSON bytecode
    ↓
Story class loads bytecode
    ↓
Story.Continue() generates text
    ↓
Display text + choices
    ↓
User clicks choice
    ↓
Story.ChooseChoiceIndex()
    ↓
Loop back to Continue()
```

## Ink Language Support

The explorer supports all core Ink features:

- ✅ Basic narrative text
- ✅ Choices and branching (`*`, `+`)
- ✅ Variables (VAR keyword)
- ✅ Conditionals (`{condition: ... - else: ...}`)
- ✅ Knots (===) and Stitches (=)
- ✅ Diverts (->)
- ✅ Gathers and Weaves (-)
- ✅ Logic and expressions
- ✅ String interpolation (`{variable}`)
- ✅ Comments (`//`)

## Implementation Details

### Import Resolution
The project uses `inkjs/full` to access both Story and Compiler classes:
```typescript
import { Story, Compiler } from 'inkjs/full';
```

### State Management
- `currentStory`: Active Story instance
- `storyHistory`: Array of story text segments
- Variables tracked via `story.variablesState`

### Error Handling
- Compilation errors displayed in runtime panel
- Runtime errors caught and displayed
- Clear error messages for debugging

## Future Enhancements

Potential improvements for the Ink Explorer:

1. **Syntax Highlighting**: Use CodeMirror or Monaco editor
2. **Save/Load**: LocalStorage persistence for drafts
3. **Theme Support**: Light/dark mode toggle
4. **Ink Language Server**: Real-time linting and autocomplete
5. **Export Options**: Export to HTML, PDF, or native Ink format
6. **Debugger**: Step-through execution with breakpoints
7. **Graph View**: Visual representation of story structure
8. **Multi-file Support**: Import/export story collections
9. **Mobile Responsive**: Touch-friendly interface
10. **Collaboration**: Real-time multi-user editing

## Resources

- **Ink Language**: https://www.inklestudios.com/ink/
- **inkjs GitHub**: https://github.com/y-lohse/inkjs
- **Ink Documentation**: https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md
- **Yarn Explorer**: ../yarn-explorer/ (reference implementation)

## Development Notes

### Why inkjs/full?
The `/full` export includes both the Story runtime and Compiler in one bundle, simplifying imports and ensuring compatibility.

### Performance
- Compilation is near-instant for small-medium stories
- Large stories (1000+ nodes) may take 100-500ms to compile
- Runtime execution is very fast (milliseconds per action)

### Browser Compatibility
- Modern browsers (ES2020+)
- No IE11 support
- Works offline after initial load
- No backend required

## Success Criteria

The Ink Explorer successfully achieves:

1. ✅ Parser implementation using inkjs
2. ✅ Interactive runtime with choice system
3. ✅ Variable tracking and display
4. ✅ Sample stories for POC
5. ✅ Similar UI/UX to Yarn Explorer
6. ✅ Error handling and debugging
7. ✅ Export functionality
8. ✅ Zero-dependency runtime (besides inkjs)

## Conclusion

The Ink Explorer provides a complete proof-of-concept for developing interactive fiction with the Ink scripting language. It mirrors the architecture of Yarn Explorer while leveraging the pure JavaScript inkjs library, making it lightweight and easy to deploy.

---

**Status**: ✅ Complete and Running
**Server**: http://localhost:8081/
**Last Updated**: 2025-11-14
