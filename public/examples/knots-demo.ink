// Knots & Stitches Demo - Story Structure

-> start

=== start ===
Welcome to the Castle of Mysteries!

You are standing in the grand entrance hall.

* [Go to the library]
    -> library
* [Visit the throne room]
    -> throne_room
* [Explore the dungeon]
    -> dungeon

=== library ===
You enter a vast library filled with ancient books.

= shelves
The shelves stretch up to the ceiling.

* [Read a book]
    You open an old tome and learn ancient secrets.
    -> shelves
* [Search for hidden doors]
    You discover a secret passage!
    -> secret_passage
* [Leave the library]
    -> start

= secret_passage
Behind the bookshelf, you find a hidden corridor.

* [Follow the passage]
    It leads to a treasure room!
    -> treasure
* [Go back]
    -> library

= treasure
You found the legendary treasure!
-> final

=== throne_room ===
The throne room is magnificent with golden decorations.

* [Sit on the throne]
    You feel the weight of power as you sit.
    But nothing happens.
    -> throne_room
* [Examine the tapestries]
    The tapestries tell stories of ancient kings.
    -> throne_room
* [Return to entrance]
    -> start

=== dungeon ===
The dungeon is dark and damp.

* [Search the cells]
    You find an old key!
    -> dungeon
* [Go deeper]
    The darkness is too threatening.
    You return to safety.
    -> start
* [Return to entrance]
    -> start

=== final ===
Your exploration of the castle is complete!

THE END

-> END
