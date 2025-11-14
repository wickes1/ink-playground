# Ink Explorer - Quick Start Guide

## Getting Started in 3 Steps

### 1. Start the Development Server
```bash
cd ink-explorer
pnpm install  # Only needed first time
pnpm run dev
```

The explorer will open at **http://localhost:8081/**

### 2. Try a Sample Story
Click the dropdown "📂 Load Example..." and select:
- **👋 Hello World** - Your first Ink story
- **🎯 Choices Demo** - Learn about branching
- **🔢 Variables Demo** - Work with stats and tracking
- **🪢 Knots & Stitches** - Explore story structure
- **🚀 Advanced Features** - See advanced Ink features

### 3. Write Your Own Story
Clear the editor and try this simple story:

```ink
You wake up in a mysterious room.

* [Look around]
    You see a door and a window.
    -> next
* [Go back to sleep]
    You decide to rest more.
    -> END

=== next ===
What do you do?

* [Open the door]
    You escape successfully!
* [Jump out the window]
    That was a bad idea...

-> END
```

Click **"▶️ Compile & Run"** or press **Ctrl+Enter**

## Understanding the Interface

### Left Panel: Editor
- Write or paste your Ink script here
- See character/line/word count at bottom
- Use **📋 Paste** to paste from clipboard
- Use **📄 Copy** to copy to clipboard

### Right Panel: Runtime
- Story text appears here
- Click choices to advance
- Watch variables update in real-time
- Use **🔄 Reset** to restart the story
- Use **⏭️ Continue** for auto-continue (when available)

### Top Bar Controls
- **📂 Load Example** - Load sample stories
- **🗑️ Clear** - Clear editor and runtime
- **💾 Export JSON** - Save story state as JSON

## Ink Syntax Quick Reference

### Basic Text
```ink
This is a simple line of text.
Another paragraph here.
```

### Choices
```ink
* [Option 1]
    Text after choosing option 1
* [Option 2]
    Text after choosing option 2
```

### Variables
```ink
VAR health = 100
VAR name = "Hero"

Your name is {name} and you have {health} health.

~ health = health - 10
```

### Conditionals
```ink
VAR has_key = false

{has_key:
    You unlock the door with the key.
- else:
    The door is locked.
}
```

### Knots (Story Sections)
```ink
-> start

=== start ===
Beginning of the story.
-> middle

=== middle ===
Middle section.
-> end

=== end ===
The end!
-> END
```

### Stitches (Subsections)
```ink
=== library ===
You enter the library.

= books
The shelves are full of books.
-> library

= desk
There's an old desk here.
-> library
```

## Tips & Tricks

### Keyboard Shortcuts
- **Ctrl+Enter** / **Cmd+Enter**: Compile & Run
- Standard text editing shortcuts work in the editor

### Best Practices
1. Start simple and test often
2. Use variables for tracking state
3. Name your knots descriptively
4. Test all choice paths
5. Use comments (`//`) to document complex logic

### Debugging
- Check the status bar for error messages
- Compilation errors show line numbers when possible
- Runtime errors display in the output panel
- Use the browser console (F12) for detailed logs

### Variable Tracking
The runtime panel shows all your variables in real-time:
```
📊 Variables:
health: 100
gold: 50
has_sword: true
```

### Export Your Story
Click **💾 Export JSON** to save:
- Complete story history
- Current story state
- All variable values
- Metadata and timestamps

## Example Workflows

### Testing a Story
1. Write/paste your Ink script
2. Click "Compile & Run"
3. Play through all choice paths
4. Make changes and re-compile
5. Test again until perfect

### Learning Ink Features
1. Load "🚀 Advanced Features"
2. Play through the story
3. Read the Ink source code
4. Modify and experiment
5. See how changes affect the story

### Creating a Game
1. Start with "🔢 Variables Demo"
2. Understand stat tracking
3. Add your own variables
4. Build choice consequences
5. Test balance and difficulty

## Common Issues & Solutions

### "Compilation Failed"
- Check your Ink syntax
- Look for unclosed knots/stitches
- Verify variable declarations (VAR)
- Check for missing `-> END` or diverts

### "No story loaded"
- Click "Compile & Run" first
- Make sure editor isn't empty
- Check for compilation errors

### Choices Not Appearing
- Ensure story isn't already at END
- Check if conditionals are blocking choices
- Verify choice syntax (`* [text]`)

### Variables Not Updating
- Check variable names match exactly
- Verify assignment syntax (`~ var = value`)
- Make sure variables are declared (VAR)

## Next Steps

### Learn More About Ink
- Read the official Ink documentation
- Study the sample stories included
- Join the Ink community
- Explore inkle's games (80 Days, Heaven's Vault)

### Enhance Your Stories
- Add complex branching
- Track multiple variables
- Create inventory systems
- Build character relationships
- Implement random events

### Share Your Work
- Export your stories as JSON
- Share Ink source files
- Create story collections
- Build custom game interfaces

## Resources

- **Ink Syntax**: https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md
- **inkjs Documentation**: https://github.com/y-lohse/inkjs
- **Ink Community**: https://discord.gg/inkle
- **Example Games**: https://www.inklestudios.com/ink/

## Support

For issues or questions:
1. Check this guide
2. Review the README.md
3. Examine sample stories
4. Check browser console for errors
5. Refer to Ink documentation

---

**Happy Story Writing! 📖✨**
