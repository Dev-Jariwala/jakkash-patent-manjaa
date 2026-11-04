Status: ready-for-agent

## Parent

[Bill series, bill year, and bill serial PRD](../PRD.md)

## What to build

A collection gains a bill year beside its name. The name stays a label such as `2025-2026`. The bill year is the token that will be printed, such as `2025` or `26`. It is not guessed from the name.

Create requires it. Edit requires it, and it cannot be cleared. A collection that already exists starts with no bill year, and the next save of that collection must fill one in. The token is trimmed. An empty year, a year that contains a hyphen, and a year longer than 20 characters are rejected. Two collections may share the same year. The collections list shows the year.

Copying products into a new collection copies products only. The new collection's bill year is the token entered for that collection, not the source collection's year.

A Bill does not use the year yet. Refusing a Bill when the year is missing is the later slice.

The glossary adds Bill year: the token stored on a collection and printed as the second part of a Bill raised while that token is current. A saved Bill keeps the year it was raised with. Avoid the collection name.

This is not a new test suite. One assertion on the existing product copy confirms it still copies products and does not take a bill year.

## Acceptance criteria

- [ ] Creating a collection requires a bill year, separate from the collection name
- [ ] `2025` and `26` are accepted, and the year is trimmed
- [ ] An empty year, a hyphen, and a year longer than 20 characters are rejected
- [ ] The year is not taken from a name such as `2025-2026`
- [ ] An existing collection starts with no bill year, and editing it cannot save until a year is entered
- [ ] A saved year can be changed and cannot be cleared
- [ ] Two collections may use the same bill year
- [ ] The collections list shows the bill year
- [ ] Copying products does not copy the bill year, and the product copy assertion still shows products copied and no bill year written
- [ ] The glossary records Bill year
- [ ] A Bill still has its three typed parts, and Orders are unchanged

## Blocked by

None - can start immediately
