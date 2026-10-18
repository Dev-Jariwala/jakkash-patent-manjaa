Status: ready-for-agent

# Bill PRD

## Problem Statement

The shop can record an Order, and it can keep tax codes and one shop bank account, but it cannot raise the GST document those were saved for. An operator who sells to a client with a GST number has nowhere to enter a bill number, a receiver, product lines, or tax. The sale they already record as an Order is a different document and must stay one.

## Solution

Add a Bills screen for the collection that is open. The operator can list bills, add a bill, and edit a bill. A bill is typed in directly. It is not created from an Order, it does not change stock, and it has no retail or wholesale split.

The bill number is three boxes typed by hand and stored as one value. The receiver is a client who has a GST number. The bill keeps a copy of that client's name, address, GST number, contact person, and contact number. Each line is a product and a tax code. The rate starts as the wholesale price and can be changed. Choosing a tax code fills CGST and SGST and sets IGST to 0, and those percents can be changed within the shapes below. A Bill has no discount; tax is charged on the full Price. See the Remove Bill discount PRD for those rules. The four bank values are copied onto the bill, hidden on the screen, and left alone on later edits. The screen says Bill, never Invoice.

PDF preview, WhatsApp, search, export, and delete are not part of this work.

## User Stories

1. As an operator, I want a Bills item in the sidebar, so that the GST document has its own home.
2. As an operator, I want Bills placed immediately after Orders, so that the GST document sits next to the sale.
3. As an operator, I want the list heading to read Bills, so that the screen uses the glossary word.
4. As an operator, I want the list to show bills for the collection I have open, so that I see the bills for the products I am working in.
5. As an operator, I want a bill from another collection to stay off this list, so that collections do not mix.
6. As an operator, I want each row to show the bill number, the date, the receiver name, and the total bill, so that I can find a bill without opening it.
7. As an operator, I want the receiver name on the row to be the name copied onto the bill, so that a later rename of the client does not change the list.
8. As an operator, I want the newest bill date first, so that the bill I just raised is at the top.
9. As an operator, I want two bills on the same date to show the one I saved later first, so that the order is stable.
10. As an operator, I want an empty list to be a normal empty screen, so that a collection with no bills is not shown as a failure.
11. As an operator, I want Add and Edit as the only actions, so that this slice is list, add, and edit.
12. As an operator, I want no Delete, search, export, PDF, or WhatsApp on the list, so that those stay later work.
13. As an operator, I want the word Invoice not to appear on the list, the add form, or the edit form, so that this document is only called a Bill.
14. As an operator, I want Add to open a new bill, so that I can raise one.
15. As an operator, I want the bill number as three boxes, so that I can type the three parts by hand.
16. As an operator, I want the date to start as today, shown day/month/year, so that a bill I raise today is dated today.
17. As an operator, I want to change the date to a past or future calendar date, so that I can record the date the bill should carry.
18. As an operator, I want the receiver labeled Receiver (Bill to), so that I know who the bill is raised to.
19. As an operator, I want the receiver list to offer only clients who have a GST number, so that a bill is not raised to a client without one.
20. As an operator, I want choosing a receiver to fill address, GST number, contact person, and contact number, so that I can see who I selected.
21. As an operator, I want those four fields locked, so that I cannot type a different address on the bill.
22. As an operator, I want a blank contact person or contact number to stay blank, so that an optional client field is not invented.
23. As an operator, I want the form to open with one empty line, so that I can enter the first product.
24. As an operator, I want Description to be a product from this collection, so that the line names a product.
25. As an operator, I want choosing a product to fill the rate with that product's wholesale price, so that I do not retype the usual rate.
26. As an operator, I want to change the rate after it is filled, so that this bill can charge a different rate.
27. As an operator, I want choosing the product again to fill the wholesale price again, so that a fresh choice replaces the rate I had typed.
28. As an operator, I want HSN/SAC to be a tax code, so that the line names the code that was charged.
29. As an operator, I want choosing a tax code to fill CGST and SGST from that code and set IGST to 0, so that a within-state line is the usual case.
30. As an operator, I want to change the three percents after they are filled, so that this line can charge a different allowed shape.
31. As an operator, I want choosing the tax code again to fill CGST and SGST again and set IGST to 0, so that a fresh choice replaces the percents I had typed.
32. As an operator, I want the rupee columns to fill from the quantity, rate, percents, and discount, so that I do not type tax amounts.
33. As an operator, I want Price to stay quantity times rate, so that a discount does not rewrite the price column.
34. As an operator, I want Add New Item to add an empty line, so that I can charge another product.
35. As an operator, I want to remove a line, so that a line I added by mistake can be dropped.
36. As an operator, I want removing the last line to leave one empty line, so that the form always has a row.
37. As an operator, I want Discount(%) to start at 0, so that a bill with no discount is unchanged.
38. As an operator, I want the footer to show Total value, Total tax, and Total bill, so that the amount of the bill is the total bill.
39. As an operator, I want the save button to read Final Save, so that one save stores the bill.
40. As an operator, I want no bank fields on the form, so that I do not edit the bank block on the bill.
41. As an operator, I want no advance, amount due, delivery, notes, firki, payment, or WhatsApp on the form, so that those stay on the Order.
42. As an operator, I want 200 of a product at rate 220, CGST 2.5, SGST 2.5, IGST 0, and discount 0 to save price 44000, CGST 1100, SGST 1100, IGST 0, line total 46200, total value 44000, total tax 2200, and total bill 46200, so that the usual within-state bill matches the reference amounts.
43. As an operator, I want the three parts 9, 26, and 15 to be stored as 9-26-15, so that the bill has one bill number.
44. As an operator, I want the saved bill to keep the receiver's name, address, GST number, contact person, and contact number from the save, so that a later edit of the client does not rewrite it.
45. As an operator, I want the line to keep the product's name from the product record, so that a name I did not type cannot replace it.
46. As an operator, I want the line to keep the tax code, and a copy of that code and its catalog description, so that a later catalog edit does not rewrite the line.
47. As an operator, I want the tax code's catalog description not to appear on the form, so that Description stays the product name.
48. As an operator, I want a rate I changed from the wholesale price to be the rate that is saved, so that the prefill is only a starting value.
49. As an operator, I want saving a bill to leave stock where it was, so that the Order remains the record that moves stock.
50. As an operator, I want saving a bill to leave Orders untouched, so that a bill is not a second copy of a sale.
51. As an operator, I want a 10% discount on a 40000 line at CGST 2.5 and SGST 2.5, plus a 4000 line at CGST 9 and SGST 9, to save total value 39600, total tax 2448, and total bill 42048, so that the discount comes off each line before that line's tax.
52. As an operator, I want those Price columns to still show 40000 and 4000, so that Price stays quantity times rate while the tax uses the discounted price.
53. As an operator, I want quantity 1, rate 10.05, discount 10, CGST 2.5, and SGST 2.5 to save a discounted price of 9.05, tax of 0.23 and 0.23, total value 9.05, total tax 0.46, and total bill 9.51, so that each rupee amount is rounded half up to the paise before the footer is added.
54. As an operator, I want a discount of 100 to save a total bill of 0, so that a full discount leaves no tax and no amount.
55. As an operator, I want a discount of 0 to tax the full price, so that an empty discount does not change the line.
56. As an operator, I want a missing bill-number part to be rejected, so that all three parts are present.
57. As an operator, I want a part that contains a hyphen to be rejected, so that edit can split the stored number back into three boxes.
58. As an operator, I want a part longer than 20 characters to be rejected, so that a part stays a short segment.
59. As an operator, I want a bill number another bill already uses to be rejected, so that 9-26-15 means one bill in the shop.
60. As an operator, I want a missing date to be rejected, so that every bill has a date.
61. As an operator, I want a date that is not a real calendar day to be rejected, so that 31/02/2026 is not stored.
62. As an operator, I want a future date to save, so that the date is not limited to today.
63. As an operator, I want a missing receiver to be rejected, so that every bill is raised to a client.
64. As an operator, I want a client with no GST number to be rejected, so that the receiver list and the save follow the same rule.
65. As an operator, I want an unknown client to be rejected, so that the copy comes from a real client.
66. As an operator, I want a save with no shop bank account to be rejected and told to save Bank details first, so that a bill is not raised with nowhere to pay.
67. As an operator, I want a fully blank extra line to be ignored, so that the empty row the form keeps does not block the save.
68. As an operator, I want a save with only blank lines to be rejected, so that a bill has at least one line.
69. As an operator, I want a line with a product and no tax code to be rejected, so that a half-filled line is not dropped quietly.
70. As an operator, I want a line with a tax code and no product to be rejected, so that the other half-filled case is rejected too.
71. As an operator, I want a line with a product and a tax code but no quantity to be rejected, so that quantity is part of a kept line.
72. As an operator, I want quantity 0, a fraction, or a negative quantity to be rejected, so that quantity is a whole number of at least 1.
73. As an operator, I want a negative rate, or a rate with more than two decimal places, to be rejected, so that the rate is zero or greater to the paise.
74. As an operator, I want a rate of 0 to save, so that a line can be charged nothing before tax.
75. As an operator, I want CGST 2.5, SGST 2.5, and IGST 0 to save, so that the usual within-state line is accepted.
76. As an operator, I want CGST 0, SGST 0, and IGST 0 to save, so that an exempt line is accepted.
77. As an operator, I want CGST 0, SGST 0, and IGST 5 to save, so that I can type an outside-state line by hand.
78. As an operator, I want CGST 2.5, SGST 2.5, and IGST 5 to be rejected, so that a line does not charge both the split and IGST.
79. As an operator, I want CGST 2.5 and SGST 9, with IGST 0, to be rejected, so that the two halves stay equal.
80. As an operator, I want a negative percent, or a percent with more than two decimal places, to be rejected, so that a percent is zero or greater to two places.
81. As an operator, I want a missing discount, a negative discount, a discount over 100, or a discount with more than two decimal places to be rejected, so that the discount is from 0 to 100 to the paise.
82. As an operator, I want a product from another collection to be rejected, so that the line stays in this bill's collection.
83. As an operator, I want an unknown tax code to be rejected, so that the copy comes from the catalog.
84. As an operator, I want the same product on two lines of one bill to save, so that two lines are not blocked for sharing a product.
85. As an operator, I want Edit to show the bill number in the three boxes, the date, the locked receiver copy, the lines, the discount, and the totals, so that I change the bill I opened.
86. As an operator, I want Edit to keep hiding the bank block and the tax code's catalog description, so that those copies stay off the form.
87. As an operator, I want to change the date on edit, so that a wrong date can be corrected.
88. As an operator, I want to change the bill number on edit when the new number is free, so that a wrong number can be corrected.
89. As an operator, I want saving this bill's own number again to succeed, so that an unrelated edit is not treated as a duplicate of itself.
90. As an operator, I want a number already used by a different bill to be rejected on edit, so that a correction cannot collide.
91. As an operator, I want leaving the receiver unchanged to keep the copied name, address, GST number, contact person, and contact number after the client is renamed, so that the bill still shows who it was raised to.
92. As an operator, I want that same receiver to remain on the bill after their GST number is cleared on the client, so that the copy does not depend on the client still qualifying for the dropdown.
93. As an operator, I want changing the receiver to replace the copy with the newly selected client, so that the bill follows the client I chose this time.
94. As an operator, I want leaving a line's product unchanged to keep the copied product name after the product is renamed, and to store the rate I submitted, so that a rename does not rewrite the line and a rate edit still saves.
95. As an operator, I want changing a line's product to copy the new product's name, so that a fresh choice takes a fresh name.
96. As an operator, I want leaving a line's tax code unchanged to keep the copied code and catalog description after the catalog is edited, and to store the percents I submitted, so that a catalog edit does not rewrite the line.
97. As an operator, I want changing a line's tax code to copy the new code and catalog description, so that a fresh choice takes a fresh copy.
98. As an operator, I want editing the bill to leave its bank block unchanged, so that a line edit does not pick up a new shop bank account.
99. As an operator, I want a shop bank account edited after the bill was raised to leave that bill's bank block unchanged, so that the old bill still holds the old account.
100. As an operator, I want removing a line on edit to drop that line, so that the saved bill matches the lines I kept.
101. As an operator, I want adding a line on edit to save that line, so that a later product is on the bill.
102. As an operator, I want the saved lines to stay in the order I left them, so that the form does not sort them for me.
103. As an operator, I want the new bill to appear on this collection's list, so that the list matches what I saved.
104. As an operator, I want that bill not to appear on another collection's list, so that the bill stays in the collection it was raised in.
105. As an operator, I want a bill's collection not to change on edit, so that a bill does not move to whatever collection I have open later.
106. As a developer, I want the glossary to record Bill as a GST document entered for one collection, not created from an Order, and not a change to stock, so that Bill is not used again as a name for an Order.
107. As a developer, I want the glossary to record Bill number, Receiver, Bill discount, and Total bill, so that the three-part number, the copied client, the percent, and the footer amount have one name each.
108. As a developer, I want the glossary to record a Bill line as the product copy, the charged rate, and the tax-code copy including the hidden catalog description and the percents charged, so that a later read does not join the live product or the live tax code.
109. As a developer, I want one decision that a Bill is not an Order and does not move stock, so that a later reader does not raise it from an Order or reduce stock.
110. As a developer, I want one decision that the Bill copies the receiver and the line, and that a line's percents are the within-state pair or IGST only, so that a later reader does not join live client details or apply the catalog's three-rate equality to the line.
111. As a developer, I want one decision that the bill number is three manual parts stored as one value and unique across the shop, so that a later reader does not generate it or restart it per collection.
112. As a developer, I want one decision that the bill discount comes off each line before tax while Price stays quantity times rate, so that a later reader does not take the percent off the grand total.
113. As a developer, I want one bill module to be the only place those rules are decided, so that the screen and the route do not grow a second copy.

## Implementation Decisions

- The sidebar gains one item, titled Bills, immediately after Orders and immediately before Clients. It opens the list for the collection that is open. The heading is Bills.
- The list columns are bill number, date, receiver name, and total bill. The receiver name is the copy stored on the bill. Rows are ordered by bill date descending, and by save time descending when the date is the same. There is no search, export, delete, PDF, or WhatsApp. An empty list is a normal empty screen.
- Add opens a new bill. Edit opens the bill that was chosen. The save button reads Final Save. There is no draft. One save either stores the bill or rejects it.
- The bill number is three parts. Each part is trimmed, required, at most 20 characters, and must not contain a hyphen. The stored bill number is the three parts joined by hyphens. It is unique across the shop. Edit may change it. A save of the bill's own current number is not a duplicate. The edit form splits the stored number back into the three boxes.
- The date is a calendar date with no time. It is required, defaults to today on a new bill, and may be any real past or future day. The form shows it as day/month/year.
- The receiver control is labeled Receiver (Bill to). It offers clients who have a GST number, by name. Choosing one fills address, GST number, contact person, and contact number and locks them. Contact person and contact number may be blank. The saved copy is taken from the client at save time when the client is newly chosen. On edit, an unchanged client id keeps the stored copy and does not read the client again. A changed client id copies the newly selected client. A client with no GST number, and an unknown client, are rejected.
- The word Invoice does not appear. The footer labels are Total value, Total tax, and Total bill.
- A line on the form has Description (a product), HSN/SAC (a tax code), quantity, rate, price, CGST percent, CGST rupees, SGST percent, SGST rupees, IGST percent, IGST rupees, and a line total. The form opens with one empty line. Add New Item adds an empty line. A line can be removed. Removing the last line leaves one empty line.
- Choosing a product fills the rate with that product's wholesale price. The operator can change the rate. Choosing that product again fills the wholesale price again. Choosing a tax code fills CGST and SGST from the catalog and sets IGST to 0. The operator can change the percents. Choosing that tax code again does the same fill again. The catalog description is not shown. The bank block is not shown.
- A blank line has no product, no tax code, and no quantity. Default zeros for rate and percents do not make a line half-filled. Blank lines are dropped on save. A line with only some of product, tax code, and quantity is rejected. A kept line needs a product in this bill's collection, a tax code, a whole quantity of at least 1, and a rate of zero or greater with at most two decimal places. The same product may appear on more than one line. A save with no kept line is rejected.
- Each saved line has a stable id. Edit sends that id back. If the product id on that line is unchanged, the stored product name is kept. If the product id changed, or the line is new, the product name is copied from the product now. The rate is always the submitted rate. If the tax code id on that line is unchanged, the stored code and catalog description are kept. If the tax code id changed, or the line is new, the code and catalog description are copied from the tax code now. The percents are always the submitted percents. A line id that does not belong to this bill is rejected. Lines are stored in the order they were submitted. A line left off the edit is gone.
- A kept line's percents are zero or greater, with at most two decimal places, and match one shape. CGST equals SGST and IGST is 0. Or CGST and SGST are both 0 and IGST is whatever was submitted. The catalog rule, where IGST equals CGST plus SGST, stays on the tax code and is not applied to the line. A within-state line of 2.5, 2.5, and 0 saves. A line of 2.5, 2.5, and 5 is rejected.
- A Bill has no discount percent. Price is quantity times rate, rounded half up to the paise. Each tax rupee is that Price times that percent, divided by 100, rounded half up to the paise. The line total is Price plus the three tax rupees. Total value is the sum of the Prices. Total tax is the sum of the tax rupees. Total bill is total value plus total tax. A save whose Total bill is 0 is rejected. Create, update, and preview reject a payload that includes a discount. The Remove Bill discount PRD is the source for discount stories and acceptance.
- Those rupee amounts are stored on the bill. A later read returns the stored amounts. The screen uses the same calculation while the operator types, from the bill module, so the form and the save do not each invent a formula.
- On create, the bill copies the current shop bank account's bank name, bank address, account number, and IFSC. It stores no bank id. If no shop bank account has been saved, the save is rejected and the operator is told to save Bank details first. Edit does not accept a new bank block and does not read the shop bank account again.
- The bill stores the collection it was raised in. Edit cannot move it to another collection. A product that is not in that collection is rejected.
- A rejected save tells the operator which rule failed: a bill-number part, a duplicate bill number, the date, the receiver, the missing shop bank account, a half-filled line, the quantity, the rate, the percent shape, a sent discount, a zero Total bill, the product's collection, the tax code, or a missing line.
- One bill module is the only writer. It lists bills for a collection, reads one bill, creates a bill, and updates a bill. It does not delete. It does not write clients, products, tax codes, the shop bank account, stock, or Orders. The screen and the HTTP boundary call it. They are not a second place where the rules are decided.
- The glossary replaces the current Bill and Bill line entries and adds Bill number, Receiver, and Total bill. Bill bank block stays as it is. The context's opening sentence mentions Bills as well as Orders.
- Bill is a GST document entered directly for one collection. It is not created from an Order, and it does not change stock. Avoid calling it an invoice or an Order.
- Bill number is the three-part number typed for a Bill, stored as one hyphenated value, unique across the shop. Avoid calling it an invoice number, an order number, or a generated sequence.
- Receiver is the GST client a Bill was raised to. The Bill stores that client's id and a copy of the name, address, GST number, contact person, and contact number taken when that client was chosen for the save. Avoid a live client lookup, and avoid customer.
- Bill line is a line on a Bill. It stores the product id, a copy of the product name, and the rate charged, plus the tax code id and a copy of the code, the tax code's description, and the CGST, SGST, and IGST percents charged. Avoid an Order line, and avoid joining the live product or tax code at display time.
- Total bill is the amount of a Bill after the tax. Avoid total invoice, and avoid amount due.
- Five decisions are recorded. A Bill is not an Order and does not move stock. The rejected alternatives were raising it from an Order, and reducing stock the way an Order does. The Bill copies the receiver and the line, and a line charges either the within-state pair or IGST only. The rejected alternatives were storing only the client id, joining the live catalog at display time, and applying the catalog's three-rate equality to the line. The bill number is three manual parts in one value, unique across the shop. The rejected alternatives were a generated sequence, and uniqueness per collection. A Bill has no discount and tax is on the full Price; see ADR 0021, which supersedes the earlier discount-before-tax decision. The bank block is not re-decided. It stays the copy already recorded for a future Bill, now applied by this module.

## Testing Decisions

- A good test asserts the outcome an operator would notice: a bill was saved, a save was rejected, an edit left a copy alone, or the totals match the amounts above. It does not assert SQL text, private helpers, HTTP status lines, or React state.
- There is one seam: the bill module. Tests call list, read, create, and update with an in-memory stand-in for bills, clients, products, tax codes, and the shop bank account. They do not open a database, boot HTTP, or render the screen.
- The suite follows the Remove Bill discount PRD testing decisions: the 46200 bill, two-line full-price totals, the 10.72 rounding case, a rate of 0 beside a positive line, zero-total rejection, sent-discount rejection, a read with no discount, and a blank-form preview of 0, plus the edit, list, receiver, bank, and tax-shape cases from this PRD that are unchanged.
- No new frontend test suite. The existing frontend tests are component tests for WhatsApp order actions and are the wrong seam for these rules. There is no HTTP or live-database harness to extend.
- Prior art is the server node:test layout used for tax-code maintenance and the shop bank account, and the in-memory stand-in used there.

## Out of Scope

- A Bill PDF, a print preview, or any change to the Order PDF.
- WhatsApp send, resend, or a delivery status on a Bill.
- Delete of a Bill, search, export, and payment, including advance and amount due.
- Delivery, notes, firki, and a retail or wholesale split.
- Moving stock, or creating or changing an Order.
- Generating the bill number, or a per-collection number series.
- Choosing within-state or outside-state from the client's state. Outside-state is typed by hand as IGST with CGST and SGST at 0.
- Showing the bank block or the tax code's catalog description on the screen.
- Editing the shop bank account, tax codes, clients, or products from this screen.
- A second test seam for HTTP or for the Bills screen.

## Further Notes

- The reference screens show the fields this module keeps. They are not a layout to copy. The screen uses this app's existing form controls.
- The product list is the same products an Order can already use in the open collection, including a labour product.
- Default zeros on an untouched line are the empty-line display. They are not a half-filled line.
- Bill bank block remains the term from the shop bank account decision. This module is where that copy is first written.
- The glossary and the four decisions are part of this work, not a precondition already on disk.
- This PRD is published under the repo's `docs/prd/` convention. The repo has no issue-tracker setup under `docs/agents/`. `Status: ready-for-agent` is recorded on this document the same way the shop bank account PRD records that role.
