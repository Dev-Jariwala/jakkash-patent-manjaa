Status: ready-for-agent

# Bill series, bill year, and bill serial PRD

## Problem Statement

An operator raises a Bill by typing all three parts of the bill number. The first part is a series such as `ST`, `ADI`, `DL`, or `00`. The second part is a year such as `2025`. The third part is the next serial, `01`, then `02`. Nothing stops a mistyped series, a year that does not belong to the open collection, or a serial that skips or repeats. The collection name is a range such as `2025-2026`, so the year that should be printed is not the collection name.

## Solution

A new Bill takes its number from three places. The operator picks a bill series from Masters. The bill year is the year stored for the open collection, shown and not editable. The bill serial is the next number for that series and that year inside that collection, shown and not editable. The stored bill number is still one hyphenated value, unique inside the collection. `ST-2026-01` in another collection is still allowed. `ADI-2026-01` and `ST-2025-01` are separate counts.

Once the Bill is saved, the number does not change. Changing the collection's bill year does not rewrite Bills already saved. The next Bill uses the new year and that series starts again at `01`.

Export's first box becomes the bill series list, including a series that is inactive. The year and the From and To serials stay typed. A series that was only ever typed on an old Bill, and was never added on Masters, is not in that list until it is added.

Orders are unchanged.

## User Stories

1. As an operator, I want a Bill series tab on Masters, so that the names I may print are kept with the other lists a Bill chooses from.
2. As an operator, I want Settings to stay the WhatsApp switch, so that a numbering list is not mixed into that switch.
3. As an operator, I want to add a bill series by typing the name that should be printed, so that `ST`, `ADI`, `DL`, or `00` is the whole row.
4. As an operator, I want no second shop-code field, so that `00` and `ST` are two names I choose between, not a code plus a label.
5. As an operator, I want a name trimmed, so that a space around `ST` is still the series `ST`.
6. As an operator, I want an empty name rejected, so that a Bill cannot be given a blank series.
7. As an operator, I want a name that contains a hyphen rejected, so that the stored bill number still has exactly two hyphens.
8. As an operator, I want a name longer than 20 characters rejected, so that a series stays within a bill number part.
9. As an operator, I want a second `ST` rejected, so that one name is one series.
10. As an operator, I want `st` kept as a different series from `ST`, so that the printed text, including case, is the series.
11. As an operator, I want the name fixed after I save it, so that renaming `ST` cannot leave old Bills on one spelling and new Bills on another.
12. As an operator, I want no delete of a bill series, so that a name already printed is not removed from the list.
13. As an operator, I want to mark a bill series inactive, so that new Bills no longer offer it.
14. As an operator, I want an inactive series to stay on the Masters list, so that I can see it and make it active again.
15. As an operator, I want to make that series active again, so that new Bills offer it again and the count continues.
16. As an operator, I want a bill year on the collection, separate from the collection name, so that `2025-2026` can print `2025`.
17. As an operator, I want the bill year required when I create a collection, so that a new collection has a year before anyone raises a Bill.
18. As an operator, I want the bill year required when I edit a collection, so that I cannot clear it.
19. As an operator, I want an existing collection to start with no bill year, so that old collections are not given a year I did not type.
20. As an operator, I want the first save of that collection to make me enter a bill year, so that the name can stay `2025-2026` while the printed year is filled in.
21. As an operator, I want a bill year of `2025` or `26` accepted, so that I print the year I typed rather than four digits only.
22. As an operator, I want a bill year trimmed, so that a space around `2025` is still `2025`.
23. As an operator, I want an empty bill year rejected, so that the second part of a bill number is never blank.
24. As an operator, I want a bill year that contains a hyphen rejected, so that `2025-26` is not stored as the year.
25. As an operator, I want a bill year longer than 20 characters rejected, so that the year stays within a bill number part.
26. As an operator, I want the year not guessed from the collection name, so that `2025-2026` does not become `2025` on its own.
27. As an operator, I want two collections to be allowed the same bill year, so that each collection still keeps its own count.
28. As an operator, I want the collections list to show the bill year, so that I can see which year the open collection will print.
29. As an operator, I want copying products into a new collection to leave the bill year for me to type, so that last year's `2025` is not copied onto `2026-2027`.
30. As an operator, I want to change a collection's bill year from `2025` to `2026` after Bills exist, so that a new year can start without a new collection.
31. As an operator, I want Bills already saved as `ST-2025-01` to stay `ST-2025-01` after that change, so that a printed number is not rewritten.
32. As an operator, I want the next `ST` Bill in that collection to be `ST-2026-01`, so that the new year is a new count.
33. As an operator, I want a new Bill's first box to be the bill series list, so that I pick `ST` instead of typing it.
34. As an operator, I want that list to offer only series that are active, so that a series I made inactive cannot be chosen.
35. As an operator, I want the year box filled from the collection and disabled, so that I cannot type a different year on one Bill.
36. As an operator, I want the serial box filled with the next serial and disabled, so that I cannot type `01` when `02` is next.
37. As an operator, I want the first `ST` Bill in a collection whose year is `2025` to be saved as `ST-2025-01`, so that the count starts at 1, written with two digits.
38. As an operator, I want the next `ST` Bill for that same year to be `ST-2025-02`, so that one series counts upward.
39. As an operator, I want the first `ADI` Bill for `2025` to be `ADI-2025-01`, so that another series has its own count.
40. As an operator, I want `ST-2025-01` and `ST-2025-03`, with no `ST-2025-02`, to make the next `ST` Bill `ST-2025-04`, so that a missing number stays missing.
41. As an operator, I want `09` followed by `10`, and `99` followed by `100`, so that the serial is at least two digits and does not stop at `99`.
42. As an operator, I want a stored `ST-2025-8` and `ST-2025-08` to count as 8, so that the next serial is `09`.
43. As an operator, I want a stored third part that is not digits, such as `ST-2025-A`, left out of the count, so that only a whole number moves the serial.
44. As an operator, I want the number that is saved to be one that this collection does not already have, so that a non-digit Bill does not make the new number clash.
45. As an operator, I want `00` added on Masters, when this collection already has `00-2025-01` and `00-2025-03`, to make the next `00` Bill for `2025` be `00-2025-04`, so that old handwritten numbers still count.
46. As an operator, I want a second save that was shown `04` to become `05` when another Bill took `04` first, so that the saved number is the one assigned at save.
47. As an operator, I want a collection with no bill year to refuse a new Bill, so that I set the year before a number is invented.
48. As an operator, I want that refusal to tell me to set a bill year on this collection, so that I know where to type it.
49. As an operator, I want a new Bill refused when no bill series is active, so that I add one on Masters first.
50. As an operator, I want that refusal to tell me to add a bill series on Masters, so that the empty list has a next step.
51. As an operator, I want an inactive series refused if it is submitted anyway, so that the screen is not the only check.
52. As an operator, I want an unknown series refused, so that a made-up name is not printed.
53. As an operator, I want a year or a serial sent with the new Bill ignored, so that the collection and the count decide those two parts.
54. As an operator, I want `ST-2026-01` saved in this collection and again in another collection, so that each collection keeps its own count.
55. As an operator, I want a second `ST-2025-01` in the same collection still impossible, so that one collection does not show the same number twice.
56. As an operator, I want Edit to show `ST-2025-01` as three disabled parts, so that I can read the number and not change it.
57. As an operator, I want Edit to keep that number when I save the rest of the Bill, so that a correction of the receiver or a line does not move the number.
58. As an operator, I want a different series, year, or serial sent on Edit ignored, so that a wrong series cannot be repaired by editing the Bill.
59. As an operator, I want Edit of a `2025` Bill to keep `2025` after the collection's bill year is `2026`, so that the saved year stays the year it was raised with.
60. As an operator, I want the Bills list to show the stored number, so that `ST-2025-01` still reads `ST-2025-01`.
61. As an operator, I want the printed Bill to show the stored number, so that the print matches the list.
62. As an operator, I want Bills already saved to keep the numbers they have, so that this change does not renumber them.
63. As an operator, I want Export's first box to list every bill series on Masters, including one that is inactive, so that I can still gather Bills raised before I made the series inactive.
64. As an operator, I want `00` absent from that list until I add `00` on Masters, so that a handwritten prefix is not invented on Export.
65. As an operator, I want to add `00`, make it inactive, and still pick it on Export, so that old `00` Bills can be gathered without offering `00` on a new Bill.
66. As an operator, I want Export's year, From, and To to stay typed, so that I can export `2025` after the collection's bill year is `2026`.
67. As an operator, I want a bill-number Export of `ST` and `2025` from `1` to `10` to keep today's span, so that `08` and `8` are the same number and a gap is skipped.
68. As an operator, I want `st-2025-1` left out of an `ST` `2025` span, so that the series on Export still matches the stored text, including case.
69. As an operator, I want a bill-date Export unchanged, so that a date span still ignores the series.
70. As an operator, I want Export to stay inside the open collection, so that the other collection's `ST-2026-01` is not in this PDF.
71. As an operator, I want an Order's number left as it is, so that this change is only the Bill number.
72. As a developer, I want the glossary to call the first part a bill series, the second a bill year, and the third a bill serial, so that shop code and a typed sequence are not the terms.
73. As a developer, I want the glossary to keep a bill number unique within the collection it was raised in, so that the same number in another collection stays allowed.
74. As a developer, I want the glossary to stop saying the bill number is typed and to stop avoiding a generated serial, so that the year and the serial are no longer typed.
75. As a developer, I want one decision for this numbering, so that a later reader does not put the three typed boxes back.
76. As a developer, I want that decision to replace only the hand-typed number and the edit that may change it, so that uniqueness within the collection stays in force.
77. As a developer, I want the rejected shop-wide count recorded, so that `ST-2026-01` in two collections is not "fixed" into one shop-wide series.
78. As a developer, I want the rejected locked year recorded, so that a year change that starts again at `01` is not "fixed" by freezing the year after the first Bill.
79. As a developer, I want the rejected editable number recorded, so that Edit is not given the series back.

## Implementation Decisions

- This replaces the hand-typed bill number and the rule that Edit may change it. It contradicts those two sentences of the decision that a bill number is unique within the collection. Uniqueness within the collection stays. The same hyphenated value may exist on a Bill in another collection. A second copy in the same collection is still rejected with "This bill number is already in use." No Bill is deleted, and no saved number is rewritten.
- One new decision records the bill series, the bill year, and the bill serial. The rejected alternatives worth keeping are a shop-wide count for one series and year, freezing the bill year after the first Bill, and letting Edit change the series.
- The glossary redefines Bill number as the three-part number of a Bill, stored as one hyphenated value, unique within the collection it was raised in. The series is chosen, the year is the collection's bill year at the time the Bill was raised, and the serial is generated. Once saved, it does not change. Avoid invoice number, order number, and typing the year or the serial.
- The glossary adds Bill series: the name printed on a Bill, fixed once saved, active or inactive, and a new Bill offers it only while it is active. Avoid shop code, and a label besides the name.
- The glossary adds Bill year: the year a collection stores, printed as the second part of a Bill raised while that year is current. A saved Bill keeps the year it was raised with. Avoid the collection name.
- The glossary adds Bill serial: the generated third part, counted inside one collection for one bill series and one bill year. Avoid a shop-wide sequence, and a typed number.
- A bill series module creates a name, lists names, and marks a name inactive or active. The name is trimmed, required, free of hyphens, and at most 20 characters. Uniqueness is the trimmed text, including case, so `ST` and `st` are different. Create rejects a duplicate. There is no rename and no delete. List returns both active and inactive, and says which is which.
- A collection gains a bill year beside its name. Existing collections have none. Create and update require text with the same trim, hyphen, and length rules as a series name. Update may replace `2025` with `2026`. Update may not clear the year. The collections list includes the year. Copying products into a new collection copies products only. The new collection's bill year is the year entered for that collection.
- The bill module remains the only writer of a Bill. Create takes the collection and the chosen bill series. It does not take a year or a serial from the caller. It reads the collection's current bill year and the series. A missing bill year is rejected with "Set a bill year on this collection before raising a bill." No active series, or a series that is unknown or inactive, is rejected with "Add a bill series on Masters before raising a bill." for an empty active list, and "This bill series is inactive." when the submitted series is inactive or unknown. An active series is accepted.
- The serial is one past the highest all-digit third part already stored in that collection on a Bill whose first part equals the series name and whose second part equals the year being used, compared as integers. A third part that is not digits does not count. When none count, the next integer is 1. The stored serial is that integer with at least two digits: `01` through `09`, then `10`, then `100`. The assigned value is the first formatted candidate that this collection does not already have. Two saves at once cannot keep the same number; the second save receives the next free serial. The stored value remains one hyphenated string. Leading zeros that were already stored stay on those old Bills. `ST-2025-8` and `ST-2025-08` are still different stored numbers, and both count as 8.
- The form shows the next serial before save. The number on the saved Bill is the one assigned at save, which may be higher than the one shown.
- Update does not change the bill number. A series, a year, or a serial on the update is ignored. The three parts shown on Edit are the stored parts, and they are disabled.
- A read for the new-Bill form returns the collection's bill year and the next serial for an active series. It uses the same refusal as create when the year is missing or the series is inactive or unknown.
- Export's bill-number read is unchanged: two series parts and a From and To on the third part, matched as stored text, with the third part compared as an integer. The Export screen's first box lists every bill series the series module returns, active or inactive. The year, From, and To stay typed. A name that is not on Masters cannot be chosen there. Date export is unchanged.
- The Bills list, the printed Bill, and opening one Bill keep showing the stored number. Orders are not changed.

## Testing Decisions

- A good test asserts what an operator would notice: the saved number, a refusal, a number that did not change, a series that was listed or rejected, or which Bills an Export returned. It does not assert SQL text, private helpers, HTTP status lines, or React state.
- There are two seams. Neither opens a database, boots HTTP, or renders a screen.
- The bill module is the seam for the number. Tests call create, update, the next-serial read, and Export through the in-memory stand-in already used for Bills. The suite covers `ST-2025-01` then `ST-2025-02`, `ADI-2025-01` beside them, a gap at `02` so the next is `04`, `8` and `08` so the next is `09`, `99` then `100`, a non-digit third part left out of the count, the same `ST-2026-01` in a second collection, a second copy in one collection still refused, a missing bill year refused with "Set a bill year on this collection before raising a bill.", an inactive or unknown series refused, a year and a serial on create ignored, Edit keeping `ST-2025-01` after the collection year is `2026`, and the next Bill then `ST-2026-01`. It covers Export of `ST` and `2025` from `1` to `10` still returning the stored Bills in integer order, including a series that is inactive, and leaving out another collection. Prior art is the bill module suite and the Export suite.
- The bill series module is the seam for Masters. Tests call create, list, and the active/inactive update through an in-memory stand-in of the same kind as tax-code maintenance. The suite covers adding `ST` and `00`, trimming, rejecting an empty name, a hyphen, a name longer than 20 characters, and a duplicate `ST`, keeping `st` beside `ST`, listing an inactive series as inactive, making it active again, and refusing a name change and a delete. Prior art is tax-code maintenance.
- The collection's bill year is not a third suite. A missing year and the year that gets printed are asserted on the bill module. Product copy stays the existing product copy: it copies products and does not write a bill year. One assertion on that copy confirms it still copies products and does not take a bill year. That assertion is not a new seam.
- No screen suite. The Masters tab, the collection form, the Bill form, and the Export dropdown call these modules. Order tests are unchanged.

## Out of Scope

- Any change to an Order's number.
- Deleting a Bill, or changing a saved bill number, including repairing a wrong series on Edit.
- Renumbering Bills already saved.
- Guessing a bill year from the collection name.
- A shop-wide serial, so that two collections cannot both have `ST-2026-01`.
- Freezing the bill year after the first Bill.
- Putting the bill series list on Settings.
- A label or shop code besides the printed name.
- Offering a handwritten prefix on Export before that name exists on Masters.
- A date span combined with a series span.
- Stock, tax, the receiver copy, the bank block, and WhatsApp.
- A test seam for HTTP, for a screen, or for the printed PDF.

## Further Notes

- This PRD is published in the local issue tracker. `Status: ready-for-agent` is the triage label.
- The examples use `ST`, `ADI`, `00`, `2025`, and `2026`. Any other name that passes the trim, hyphen, and length rules follows the same count.
- Uniqueness of the stored number inside one collection remains the earlier decision. This document replaces only the typing of the three parts and the permission to change them on Edit.
