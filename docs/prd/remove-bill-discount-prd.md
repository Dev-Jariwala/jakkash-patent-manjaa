Status: ready-for-agent

# Remove Bill discount PRD

## Problem Statement

A Bill asks for a discount percent. The operator knows the rupees they would give, and working out the percent is the wrong job on a GST document. The shop has decided a Bill does not carry a discount at all. The percent is still on the form, still stored on the Bill, and still printed as a Discount row. Orders are a different document and already have their own rupee discount.

## Solution

Take the discount off the Bill. A new Bill and an edited Bill have no Discount(%) box. Tax is charged on the full Price. Total value is the sum of the Price columns. Total bill is that value plus the tax, and a save whose Total bill is 0 is rejected. The printed summary has no Discount row. Bills already raised in local and sandbox are deleted, because none have been issued. An Order keeps its rupee discount, its advance, and its total due.

The discount stories in the Bill PRD are replaced by this document. The rest of that PRD stands: the bill number, the receiver copy, the line copy, the tax shapes, and the bank block.

## User Stories

1. As an operator, I want a new Bill to have no Discount(%) box, so that I cannot enter a percent.
2. As an operator, I want Edit to have no Discount(%) box, so that I cannot change a discount on a Bill I open.
3. As an operator, I want the footer to stay Total value, Total tax, and Total bill, so that the screen still names the three amounts.
4. As an operator, I want Price to stay quantity times rate, so that the price column is the amount before tax.
5. As an operator, I want the tax rupees to fill from the quantity, the rate, and the percents, so that I do not type tax amounts.
6. As an operator, I want the word Invoice to stay off the screen, so that the screen still says Bill.
7. As an operator, I want 200 of a product at rate 220, CGST 2.5, SGST 2.5, and IGST 0 to save price 44000, CGST 1100, SGST 1100, IGST 0, line total 46200, total value 44000, total tax 2200, and total bill 46200, so that the usual within-state bill is unchanged.
8. As an operator, I want a 40000 line at CGST 2.5 and SGST 2.5, plus a 4000 line at CGST 9 and SGST 9, to save total value 44000, total tax 2720, and total bill 46720, so that each line is taxed on its full Price.
9. As an operator, I want those Price columns to still show 40000 and 4000, so that Price stays quantity times rate.
10. As an operator, I want quantity 1, rate 10.20, CGST 2.5, and SGST 2.5 to save tax of 0.26 and 0.26 and a total bill of 10.72, so that each tax rupee is still rounded half up to the paise.
11. As an operator, I want an IGST-only line to be taxed on its full Price, so that the outside-state shape is unchanged apart from the discount.
12. As an operator, I want an exempt line to save zero tax on its full Price, so that a zero percent still charges nothing.
13. As an operator, I want Total value to be the sum of the Price columns, so that the taxable amount is the full price.
14. As an operator, I want Total tax to be the sum of the tax rupees, so that the footer adds the amounts already rounded on each line.
15. As an operator, I want Total bill to be Total value plus Total tax, so that the amount of the Bill is the price plus the tax.
16. As an operator, I want a line with rate 0 to save when another line makes the Total bill greater than 0, so that a free line does not block a real bill.
17. As an operator, I want a Bill whose kept lines add up to a Total bill of 0 to be rejected, so that a zero bill cannot be raised.
18. As an operator, I want that rejection to say the Total bill must be greater than 0, so that I know which rule failed.
19. As an operator, I want a Bill with no kept line to be rejected as a missing line, so that an empty bill is not reported as a zero total.
20. As an operator, I want an unfinished form to show a footer of 0, so that totals stay quiet until a line is complete.
21. As an operator, I want Save to stay disabled while that footer is 0, so that I cannot raise the unfinished bill.
22. As an operator, I want the old 100% discount path gone, so that a zero bill can no longer be saved by filling a percent.
23. As an operator, I want a save that still sends a discount to be rejected, so that a stale screen cannot look as if a discount was applied.
24. As an operator, I want an edit that still sends a discount to be rejected, so that the same rule holds when I change a Bill.
25. As an operator, I want a preview that still sends a discount to be rejected, so that the amounts on the form follow the same rule as the save.
26. As an operator, I want a discount of 0 to be rejected when it is sent, so that the absence of a discount is not stored as a percent.
27. As an operator, I want that rejection to name the discount, so that I know the Bill has no discount.
28. As an operator, I want a saved Bill to have no discount percent, so that a later read cannot show one.
29. As an operator, I want a saved line to have no reduced price, so that the line keeps Price, the tax rupees, and the line total.
30. As an operator, I want the printed summary to have no Discount row, so that the Bill I print does not show a cut.
31. As an operator, I want the printed Total Taxable Value to equal Total value, so that the print and the screen name the same taxable amount.
32. As an operator, I want the printed Final Amount to equal Total bill, so that the print and the screen name the same amount due on the Bill.
33. As an operator, I want the printed CGST, SGST, and IGST rows to stay, so that only the Discount row leaves.
34. As an operator, I want the Bills already raised in local and sandbox to be deleted, so that none of them still carry a percent.
35. As an operator, I want the lines of those Bills to be deleted with them, so that a line is not left without its Bill.
36. As an operator, I want Orders to be left in place, so that wiping Bills does not remove sales.
37. As an operator, I want an Order's discount, advance, and total due to calculate as they do today, so that the money on an Order does not change.
38. As an operator, I want raising a Bill to leave Orders alone, so that a Bill is still not an Order.
39. As an operator, I want the Bills list to have no discount column, so that the list does not grow a field the Bill no longer has.
40. As an operator, I want Edit to tax the rate I type, so that a changed rate is taxed on the new Price.
41. As an operator, I want the receiver copy, the bill number, the bank block, and the tax shapes to stay as they are, so that removing the discount does not reopen those rules.
42. As a developer, I want the glossary to drop Bill discount, so that a percent on a Bill is no longer a term.
43. As a developer, I want Total bill to mean the amount of a Bill after the tax, so that the glossary matches the footer.
44. As a developer, I want one decision that a Bill has no discount, so that a later reader does not put the percent back.
45. As a developer, I want that decision to record the rejected alternatives, so that keeping the percent, spreading a rupee amount across lines before tax, and copying the Order's cut off the total after tax are not reopened by accident.
46. As a developer, I want the earlier decision, that the percent comes off each line before tax, marked superseded, so that the two decisions are not both in force.
47. As a developer, I want one bill module to remain the only writer, so that the screen and the save do not each invent a formula.

## Implementation Decisions

- The bill module remains the only writer. It lists Bills for a collection, reads one Bill, previews totals, creates a Bill, and updates a Bill. It does not delete a Bill through an operator action. It does not write clients, products, tax codes, the shop bank account, stock, or Orders.
- A Bill no longer stores a discount percent. A Bill line no longer stores a reduced price. Price, the three tax percents, the three tax rupees, and the line total stay on the line. Total value, total tax, and total bill stay on the Bill.
- One migration deletes every Bill. Lines are removed with the Bill by the existing cascade. The migration then drops the discount percent and the reduced price. Order tables are not touched. The module is not live, so the delete is the way those scratch Bills leave. The migration wipes every Bill in any database that applies it.
- Price is quantity times rate, rounded half up to the paise. Each tax rupee is that Price times that percent, divided by 100, rounded half up to the paise. The line total is the Price plus the three tax rupees. Total value is the sum of the Prices. Total tax is the sum of the tax rupees. Total bill is total value plus total tax. The footer adds those already rounded amounts and does not round again.
- Create and update reject a Bill whose Total bill is 0. The message says the Total bill must be greater than 0. A rate of 0 remains allowed. A line at rate 0 saves when another kept line makes the Total bill greater than 0.
- A Bill with no kept line is still rejected as a missing line. That rejection is not replaced by the zero-total rule.
- Preview of an unfinished form, including a form with only blank lines, still returns a footer of 0 and does not throw. The screen keeps Save disabled while the preview Total bill is not greater than 0.
- Create, update, and preview reject a payload that includes a discount, including a discount of 0. The message names the discount. The screen does not send one.
- A later read returns the stored Price, tax, and totals. It does not return a discount percent or a reduced price.
- The form drops the Discount(%) box on create and on edit. The printed summary drops the Discount row. Total Taxable Value remains and equals Total value. Final Amount remains and equals Total bill.
- The glossary deletes Bill discount. Total bill is the amount of a Bill after the tax. Avoid total invoice, and avoid amount due.
- One new decision records that a Bill has no discount and that tax is charged on the full Price. It supersedes the decision that a percent comes off each line before tax. The rejected alternatives are keeping that percent, taking a rupee amount off the sum of Prices and spreading it across the lines before tax, and copying the Order so the cut comes off Total bill after tax.
- The discount stories and the discount glossary lines in the Bill PRD are replaced by this document. The Bill issue that restates those stories is updated the same way.

## Testing Decisions

- A good test asserts the outcome an operator would notice: a Bill was saved, a save was rejected, a preview matched the footer, or a read had no discount. It does not assert SQL text, private helpers, HTTP status lines, or React state.
- There is one seam: the bill module. Tests call list, read, create, update, and preview with an in-memory stand-in for Bills, clients, products, tax codes, and the shop bank account. They do not open a database, boot HTTP, or render the screen.
- The suite keeps the 200 at 220 bill and its total bill of 46200. It covers the two-line full-price totals of 44000, 2720, and 46720, the 10.20 rounding case and its total bill of 10.72, a rate of 0 beside a positive line, rejection of a Total bill of 0, rejection of a create, an update, and a preview that send a discount, a read that has no discount percent and no reduced price, and a preview of blank lines that still returns a footer of 0. An IGST-only line and an exempt line stay covered, now taxed on the full Price.
- No new frontend test suite. The existing invoice-figure tests are updated only so they stop expecting a Discount row. They are not a second seam, and they do not decide the tax. Order tests are unchanged.
- Prior art is the bill module suite and its in-memory stand-in.

## Out of Scope

- Any change to an Order's discount, advance, total due, or PDF.
- A rupee discount on a Bill, whether before tax or after tax.
- Recomputing a saved Bill onto the full Price instead of deleting it.
- An operator control that deletes a Bill. The wipe is the migration, not a screen action.
- The receiver copy, the bill number, the bank block, the tax shapes, stock, and WhatsApp.
- A second test seam for HTTP, for the Bills screen, or for the printed summary.

## Further Notes

- This PRD is published under the repo's `docs/prd/` convention. The repo has no issue-tracker setup under `docs/agents/`. `Status: ready-for-agent` is recorded on this document the same way the Bill PRD records that role.
- Local and sandbox are the only places Bills exist. Deleting them does not remove an issued document.
- The amounts an operator would have reached with 10% off a 40000 line and a 4000 line were total value 39600, total tax 2448, and total bill 42048. Those amounts are no longer the rule. The full-price totals in story 8 replace them.
