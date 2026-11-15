Status: done

## Parent

[Bill line per Product and rate PRD](../PRD.md)

## What to build

An operator can put the same Product on more than one Bill line when the rates differ. Product A at 220 for 100 and Product A at 270 for 20 save as two lines, with their own quantities, rates, Prices, and tax copies. A third rate is a third line. The same Product at the same rate is still one line: the save is refused, the extra quantity belongs on the line that already has that rate, and nothing is merged automatically.

220 and 220.00 are the same rate, and 220.5 and 220.50 are the same rate. 220.50 and 220.51 are different. A rate of 0 and a rate of 270 are two lines. Two lines at 0 are refused. Different GST percents do not make a second line at the same rate. Lines at different rates may keep different tax copies, and the Bill's tax shape still charges the matching side of each copy.

The form says "This product is already on the Bill at this rate." on the rate of every colliding line. The server refuses with `BillDuplicateProductError` (400, `BILL_DUPLICATE_PRODUCT`) and names the Product and the rate, for example "Cotton is already on this bill at 220." A blank or invalid rate keeps its own rate message. A blank line is ignored. A half-filled line is rejected as incomplete.

Choosing the Product still fills the wholesale price and that Product's current tax code. If that price matches the other line, the save is refused until the rate is changed. Labour follows the same rule. An inactive Product stays unavailable for a new line. A saved line may still show a Product that is now inactive.

Stock in hand stays the quantity the shop holds, shown on every line of that Product. The save is refused when the sum of that Product's quantities is more than it can cover, with "Insufficient stock for Cotton: 100 available, 110 requested." on every line of that Product. Creating the Bill takes the sum. Editing adds back the quantity that Bill already holds, when stock was applied, and takes the difference. A Bill that never took stock is judged against current stock only; its first save takes the new sum and marks it applied. A legacy Bill whose two lines share a rate cannot be saved until one line is removed. A legacy Bill whose rates already differ can be saved. The Bill and the stock change succeed or fail together, and one guarded deduction per Product covers every line of that Product.

The glossary records a Bill line as one Product at one rate, and records that a Bill refuses a save when the sum of a Product's quantities is more than stock in hand can cover. A new decision record replaces only the one-Product-per-Bill sentence of the stock decision. Stock deduction itself stays. Orders stay one line per Product. The printed Bill lists each stored line. The Bills list, Bill view, Export, Price, and tax on the full Price stay as they are.

## Acceptance criteria

- [x] Product A at 220 for 100 and Product A at 270 for 20 save as two lines, with Prices 22000 and 5400
- [x] A third different rate of the same Product saves as its own line
- [x] The same Product at the same rate is refused on create and on update
- [x] 220 and 220.00 are refused as the same rate, and 220.5 and 220.50 are refused as the same rate
- [x] 220.50 and 220.51 save as two lines
- [x] A rate of 0 and a rate of 270 save as two lines, and two lines at rate 0 are refused
- [x] The same rate is refused when the GST percents differ
- [x] Lines at different rates keep their own tax copies, and the Bill's tax shape charges the matching side of each copy
- [x] The form shows "This product is already on the Bill at this rate." on the rate of every colliding line
- [x] The server answers 400 `BILL_DUPLICATE_PRODUCT` and names the Product and the rate
- [x] A blank rate keeps the rate-required message, and an invalid rate keeps the rate-format message
- [x] A blank line is ignored, and a half-filled line is rejected as incomplete
- [x] Choosing the Product still fills the wholesale price and the current tax code, and the save is refused while that price matches another line of the same Product
- [x] Changing one line's rate onto the other line's rate is refused, and removing the extra line saves
- [x] Labour follows the same Product-and-rate rule
- [x] An inactive Product cannot be newly chosen, and a saved line whose Product is now inactive can remain
- [x] Stock in hand shows the quantity held on every line of that Product
- [x] 80 and 30 against 100 in stock are refused on every line of that Product, naming 100 available and 110 requested
- [x] 80 and 20 against 100 save, and stock in hand falls by 100
- [x] Only the Product that is short is marked
- [x] A quantity that is not a whole number of at least 1 keeps its quantity message and is left out of the sum
- [x] An edit adds back the quantity the Bill already holds when stock was applied
- [x] Adding 20 at a second rate is refused when stock in hand is 0 and the Bill already holds 100
- [x] That edit saves when stock in hand is 20, and stock in hand ends at 0
- [x] Changing 100 at 220 into 80 at 220 plus 30 at 270 saves when 50 remain in stock
- [x] Removing the second-rate line returns its quantity
- [x] Changing a line to another Product returns the old Product's quantity and takes the new Product's quantity
- [x] A Bill that never took stock is judged against current stock only, and its first save takes the new sum and marks it applied
- [x] A legacy Bill with two lines at the same rate is refused until one line is removed
- [x] A legacy Bill with two lines at different rates saves
- [x] A refused save leaves stock unchanged, and one guarded deduction per Product covers all of that Product's lines
- [x] Price stays quantity times rate, tax stays on the full Price, and a Total bill of 0 is refused
- [x] The printed Bill lists each line in saved order, and the Bills list, Bill view, and Export stay as they are
- [x] Orders stay one line per Product
- [x] The glossary says a Product may appear on more than one Bill line when the rates differ, and that a Bill refuses a save when the summed quantities exceed stock in hand
- [x] The decision record replaces only the one-Product-per-Bill sentence of the stock decision, and the stock decision points at it
- [x] The bill module and the Bill form validation cover the behavior above, with no new HTTP, database, PDF, or browser suite

## Blocked by

None - can start immediately