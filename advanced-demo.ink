// Advanced Features Demo
// Includes: conditionals, variables, random, functions, and more

VAR player_name = "Adventurer"
VAR strength = 5
VAR intelligence = 5
VAR luck = 5
VAR has_key = false
VAR monster_defeated = false

-> character_creation

=== character_creation ===
Welcome, {player_name}!

Choose your character class:

* [Warrior]
    You are a mighty warrior!
    ~ strength = 8
    ~ intelligence = 3
    ~ luck = 4
    -> game_start
* [Mage]
    You are a wise mage!
    ~ strength = 3
    ~ intelligence = 8
    ~ luck = 4
    -> game_start
* [Rogue]
    You are a cunning rogue!
    ~ strength = 4
    ~ intelligence = 5
    ~ luck = 8
    -> game_start

=== game_start ===
Your stats: Strength {strength} | Intelligence {intelligence} | Luck {luck}

You enter a mysterious dungeon.

-> main_hall

=== main_hall ===
You stand in a large hall with three doors.

{has_key:
    You have a golden key in your possession.
}

{monster_defeated:
    The monster you defeated lies motionless on the floor.
}

* {not has_key} [Search the hall]
    -> search_hall
* [Try the left door]
    -> left_room
* [Try the middle door]
    -> middle_room
* [Try the right door]
    -> right_room

=== search_hall ===
You search carefully...

{luck >= 6:
    Your luck pays off! You find a golden key!
    ~ has_key = true
- else:
    You find nothing of value.
}
-> main_hall

=== left_room ===
{strength >= 6:
    You force open the heavy door.
    Inside is a fierce monster!
    -> fight_monster
- else:
    The door is too heavy for you to open.
    -> main_hall
}

=== fight_monster ===
{monster_defeated:
    The room is empty now.
    -> main_hall
}

A terrifying creature blocks your path!

* {strength >= 7} [Fight with brute force]
    You overpower the monster with raw strength!
    ~ monster_defeated = true
    -> main_hall
* {intelligence >= 7} [Outsmart the monster]
    You trick the monster into a trap!
    ~ monster_defeated = true
    -> main_hall
* [Run away]
    You flee back to the hall.
    -> main_hall

=== middle_room ===
{intelligence >= 6:
    You solve the puzzle lock and enter.
    Inside is a library with ancient knowledge.

    {not monster_defeated:
        You learn a spell to defeat monsters!
        -> main_hall
    - else:
        The knowledge here is vast but no longer needed.
        -> main_hall
    }
- else:
    The door has a complex puzzle you can't solve.
    -> main_hall
}

=== right_room ===
{has_key:
    You use the golden key to unlock the door.
    -> treasure_room
- else:
    The door is locked. You need a key.
    -> main_hall
}

=== treasure_room ===
You found the legendary treasure chamber!

Your adventure is complete!

Final Stats:
- Strength: {strength}
- Intelligence: {intelligence}
- Luck: {luck}
- Monster Defeated: {monster_defeated}

THE END
