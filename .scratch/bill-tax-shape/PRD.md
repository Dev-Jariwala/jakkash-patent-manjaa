Status: ready-for-agent

# Bill tax shape PRD

## Problem Statement

On a Bill the operator types CGST, SGST, and IGST. Those three boxes are the wrong job. The rates already live on the tax code. What the operator actually chooses is which side of those rates to charge: the within-state pair, or IGST. A Bill saved the old way still holds only the percents that were charged, and that history has to stay readable.

## Solution

A new Bill has one tax shape. It opens on within-state. The operator can switch the whole Bill to interstate. The client's state does not move the switch. Choosing a product copies that tax code's CGST, SGST, and IGST onto that line, and the boxes show the charged percents as read-only. Within-state shows the copied CGST and SGST and shows IGST as 0. Interstate shows CGST and SGST as 0 and shows the copied IGST. The line keeps the full copy, so a later switch uses that copy and does not read the tax code again.

A Bill saved the old way keeps the percents that were charged. It is not deleted, and the missing rate is not invented. The switch stays off until every product has been chosen again, and only when those lines already share one shape. A Bill that charges both shapes never gets the switch.

Tax stays on the full Price. The receiver copy, the bill number, the bank block, and Orders are unchanged.

## User Stories

1. As an operator, I want a new Bill to open on within-state, so that the usual Bill charges CGST and SGST without an extra choice.
2. As an operator, I want one tax-shape switch for the whole Bill, so that I do not set a shape on each line.
3. As an operator, I want the switch to offer Within state and Interstate, so that I am choosing the side of the tax and not a third rate.
4. As an operator, I want choosing a client to leave the switch where it is, so that the client's state does not change the tax.
5. As an operator, I want the CGST, SGST, and IGST boxes to be read-only, so that I cannot type a percent.
6. As an operator, I want choosing a product to copy that tax code's CGST, SGST, and IGST onto the line, so that the rates come from the tax code.
7. As an operator, I want a within-state line to show the copied CGST and SGST and to show IGST as 0, so that the screen shows what is charged.
8. As an operator, I want an interstate line to show CGST and SGST as 0 and to show the copied IGST, so that the screen does not look like all three rates are charged.
9. As an operator, I want the stored copy to keep all three rates, so that switching later does not lose the unused rate.
10. As an operator, I want switching the Bill to rewrite every filled line from the copy already on that line, so that a tax code edited in Masters after the product was chosen does not change this Bill.
11. As an operator, I want choosing the product again to copy the tax code's current rates onto that line only, so that I can pick up a Masters change when I mean to.
12. As an operator, I want two lines of the same product to keep their own copies, so that one line can stay on the old rates while the other takes the new ones.
13. As an operator, I want a save that does not choose the product again to leave that line's copy alone, so that editing the quantity or the rate does not refresh the tax.
14. As an operator, I want an exempt tax code of 0, 0, and 0 to charge nothing in either shape, so that a zero rate still means no tax.
15. As an operator, I want 200 of a product at rate 220, with a copied trio of 2.5, 2.5, and 5, on a within-state Bill, to save price 44000, charged CGST 2.5, charged SGST 2.5, charged IGST 0, tax 1100 and 1100 and 0, line total 46200, and total bill 46200, so that the usual within-state amount is unchanged.
16. As an operator, I want that same line to store the copy 2.5, 2.5, and 5, so that the unused IGST is still on the line.
17. As an operator, I want switching that Bill to interstate to charge IGST 5, CGST 0, and SGST 0, with tax 2200, line total 46200, and total bill 46200, so that the full rate moves into IGST.
18. As an operator, I want a 40000 line copied at 2.5, 2.5, and 5, plus a 4000 line copied at 9, 9, and 18, on a within-state Bill, to save total value 44000, CGST and SGST tax 2720, IGST tax 0, and total bill 46720, so that each line is taxed on its full Price.
19. As an operator, I want switching that Bill to interstate to save CGST and SGST tax 0, IGST tax 2720, and total bill 46720, so that each line uses its own copied IGST.
20. As an operator, I want quantity 1 at rate 10.20, with a copied trio of 2.5, 2.5, and 5, on a within-state Bill, to save tax of 0.26 and 0.26 and a total bill of 10.72, so that each half is still rounded half up to the paise.
21. As an operator, I want that same line switched to interstate to save IGST tax of 0.51 and a total bill of 10.71, so that one rounding of the full rate is not the same as two roundings of the halves.
22. As an operator, I want Price to stay quantity times rate, so that the price column is the amount before tax.
23. As an operator, I want the tax rupees to fill from the Price and the charged percents, so that I do not type tax amounts.
24. As an operator, I want the footer to stay Total value, Total tax, and Total bill, so that the screen still names the three amounts.
25. As an operator, I want Total value to be the sum of the Price columns, so that the taxable amount is the full price.
26. As an operator, I want Total tax to be the sum of the charged tax rupees, so that the footer adds the amounts already rounded on each line.
27. As an operator, I want Total bill to be Total value plus Total tax, so that the amount of the Bill is the price plus the tax.
28. As an operator, I want a line with rate 0 to save when another line makes the Total bill greater than 0, so that a free line does not block a real Bill.
29. As an operator, I want a Bill whose kept lines add up to a Total bill of 0 to be rejected, so that a zero Bill cannot be raised.
30. As an operator, I want a Bill with no kept line to be rejected as a missing line, so that an empty Bill is not reported as a zero total.
31. As an operator, I want an unfinished form to show a footer of 0, so that totals stay quiet until a line is complete.
32. As an operator, I want Save to stay disabled while that footer is 0, so that I cannot raise the unfinished Bill.
33. As an operator, I want a blank line to be ignored, so that the empty row at the bottom is not a kept line.
34. As an operator, I want a half-filled line to be rejected, so that a product without a quantity cannot be saved.
35. As an operator, I want a product with no tax code to be rejected on a new line, so that a Bill line still names an HSN or SAC.
36. As an operator, I want the word Invoice to stay off the screen, so that the screen still says Bill.
37. As an operator, I want a new Bill that omits the tax shape to be rejected, so that a stale screen cannot save charged percents as if they were a copy.
38. As an operator, I want a new line of 2.5, 2.5, and 0 to be rejected, so that a charged pair is not stored as the copy.
39. As an operator, I want a new line of 2.5, 2.5, and 6 to be rejected, so that IGST has to be the sum of CGST and SGST.
40. As an operator, I want a new line of 2.5, 3, and 5.5 to be rejected, so that CGST and SGST on the copy have to be equal.
41. As an operator, I want a negative percent, or a percent with more than two decimal places, to be rejected, so that the copy follows the same number rules as a tax code.
42. As an operator, I want a new line of 0, 0, and 0 to save, so that an exempt copy is legal.
43. As an operator, I want a new line whose copy is a legal trio, but not the tax code's current rates, to save, so that the module checks the shape of the copy and does not look the rates up again.
44. As an operator, I want opening a saved new Bill to show the tax shape and the charged percents, so that what I see is what was charged.
45. As an operator, I want a read of that Bill to return the copied trio and the charged tax rupees, so that IGST can be 5 on the copy while the IGST rupees are 0.
46. As an operator, I want editing the quantity on that Bill, without choosing the product again and without switching, to keep the copied trio, so that the rates stay put.
47. As an operator, I want a different trio submitted on that save to be rejected, so that the copy cannot change unless the product is chosen again.
48. As an operator, I want Masters moving that tax code from 2.5, 2.5, and 5 to 9, 9, and 18, then switching the Bill to interstate without choosing the product again, to charge IGST 5, so that the switch uses the copy.
49. As an operator, I want choosing that product again after the Masters change to copy 9, 9, and 18 onto that line only, so that the other lines of the same product keep 2.5, 2.5, and 5.
50. As an operator, I want switching after that re-choice to charge IGST 18 on the re-chosen line and IGST 5 on the line that was left alone, so that each line follows its own copy.
51. As an operator, I want the HSN/SAC on a line that was not chosen again to stay the copied code and description, so that a Masters edit does not rewrite the line.
52. As an operator, I want choosing the product again to copy the current code and description as well as the current trio, so that a fresh choice refreshes the whole tax-code copy.
53. As an operator, I want the receiver copy, the bill number, and the bank block to stay as they are when I do not change them, so that the tax shape does not reopen those rules.
54. As an operator, I want a save that still sends a discount to be rejected, so that removing the discount stays in force.
55. As an operator, I want a Bill saved the old way, with charged percents such as 2.5, 2.5, and 0, to open with those percents and with no tax shape, so that the missing IGST is not invented.
56. As an operator, I want the switch on that Bill to stay off while any line has not been chosen again, so that I cannot flip a line that has no unused rate.
57. As an operator, I want changing the quantity or the rate on that Bill to keep the charged percents, so that an ordinary edit does not convert the Bill.
58. As an operator, I want an old exempt line of 0, 0, and 0 not to count as a copy, so that I still have to choose that product again before the switch unlocks.
59. As an operator, I want choosing one product again on an old within-state Bill to store today's trio on that line and to keep charging CGST and SGST, so that the line is ready and the Bill is not flipped yet.
60. As an operator, I want the switch to stay off after that one re-choice, so that a half-converted Bill cannot change shape.
61. As an operator, I want choosing the last remaining product again to set the tax shape to the shape those lines already shared, and to turn the switch on, so that the Bill converts only when every line has a copy.
62. As an operator, I want that unlocked switch to start on the old shared shape, so that conversion does not move a within-state Bill to interstate by itself.
63. As an operator, I want an old interstate line of 0, 0, and 5, when I choose the product again, to copy today's trio and keep charging IGST, so that the line is not reset to within-state.
64. As an operator, I want a later edit of a converted Bill to remember which lines are copies, so that I do not have to choose every product again.
65. As an operator, I want adding a line on an old Bill that shares one shape to count that new line as a copy immediately, so that only the old lines still block the switch.
66. As an operator, I want removing the last unconverted line, once every line that remains is a copy, to unlock the switch, so that a line I deleted does not block conversion.
67. As an operator, I want an old Bill with CGST and SGST on one line and IGST on another to have no switch, so that one Bill is not given a single shape it never had.
68. As an operator, I want choosing every product again on that mixed Bill to leave it without a tax shape, so that re-choice does not invent one.
69. As an operator, I want each line on that mixed Bill to keep its own charged shape when I choose the product again, so that an interstate line stays interstate and a within-state line stays within-state.
70. As an operator, I want those mixed lines to keep storing charged percents, not a trio, so that the Bill stays on the old rule.
71. As an operator, I want deleting the conflicting lines, and choosing the remaining products again, to unlock the switch on the shape that remains, so that a Bill that no longer mixes can convert.
72. As an operator, I want an old Bill whose every line is exempt to treat the shared shape as within-state once every product has been chosen again, so that a zero Bill still has a definite switch.
73. As an operator, I want switching that exempt Bill to interstate to keep the tax at 0, so that the switch does not invent a rate.
74. As an operator, I want a tax shape submitted for a Bill that still has a charged-percent line to be rejected, so that the switch cannot move early.
75. As an operator, I want a tax shape submitted for a mixed Bill to be rejected, so that the module refuses the shape the screen does not offer.
76. As an operator, I want the conversion save to reject a tax shape other than the one the lines already share, so that the first unlock cannot flip the Bill in the same step.
77. As an operator, I want the printed summary to keep the CGST, SGST, and IGST rows, showing the charged rupees, so that a within-state Bill still prints an IGST row of 0.
78. As an operator, I want the Bills list to stay bill number, date, receiver, and total bill, so that the tax shape does not add a column.

## Implementation Decisions

- The bill module is the only module that changes. Create, update, read, and preview learn the tax shape. List does not.
- A new Bill stores one tax shape, `within-state` or `interstate`. It is required on create. The screen opens on within-state and sends that value. Choosing a client does not change it.
- Each line on a new Bill stores the copied trio in the three percent fields, and stores the charged tax rupees. It does not store a second set of charged percents. Within-state charges the copied CGST and SGST and charges IGST at 0. Interstate charges the copied IGST and charges CGST and SGST at 0. Read returns the tax shape, the trio, and the charged rupees. The screen derives the read-only boxes from those two.
- A copied trio is legal when CGST equals SGST, IGST equals their sum, each percent is zero or greater, and each has at most two decimal places. 2.5, 2.5, and 5 is legal. 0, 0, and 0 is legal. 2.5, 2.5, and 0 is not. 2.5, 2.5, and 6 is not. The trio does not have to equal the live tax code.
- On create, every kept line is a copy. On update, a line is a fresh choice when it is new, when its product changed, or when the save says the product was chosen again. A fresh choice stores the submitted trio if that trio is legal. A line that is not a fresh choice must submit the trio already stored, and the module keeps that trio. It does not read the tax code's rates on that save. The copied code and description follow the same fresh-choice rule they already have.
- Price, tax rupees, line total, Total value, Total tax, and Total bill stay rounded half up to the paise, from the full Price. The footer adds the already rounded amounts. A Total bill of 0 is still rejected. A missing line is still rejected as a missing line. A discount in the payload is still rejected. The bank block, the receiver copy, and the bill number are unchanged.
- Preview with a tax shape treats the submitted percents as a trio and returns the charged rupees. Preview without a tax shape treats the submitted percents as charged percents, which is how an old Bill still previews. A blank or half-filled line still previews as an empty footer of 0 and does not throw.
- A Bill saved the old way has no tax shape. Its lines store charged percents and are not copies. An exempt line of 0, 0, and 0 is not a copy until the product is chosen again. The line records that it is a copy, and that record survives a later edit.
- The lines of an old Bill share within-state when every charged line has IGST 0 and CGST equal to SGST. They share interstate when every charged line has CGST and SGST at 0 and IGST greater than 0, or when every line is exempt of IGST only. They are mixed when one line has a positive CGST or SGST and another has a positive IGST. An old Bill whose every line is exempt shares within-state.
- While any line is not a copy, the module rejects a tax shape. Choosing a product again on a Bill that shares one shape stores the submitted legal trio, marks the line as a copy, and charges it in that shared shape. The switch on the screen stays off. The save that first has every line as a copy must send that shared shape, and the module rejects any other shape. From the next save on, the switch may change, and every line is charged from its own trio.
- A mixed Bill never stores a tax shape. Choosing a product again refreshes that line's charged percents from the submitted charged percents for the shape that line already had, and does not mark it as a copy. An interstate line is not reset to within-state. If a later save no longer mixes, because the conflicting lines were removed, the remaining lines can convert under the shared-shape rule.
- The screen has one switch, labeled Within state and Interstate. On a new Bill it is on. On an old Bill that shares one shape it is shown and off until every line is a copy, sitting on that shared shape. On a mixed Bill it is absent. The percent boxes are read-only and show the charged percents.
- The printed summary keeps the CGST, SGST, and IGST rows and shows the charged rupees. The list does not gain a tax column.
- The glossary adds Tax shape: a Bill's single choice of which copied rates are charged. Within-state charges the copied CGST and SGST. Interstate charges the copied IGST. A new Bill opens on within-state. The client's state does not set it. Avoid a three-way CGST, SGST, or IGST switch, outside-state, and intrastate.
- The glossary revises Bill line. The line stores the tax code's CGST, SGST, and IGST from when that product was chosen, and the tax shape decides which are charged. A line saved before tax shape stores the percents charged, until that product is chosen again on a Bill whose lines share one shape. Avoid calling the stored numbers the percents charged, one rate shared by every line of a product, and a live rate lookup.
- One new decision records that a Bill's tax shape charges one side of the copied trio, including the old-Bill rule and the rejected alternatives: typed percents, a three-way switch, a shape per line, reading the live tax code on a switch, wiping Bills or inventing the missing rate, converting on the next save, and giving a mixed Bill a switch. It supersedes the percents-charged rule on the Bill line. The receiver copy in that earlier decision stays. The tax-code decision that said the line stores the rates actually charged gets one sentence pointing at the new decision. The discount decision is not reopened. The in-progress discount PRD gets one sentence that the either-or percents for a new Bill are replaced by this tax shape.

## Testing Decisions

- A good test asserts the outcome an operator would notice: a Bill was saved, a switch changed the charged rupees, a save was rejected, a preview matched the footer, or a read returned the copied trio beside the charged rupees. It does not assert SQL text, private helpers, HTTP status lines, or React state.
- There is one seam: the bill module. Tests call list, read, create, update, and preview with an in-memory stand-in for Bills, clients, products, tax codes, and the shop bank account. They do not open a database, boot HTTP, or render the screen.
- The suite keeps the within-state 200 at 220 bill and its total bill of 46200, now with the stored trio 2.5, 2.5, and 5 and charged IGST of 0. It covers that Bill switched to interstate with IGST tax 2200, the two-line totals of 44000, 2720, and 46720 in both shapes, the 10.20 within-state total of 10.72, the 10.20 interstate total of 10.71, an exempt trio, a rate of 0 beside a positive line, and rejection of a missing tax shape, of 2.5, 2.5, and 0, of 2.5, 2.5, and 6, and of unequal CGST and SGST.
- It covers a switch after Masters has moved to 9, 9, and 18 that still charges the copied 5, a re-choice that copies 9, 9, and 18 onto one line only, and two lines of the same product charging different rates. It covers an old within-state Bill that stays on charged percents until every product is chosen again, an old exempt line that does not count as a copy, an old interstate line that is not reset to within-state, a mixed Bill that never gains a tax shape, and a mixed Bill that can convert after the conflicting line is removed and the remaining product is chosen again.
- A preview with a tax shape returns the charged rupees. A preview without one still treats the percents as charged. A preview of blank lines still returns a footer of 0. List still returns bill number, date, receiver, and total bill.
- No new frontend test suite. The printed-summary tests are not a second seam, and they do not decide the tax. Order tests are unchanged.
- Prior art is the bill module suite and its in-memory stand-in.

## Out of Scope

- Any change to an Order.
- Choosing the tax shape from the client's state, or storing a state for the shop.
- A switch per line, or a switch that charges only CGST, only SGST, or only IGST.
- Typing a percent on a new Bill.
- Deleting Bills that were already saved, or filling in a rate that was never stored.
- Converting an old Bill on a save that does not choose the product again.
- Giving a mixed Bill a tax shape while it still contains both shapes.
- The receiver copy, the bill number, the bank block, the discount removal, stock, and WhatsApp.
- A change to the printed summary other than showing the charged rupees it already prints.
- A second test seam for HTTP, for the Bills screen, or for the printed summary.

## Further Notes

- This PRD is published in the local issue tracker. `Status: ready-for-agent` is the triage label.
- The either-or rule on a line remains the rule for a Bill that has no tax shape. A Bill that has a tax shape stores a legal tax-code trio instead, and the shape picks the side that is charged.
- The 10.20 line is the case where the two shapes do not produce the same total. Two halves of 2.5 round to 0.26 and 0.26. The single 5 rounds to 0.51.
