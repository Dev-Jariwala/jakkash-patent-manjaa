Status: ready-for-agent

# Shop bank account PRD

## Problem Statement

The shop has one bank account that a future Bill must print: bank name, bank address, account number, and IFSC. There is nowhere to enter it. Masters is a catalog of many rows, and Settings holds the WhatsApp toggle, so neither is the home for this single account. The document the shop prints today is an Order PDF, and that PDF must not gain a bank block. When the Bill exists later, a Bill raised with one account must keep those four values even if the shop account is edited afterwards, and a Bill must not be raised at all until an account has been saved.

## Solution

Add a sidebar item titled Bank details, after Masters and before Settings. It opens one form for the shop bank account: bank name, bank address, account number, and IFSC. There is one account, not a list. The first save creates it. Every later save updates that same account. All four fields are required. The account number is 9 to 18 digits. The IFSC is the standard 11-character code, stored in uppercase. There is no delete. This work does not build the Bill. It records that a future Bill copies the four fields once into a Bill bank block, prints that copy only on the Bill PDF, and refuses to be raised until a shop bank account exists. The Order PDF stays as it is.

## User Stories

1. As an operator, I want a Bank details item in the sidebar, so that the shop bank account has its own home.
2. As an operator, I want Bank details placed after Masters and before Settings, so that the account sits with the other reference screens and the WhatsApp toggle stays last.
3. As an operator, I want the sidebar title to read Bank details, so that the item says what I am opening.
4. As an operator, I want Bank details to open one form, so that I am not shown a list of accounts.
5. As an operator, I want the page heading to read Bank details, so that the screen matches the sidebar item.
6. As an operator, I want fields for bank name, bank address, account number, and IFSC, so that the account has the four values a future Bill will copy.
7. As an operator, I want the code field labeled IFSC, so that the form uses the standard name for that code.
8. As an operator, I want no account-holder field, so that the shop name already printed on documents is not entered again.
9. As an operator, I want no separate branch name, account type, or UPI id, so that the form stays the four fields.
10. As an operator, I want the form to open empty before any account has been saved, so that I can enter the account for the first time.
11. As an operator, I want that empty form to be a normal screen, so that a missing account is not shown as a failure to load.
12. As an operator, I want a save rejected when the bank name is blank, so that the account always has a bank name.
13. As an operator, I want a save rejected when the bank address is blank, so that the account always has an address.
14. As an operator, I want a save rejected when the account number is blank, so that the account always has a number.
15. As an operator, I want a save rejected when the IFSC is blank, so that the account always has an IFSC.
16. As an operator, I want a blank-field rejection to name the field, so that I know which box to fill.
17. As an operator, I want spaces around a value to be ignored, so that an accidental space does not become part of the account.
18. As an operator, I want a bank name that is only spaces to be rejected, so that a blank name cannot hide behind whitespace.
19. As an operator, I want a bank address that is only spaces to be rejected, so that a blank address cannot hide behind whitespace.
20. As an operator, I want a bank name longer than 120 characters to be rejected, so that the name stays a single readable line.
21. As an operator, I want a bank address longer than 255 characters to be rejected, so that the address stays within the length the account stores.
22. As an operator, I want the account number to contain digits only, so that a letter or a space is not stored as part of the number.
23. As an operator, I want an account number of 9 to 18 digits to save, so that the lengths used by Indian banks are accepted.
24. As an operator, I want an account number shorter than 9 digits to be rejected, so that a partial number is not stored.
25. As an operator, I want an account number longer than 18 digits to be rejected, so that a padded number is not stored.
26. As an operator, I want that account-number rejection to say the number must be 9 to 18 digits, so that I know which rule failed.
27. As an operator, I want a leading zero in the account number to be kept, so that the number I typed is the number that is stored.
28. As an operator, I want a valid IFSC such as HDFC0000123 to save, so that a real code is accepted.
29. As an operator, I want a lowercase IFSC to be saved in uppercase, so that hdfc0000123 and HDFC0000123 are the same code.
30. As an operator, I want an IFSC that is not four letters, then 0, then six letters or digits to be rejected, so that a mistyped code is not stored.
31. As an operator, I want an IFSC whose fifth character is not 0 to be rejected, so that the standard shape is enforced.
32. As an operator, I want an IFSC of the wrong length to be rejected, so that a short or long code is not stored.
33. As an operator, I want a space inside an IFSC to be rejected, so that the stored code is the 11 characters without gaps.
34. As an operator, I want that IFSC rejection to say the code must be the standard 11-character IFSC, so that I know which rule failed.
35. As an operator, I want the first successful save to create the shop bank account, so that the shop has an account to copy onto a future Bill.
36. As an operator, I want the form to show the saved bank name, bank address, account number, and IFSC after that save, so that I can see what was stored.
37. As an operator, I want a later save to update that same account, so that a new bank replaces the current one.
38. As an operator, I want a later save to still leave exactly one account, so that the shop never has two current accounts.
39. As an operator, I want to change the bank name on a later save, so that a renamed bank can be corrected.
40. As an operator, I want to change the bank address on a later save, so that a moved branch can be corrected.
41. As an operator, I want to change the account number on a later save, so that a new number replaces the old one.
42. As an operator, I want to change the IFSC on a later save, so that a new code replaces the old one.
43. As an operator, I want a later save that clears a field to be rejected, so that the account cannot be emptied one field at a time.
44. As an operator, I want no Add control, so that I cannot start a second account.
45. As an operator, I want no Delete control, so that I cannot remove the only account.
46. As an operator, I want no table of accounts, so that the screen does not look like a catalog.
47. As an operator, I want a reload of Bank details to show the latest saved account, so that I am editing the current values.
48. As an operator, I want Masters to stay the catalog of countries, states, cities, and tax codes, so that the bank account is not another Masters tab.
49. As an operator, I want Settings to stay the WhatsApp toggle, so that the bank account is not mixed into that screen.
50. As an operator, I want the Order PDF to stay without a bank block, so that the document WhatsApp sends does not change.
51. As an operator, I want Orders to stay Orders, so that this account does not rename the sale.
52. As a developer, I want the glossary to record Shop bank account as the shop's one current account of those four fields, so that Bank details is the screen name and not a second concept.
53. As a developer, I want the glossary to record Bill bank block as the copy of those four fields stored on a Bill when it is raised and printed only on that Bill's PDF, so that a later edit does not rewrite it.
54. As a developer, I want one recorded decision that a Bill stores the four strings and not a bank id, so that a later reader does not join the live account.
55. As a developer, I want that decision to record that a Bill cannot be raised until a shop bank account has been saved, so that a later Bill does not go out with an empty bank block.
56. As a developer, I want that decision to record that the Order PDF is unchanged, so that the WhatsApp document is not treated as the Bill PDF.
57. As an operator, I want a future Bill to copy the account that is current when the Bill is raised, so that the PDF shows the bank the shop was using then.
58. As an operator, I want a future Bill PDF to keep the original bank name, bank address, account number, and IFSC after I change the shop bank account, so that an old Bill still shows the old account.
59. As an operator, I want editing that Bill later to leave its bank block unchanged, so that saving a line edit does not pick up the new account.
60. As an operator, I want the bank block hidden on the future Bill screen and shown only on the Bill PDF, so that I do not edit those four fields on the Bill.
61. As an operator, I want a future Bill refused when no shop bank account has been saved, so that I cannot raise a Bill with nowhere for the customer to pay.
62. As an operator, I want no Bill screen in this work, so that I am not asked to raise a GST document yet.

## Implementation Decisions

- The sidebar gains one item, titled Bank details, immediately after Masters and immediately before Settings. It opens one screen.
- The screen is one form. The heading is Bank details. The fields are bank name, bank address, account number, and IFSC. The code field is labeled IFSC. There is no table, no Add, and no Delete.
- One shop-bank-account module is the only writer. It can read the account and save the account. A read before any save returns no account, which the form shows as empty fields. The first save inserts the only row. Every later save updates that same row. There is no delete.
- The account is stored in its own table, limited to one row. The columns are bank name, bank address, account number, IFSC, and the time of the last save. Nothing is seeded.
- A save trims every field. Bank name and bank address are required. Bank name is at most 120 characters. Bank address is at most 255 characters. The account number is digits only, 9 to 18 digits, and is stored as text so a leading zero remains. The IFSC is uppercased and must be four letters, then 0, then six letters or digits. A space inside the IFSC is rejected.
- A rejected save tells the operator which rule failed: a named blank field, the account-number length, or the IFSC shape.
- The read and the save are exposed to the screen through a thin HTTP boundary. That boundary is not a second place where the rules are decided.
- The glossary gains Shop bank account and Bill bank block. An Order stays the sale. Bill stays the future GST document.
- A Bill bank block, when that module is built later, stores a copy of the bank name, bank address, account number, and IFSC taken at the moment the Bill is raised. It does not store a bank id. It does not read the shop bank account again when the Bill is shown or when the Bill PDF is opened. Editing the shop bank account later does not change it. Editing the Bill later does not refresh it. The Bill screen does not show it. The Bill PDF does. A Bill cannot be raised when no shop bank account has been saved. That copy, that refusal, and that PDF are not implemented now.
- One ADR records the trade-off. The Bill stores the four strings. The rejected alternatives were a foreign key to the shop bank account, reading the live account when the PDF is opened, allowing a Bill with no bank block, and printing the account on the Order PDF. The sidebar, rather than a Masters tab or the Settings screen, is context for where the operator edits the account. The placement itself is easy to move later.

## Testing Decisions

- A good test asserts the outcome an operator would notice: the account was saved, a save was rejected, or a second save replaced the same account. It does not assert SQL text, private helpers, HTTP status lines, or React state.
- There is one seam: the shop-bank-account module. Tests call that module with an in-memory stand-in for storage, the same way the tax-code maintenance tests stand in for the tax code row. They do not open a database and they do not boot HTTP.
- The suite covers an empty read, a valid save, an IFSC stored in uppercase, an account number whose leading zero is kept, a second save that updates the same account and leaves only one, rejection of each blank field, rejection of an account number that is too short, too long, or not all digits, and rejection of an IFSC that is the wrong length or whose fifth character is not 0.
- No new frontend test suite. The existing frontend tests are component tests for WhatsApp order actions and are the wrong seam for these rules. There is no HTTP or live-database harness to extend.
- Prior art is the server node:test layout used for tax-code maintenance and the in-memory stand-in used there.

## Out of Scope

- Building the Bill, a Bill line, the Bill PDF, or any screen that raises a GST document.
- Copying the four fields onto a Bill, or refusing a Bill when the account is missing. Those rules are recorded here and implemented with the Bill.
- Changing the Order PDF, or showing the bank account on an Order.
- A second account, a delete, or a bank id on an Order or a Bill.
- An account holder, a separate branch name, an account type, or a UPI id.
- Changing Masters, Settings, Orders, products, purchases, stocks, clients, or WhatsApp delivery.

## Further Notes

- The sidebar title is Bank details. The glossary term for the record is Shop bank account. The glossary term for the future copy is Bill bank block.
- The word Bill in this PRD is the future GST document. It is not the sale. The sale remains an Order. The PDF the shop already prints, including the one WhatsApp sends, is the Order PDF.
- The glossary and the ADR are part of the work, not a precondition already on disk.
- This PRD is published under the repo's `docs/prd/` convention. The repo has no issue-tracker setup under `docs/agents/`. `Status: ready-for-agent` is recorded on this document the same way the Masters and tax codes PRD records that role.
