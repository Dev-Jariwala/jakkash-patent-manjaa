# Client Profile PRD

## Problem Statement

A client exists only because a bill was created. The clients screen can list, search, and export that thin record, but an operator cannot add a client or fill in a stable buyer profile. The only stored details are name, mobile number, and address, and the next bill replaces the name and address. There is nowhere to keep a pincode, state, city, GST number, contact person, or contact number without putting those details at risk of being wiped by billing. Wholesale follow-up and GST lookup have no home, and a client who has never been billed cannot be entered at all.

## Solution

Keep bill creation as the way a client is first inserted, and keep the next bill able to replace that client's name and address. Add an Add Client and Edit Client flow on the clients screen for the client profile: pincode, state, city, GST number, contact person, and contact number. Country is always India and is not shown. Add rejects a mobile number that already belongs to a client. Edit is the only way to fill or change the profile, including for a client that a bill created. A later bill may still replace name and address, and must leave the profile untouched. The profile is shown on the clients list, client search, the CSV export, and the client report. The bill form and the bill PDF stay limited to name, mobile number, and address.

## User Stories

1. As an operator, I want to add a client from the clients screen, so that I can record a buyer before the first bill.
2. As an operator, I want Add Client to ask for name, mobile number, and address, so that a manually added client is as complete as one created by a bill.
3. As an operator, I want Add Client to require a state and a city, so that every manually added client has a location from the shared tables.
4. As an operator, I want state and city to be chosen from the shared location tables, so that operators cannot invent a spelling that the rest of the system does not know.
5. As an operator, I want the state list limited to India, so that I never pick a state for a country this shop does not bill.
6. As an operator, I want country kept off the form, so that I am not asked to confirm India on every client.
7. As an operator, I want the city list limited to the selected state, so that I cannot save a city that sits in a different state.
8. As an operator, I want changing the state to clear a city that does not belong to the new state, so that the pair stays valid.
9. As an operator, I want only active states and cities in the dropdowns, so that retired locations are not offered for new clients.
10. As an operator, I want pincode, GST number, contact person, and contact number to be optional, so that I can save a client who is not GST-registered or whose contact I do not know yet.
11. As an operator, I want a pincode, when I type one, to be exactly six digits, so that a bad pin is caught before it is stored.
12. As an operator, I want a GST number, when I type one, to be a 15-character GSTIN, so that a mistyped registration number is rejected.
13. As an operator, I want the GST number stored in uppercase with spaces removed, so that the same number cannot be saved twice under different casing or spacing.
14. As an operator, I want a GST number to belong to only one client, so that two client rows cannot claim the same registration.
15. As an operator, I want several clients to have no GST number, so that unregistered buyers are not blocked by the uniqueness rule.
16. As an operator, I want a contact number, when I type one, to be 10 digits, so that it matches the mobile numbers already used for billing.
17. As an operator, I want the contact number to be allowed to match the billing mobile or to be a different number, so that I can record whoever should be called.
18. As an operator, I want two clients to be allowed to share a contact number, so that one person can be the contact for more than one client.
19. As an operator, I want the contact person stored as free text, so that I can record a name without a special format.
20. As an operator, I want Add Client to reject a mobile number that already exists, so that I do not silently overwrite a client a bill already created.
21. As an operator, I want that rejection to tell me the mobile already exists, so that I know to open Edit instead of trying Add again.
22. As an operator, I want to edit a client from the clients list, so that I can fill the profile on a client that a bill created with only name, mobile, and address.
23. As an operator, I want Edit to show the current name, address, and profile, so that I change the right client.
24. As an operator, I want the mobile number to stay fixed on Edit, so that I cannot split a client away from the bills that already use that number.
25. As an operator, I want a wrong mobile number to be handled by adding a new client, so that old bills remain on the number they were created with.
26. As an operator, I want Edit to require state and city before it saves, so that a finished profile always has a location even when the client started from a bill.
27. As an operator, I want to save Edit while pincode, GST number, contact person, and contact number are blank, so that choosing Gujarat and Surat is enough to complete a bill-created client.
28. As an operator, I want saving a client's own GST number again to succeed, so that an unrelated edit is not rejected as a duplicate of itself.
29. As an operator, I want a second client to be rejected when I reuse a GST number already stored on another client, so that I leave GST blank on the extra mobile instead of linking two clients to one registration.
30. As an operator, I want the edit form to say that name and address can change the next time a bill is created for this mobile, so that I do not expect the edited address to be frozen.
31. As an operator, I want a bill for a new mobile to keep creating the client with name, mobile, and address only, so that billing does not start demanding a GST number at the counter.
32. As an operator, I want that bill-created client to have an empty profile, so that missing pincode, state, city, GST number, and contacts are visibly unset rather than filled with placeholders.
33. As an operator, I want a later bill for an existing mobile to update only the client's name and address, so that the printed name stays in step with the last bill.
34. As an operator, I want that later bill to leave pincode, state, city, GST number, contact person, and contact number as I saved them, so that billing cannot wipe the profile.
35. As an operator, I want a later bill to leave the profile empty when I have not edited the client yet, so that billing does not invent a state or a GST number.
36. As an operator, I want editing a bill to update that bill only, so that a correction on an old bill does not change the client record.
37. As an operator, I want the bill form to keep filling name and address from the client when both are already stored, so that the counter flow I have today does not change.
38. As an operator, I want the bill form and the bill PDF to ignore the profile, so that a GST number or city edited later cannot rewrite an old bill.
39. As an operator, I want the clients list to show city, GST number, contact person, and contact number beside name, mobile, and address, so that I can look a buyer up without opening Edit.
40. As an operator, I want blank profile cells on the list for a client created by a bill, so that I can see who still needs Edit.
41. As an operator, I want client search to match pincode, GST number, contact person, contact number, and city name as well as name, mobile, and address, so that I can find a client by the detail I have.
42. As an operator, I want the CSV export to include name, mobile, address, pincode, state, city, GST number, contact person, and contact number, so that I can hand the buyer record to an accountant.
43. As an operator, I want the client report to print the profile under the client header, so that a printed statement shows the GST number and who to call.
44. As an operator, I want state and city shown by name on the list, CSV, and report, so that I do not have to interpret internal ids.
45. As an operator, I want Edit to still show a state or city name if that location is later marked inactive, so that an existing client does not look like it has no location.
46. As an operator, I want a clear failure when the city does not belong to the state, so that a stale form cannot save a broken pair.
47. As an operator, I want a clear failure when state or city is missing on Add or Edit, so that I know why the save did not stick.
48. As an operator, I want a clear failure for a bad pincode, GST number, or contact number, so that I can correct the field instead of guessing.
49. As an operator, I do not want a delete or a merge action, so that this change does not give me a way to destroy a client or combine two mobiles.
50. As an operator, I want the only state and city choices to be the ones already in the shared tables, so that this change does not pretend locations exist that nobody has loaded.
51. As a developer, I want the client profile vocabulary recorded in the glossary, so that later work does not call these fields a customer account or an invoice address.
52. As a developer, I want one recorded decision that bills update name and address only, so that a later reader does not "fix" bill create by copying the profile onto the client or wiping it.

## Implementation Decisions

- A client remains one row identified by mobile number. Name and address stay the last details used on a bill. The client profile is pincode, state, city, GST number, contact person, and contact number, and it is maintained only from the clients screen.
- The glossary gains those profile terms. One ADR records the trade-off: bill create keeps updating name and address, Add rejects an existing mobile instead of merging, and bill create never writes the profile. The rejected alternative was a silent merge on Add.
- The profile columns are nullable. A bill must still be able to insert a client that has no profile. State and city are required only when the operator saves Add or Edit, not when a bill inserts the row.
- The client stores a state id and a city id from the shared location tables. It does not store a country. The form resolves India by its country code and lists that country's states. No country control is rendered.
- This change does not seed more states or cities and does not add a location admin. Until a later load, the only choices are the rows already present: Gujarat and Surat.
- Dropdowns offer active locations only. If a client already points at a location that is later inactive, Edit and the read models still show that location's name.
- The city must belong to the selected state. Changing state clears a city that is not in the new state.
- Optional fields are validated only when present. Pincode is six digits. GST number is a 15-character GSTIN, normalized to uppercase with spaces removed before the uniqueness check. Contact number is 10 digits. Contact person is unbounded free text within a normal name length. Blank optional fields are stored as empty, never as an empty string, so many clients can have no GST number.
- GST number is unique among clients that have one. Updating a client and submitting that client's current GST number is allowed. The same GST number on a second client is rejected. Contact number is not unique and may equal the billing mobile.
- A GST number is not checked against the selected state's GST state code.
- Add creates a client only when the mobile is new. An existing mobile is a conflict, not an update. Edit updates name, address, and the profile for that mobile and refuses to change the mobile. There is no delete and no merge.
- Bill create is the other writer. For a new mobile it inserts name, mobile, and address and leaves the profile empty. For an existing mobile it replaces only name and address, using the existing value when the bill omits one, and it does not write profile columns. Editing a bill does not write the client at all.
- Both writers go through one client-maintenance module. Bill create must not keep a private update that can null the profile. The module is the single place that decides create, reject, edit, and "apply this bill's name and address."
- Reads that feed the list, the by-mobile lookup, the full export, and the client report return state and city names, not only ids. Search matches name, mobile, address, pincode, GST number, contact person, contact number, and city name.
- The clients list adds city, GST number, contact person, and contact number to name, mobile, and address. The CSV includes name, mobile, address, pincode, state, city, GST number, contact person, and contact number. The client report header prints that same profile. The bill form still autofills name and address only when both exist, and the bill PDF is unchanged.
- The edit form tells the operator that name and address can change the next time a bill is created for this mobile.
- Add and Edit share one form. Mobile is editable on Add and read-only on Edit. The new-client and edit screens are reached from the clients list.

## Testing Decisions

- A good test asserts the outcome an operator would notice: a client was created, a save was rejected, name and address changed, or the profile stayed as it was. It does not assert SQL text, private helpers, or React state.
- There is one seam: the client-maintenance module. Tests call that module with an in-memory stand-in for storage, the same way the WhatsApp delivery tests stand in for the bill row. They do not open a database and they do not boot HTTP.
- The suite covers Add of a new mobile, rejection of a duplicate mobile, Edit that cannot change mobile, required state and city, a city that does not belong to the state, optional blanks, pincode and GST and contact-number formats, GST normalization, a repeated save of the client's own GST number, rejection of a GST number owned by someone else, many clients with no GST number, bill create inserting a client with an empty profile, and a later bill replacing name and address while leaving the profile untouched.
- Bill create is tested through this module, not through a second copy of the update rules.
- No new frontend test suite. The existing frontend tests are component tests for WhatsApp bill actions and are the wrong seam for these rules. There is no HTTP or live-database harness to extend.
- Prior art is the server node:test layout used for WhatsApp delivery eligibility and the in-memory bill stand-in used for delivery outcomes.

## Out of Scope

- Loading the rest of India's states and cities, or any screen for adding locations.
- Showing or storing country on the client.
- Copying the profile onto the bill, autofilling it on the bill form, or printing it on the bill PDF.
- Changing a client's mobile number, rewriting historical bills onto a new mobile, merging two clients, or deleting a client.
- Rejecting a GSTIN because its state code disagrees with the selected state.
- Making contact number unique.
- A badge or workflow for "profile incomplete" beyond blank cells on the list.
- Any change to WhatsApp bill delivery.

## Further Notes

- The clients screen is read-only today. Bill create is the only writer, and it writes name, mobile, and address. Bill update does not touch the client. Bills store the mobile as text, which is why renaming a mobile would orphan old bills.
- The shared location tables currently contain India, Gujarat, and Surat. Every client saved from Add or Edit will be Surat, Gujarat, until more locations are loaded separately.
- This PRD is the agreed client language from the grilling session. The glossary and the ADR are part of the work, not a precondition already on disk.
- It is published as a repo PRD rather than a tracker issue. The repo has no issue-tracker setup, and the request was to follow the existing `docs/prd/` convention instead of opening a GitHub issue or applying `ready-for-agent`.
