Status: ready-for-agent

# Masters and Tax Codes PRD

## Problem Statement

Country, state, and city already exist as shared location rows, and a client profile stores a state and a city. An operator cannot open those lists. The only place they appear is inside the client form, and that form offers active rows only. There is also nowhere to keep an HSN or SAC code. A future Bill will need a stable tax code, a description, and default CGST, SGST, and IGST rates. Today an operator cannot add that catalog, and the sale itself must stay an Order.

## Solution

Add a Masters screen with four tabs: Countries, States, Cities, and HSN/SAC. The three location tabs show the shared rows, including inactive ones, and do not add, edit, delete, or sync them. The HSN/SAC tab is the tax code catalog. An operator can add a tax code and can edit its code, description, and default rates. Each tax code is either HSN (goods) or SAC (services), the code is unique within that type, and a save is accepted only when CGST equals SGST and IGST equals their sum. The type cannot be changed later, and a tax code cannot be deleted. The sale stays an Order. The Bill is not built in this work. A future Bill line will store the tax code id and a copy of the code, description, and the rates actually charged, so a later catalog edit does not rewrite that Bill.

## User Stories

1. As an operator, I want a Masters item in the sidebar, so that location lists and tax codes have one home.
2. As an operator, I want Masters placed before Settings, so that reference data sits with the other day-to-day screens.
3. As an operator, I want Masters to open on four tabs, so that countries, states, cities, and tax codes are separate lists.
4. As an operator, I want the tabs in the order Countries, States, Cities, then HSN/SAC, so that the location lists come before the catalog I maintain.
5. As an operator, I want the Countries tab to list every country, so that I can see the shared location list without opening a client.
6. As an operator, I want each country row to show name, ISO2, ISO3, and whether it is active, so that I can tell India apart from a retired country later.
7. As an operator, I want to see India on the Countries tab, so that the row already used by client state lists is visible.
8. As an operator, I want the States tab to list every state, so that a state hidden from the client form is still visible here.
9. As an operator, I want each state row to show the state name, the country name, and whether it is active, so that I can see that Gujarat belongs to India.
10. As an operator, I want to see Gujarat on the States tab, so that the state already offered on the client form is visible.
11. As an operator, I want the Cities tab to list every city, so that a city hidden from the client form is still visible here.
12. As an operator, I want each city row to show the city name, the state name, and whether it is active, so that I can see that Surat belongs to Gujarat.
13. As an operator, I want to see Surat on the Cities tab, so that the city already offered on the client form is visible.
14. As an operator, I want an inactive country, state, or city to remain on its Masters tab, so that a later sync which retires a location does not make it disappear from this screen.
15. As an operator, I want no Add control on Countries, States, or Cities, so that I do not invent a location the shared list does not contain.
16. As an operator, I want no Edit control on Countries, States, or Cities, so that I do not rename or retire a location from this screen.
17. As an operator, I want no Delete control on Countries, States, or Cities, so that I cannot remove India, Gujarat, or Surat.
18. As an operator, I want no Sync control on the location tabs, so that loading the rest of the location list stays a later piece of work.
19. As an operator, I want the client form to keep offering only active states and cities, so that Masters showing an inactive row does not put that row back on a new client.
20. As an operator, I want the client form to keep resolving India without a country control, so that Masters does not change how a client profile is saved.
21. As an operator, I want an HSN/SAC tab, so that tax codes live beside the location lists.
22. As an operator, I want the HSN/SAC tab to list every tax code, so that I can see the catalog a future Bill will use.
23. As an operator, I want each tax code row to show type, code, description, CGST, SGST, and IGST, so that the default rates are visible without opening the row.
24. As an operator, I want to add a tax code, so that I can record an HSN or SAC before the Bill module exists.
25. As an operator, I want to choose HSN or SAC when I add a tax code, so that goods and services stay distinct.
26. As an operator, I want HSN to mean goods and SAC to mean services, so that a fabric code and a labour code are not the same kind of row.
27. As an operator, I want to enter the statutory code, a description, and the three default rates, so that the row is complete enough for a future Bill line to copy.
28. As an operator, I want a saved tax code to keep a stable id, so that a future Bill can point at that row.
29. As an operator, I want an HSN of 4, 6, or 8 digits to save, so that the heading lengths used on GST documents are accepted.
30. As an operator, I want an HSN of any other length to be rejected, so that a partial or padded code is not stored.
31. As an operator, I want a SAC of 6 digits to save, so that a service code has the length GST uses.
32. As an operator, I want a SAC of any other length to be rejected, so that a service code cannot be stored as if it were an HSN.
33. As an operator, I want letters, spaces, and punctuation in a code to be rejected, so that the code stays the statutory number.
34. As an operator, I want a blank description to be rejected, so that two codes are not distinguished by an empty name.
35. As an operator, I want a second HSN with the same code to be rejected, so that one goods code has one authoritative row.
36. As an operator, I want a second SAC with the same code to be rejected, so that one service code has one authoritative row.
37. As an operator, I want the same digits to be allowed once as HSN and once as SAC, so that a goods code and a service code are not blocked by each other.
38. As an operator, I want that duplicate rejection to say the code already exists for that type, so that I know which rule failed.
39. As an operator, I want CGST, SGST, and IGST stored as the default rates, so that a future Bill can copy the three numbers.
40. As an operator, I want a save rejected when CGST and SGST differ, so that the two halves cannot drift apart.
41. As an operator, I want a save rejected when IGST is not CGST plus SGST, so that the out-of-state rate matches the two halves.
42. As an operator, I want that rate rejection to say the three rates do not match, so that I can correct the numbers.
43. As an operator, I want a zero rate to save when all three rates are zero, so that an exempt code is allowed.
44. As an operator, I want a negative rate to be rejected, so that a tax code cannot store a credit as a rate.
45. As an operator, I want more than two decimal places in a rate to be rejected, so that a rate stays a percent with paise-level precision.
46. As an operator, I want a missing rate to be rejected, so that a tax code always has all three defaults.
47. As an operator, I want to edit a tax code, so that a mistyped code, description, or rate can be corrected.
48. As an operator, I want Edit to show the current type, code, description, and rates, so that I change the row I opened.
49. As an operator, I want to change the code on Edit when the new code is still free for that type, so that a typo such as 5209 can become 5208.
50. As an operator, I want Edit to reject a code already used by another row of the same type, so that a correction cannot collide with an existing tax code.
51. As an operator, I want saving a tax code's own code again to succeed, so that an unrelated edit is not treated as a duplicate of itself.
52. As an operator, I want to change the description on Edit, so that the words on the row can be corrected.
53. As an operator, I want to change the three rates on Edit when they still match, so that a default rate can be updated before any Bill exists.
54. As an operator, I want the type to stay HSN or SAC after create, so that a goods code cannot be turned into a service code on the same id.
55. As an operator, I want an attempt to change the type to be rejected, so that the stable id keeps the type it was created with.
56. As an operator, I want no Delete control on a tax code, so that the id a future Bill will store cannot be destroyed.
57. As an operator, I want the HSN/SAC table to show the edited code, description, and rates, so that I can see the catalog I just saved.
58. As an operator, I want Orders to stay Orders, so that this catalog does not rename the sale.
59. As an operator, I want products to stay without a tax code, so that choosing an HSN waits for the Bill.
60. As an operator, I want no Bill screen in this work, so that I am not asked to raise a GST document yet.
61. As a developer, I want the glossary to record Bill as the future GST document, so that Bill is not used again as a name for an Order.
62. As a developer, I want the glossary to record a Bill line as a future line that stores the tax code id and a copy of the code, description, and rates charged, so that a later Bill does not read live catalog rates.
63. As a developer, I want the glossary to record Tax code, Country, State, and City, so that Masters uses those words.
64. As a developer, I want one recorded decision for the three default rates and the future copy onto the Bill line, so that a later reader does not replace them with a single GST rate or a live lookup.

## Implementation Decisions

- The sidebar gains one item, Masters, immediately before Settings. It opens one screen with four tabs, in order: Countries, States, Cities, HSN/SAC.
- Countries, States, and Cities are tables only. They have no add, edit, delete, or sync.
- Those tables list every shared location row, including inactive ones. A state row shows the country name. A city row shows the state name. A country row shows name, ISO2, ISO3, and whether it is active.
- The client form keeps its current location behavior. It still resolves India without a country field, and its state and city choices stay limited to active rows. Masters does not replace those reads.
- HSN/SAC is a tax code catalog. A row has its own id, a type of HSN or SAC, a code, a required description, and default CGST, SGST, and IGST. The table shows type, code, description, and the three rates.
- The type is chosen on create and is immutable. Edit may change the code, the description, and the three rates. There is no delete and no inactive flag on a tax code.
- The code is digits only. An HSN is 4, 6, or 8 digits. A SAC is 6 digits. The code is unique among rows of the same type. The same digits may exist once as HSN and once as SAC. Uniqueness is checked again on edit, ignoring the row being saved.
- Rates are exact numbers, zero or greater, with at most two decimal places. A save is rejected unless CGST equals SGST and IGST equals their sum. The rejection tells the operator which rule failed: the code, the type change, the description, or the rates.
- One tax-code maintenance module is the only writer. List, create, and update go through it. Create returns the new id. Update of an unknown id is a not-found failure. The module is the single place that decides the type, the code shape, uniqueness, and the rate rule.
- The tax code is stored in its own table: id, type, code, description, and the three rates. The unique pair is type plus code.
- The glossary gains Bill, Bill line, Tax code, Country, State, and City. An Order stays the sale. Bill is only the future GST document, and this work does not create one.
- A Bill line, when that module is built later, stores the tax code id and a copy of the code, the description, and the CGST, SGST, and IGST rates actually charged. It does not read those fields back from the catalog at display time. That copy is not implemented now. It is recorded so the catalog can still be edited safely.
- One ADR records the trade-off. The three rates are stored, and a save enforces the equality rule. The rejected alternatives were a single GST rate, filling the three numbers from one input, and accepting any three percents. The same ADR records that a future Bill line copies the code, description, and charged rates instead of joining the live catalog.
- Orders, products, purchases, stocks, clients, and WhatsApp delivery are unchanged.

## Testing Decisions

- A good test asserts the outcome an operator would notice: a tax code was created, a save was rejected, or an edit changed the code, description, or rates. It does not assert SQL text, private helpers, HTTP status lines, or React state.
- There is one seam: the tax-code maintenance module. Tests call that module with an in-memory stand-in for storage, the same way the client-maintenance tests stand in for the client row. They do not open a database and they do not boot HTTP.
- The suite covers a valid HSN create, a valid SAC create, HSN lengths 4, 6, and 8, rejection of any other HSN length, a 6-digit SAC, rejection of any other SAC length, rejection of a non-digit code, rejection of a blank description, rejection of a duplicate code of the same type, acceptance of the same digits as both HSN and SAC, rejection of unequal CGST and SGST, rejection of an IGST that is not their sum, acceptance of a zero rate, rejection of a negative rate, rejection of more than two decimal places, an edit that changes code, description, and rates, a repeated save of the row's own code, rejection of an edit onto another row's code of the same type, and rejection of a type change.
- List is covered through the same module: after a create, the list includes that tax code's type, code, description, and rates.
- No new frontend test suite. The existing frontend tests are component tests for WhatsApp order actions and are the wrong seam for these rules. There is no HTTP or live-database harness to extend. The Masters location tabs are display of existing rows and are not a second seam.
- Prior art is the server node:test layout used for client maintenance and the in-memory stand-in used there.

## Out of Scope

- Building the Bill, a Bill line, or any screen that raises a GST document.
- Copying a tax code onto a Bill line, overriding rates on a line, or choosing CGST plus SGST versus IGST from the client's state.
- Deleting a tax code, marking a tax code inactive, or changing its type.
- Putting a tax code on a product, an order line, or a purchase.
- Adding, editing, deleting, or syncing countries, states, or cities.
- Loading the rest of India's states and cities.
- Showing a country control on the client form, or changing which locations that form offers.
- Changing an Order, including its name, totals, or WhatsApp delivery.
- A second test seam for HTTP or for the Masters screen.

## Further Notes

- The shared location tables currently contain India, Gujarat, and Surat, all active. Masters will show those three until a later load adds more.
- Client profiles store a state id and a city id. They do not store a country. That stays true.
- The word Bill in this PRD is the future GST document. It is not the sale. The sale remains an Order.
- GSM is not a term in this work. The future document is a Bill.
- The glossary and the ADR are part of the work, not a precondition already on disk.
- This PRD is published under the repo's `docs/prd/` convention. The repo has no issue-tracker setup under `docs/agents/`. `Status: ready-for-agent` is recorded on this document the same way sliced issues in this repo record that role.
