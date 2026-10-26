Status: ready-for-agent

## Parent

[Bill tax shape PRD](../PRD.md)

## What to build

An operator raises a new Bill. It opens on within-state. One switch, labeled Within state and Interstate, applies to the whole Bill. Choosing a client does not move it. The CGST, SGST, and IGST boxes are read-only. Choosing a product copies that tax code's three percents onto the line. Within-state shows the copied CGST and SGST and shows IGST as 0. Interstate shows CGST and SGST as 0 and shows the copied IGST. The line stores the full copy, so a later switch uses that copy and does not read the tax code again.

Choosing the product again copies the tax code's current percents, code, and description onto that line only. Two lines of the same product may keep different copies. A save that does not choose the product again leaves the copy, including after Masters changes the tax code. Tax stays on the full Price. A legal copy is CGST equal to SGST and IGST equal to their sum, including 0, 0, and 0. It does not have to equal the live tax code. A missing tax shape, a charged pair such as 2.5, 2.5, and 0, an IGST that is not the sum, or unequal CGST and SGST is rejected.

The usual within-state Bill of 200 at 220, copied at 2.5, 2.5, and 5, saves price 44000, tax 1100 and 1100 and 0, line total 46200, and total bill 46200, and stores that trio. Switching it to interstate charges IGST 2200 and the same line total. A 40000 line at 2.5, 2.5, and 5 plus a 4000 line at 9, 9, and 18 saves total value 44000, tax 2720, and total bill 46720 in the buckets for the shape. Quantity 1 at rate 10.20 saves a within-state total bill of 10.72 and an interstate total bill of 10.71.

The receiver copy, the bill number, the bank block, the discount rejection, the zero-total rejection, the blank and half-filled lines, the printed summary rows, and the list columns stay as they are. The word Invoice stays off the screen. A Bill that has no tax shape is not converted in this slice. Orders are unchanged.

The glossary adds Tax shape and revises Bill line. One decision records that a Bill's tax shape charges one side of the copied trio, including the old-Bill rule the later slices build. It points the earlier percents-charged decisions at this one. The discount PRD gets one sentence that a new Bill uses this tax shape.

## Acceptance criteria

- [ ] A new Bill opens on within-state, with one switch labeled Within state and Interstate, and choosing a client does not move it
- [ ] The percent boxes are read-only and show the charged percents: the copied pair and IGST 0, or zeros and the copied IGST
- [ ] Choosing a product copies that tax code's CGST, SGST, and IGST onto the line, and the saved line stores that trio
- [ ] 200 at 220 copied at 2.5, 2.5, and 5 saves price 44000, tax 1100 and 1100 and 0, line total 46200, total bill 46200, and the trio 2.5, 2.5, and 5
- [ ] Switching that Bill to interstate charges IGST 2200, CGST 0, and SGST 0, with line total 46200, using the stored copy
- [ ] A 40000 line at 2.5, 2.5, and 5 plus a 4000 line at 9, 9, and 18 saves total value 44000, tax 2720, and total bill 46720, within-state in the pair and interstate in IGST
- [ ] Quantity 1 at rate 10.20 saves within-state tax of 0.26 and 0.26 and total bill 10.72, and interstate IGST tax of 0.51 and total bill 10.71
- [ ] An exempt copy of 0, 0, and 0 charges nothing in either shape
- [ ] A missing tax shape, a line of 2.5, 2.5, and 0, a line of 2.5, 2.5, and 6, unequal CGST and SGST, a negative percent, and more than two decimal places are rejected
- [ ] A legal trio that is not the tax code's current rates still saves
- [ ] Editing quantity or rate without choosing the product again keeps the copy, and a different trio on that save is rejected
- [ ] After Masters moves the tax code to 9, 9, and 18, switching without choosing the product again still charges the copied 5
- [ ] Choosing the product again copies 9, 9, and 18 onto that line only, and the other line of the same product keeps 2.5, 2.5, and 5
- [ ] A save that does not choose the product again also keeps the copied code and description
- [ ] Price stays quantity times rate, the footer stays Total value, Total tax, and Total bill, a rate of 0 still saves beside a positive line, a Total bill of 0 is rejected, and a Bill with no kept line is rejected as a missing line
- [ ] A blank line is ignored, a half-filled line is rejected, a product with no tax code is rejected, an unfinished form still previews a footer of 0, and Save stays disabled while that footer is 0
- [ ] A discount in the payload is still rejected, and the receiver copy, the bill number, and the bank block are unchanged
- [ ] The printed summary still has CGST, SGST, and IGST rows of the charged rupees, and the list stays bill number, date, receiver, and total bill
- [ ] The word Invoice stays off the screen
- [ ] Tests on the bill module, using the in-memory stand-in, cover the amounts, the switch against a moved tax code, the single-line re-choice, the two copies of one product, and the rejections
- [ ] The glossary records Tax shape and the revised Bill line
- [ ] A decision records that the tax shape charges one side of the copied trio, names the rejected alternatives, and points the earlier percents-charged decisions at it
- [ ] The discount PRD notes that a new Bill uses this tax shape
- [ ] A Bill with no tax shape is left for the next slice, and Orders are unchanged

## Blocked by

None - can start immediately
