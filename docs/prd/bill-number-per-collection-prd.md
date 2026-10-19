Status: ready-for-agent

# Bill number once per collection PRD

## Problem Statement

An operator raises Bill 00-26-01 in the collection that is open, switches to another collection, and types 00-26-01 again. The save is rejected. The number is already used on a Bill in the first collection, and the shop treats that as one number for every collection. An Order does not work that way: the same order number can be raised in a different collection. Each collection should be able to keep its own Bill numbers.

## Solution

A Bill number may be used once in each collection. 00-26-01 saved in the default collection can be saved again in another collection. A second 00-26-01 in the same collection is still rejected, and the message stays "This bill number is already in use." Edit may save the Bill's own current number. Edit may also take a number that is used only in another collection. Edit may not take a number that another Bill in the same collection already has.

The number stays three parts typed by hand and stored as one hyphenated value. A Bill has no retail or wholesale type, so the same number cannot be saved twice in one collection by calling one of them a different type. Orders are unchanged. No Bills are deleted.

## User Stories

1. As an operator, I want to save 00-26-01 in the collection I have open, so that I can raise the Bill I typed.
2. As an operator, I want to switch collection and save 00-26-01 again, so that the other collection can use the same number.
3. As an operator, I want both of those Bills to keep the number 00-26-01, so that each collection shows the number I typed.
4. As an operator, I want a second 00-26-01 in the same collection to be rejected, so that one collection does not have two Bills with that number.
5. As an operator, I want that rejection to say "This bill number is already in use", so that the message I already know still means a clash in the collection I have open.
6. As an operator, I want the other collection's 00-26-01 to play no part in that rejection, so that I am not blocked by a Bill I cannot see on this list.
7. As an operator, I want Edit to save the Bill's own current number, so that leaving the number alone is not treated as a duplicate.
8. As an operator, I want Edit to change a Bill to a number that exists only in another collection, so that the number is free in this collection.
9. As an operator, I want Edit to reject a number that another Bill in this collection already has, so that a changed number still clashes only inside the collection.
10. As an operator, I want that edit rejection to say "This bill number is already in use", so that create and edit name the clash the same way.
11. As an operator, I want the three boxes to stay, so that I still type the number in parts.
12. As an operator, I want those parts stored as one hyphenated value, so that 00, 26, and 01 remain 00-26-01.
13. As an operator, I want spaces around a part to be ignored, so that an accidental space does not become part of the number.
14. As an operator, I want a missing part to be rejected, so that the number still has three parts.
15. As an operator, I want a hyphen inside a part to be rejected, so that the stored value has exactly two hyphens.
16. As an operator, I want a part longer than 20 characters to be rejected, so that the length rule stays as it is.
17. As an operator, I want 00-26-01 and 0-26-1 to be different numbers, so that the digits I type, including leading zeros, are the number.
18. As an operator, I want the Bills list for this collection to show this collection's 00-26-01, so that the other collection's Bill with the same number is not on this list.
19. As an operator, I want the printed Bill to show the number of the Bill I opened, so that the print follows that Bill and not the other collection's copy.
20. As an operator, I want a Bill to stay in the collection where it was raised, so that I cannot move it onto another collection's number.
21. As an operator, I want no Bills deleted by this change, so that a number I already saved is still there.
22. As an operator, I want an Order's number to stay as it is, so that the same order number in another collection, and the retail and wholesale split inside one collection, are untouched.
23. As an operator, I want raising a Bill to leave Orders alone, so that a Bill is still not an Order.
24. As a developer, I want the glossary to say a Bill number is unique within the collection it was raised in, so that "unique across the shop" is no longer the term.
25. As a developer, I want one decision that records this, so that a later reader does not put the shop-wide number back.
26. As a developer, I want that decision to supersede the shop-wide bill number decision, so that the two decisions are not both in force.
27. As a developer, I want the rejected alternative recorded as keeping the number unique across the shop, so that the reason for the change stays with the decision.
28. As a developer, I want one bill module to remain the only writer, so that the screen does not invent a second uniqueness rule.

## Implementation Decisions

- The bill module remains the only writer. It lists Bills for a collection, reads one Bill, creates a Bill, and updates a Bill. The duplicate rule is decided there. The screen shows the module's rejection and does not decide which collection a number belongs to.
- A Bill number stays three trimmed parts, each required, at most 20 characters, and free of hyphens, stored as one hyphenated value. Leading zeros stay in the stored value. 00-26-01 and 0-26-1 are different numbers.
- Uniqueness is the pair of the Bill's collection and that hyphenated value. The shop-wide unique constraint on the number alone is replaced by that pair. Existing Bills already have distinct numbers across the shop, so they already satisfy the pair. No Bills are deleted.
- Create rejects the number when another Bill in the same collection already has it. Update rejects it when another Bill in the same collection already has it. Update allows the Bill's own current number. Update allows a number that is used only on a Bill in a different collection. The message remains "This bill number is already in use."
- A Bill still cannot move to another collection. The collection used for the check is the collection the Bill was raised in.
- The list stays limited to the open collection. The print shows the number stored on the Bill that was opened.
- The glossary redefines Bill number as the three-part number typed for a Bill, stored as one hyphenated value, unique within the collection it was raised in. Avoid invoice number, order number, a generated sequence, and unique across the shop.
- One new decision records that the number is unique within the collection. It supersedes the decision that the number is unique across the shop. The rejected alternative is keeping that shop-wide uniqueness.
- Order numbers are not changed. An Order remains unique on collection, order number, and retail or wholesale type.

## Testing Decisions

- A good test asserts the outcome an operator would notice: 00-26-01 was saved in two collections, a second save in one collection was rejected, an edit kept its own number, or an edit took a number that exists only in another collection. It does not assert SQL text, private helpers, HTTP status lines, or React state.
- There is one seam: the bill module. Tests call create and update with an in-memory stand-in for Bills. They do not open a database, boot HTTP, or render the screen.
- The suite covers 00-26-01 saved in two collections, a second 00-26-01 in the same collection rejected with "This bill number is already in use", an edit that saves the Bill's own number, an edit that takes a number used only in another collection, and an edit that is rejected when another Bill in the same collection already has the number. The existing part rules stay covered: three parts, a missing part, a hyphen inside a part, and a part that is too long.
- No new frontend test suite. Order tests are unchanged.
- Prior art is the bill module suite and its in-memory stand-in, including the test that already rejects a duplicate number and the test that accepts a Bill's own number on edit.

## Out of Scope

- Changing how the three parts are typed, trimmed, or stored.
- Treating 00-26-01 and 0-26-1 as the same number.
- A retail or wholesale type on a Bill, or two Bills with the same number in one collection.
- Any change to an Order's number, including uniqueness by collection and type.
- Deleting Bills, or moving a Bill to another collection.
- A shop-wide Bills list, search, or print that would have to choose between two Bills with the same number.
- A second test seam for HTTP or for the Bills screen.

## Further Notes

- This PRD is published under the repo's `docs/prd/` convention. The repo has no issue-tracker setup under `docs/agents/`. `Status: ready-for-agent` is recorded on this document the same way the Bill PRD records that role.
- The number the operator could not reuse was 00-26-01. That value is the example in the stories. Any other well-formed number follows the same rule.
- The shop-wide rule being replaced is the one that rejected uniqueness per collection. This document is that rejected alternative, chosen so each collection can keep its own series.
