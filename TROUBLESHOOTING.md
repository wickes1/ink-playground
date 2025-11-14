# Ink Explorer - Troubleshooting Guide

## Common Issues and Solutions

### Compilation Error: "ink version number not found"

**Problem**: When clicking "Compile & Run", you see the error:
```
Compilation Error
ink version number not found. Are you sure it's a valid .ink.json file?
```

**Cause**: The `Compiler.Compile()` method returns a `Story` object directly, not JSON. Trying to pass this Story object to the Story constructor causes the error.

**Solution**: ✅ **FIXED** - The code now correctly uses:
```typescript
const compiler = new Compiler(inkText);
currentStory = compiler.Compile(); // Returns Story object directly
```

**Incorrect approach** (causes the error):
```typescript
const compiler = new Compiler(inkText);
const storyJson = compiler.Compile();
currentStory = new Story(storyJson); // ❌ Wrong! storyJson is already a Story
```

---

### Import Error: Missing "./compiler" specifier

**Problem**: Build errors about missing compiler specifier:
```
Missing "./compiler" specifier in "inkjs" package
```

**Cause**: Incorrect import path for the Compiler class.

**Solution**: ✅ **FIXED** - Use the `/full` export:
```typescript
import { Story, Compiler } from 'inkjs/full';
```

**Other approaches that don't work**:
```typescript
import { Story, Compiler } from 'inkjs/compiler'; // ❌ Wrong path
import { Compiler } from 'inkjs/compiler/Compiler'; // ❌ Doesn't work in browser
```

---

### Variables Not Displaying

**Problem**: Story runs but variables don't show up in the runtime panel.

**Cause**: Variables might not be declared or the variable display code has an issue.

**Solution**:
1. Ensure variables are declared in your Ink script:
   ```ink
   VAR health = 100
   VAR gold = 50
   ```
2. Check browser console (F12) for errors
3. Verify the story has variables:
   ```javascript
   console.log(currentStory.variablesState._globalVariables);
   ```

---

### Sample Files Not Loading

**Problem**: Clicking "Load Example" dropdown doesn't load files.

**Cause**: Sample `.ink` files are missing or in wrong location.

**Solution**:
1. Ensure all `.ink` files are in the root directory (same level as `index.html`)
2. Check file names match exactly:
   - `hello-world.ink`
   - `choices-demo.ink`
   - `variables-demo.ink`
   - `knots-demo.ink`
   - `advanced-demo.ink`

---

### Choices Not Appearing

**Problem**: Story text appears but no choices are shown.

**Causes and Solutions**:

1. **Conditional blocking choices**:
   ```ink
   VAR has_key = false

   * {has_key} [Use the key]  # Won't show if has_key is false
   ```
   Solution: Check your conditionals

2. **Story already at END**:
   ```ink
   -> END  # Story finished
   ```
   Solution: Click "Reset" to restart

3. **Missing choice syntax**:
   ```ink
   [This is wrong]  # Missing the *
   * [This is correct]
   ```
   Solution: Ensure choices start with `*` or `+`

---

### "No story loaded" Error

**Problem**: Clicking buttons shows "No story loaded".

**Solution**:
1. Write or load an Ink script first
2. Click "Compile & Run" (or press Ctrl+Enter)
3. Make sure compilation succeeded (check for error messages)

---

### Browser Console Errors

**Problem**: Errors in browser console (F12).

**Common Errors and Fixes**:

1. **"Cannot read property of null"**:
   - Story not compiled yet
   - Click "Compile & Run" first

2. **"Unexpected token"**:
   - Syntax error in Ink script
   - Check your Ink syntax

3. **Module not found**:
   - Dependencies not installed
   - Run `pnpm install`

---

### Performance Issues

**Problem**: Slow compilation or laggy interface.

**Solutions**:
1. **Large stories**: Stories with 1000+ nodes may take longer to compile
2. **Browser**: Use a modern browser (Chrome, Firefox, Safari, Edge)
3. **Memory**: Close other tabs if running low on RAM

---

### Development Server Issues

**Problem**: `pnpm run dev` fails or server won't start.

**Solutions**:

1. **Port already in use**:
   ```bash
   # Kill process on port 8081
   lsof -ti:8081 | xargs kill -9
   pnpm run dev
   ```

2. **Dependencies not installed**:
   ```bash
   pnpm install
   pnpm run dev
   ```

3. **Node version**:
   - Requires Node.js 18+
   - Check: `node --version`

---

### TypeScript Errors

**Problem**: Type errors during development.

**Solutions**:

1. **Check types**:
   ```bash
   pnpm run typecheck
   ```

2. **Common type issues**:
   ```typescript
   // Use type assertions when needed
   const element = document.getElementById('id') as HTMLElement;
   ```

3. **Ignore specific errors** (use sparingly):
   ```typescript
   // @ts-ignore
   import { Story, Compiler } from 'inkjs/full';
   ```

---

### Export JSON Not Working

**Problem**: "Export JSON" button doesn't download file.

**Causes and Solutions**:

1. **No story to export**:
   - Compile and run a story first

2. **Browser blocking download**:
   - Check browser's download permissions
   - Allow pop-ups for localhost:8081

3. **Browser compatibility**:
   - Use modern browser with Blob API support

---

## Debugging Tips

### Enable Verbose Logging

Add to `src/app.ts`:
```typescript
// At the top of compileAndRun()
console.log('Compiling:', inkText);
console.log('Compiler:', new Compiler(inkText));

// After compilation
console.log('Story:', currentStory);
console.log('Can continue:', currentStory.canContinue);
console.log('Choices:', currentStory.currentChoices);
```

### Check Story State

In browser console:
```javascript
// Check if story exists
console.log(window.currentStory);

// Check variables
console.log(window.currentStory.variablesState._globalVariables);

// Check current text
console.log(window.currentStory.currentText);
```

### Validate Ink Syntax

Use the inkjs compiler CLI:
```bash
npx inkjs-compiler your-story.ink -o output.json
```

If this fails, your Ink syntax has errors.

---

## Getting Help

1. **Check Documentation**:
   - README.md
   - QUICK_START.md
   - Ink language docs: https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md

2. **Browser Console**:
   - Press F12
   - Check Console tab for errors
   - Check Network tab for loading issues

3. **Test with Samples**:
   - Load one of the example stories
   - If samples work, issue is in your Ink script
   - If samples fail, issue is in the app

4. **Minimal Test**:
   ```ink
   Hello World
   -> END
   ```
   If this doesn't work, there's a system issue.

---

## Known Limitations

1. **No syntax highlighting** in editor (plain textarea)
2. **No autocomplete** for Ink keywords
3. **Limited error messages** from compiler
4. **No step-through debugging** of Ink logic
5. **Browser-only** (no mobile app)

---

## Version Information

- **inkjs**: 2.3.2
- **Vite**: 7.2.2
- **TypeScript**: 5.9.3
- **Node**: 18+ required

---

Last Updated: 2025-11-14
