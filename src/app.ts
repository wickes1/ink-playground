/**
 * Ink Explorer - Interactive Fiction Parser & Runtime
 * Uses inkjs library for parsing and executing Ink scripts
 */

// @ts-ignore - inkjs has some type issues with module resolution
import { Story, Compiler } from 'inkjs/full';

// Global state
let currentStory: Story | null = null;
let storyHistory: string[] = [];

// DOM elements
const inkEditor = document.getElementById('inkEditor') as HTMLTextAreaElement;
const compileBtn = document.getElementById('compileBtn') as HTMLButtonElement;
const pasteBtn = document.getElementById('pasteBtn') as HTMLButtonElement;
const copyBtn = document.getElementById('copyBtn') as HTMLButtonElement;
const loadSampleSelect = document.getElementById('loadSampleSelect') as HTMLSelectElement;
const clearBtn = document.getElementById('clearBtn') as HTMLButtonElement;
const exportBtn = document.getElementById('exportBtn') as HTMLButtonElement;
const resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;
const continueBtn = document.getElementById('continueBtn') as HTMLButtonElement;
const outputContainer = document.getElementById('outputContainer') as HTMLDivElement;
const statusText = document.getElementById('statusText') as HTMLSpanElement;
const statsText = document.getElementById('statsText') as HTMLSpanElement;

// Event listeners
compileBtn.addEventListener('click', () => compileAndRun());
resetBtn.addEventListener('click', () => resetStory());
continueBtn.addEventListener('click', () => continueStory());

pasteBtn.addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        inkEditor.value = text;
        updateStats();
        statusText.textContent = 'Pasted from clipboard';
    } catch (err) {
        statusText.textContent = 'Failed to paste: ' + (err as Error).message;
    }
});

copyBtn.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(inkEditor.value);
        statusText.textContent = 'Copied to clipboard';
    } catch (err) {
        statusText.textContent = 'Failed to copy: ' + (err as Error).message;
    }
});

loadSampleSelect.addEventListener('change', async (e) => {
    const fileName = (e.target as HTMLSelectElement).value;
    if (fileName) {
        await loadSampleFile(fileName);
        (e.target as HTMLSelectElement).value = '';
    }
});

clearBtn.addEventListener('click', () => {
    inkEditor.value = '';
    currentStory = null;
    storyHistory = [];
    outputContainer.innerHTML = '<div class="info-panel"><strong>Cleared!</strong><br><br>Ready to write a new story.</div>';
    updateStats();
    statusText.textContent = 'Cleared';
    continueBtn.disabled = true;
});

exportBtn.addEventListener('click', exportJSON);
inkEditor.addEventListener('input', updateStats);

inkEditor.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        compileAndRun();
    }
});

async function loadSampleFile(fileName: string) {
    try {
        statusText.textContent = 'Loading sample...';
        const response = await fetch(`./${fileName}`);
        if (!response.ok) {
            throw new Error('Failed to load sample file');
        }
        const text = await response.text();
        inkEditor.value = text;
        updateStats();
        statusText.textContent = 'Sample loaded - Click "Compile & Run" to start';
    } catch (error) {
        statusText.textContent = 'Error: ' + (error as Error).message;
        console.error(error);
    }
}

function updateStats() {
    const text = inkEditor.value;
    const chars = text.length;
    const lines = text.split('\n').length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    statsText.textContent = `${chars} chars | ${lines} lines | ${words} words`;
}

async function compileAndRun() {
    const inkText = inkEditor.value.trim();

    if (!inkText) {
        statusText.textContent = 'Editor is empty';
        return;
    }

    try {
        statusText.textContent = 'Compiling Ink script...';
        compileBtn.disabled = true;
        compileBtn.textContent = '⏳ Compiling...';

        // Compile the Ink source code
        // The Compiler.Compile() method returns a Story object directly
        const compiler = new Compiler(inkText);
        currentStory = compiler.Compile();

        if (!currentStory) {
            throw new Error('Compilation failed - no story generated');
        }

        // Console log the parsed JSON
        try {
            const storyJson = currentStory.ToJson();
            if (storyJson) {
                console.log('Parsed Story JSON:', JSON.parse(storyJson));
            }
        } catch (e) {
            console.warn('Unable to serialize story to JSON:', e);
        }

        // Add error handler to catch runtime errors
        currentStory.onError = (message: string, type: any) => {
            console.error('Ink runtime error:', message, type);
            outputContainer.innerHTML += `
                <div class="error-message">
                    <div class="error-title">Runtime Warning</div>
                    <div>${escapeHtml(message)}</div>
                </div>
            `;
        };

        storyHistory = [];

        statusText.textContent = '✅ Compiled successfully - Running story';

        // Start the story
        outputContainer.innerHTML = '';
        continueStory();

    } catch (error) {
        console.error('Compilation error:', error);
        statusText.textContent = '❌ Compilation failed';
        outputContainer.innerHTML = `
            <div class="error-message">
                <div class="error-title">Compilation Error</div>
                <div>${(error as Error).message}</div>
            </div>
        `;
    } finally {
        compileBtn.disabled = false;
        compileBtn.textContent = '▶️ Compile & Run';
    }
}

function resetStory() {
    if (!currentStory) {
        statusText.textContent = 'No story to reset';
        return;
    }

    try {
        currentStory.ResetState();
        storyHistory = [];
        outputContainer.innerHTML = '';
        continueStory();
        statusText.textContent = '🔄 Story reset';
    } catch (error) {
        console.error('Reset error:', error);
        statusText.textContent = '❌ Reset failed';
    }
}

function continueStory() {
    if (!currentStory) {
        statusText.textContent = 'No story loaded';
        return;
    }

    try {
        // Continue as far as we can
        while (currentStory.canContinue) {
            const text = currentStory.Continue();
            if (text && text.trim()) {
                storyHistory.push(text);
                appendStoryText(text);
            }
        }

        // Display current choices
        if (currentStory.currentChoices && currentStory.currentChoices.length > 0) {
            displayChoices(currentStory.currentChoices);
            continueBtn.disabled = true;
            statusText.textContent = `Waiting for choice (${currentStory.currentChoices.length} options)`;
        } else {
            // Story has ended
            continueBtn.disabled = true;
            statusText.textContent = 'Story ended';
            appendStoryEnded();
        }

        // Display variables
        displayVariables();

    } catch (error) {
        console.error('Continue error:', error);
        statusText.textContent = '❌ Error continuing story';
        outputContainer.innerHTML += `
            <div class="error-message">
                <div class="error-title">Runtime Error</div>
                <div>${(error as Error).message}</div>
            </div>
        `;
    }
}

function appendStoryText(text: string) {
    const storyDiv = document.createElement('div');
    storyDiv.className = 'story-text';

    // Split by newlines and create paragraphs
    const paragraphs = text.split('\n').filter(p => p.trim());
    storyDiv.innerHTML = paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('');

    outputContainer.appendChild(storyDiv);
    outputContainer.scrollTop = outputContainer.scrollHeight;
}

function displayChoices(choices: any[]) {
    const choicesDiv = document.createElement('div');
    choicesDiv.className = 'choices-container';

    choices.forEach((choice, index) => {
        const choiceBtn = document.createElement('div');
        choiceBtn.className = 'choice';
        choiceBtn.innerHTML = `<span class="choice-index">${index + 1}.</span>${escapeHtml(choice.text)}`;

        choiceBtn.addEventListener('click', () => {
            makeChoice(choice.index);
        });

        choicesDiv.appendChild(choiceBtn);
    });

    outputContainer.appendChild(choicesDiv);
    outputContainer.scrollTop = outputContainer.scrollHeight;
}

function makeChoice(choiceIndex: number) {
    if (!currentStory) return;

    try {
        currentStory.ChooseChoiceIndex(choiceIndex);

        // Remove choices from display
        const choicesContainer = outputContainer.querySelector('.choices-container');
        if (choicesContainer) {
            choicesContainer.remove();
        }

        // Continue the story
        continueStory();

    } catch (error) {
        console.error('Choice error:', error);
        statusText.textContent = '❌ Error making choice';
    }
}

function displayVariables() {
    if (!currentStory) return;

    // Remove previous variable display
    const prevVarDisplay = outputContainer.querySelector('.variable-display');
    if (prevVarDisplay) {
        prevVarDisplay.remove();
    }

    const variables = currentStory.variablesState;
    // Get all variable names by iterating over the state
    const varNames: string[] = [];

    // @ts-ignore - accessing internal state for display purposes
    if (variables._globalVariables) {
        // @ts-ignore
        for (const key of variables._globalVariables.keys()) {
            varNames.push(key);
        }
    }

    if (varNames.length === 0) return;

    const varDiv = document.createElement('div');
    varDiv.className = 'variable-display';

    let varHtml = '<h3>📊 Variables:</h3><div class="variable-list">';

    varNames.forEach(varName => {
        const value = variables.$(varName);
        varHtml += `<div class="variable-item"><span class="variable-key">${escapeHtml(varName)}</span>: <span class="variable-value">${escapeHtml(JSON.stringify(value))}</span></div>`;
    });

    varHtml += '</div>';
    varDiv.innerHTML = varHtml;

    outputContainer.appendChild(varDiv);
}

function appendStoryEnded() {
    const endDiv = document.createElement('div');
    endDiv.className = 'story-ended';
    endDiv.innerHTML = '<strong>📚 THE END</strong><br><br>The story has concluded.';
    outputContainer.appendChild(endDiv);
}

function exportJSON() {
    if (!currentStory) {
        statusText.textContent = '⚠️ No story to export';
        return;
    }

    // Collect variables safely
    const variablesObj: Record<string, any> = {};
    // @ts-ignore - accessing internal state for export
    if (currentStory.variablesState._globalVariables) {
        // @ts-ignore
        for (const [key, value] of currentStory.variablesState._globalVariables.entries()) {
            variablesObj[key] = value;
        }
    }

    const exportData = {
        storyHistory: storyHistory,
        currentState: {
            canContinue: currentStory.canContinue,
            currentChoices: currentStory.currentChoices,
            variables: variablesObj
        },
        metadata: {
            exportDate: new Date().toISOString(),
            scriptLength: inkEditor.value.length,
            parser: 'inkjs'
        }
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `ink_story_${Date.now()}.json`;
    link.click();

    URL.revokeObjectURL(url);
    statusText.textContent = '💾 Exported to JSON';
}

function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    updateStats();
    console.log('📖 Ink Explorer initialized');
    statusText.textContent = 'Ready - Press Ctrl+Enter to compile & run';
});
