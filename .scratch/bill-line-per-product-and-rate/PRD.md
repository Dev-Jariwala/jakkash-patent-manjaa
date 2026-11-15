Status: ready-for-agent

# Bill line per Product and rate PRD

## Problem Statement

A Bill refuses a second line of the same Product. The message is "Each product may appear once on a Bill." A shop needs the opposite for a real sale: Product A at 220 rupees for 100, and Product A again at 270 rupees for 20, on the same Bill. Each line is its own rate and its own quantity. Stock in hand is still one quantity for that Product, so those two lines need 120 together.

## Solution

A Bill line is one Product at one rate. The same Product may appear on another line when the rate is different. The same Product at the same rate is one line, including when the GST percents differ, and including 220 and 220.00. The extra quantity belongs on the line that already has that rate.

Stock in hand stays the quantity the shop holds. Every line of that Product still shows that number. On save, the Bill is refused when the sum of that Product's quantities is more than stock can cover. The message names the Product, the quantity it can cover, and the quantity the lines request, and it appears on every line of that Product. Editing a saved Bill adds back the quantity that Bill already holds for the Product before comparing. Creating a Bill takes the sum. Editing takes the difference between the new sum and the old sum.

Choosing the Product still fills that line with the wholesale price and that Product's current tax-code copy. The operator changes the rate when this line is a different price. The printed Bill lists each line. Orders stay one line per Product.

## User Stories

1. As an operator, I want Product A at 220 for 100 and Product A at 270 for 20 on one Bill, so that two prices of the same Product are one sale.
2. As an operator, I want each of those lines to keep its own quantity, rate, and Price, so that 100 at 220 and 20 at 270 stay 22000 and 5400 before tax.
3. As an operator, I want a third rate of the same Product on its own line, so that another price is another line.
4. As an operator, I want a second line at the same rate refused, so that 220 twice is one line and the extra quantity goes on the line that already has 220.
5. As an operator, I want 220 and 220.00 treated as the same rate, so that trailing zeros do not make a second line.
6. As an operator, I want 220.5 and 220.50 treated as the same rate, so that one decimal place and two decimal places are the same paise.
7. As an operator, I want 220.50 and 220.51 kept as two lines, so that a different paise amount is a different rate.
8. As an operator, I want a rate of 0 and a rate of 270 kept as two lines, so that a free line and a priced line of the same Product can share a Bill.
9. As an operator, I want two lines at rate 0 refused, so that a zero rate follows the same one-line rule.
10. As an operator, I want the same rate refused even when the GST percents differ, so that an old 2.5 percent copy and a new 9 percent copy do not split one price into two lines.
11. As an operator, I want the 220 line and the 270 line to keep their own tax copies, so that one line can stay on the rates copied when it was chosen and the other can take a later copy.
12. As an operator, I want the Bill's tax shape to charge the matching side of each line's own copy, so that within-state and interstate still apply per line.
13. As an operator, I want choosing the Product on the second line to fill the wholesale price and the Product's current tax code, so that the new line starts the same way a first line does.
14. As an operator, I want a save refused while that filled wholesale price matches the other line, so that I change the rate to 270 before the Bill is stored.
15. As an operator, I want the same-rate message on the rate of every line that shares that Product and that rate, so that both lines show what to fix.
16. As an operator, I want that message to read "This product is already on the Bill at this rate.", so that the Product is allowed and the rate is what clashes.
17. As an operator, I want a blank rate to say that the rate is required, so that an unfinished rate is not reported as a duplicate.
18. As an operator, I want an invalid rate to keep the rate-format message, so that a bad rate is fixed before it is compared.
19. As an operator, I want a half-filled line rejected for being incomplete, so that a line without a quantity is not treated as a second price.
20. As an operator, I want a blank line ignored, so that an empty extra row does not count as another price.
21. As an operator, I want the same-rate refusal on create and on edit, so that a stale screen cannot store two lines at one rate.
22. As an operator, I want the server to name the Product and the rate when it refuses, so that a save that skips the form still says which price clashed.
23. As an operator, I want changing one line's rate onto the other line's rate refused, so that an edit cannot collapse two prices into one rate on two lines.
24. As an operator, I want removing the extra line, or moving its quantity onto the line that already has that rate, to save, so that one line at that rate is the fix.
25. As an operator, I want Labour to follow the same Product-and-rate rule, so that a labour line has no separate exception.
26. As an operator, I want an inactive Product to stay unavailable for a new line, so that a second price cannot newly choose a Product that is turned off.
27. As an operator, I want a saved line whose Product is now inactive to remain on that line, so that history can still be saved when the rate rule is satisfied.
28. As an operator, I want Stock in hand to show the quantity the shop holds on every line of that Product, so that both the 220 line and the 270 line show 100 when 100 are held.
29. As an operator, I want a save refused when those lines ask for 80 and 30 against 100 in stock, so that each line fitting on its own cannot oversell the Product.
30. As an operator, I want that refusal to read "Insufficient stock for Cotton: 100 available, 110 requested." on every Cotton line, so that I can reduce either quantity.
31. As an operator, I want 80 and 20 against 100 to save, so that a sum that matches stock is allowed.
32. As an operator, I want creating that Bill to take 100 from stock in hand, so that the two lines reduce stock once, by their sum.
33. As an operator, I want a Product that is already short to be the only Product marked, so that another Product on the Bill is not blamed.
34. As an operator, I want a line with a quantity that is not a whole number of at least 1 to keep that quantity message, so that a bad quantity is not rewritten as a stock error.
35. As an operator, I want the other valid lines of that Product summed without the bad quantity, so that the stock check uses only quantities that are numbers.
36. As an operator, I want editing a Bill to add back the quantity that Bill already holds for the Product, so that I can keep 100 at 220 when stock in hand is 0 because this Bill took it.
37. As an operator, I want adding 20 at 270 refused when stock in hand is 0 and this Bill already holds 100, so that the request of 120 is more than the 100 this Bill covers.
38. As an operator, I want that same edit to save when stock in hand is 20, so that the extra 20 are there and stock in hand ends at 0.
39. As an operator, I want changing 100 at 220 into 80 at 220 plus 30 at 270, with 50 still in stock, to save, so that the net extra 10 is covered by the 50.
40. As an operator, I want removing the 270 line to return its quantity, so that a deleted price goes back to stock.
41. As an operator, I want changing a line from this Product to another to return this Product's quantity and take the other Product's quantity, so that both Products stay right.
42. As an operator, I want a Bill saved before stock was applied to be judged against current stock only, so that its old quantities are not added back when they were never taken.
43. As an operator, I want the first save of that Bill to take the new sum and mark the Bill applied, so that a later edit reconciles from the sum.
44. As an operator, I want a Bill that already has two lines of one Product at the same rate refused until one of those lines is removed, so that an old same-rate pair is not stored again.
45. As an operator, I want a Bill that already has two lines of one Product at different rates to save, so that a real two-price Bill can be edited.
46. As an operator, I want the Bill and the stock change to succeed or fail together, so that a refused save leaves stock where it was.
47. As an operator, I want two saves at the same time to share one guarded deduction of the summed quantity, so that two lines cannot each pass the last item.
48. As an operator, I want Price on each line to stay quantity times rate, rounded half up to the paise, so that tax is still on the full Price of that line.
49. As an operator, I want Total bill to stay the sum of those Prices plus the tax of each line, so that two prices add up in the footer.
50. As an operator, I want a Total bill of 0 refused, so that the existing empty-Bill rule still holds.
51. As an operator, I want the printed Bill to show each line in its saved order, with its own rate, quantity, Price, and tax, so that 220 and 270 are both on the PDF.
52. As an operator, I want the Bills list, Bill view, and Export to stay as they are, so that this change is the lines and the stock sum.
53. As an operator, I want Orders to keep one line per Product, so that this sale shape belongs to Bills.
54. As an operator, I want the glossary to say a Product may appear on more than one Bill line when the rates differ, and that the same Product at the same rate is one line, so that the language matches the Bill.
55. As an operator, I want the glossary to say a Bill refuses a save when the sum of a Product's line quantities is more than stock in hand can cover, so that stock is described per Product.
56. As an operator, I want a decision record for one line per Product per rate, so that a later reader knows why 220 and 270 are allowed and 220 twice is not.
57. As an operator, I want that record to point at the stock decision and replace only its one-Product-per-Bill sentence, so that stock deduction itself stays.

## Implementation Decisions

- A Bill line is identified by Product and rate. The rate is normalized half up to the paise before the comparison, so 220, 220.0, and 220.00 are one rate, and 220.5 and 220.50 are one rate. Tax percents, tax code, quantity, and the copied product name are not part of the identity.
- The bill module refuses create and update when two kept lines share a Product and a normalized rate. The refusal stays `BillDuplicateProductError` (400, `BILL_DUPLICATE_PRODUCT`). The message names the Product and the rate, for example "Cotton is already on this bill at 220."
- Lines whose rate does not parse are rejected for the rate itself and are left out of the rate comparison. Blank lines are dropped. A half-filled line is rejected as incomplete and is left out of the rate comparison.
- There is no merge. The module does not add the second quantity onto the first line. The operator edits the existing line.
- Stock stays one pool per Product, shared with Orders. Create compares the sum of the kept quantities for that Product with stock in hand. Update uses the difference between the new sum and the old sum. The old sum is empty when the Bill is not yet stock-applied. A positive difference is refused when it is greater than stock in hand. The guarded stock update still applies that one difference per Product, so two lines of one Product cannot each spend the same units.
- The Bill, its lines, and the stock change still commit or roll back together. Only stock in hand moves.
- The Bill form checks the same rule when the operator saves. Every complete line whose parsed rate collides gets "This product is already on the Bill at this rate." on the rate. The Product control stays a legal choice, including a Product already used at another rate.
- For stock, the form sums valid quantities per Product. Available is stock in hand plus the quantities this Bill already holds for that Product. Those held quantities count only when the Bill is stock-applied, and only for lines that are still on the form, still carry their saved line id, and still name that Product. When the sum is over, every line of that Product with a valid quantity gets "Insufficient stock for {Product}: {available} available, {requested} requested." A quantity that is not a whole number of at least 1 keeps its own message and is left out of the sum.
- The Stock in hand column keeps showing the quantity held for that Product. It does not show a remainder after the other lines.
- Choosing a Product still copies the wholesale price and the current tax code onto that line only. A saved line keeps its tax copy until the Product is chosen again on that line. Two lines at different rates may hold different copies. The Bill still has one tax shape.
- An inactive Product stays out of a new choice. A saved line may still show its current Product when that Product is inactive.
- No schema change. Bill lines already store one row per line, with its own rate, and there is no uniqueness constraint on Product within a Bill. Existing same-rate pairs are not migrated and cannot be saved again until one line is removed. Existing different-rate pairs can be saved. The first save of a Bill that never took stock takes the new sum and marks it applied.
- The printed Bill, the Bills list, Bill view, and Export keep listing stored lines. They do not group by Product.
- Glossary: Bill line records that a Product may appear on more than one line when each line's rate differs, and that the same Product at the same rate is one line. Stock in hand records that a Bill refuses a save when the sum of a Product's line quantities is more than it can cover.
- The new decision record supersedes the one-Product-per-Bill sentence of the stock decision. Stock deduction, the cutover for Bills that never took stock, and the single guarded deduction per Product stay.

## Testing Decisions

- A good test asserts what an operator would notice: a two-rate Bill saved and stock fell by the sum, a same-rate Bill was refused with the rate named, 220 and 220.00 were refused, different GST percents at one rate were refused, a summed quantity over stock was refused on the lines of that Product, and an edit was allowed only for the net change.
- Tests stay external. They do not assert private helpers, SQL text, or component markup.
- Two existing seams cover the feature. The bill module is called through create and update on the in-memory bill world. The Bill form is called through the pure form validation. These are the same seams the stock work used. No HTTP seam, database suite, PDF render, or browser pass is added.
- The bill module covers: different rates save and deduct the sum; the same rate is refused on create and on update, including a rate that normalizes to the same paise; different GST percents at the same rate are refused; a legacy Bill whose two lines share a rate is refused until one line is removed; a legacy Bill whose two lines have different rates saves; a legacy Bill that never took stock deducts the new sum on that save; an edit that adds a second rate takes only the extra quantity; an edit that asks for more than stock in hand plus the quantity the Bill already holds is refused.
- The form validation covers: the same rate sets the rate message on each matching line; 220 and 220.00 do too; a different rate is accepted; different GST percents at the same rate are refused; a blank or invalid rate keeps its own rate message; 80 and 30 against 100 set the summed stock message on both lines; a sum equal to stock is accepted; an edit adds back the stored quantities before comparing; a Bill that is not stock-applied does not add those quantities back. The Stock in hand value shown for a line stays the quantity held.
- Prior art is the bill-module stock suite and the Bill form validation suite, which already refuse a duplicate Product, name insufficient stock, and credit a stored quantity on edit.

## Out of Scope

- Orders, including their one-line-per-Product rule.
- Merging two same-rate lines into one quantity automatically.
- A migration that rewrites or deletes existing lines.
- Letting a different tax copy count as a different line at the same rate.
- Showing a running remainder in the Stock in hand column.
- Changing the printed Bill, Bills list, Bill view, or Export, beyond leaving each stored line as its own row.
- A database uniqueness constraint.
- Receiving stock from the Bill.
- Changing Price, tax-on-full-Price, tax shape, the receiver copy, the bill number, or the bank block.
- Preview totals checking stock.

## Further Notes

- This PRD is published in the local issue tracker. `Status: ready-for-agent` is the triage label.
- The client's case is Product A at 220 for 100 and Product A at 270 for 20. The same Product at the same rate stays one line because that was the rule chosen after the case, not because the screen cannot show two rows.
- The stock decision still deducts stock and still refuses a check that would let each line spend the full stock in hand. Only its sentence that a Product may appear once on a Bill is replaced.
