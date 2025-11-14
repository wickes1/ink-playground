// Variables Demo - Stats & Tracking

VAR health = 100
VAR gold = 50
VAR sword = false

You are a brave adventurer.

Health: {health} | Gold: {gold} | Has Sword: {sword}

* [Buy a sword (30 gold)]
    {gold >= 30:
        You purchase a sturdy sword!
        ~ sword = true
        ~ gold = gold - 30
        -> checkpoint
    - else:
        You don't have enough gold!
        -> checkpoint
    }
* [Rest at the inn (10 gold)]
    {gold >= 10:
        You rest at the inn and recover.
        ~ health = 100
        ~ gold = gold - 10
        -> checkpoint
    - else:
        You can't afford the inn!
        -> checkpoint
    }
* [Search for treasure]
    You find a treasure chest!
    ~ gold = gold + 20
    -> checkpoint

=== checkpoint ===
Health: {health} | Gold: {gold} | Has Sword: {sword}

{sword:
    With your sword, you feel confident!
- else:
    You could use better equipment...
}

* [Continue adventure]
    -> battle

=== battle ===
You encounter a fierce monster!

{sword:
    * [Fight with sword]
        You defeat the monster with your sword!
        ~ gold = gold + 100
        -> victory
- else:
    * [Fight with bare hands]
        You fight bravely but get injured.
        ~ health = health - 30
        {health > 0:
            You barely survive!
            -> victory
        - else:
            You have been defeated...
            -> defeat
        }
}

* [Run away]
    You flee to safety.
    -> victory

=== victory ===
You survived the encounter!
Final Stats - Health: {health} | Gold: {gold}
-> END

=== defeat ===
Game Over - You were defeated!
-> END
