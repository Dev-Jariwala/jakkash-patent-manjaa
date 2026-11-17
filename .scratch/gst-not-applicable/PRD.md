Status: ready-for-agent

# GST not applicable PRD

## Problem Statement

Some clients want a Bill and have no GST number. A Bill only offers a client who already has a GST number, and a GST number that is filled in must be a 15-character GSTIN. Leaving GST blank keeps the client out of the Bill. Typing N/A is rejected. The operator cannot record "this client has no GST" as its own choice, so those clients never appear as a Receiver.

## Solution

On add or edit, the operator turns on **GST not applicable**. The GST number stays empty. The GST field shows N/A and cannot be typed in while the switch is on. Many clients can be marked. A client with a GSTIN, and a client who is GST not applicable, both appear as Receivers. A client whose GST was left blank stays out.

The Receiver dropdown still shows the client name. The GST box beside it shows N/A, and the bill preview prints N/A on the GST line. Tax, tax shape, and the TAX INVOICE layout stay as they are. This is the same Bill.

A Bill keeps the receiver GST it copied when that client was chosen. Marking a client later does not rewrite Bills already saved. N/A is copied only when that client is chosen on a new Bill, or when an existing Bill's receiver is changed to that client. Saving a Bill again for the same receiver keeps the old copy.

Turning the switch on clears any GSTIN. Turning it off and leaving GST empty returns the client to blank, so later Bills no longer offer that client. A cleared GSTIN comes back only if the operator types it again. A typed GSTIN and the switch cannot both be saved.

The clients list, the client CSV, and the client report show N/A for a marked client. A blank GST stays blank there. Orders are unchanged.

## User Stories

1. As an operator, I want a GST not applicable switch when I add a client, so that a client with no GSTIN can still be a Receiver.
2. As an operator, I want the same switch when I edit a client, so that I can mark a client who is already on file.
3. As an operator, I want the GST field to show N/A and stay disabled while the switch is on, so that I see the choice without typing N/A.
4. As an operator, I want a blank GST with the switch off to stay blank, so that an unset GST is not treated as a Receiver.
5. As an operator, I want a typed GSTIN to keep the 15-character GSTIN check, so that a real GST number is still validated.
6. As an operator, I want typing a GSTIN to turn the switch off, so that a GSTIN and GST not applicable cannot both be set.
7. As an operator, I want turning the switch on to clear a GSTIN already in the field, so that the client becomes GST not applicable.
8. As an operator, I want turning the switch on to clear a GSTIN that was already saved, so that an edit replaces the number with the mark.
9. As an operator, I want turning the switch off with an empty GST to return the client to blank, so that later Bills no longer offer that client.
10. As an operator, I want a cleared GSTIN to stay cleared until I type it again, so that the switch does not restore an old number.
11. As an operator, I want many clients marked GST not applicable, so that more than one client without a GSTIN can be billed.
12. As an operator, I want the letters N/A rejected when typed into the GST field, so that N/A is the mark and not a fake GSTIN.
13. As an operator, I want a save that sends both a GSTIN and the mark rejected, so that the two states cannot be stored together.
14. As an operator, I want a real GSTIN to stay unique, so that two clients still cannot share one GSTIN.
15. As an operator, I want the clients list to show N/A for a marked client, so that I can tell that client from one whose GST is blank.
16. As an operator, I want a blank GST to stay blank on the clients list, so that the two states look different.
17. As an operator, I want the client CSV to show N/A for a marked client, so that an export matches the list.
18. As an operator, I want a blank GST to stay blank in the client CSV.
19. As an operator, I want the client report to show N/A for a marked client, so that the printed profile matches the list.
20. As an operator, I want a blank GST to stay blank on the client report.
21. As an operator, I want a client search for N/A to find marked clients, so that search matches the text the list shows.
22. As an operator, I want a search for a real GSTIN to still find that client, so that GST search is unchanged for GSTINs.
23. As an operator, I want a marked client in the Bill receiver list, so that I can raise a Bill for them.
24. As an operator, I want a client with a GSTIN still in that list, so that existing Receivers stay available.
25. As an operator, I want a blank-GST client left out of that list, so that an unset GST still cannot be billed.
26. As an operator, I want the Receiver dropdown to keep showing the client name, so that N/A does not sit beside the name.
27. As an operator, I want the GST box beside the Receiver to show N/A for a marked client, so that I see it before I save.
28. As an operator, I want that GST box to show the GSTIN when the chosen client has one.
29. As an operator, I want the bill preview GST line to show N/A, so that the printed Bill matches the choice.
30. As an operator, I want the bill preview to show the GSTIN when the copied receiver GST is a GSTIN.
31. As an operator, I want tax, tax shape, and the TAX INVOICE layout unchanged, so that this stays the same Bill.
32. As an operator, I want a new Bill for a marked client to copy N/A as the receiver GST, so that the saved Bill shows N/A.
33. As an operator, I want a new Bill for a GSTIN client to copy that GSTIN, so that a real number is still stored on the Bill.
34. As an operator, I want marking a client later to leave Bills already saved untouched, so that history keeps the GST it copied.
35. As an operator, I want saving a Bill again for the same receiver to keep the copied GST, so that an edit of the lines does not refresh the receiver.
36. As an operator, I want changing the receiver on an existing Bill to copy the new client's GSTIN or N/A, so that a new choice takes a fresh copy.
37. As an operator, I want the server to refuse a blank-GST receiver, so that a bypassed form cannot bill an unset GST.
38. As an operator, I want the Bill form to refuse a blank-GST receiver before save, so that I see the refusal on the form.
39. As an operator, I want the Bill form to accept a marked client before save, so that the form and the server agree.
40. As an operator, I want Orders unchanged, so that this does not reopen the order flow.
41. As an operator, I want the glossary to name GST not applicable, so that White Bill and regular client are not the words we keep.
42. As an operator, I want the glossary to say a Receiver is a client with a GSTIN or GST not applicable, so that the Bill language matches who can be chosen.
43. As an operator, I want a decision record that N/A is not stored in the GST number, so that the next reader knows why the mark is separate.
44. As an operator, I want that record to say the unique GSTIN rule is why the letters N/A were rejected as a stored GST number, so that the alternative is not proposed again.

## Implementation Decisions

- A client profile's GST is one of three states: blank, a GSTIN, or GST not applicable. Blank means the GST number is empty and the mark is off. A GSTIN is a valid 15-character number and the mark is off. GST not applicable means the mark is on and the GST number is empty.
- The clients table gains `gst_not_applicable`, a boolean that is false for every existing row. A check refuses a row that has both a GST number and the mark. The unique GSTIN index is unchanged, so the letters N/A are never stored in the GST number. Many marked clients are allowed because their GST number stays empty.
- Create and update accept `gst_not_applicable`. When the mark is on, the stored GST number is null. A payload that sends both a GSTIN and the mark is rejected. The letters N/A remain an invalid GSTIN.
- Turning the switch on clears the GST field before save. Turning it off and leaving the field empty saves a blank GST. Typing a GSTIN turns the switch off before save. The switch label is **GST not applicable**. While it is on, the GST field is disabled and shows N/A as display text only.
- The clients list, the client CSV, and the client report show N/A when the mark is on, and show nothing when the GST number is blank. Client search includes marked clients when the search text matches N/A, and still matches a real GSTIN against the GST number.
- A Bill copies the receiver the same way it does today. A GSTIN is copied as the receiver GST. GST not applicable copies the words N/A. A blank GST is refused with the existing receiver error. The receiver GST column is already wide enough for N/A, so Bills need no schema change.
- Saving a Bill for the same receiver keeps the copied name, address, GST, contact person, and contact number. Changing the receiver copies the newly chosen client, including N/A when that client is GST not applicable.
- The Bill receiver list offers a client who has a GSTIN or who is GST not applicable. The dropdown label stays the client name. The GST box shows the GSTIN or N/A from the chosen client on a new choice, and shows the copied receiver GST when the saved receiver is unchanged.
- The bill preview prints the copied receiver GST, so a saved N/A appears on the GST line with no layout change. Tax, tax shape, and the TAX INVOICE title stay as they are.
- Orders do not read this mark.
- The glossary gains GST not applicable, and Client profile and Receiver are sharpened to the three GST states and to who can be a Receiver. A short decision record states that the words N/A live on the Bill copy, not in the GST number, because a filled GST number is unique.

## Testing Decisions

- A good test asserts what an operator would notice: the saved client is GST not applicable with an empty GST number, a second marked client is allowed, a GSTIN plus the mark is rejected, the letters N/A are still an invalid GSTIN, clearing the mark returns a blank GST, a marked client can be a Receiver and the copied GST is N/A, a blank GST is still refused, and editing a Bill without changing the receiver keeps the GST it already copied.
- Tests stay on the seams that already exist. They do not open a database, boot HTTP, or render a screen.
- Client save tests call create and update through the in-memory client world. They cover the three states, many marked clients, rejection of a GSTIN plus the mark, rejection of the letters N/A as a GSTIN, and turning the mark off so the GST number is empty again.
- Bill save tests call create and update through the in-memory bill world. They cover a marked client accepted with receiver GST N/A, a blank GST still refused, an edit that keeps the same receiver and therefore keeps the copied GST, and an edit that changes the receiver and therefore copies the new GSTIN or N/A.
- The Bill form check, in the existing form-validation suite, accepts a marked client and still rejects a blank GST.
- The clients list, CSV, client report, and bill preview are not rendered. They show the mark or the copied receiver GST. Client-list search is not given a new seam; the search rule is specified above and is not executed by these three suites.

## Out of Scope

- A different document from the current Bill, or a Bill that charges no CGST, SGST, or IGST.
- Changing tax, tax shape, or the TAX INVOICE layout.
- Rewriting the receiver GST on Bills already saved.
- Restoring a cleared GSTIN when the switch is turned off.
- Storing the letters N/A in the GST number.
- Showing N/A beside the client name in the Receiver dropdown.
- Any change to Orders.
- A database suite, an HTTP suite, a PDF render test, or a screen test for the list, CSV, report, or preview.

## Further Notes

- This PRD is published in the local issue tracker. `Status: ready-for-agent` is the triage label.
- The words the shop used were White Bill and regular client. Those are not glossary terms. The document is a Bill, and the client state is GST not applicable.
- ADR-0017 already says a Bill stores a copy of the receiver GST taken when the client is chosen, and that a later client edit must not rewrite that copy. This feature keeps that rule and only widens who can be copied: a GSTIN, or the words N/A when the client is GST not applicable.
