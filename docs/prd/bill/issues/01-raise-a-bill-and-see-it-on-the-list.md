Status: ready-for-agent

## What to build

An operator opens Bills from the sidebar, immediately after Orders, and sees the bills for the collection that is open. The list shows bill number, date, receiver name, and total bill, newest date first, and the later save first when the date matches. An empty list is a normal empty screen. Add opens a new bill. Final Save stores it. There is no edit in this slice.

The bill number is three trimmed parts, each required, at most 20 characters, and free of hyphens, stored as one value such as 9-26-15. That value is unique across the shop. The date starts as today, is shown day/month/year, and may be any real past or future day. Receiver (Bill to) offers only clients who have a GST number. Choosing one locks address, GST number, contact person, and contact number, and those may be blank when the client left them blank. The save copies the client's name, address, GST number, contact person, and contact number.

The form opens with one empty line. Description is a product from this collection. Choosing it fills the rate with the wholesale price, and the operator can change that rate. HSN/SAC is a tax code. Choosing it fills CGST and SGST from the catalog and sets IGST to 0, and the operator can change the percents. Add New Item adds an empty line. A line can be removed, and removing the last line leaves one empty line. A blank line is ignored. A half-filled line is rejected. A kept line needs a product in this collection, a tax code, a whole quantity of at least 1, and a rate of zero or greater with at most two decimal places. The same product may appear twice. The product name and the tax code's code and catalog description are copied from those records. The catalog description is not shown.

Price is quantity times rate. Discount(%) starts at 0, is required, and is from 0 to 100 with at most two decimal places. It reduces each line's price before that line's tax, rounded half up to the paise. The tax rupees and the line total use the discounted price. Total value, total tax, and total bill are the sums of those rounded amounts. A line saves only when CGST equals SGST and IGST is 0, or when CGST and SGST are both 0 and IGST carries the tax. The usual 200 at 220 with CGST 2.5, SGST 2.5, IGST 0, and discount 0 stores a total bill of 46200. A 10% discount on a 40000 line at 2.5 and 2.5 plus a 4000 line at 9 and 9 stores total value 39600, total tax 2448, and total bill 42048.

The save copies the shop bank account's four values and does not show them. It is rejected, and the operator is told to save Bank details first, when no shop bank account exists. The word Invoice does not appear. Saving a bill does not change stock and does not create or change an Order. One bill module is the only writer. Tests call it with an in-memory stand-in. The glossary records Bill, Bill number, Receiver, Bill line, Bill discount, and Total bill. Four decisions record that a Bill is not an Order and does not move stock, that the Bill copies the receiver and the line and charges either the within-state pair or IGST only, that the bill number is manual and unique across the shop, and that the discount comes off each line before tax.

## Acceptance criteria

- [ ] Bills is in the sidebar immediately after Orders, the heading reads Bills, and the word Invoice does not appear
- [ ] The list shows this collection's bills only, with bill number, date, the copied receiver name, and total bill, newest date first and later save first on a tie
- [ ] An empty list is not an error, and Add and the list are the only actions in this slice
- [ ] Final Save stores three bill-number parts as one hyphenated value, unique across the shop, and rejects a missing part, a hyphen inside a part, a part over 20 characters, or a duplicate
- [ ] The date defaults to today, accepts any real past or future day, and rejects a missing or impossible date
- [ ] The receiver list offers only clients with a GST number, the four detail fields lock after selection, and the save copies name, address, GST number, contact person, and contact number
- [ ] A missing receiver, an unknown client, or a client with no GST number is rejected
- [ ] Choosing a product fills the wholesale price, and the saved rate is the rate the operator left, including a rate of 0
- [ ] Choosing a tax code fills CGST and SGST and sets IGST to 0, and the line stores the product name plus the tax code, its code, and its catalog description without showing that description
- [ ] 200 at 220 with CGST 2.5, SGST 2.5, IGST 0, and discount 0 saves price 44000, tax 1100 and 1100, line total 46200, and total bill 46200
- [ ] A 10% discount on a 40000 line at 2.5 and 2.5 plus a 4000 line at 9 and 9 saves total value 39600, total tax 2448, and total bill 42048, while the Price columns stay 40000 and 4000
- [ ] Quantity 1 at rate 10.05 with discount 10 and CGST 2.5 and SGST 2.5 saves discounted price 9.05, tax 0.23 and 0.23, and total bill 9.51
- [ ] CGST equal to SGST with IGST 0 saves, including all zeros; CGST and SGST both 0 with an IGST amount saves; charging both shapes, or unequal CGST and SGST, is rejected
- [ ] A blank extra line is ignored, a half-filled line is rejected, a bill with no kept line is rejected, and the same product may be on two lines
- [ ] A bad quantity, rate, discount, unknown tax code, or product from another collection is rejected, and the message names the rule
- [ ] The four bank values are copied and hidden, and a save with no shop bank account is rejected and tells the operator to save Bank details first
- [ ] Saving a bill leaves stock and Orders unchanged
- [ ] Tests on the bill module, using an in-memory stand-in, cover the 46200 bill, the discounted two-line bill, the paise rounding, the tax shapes, the bill-number and receiver rejections, the missing bank account, a blank line dropped, and a list that stays inside one collection
- [ ] The glossary records Bill, Bill number, Receiver, Bill line, Bill discount, and Total bill in the words of the Bill PRD
- [ ] Four ADRs record the standalone Bill, the copies and the either-or percents, the manual shop-wide bill number, and the discount before tax

## Blocked by

None - can start immediately
