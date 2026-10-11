Status: ready-for-agent

## What to build

An operator opens a saved bill and changes it. Edit shows the three bill-number boxes, the date, the locked receiver copy, the lines, the discount, and the totals. The bank block and the tax code's catalog description stay hidden. Final Save replaces the bill. There is still no delete.

The operator can change the date and the bill number. Saving this bill's own number succeeds. Saving a number another bill already uses is rejected. Leaving the receiver unchanged keeps the copied name, address, GST number, contact person, and contact number even if the client is later renamed or loses the GST number. Choosing a different receiver replaces that copy. A receiver who no longer has a GST number still appears as the current receiver so the bill can be saved without picking someone else.

Each saved line keeps its id. Leaving the product unchanged keeps the copied product name after the product is renamed, and stores the rate submitted on this save. Changing the product copies the new product's name and fills the wholesale price again. Leaving the tax code unchanged keeps the copied code and catalog description after the catalog is edited, and stores the percents submitted on this save. Changing the tax code copies the new code and description and fills CGST, SGST, and IGST 0 again. A line left off the form is removed. A new line is saved. Lines stay in the order the operator left them. The same money rules as on create apply to the lines submitted now.

The bank block is not replaced, even if Bank details changed after the bill was raised. The bill stays in the collection it was raised in. One bill module remains the only writer, and the tests for this slice call that same module with the in-memory stand-in.

## Acceptance criteria

- [ ] Edit opens a saved bill into the three bill-number boxes, the date, the locked receiver copy, the lines, the discount, and the totals
- [ ] The bank block and the tax code's catalog description stay hidden
- [ ] The date can be changed, and a free bill number can be changed
- [ ] Saving this bill's own number succeeds, and saving another bill's number is rejected
- [ ] An unchanged receiver keeps the stored copy after the client is renamed or the GST number is cleared
- [ ] A changed receiver replaces the copy with the newly selected client
- [ ] An unchanged product keeps the stored product name after a rename, and the submitted rate is stored
- [ ] A changed product copies the new product name
- [ ] An unchanged tax code keeps the stored code and catalog description after a catalog edit, and the submitted percents are stored
- [ ] A changed tax code copies the new code and catalog description
- [ ] A line removed on the form is gone, a line added on the form is saved, and the remaining lines stay in the submitted order
- [ ] Edit leaves the bank block unchanged after Bank details is updated
- [ ] Edit cannot move the bill into another collection
- [ ] There is no delete
- [ ] Tests on the same bill module cover an unchanged receiver, product name, tax-code description, and bank block, a replaced receiver and product and tax code, a repeated save of the bill's own number, and a line removed and a line added

## Blocked by

- [01 — Raise a bill and see it on the list](01-raise-a-bill-and-see-it-on-the-list.md)
