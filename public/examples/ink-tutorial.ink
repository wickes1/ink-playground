// ============================================================================
// INK TUTORIAL - A Comprehensive Guide Through Examples
// ============================================================================
// This file demonstrates all major ink features in a playable story format.
// Each section is commented to explain the feature being demonstrated.
// ============================================================================

// ----------------------------------------------------------------------------
// GLOBAL TAGS - Metadata at the top of the file
// ----------------------------------------------------------------------------
# title: The Adventurer's Guide to Ink
# author: Tutorial Bot

// ----------------------------------------------------------------------------
// CONSTANTS - Immutable values defined once
// ----------------------------------------------------------------------------
CONST MAX_HEALTH = 100
CONST STARTING_GOLD = 50

// ----------------------------------------------------------------------------
// GLOBAL VARIABLES - State that persists throughout the story
// ----------------------------------------------------------------------------
VAR player_name = "Adventurer"
VAR health = MAX_HEALTH
VAR gold = STARTING_GOLD
VAR has_sword = false
VAR has_key = false
VAR mood = 0  // -10 to 10, negative = sad, positive = happy

// ----------------------------------------------------------------------------
// LIST - State machines for tracking complex states
// ----------------------------------------------------------------------------
LIST DoorState = locked, closed, (open)
LIST TimeOfDay = morning, afternoon, evening, night

VAR front_door = closed
VAR current_time = morning

// ----------------------------------------------------------------------------
// EXTERNAL FUNCTION DECLARATION - For game integration
// ----------------------------------------------------------------------------
// EXTERNAL playSound(soundName)
// EXTERNAL showImage(imageName)

// ----------------------------------------------------------------------------
// INCLUDE - Split story across multiple files (commented out for this demo)
// ----------------------------------------------------------------------------
// INCLUDE characters.ink
// INCLUDE locations.ink

// ============================================================================
// STORY START
// ============================================================================

-> introduction

// ----------------------------------------------------------------------------
// KNOT - Major story sections, defined with ===
// ----------------------------------------------------------------------------
=== introduction ===

// LINE TAGS - Metadata attached to specific lines
Welcome to the world of Ink! # tutorial_start # mood:excited

// VARIABLE INTERPOLATION - Embedding variables in text
Your name is {player_name} and you have {health} health points.

// CONDITIONAL TEXT - Text that changes based on conditions
You are currently feeling {mood > 0: quite happy|mood < 0: a bit down|neutral}.

* [Begin the adventure] -> tavern
* [Learn about the author] -> about

// ----------------------------------------------------------------------------
// SIMPLE KNOT WITH DIVERTS
// ----------------------------------------------------------------------------
=== about ===
This tutorial was created to demonstrate ink's features.
-> introduction

// ----------------------------------------------------------------------------
// KNOT WITH STITCHES - Sub-sections within a knot
// ----------------------------------------------------------------------------
=== tavern ===

// STITCH - Sub-section defined with single =
= entrance
You push open the heavy wooden door and enter the tavern. # location:tavern

// DIVERT TO STITCH - Jump to a stitch within the same knot
-> main_room

= main_room
The tavern is {&bustling with activity|quiet tonight|moderately busy}.

// GLUE - <> prevents line breaks
The barkeep notices you and <>

// SEQUENCE - Shows items in order, sticks on last
{waves cheerfully|nods in recognition|barely glances up}.

- (tavern_choices)

// STICKY CHOICE (+) - Can be selected multiple times
+ [Look around]
    You survey the room. There's a fireplace, some tables, and a mysterious stranger in the corner.
    -> tavern_choices

// ONCE-ONLY CHOICE (*) - Disappears after selection
* [Approach the bar]
    -> bar_conversation

* {not has_sword} [Check the notice board]
    There's a quest posted: "Retrieve the Ancient Sword from the Cave."
    ~ mood = mood + 1
    -> tavern_choices

* [Talk to the stranger]
    -> stranger_conversation

* {has_sword and has_key} [Leave the tavern]
    -> ending

// FALLBACK CHOICE - Triggers when no other choices available
* ->
    There's nothing else to do here.
    -> ending

// ----------------------------------------------------------------------------
// WEAVE - Branching and gathering without explicit knots
// ----------------------------------------------------------------------------
=== bar_conversation ===

"What'll it be?" the barkeep asks. # speaker:Barkeep

// GATHER POINT (-) - Collects all branches back together
- (drinks_menu)

* "A mug of ale, please."[]
    // INLINE LOGIC - Modify variables within the flow
    ~ gold = gold - 5
    ~ health = health + 10
    ~ mood = mood + 2
    The ale warms your spirits. # sound:drinking

* "Just water."[]
    ~ mood = mood - 1
    "Suit yourself," the barkeep shrugs.

* {gold >= 20} "Your finest wine!"[]
    ~ gold = gold - 20
    ~ health = health + 20
    ~ mood = mood + 5
    Exquisite! You feel invigorated.

// GATHER - All paths merge here
- "Anything else?" the barkeep asks.

// NESTED CHOICES - Multiple levels of choices
* "Tell me about the cave."[]
    "Dangerous place," he warns.
    * * "What's in there?"[]
        "An ancient sword, they say. Guarded by puzzles."
        // NESTED GATHER
        - - You thank him for the information.
    * * "How do I get there?"[]
        "North road, can't miss it."
        - - You nod in understanding.

* "Nothing, thanks."[]

- -> tavern.tavern_choices

// ----------------------------------------------------------------------------
// CONDITIONAL LOGIC AND FUNCTIONS
// ----------------------------------------------------------------------------
=== stranger_conversation ===

// CONDITIONAL BLOCKS - if/else logic
{
    - has_key:
        The stranger smiles. "I see you found what you needed."
        -> tavern.tavern_choices
    - has_sword:
        "Impressive blade," the stranger notes.
    - else:
        The stranger eyes you suspiciously.
}

"I might have something for you," they whisper.

* "I'm listening."[]
    -> stranger_deal
* "Not interested."[]
    -> tavern.tavern_choices

=== stranger_deal ===

// SWITCH STATEMENT - Multiple condition checks
{ gold:
    - 0: "You're broke. Come back when you have coin."
    - 1: "One gold? That's insulting."
    - else: "For {gold} gold, I'll give you this key."
}

* {gold >= 30} [Pay for the key]
    ~ gold = gold - 30
    ~ has_key = true
    You receive a rusty iron key. # item:key
    -> tavern.tavern_choices

* [Decline]
    -> tavern.tavern_choices

// ----------------------------------------------------------------------------
// TUNNELS - Reusable story segments that return to caller
// ----------------------------------------------------------------------------
=== cave ===

You venture into the dark cave.

// TUNNEL CALL - ->...-> runs content then returns
-> describe_environment ->

The sword glimmers on a pedestal ahead.

* [Take the sword]
    // TUNNEL WITH CHAIN - Multiple tunnels in sequence
    -> take_sword -> check_health ->
    -> cave_exit

* [Leave it alone]
    -> cave_exit

= cave_exit
You exit the cave.
~ has_sword = true
-> tavern.tavern_choices

// TUNNEL DEFINITION - Ends with ->-> to return
=== describe_environment ===
// SHUFFLE - Random selection each time
The cave is {~damp and cold|eerily silent|filled with strange echoes}.
// CYCLE - Loops through options
You hear {&dripping water|distant rumbling|your own heartbeat}.
->->

=== take_sword ===
You reach out and grasp the ancient blade.
~ has_sword = true
~ mood = mood + 10
->->

=== check_health ===
// CONDITIONAL RETURN - Different outcomes based on state
{ health < 50:
    You feel weak but determined.
- else:
    You feel strong and ready.
}
->->

// ----------------------------------------------------------------------------
// FUNCTIONS - Reusable logic that can return values
// ----------------------------------------------------------------------------

// FUNCTION - Cannot contain diverts or choices, can return values
=== function describe_mood() ===
{
    - mood >= 5: radiantly happy
    - mood > 0: content
    - mood == 0: neutral
    - mood > -5: slightly glum
    - else: deeply melancholic
}

// FUNCTION WITH PARAMETERS
=== function add_gold(amount) ===
~ gold = gold + amount
~ return gold

// FUNCTION WITH REF PARAMETER - Modifies the passed variable
=== function heal(ref hp, amount) ===
~ hp = hp + amount
{ hp > MAX_HEALTH:
    ~ hp = MAX_HEALTH
}

// FUNCTION RETURNING VALUE
=== function is_wealthy() ===
~ return gold >= 100

// RECURSIVE FUNCTION
=== function factorial(n) ===
{ n <= 1:
    ~ return 1
- else:
    ~ return n * factorial(n - 1)
}

// ----------------------------------------------------------------------------
// THREADS - Parallel content composition
// ----------------------------------------------------------------------------
=== ending ===

// THREAD - <- merges content from another knot
<- describe_final_state
<- credits

-> DONE

=== describe_final_state ===
// ONCE-ONLY ALTERNATIVE - Each item shown once, then nothing
{!Your adventure concludes.|The journey ends here.|}

You finish your adventure feeling {describe_mood()}.

// MULTI-LINE ALTERNATIVES
{ stopping:
    - The sun sets on your first day.
    - Another chapter closes.
    - The story continues...
}

-> DONE

=== credits ===
* [View your stats]
    // PRINT VARIABLES
    Final Stats:
    - Health: {health}/{MAX_HEALTH}
    - Gold: {gold}
    - Sword: {has_sword: Yes | No}
    - Key: {has_key: Yes | No}
    - Mood: {mood} ({describe_mood()})

    // MATHEMATICAL OPERATIONS
    ~ temp score = (health / 10) + gold + (has_sword * 50) + (has_key * 25)
    Your adventure score: {score}

    // RANDOM NUMBER
    ~ temp bonus = RANDOM(1, 20)
    Luck bonus: {bonus}

    -> final_choice

* [End now]
    -> final_choice

-> DONE

=== final_choice ===

// TURN COUNTING - Check how many turns since visiting a knot
{ TURNS_SINCE(-> introduction) > 5:
    You've come a long way since the beginning.
}

// VISIT COUNTING - Knot name alone returns visit count
{ tavern > 0:
    The tavern was a memorable stop.
}

Thank you for playing!

-> END

// ----------------------------------------------------------------------------
// ADVANCED: LABELED CHOICES AND GATHERS
// ----------------------------------------------------------------------------
=== demo_labels ===

// LABELED GATHER - Can be referenced later
- (start)
    What would you like to learn about?

// LABELED CHOICE - Can be tested for later
* (basics) [Basic syntax]
    Ink uses simple markup for complex stories.
* (advanced) [Advanced features]
    Tunnels, threads, and functions enable powerful patterns.
* {basics && advanced} [I've seen both]
    Great! You've learned the fundamentals.
    -> END

- (loop_back)
    // DIVERT TO LABELED GATHER
    { basics and advanced: -> END }
    -> start

// ----------------------------------------------------------------------------
// ADVANCED: KNOT/STITCH PARAMETERS
// ----------------------------------------------------------------------------
=== greet(person) ===
"Hello, {person}!" you say cheerfully.
-> DONE

=== give_item(item, ref inventory_count) ===
You receive the {item}.
~ inventory_count = inventory_count + 1
-> DONE

// DIVERT TARGET AS PARAMETER
=== do_then_return(-> afterwards) ===
Something happens...
-> afterwards

// ----------------------------------------------------------------------------
// ADVANCED: LIST OPERATIONS
// ----------------------------------------------------------------------------
=== demo_lists ===

// LIST VALUE ASSIGNMENT
~ front_door = locked

// LIST COMPARISON
{ front_door == locked:
    The door is locked.
}

// LIST PROGRESSION (next value)
~ current_time++
It is now {current_time}.

// Check against multiple values
{ current_time == evening or current_time == night:
    It's getting dark.
}

-> DONE

// ============================================================================
// END OF TUTORIAL
// ============================================================================
//
// KEY SYNTAX REFERENCE:
//
// Structure:
//   ===     Knot definition
//   =       Stitch definition
//   ->      Divert (jump)
//   ->->    Return from tunnel
//   <-      Thread (merge content)
//   -       Gather point
//
// Choices:
//   *       Once-only choice
//   +       Sticky (repeatable) choice
//   []      Suppress text in output
//
// Variables:
//   VAR     Global variable
//   CONST   Constant
//   LIST    State enumeration
//   temp    Temporary variable
//   ~       Logic line
//   ref     Pass by reference
//
// Text:
//   {var}       Print variable
//   {cond:a|b}  Conditional text
//   {|a|b|c}    Sequence
//   {&a|b|c}    Cycle
//   {!a|b|c}    Once-only
//   {~a|b|c}    Shuffle (random)
//   <>          Glue (no line break)
//   #           Tag
//   //          Comment
//
// Control:
//   -> END      End story
//   -> DONE     End thread/section
//   { }         Conditional block
//
// Functions:
//   CHOICE_COUNT()          Current choice count
//   TURNS_SINCE(-> knot)    Turns since visiting
//   RANDOM(min, max)        Random integer
//   SEED_RANDOM(seed)       Set random seed
//
// ============================================================================
