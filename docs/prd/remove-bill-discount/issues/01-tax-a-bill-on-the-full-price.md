Status: ready-for-agent

## What to build

A Bill has no discount. A new Bill and an edited Bill have no Discount(%) box. The footer stays Total value, Total tax, and Total bill. Price stays quantity times rate. Tax rupees fill from that Price and the percents, rounded half up to the paise. Total value is the sum of the Price columns. Total tax is the sum of those tax rupees. Total bill is total value plus total tax. The word Invoice does not appear.

The usual 200 at 220 with CGST 2.5, SGST 2.5, and IGST 0 saves price 44000, tax 1100 and 1100, line total 46200, and total bill 46200. A 40000 line at 2.5 and 2.5 plus a 4000 line at 9 and 9 saves total value 44000, total tax 2720, and total bill 46720, and the Price columns stay 40000 and 4000. Quantity 1 at rate 10.20 with CGST 2.5 and SGST 2.5 saves tax of 0.26 and 0.26 and a total bill of 10.72. An IGST-only line and an exempt line are taxed on the full Price.

A line with rate 0 saves when another line makes the Total bill greater than 0. A Bill whose kept lines add up to 0 is rejected, and the message says the Total bill must be greater than 0. A Bill with no kept line is still rejected as a missing line. An unfinished form may show a footer of 0, and Save stays disabled while it does. The old path that saved a zero Bill with a 100% discount is gone.

A create, an update, or a preview that still sends a discount is rejected, including a discount of 0, and the message names the discount. A saved Bill has no discount percent. A saved line has no reduced price. A later read returns Price, the tax, and the totals.

The printed summary has no Discount row. Total Taxable Value equals Total value. Final Amount equals Total bill. The CGST, SGST, and IGST rows stay.

Every Bill already raised in local and sandbox is deleted, and its lines go with it. Orders stay, including discount, advance, and total due. Raising a Bill still does not change an Order. The Bills list has no discount column. Edit taxes the rate the operator types. The receiver copy, the bill number, the bank block, and the tax shapes stay as they are.

The glossary drops Bill discount. Total bill means the amount of a Bill after the tax. One decision records that a Bill has no discount and that tax is charged on the full Price. It supersedes the decision that a percent comes off each line before tax. The rejected alternatives are keeping that percent, spreading a rupee amount across the lines before tax, and copying the Order's cut off the total after tax. One bill module remains the only writer. Tests call it with an in-memory stand-in. The discount stories in the Bill PRD are replaced by the Remove Bill discount PRD.

## Acceptance criteria

- [ ] A new Bill and Edit have no Discount(%) box, the footer stays Total value, Total tax, and Total bill, and the word Invoice does not appear
- [ ] 200 at 220 with CGST 2.5, SGST 2.5, and IGST 0 saves price 44000, tax 1100 and 1100, line total 46200, and total bill 46200
- [ ] A 40000 line at 2.5 and 2.5 plus a 4000 line at 9 and 9 saves total value 44000, total tax 2720, and total bill 46720, while the Price columns stay 40000 and 4000
- [ ] Quantity 1 at rate 10.20 with CGST 2.5 and SGST 2.5 saves tax of 0.26 and 0.26 and a total bill of 10.72
- [ ] An IGST-only line and an exempt line are taxed on the full Price
- [ ] A rate of 0 saves beside a line that makes the Total bill greater than 0
- [ ] A Bill whose kept lines add up to 0 is rejected, and the message says the Total bill must be greater than 0
- [ ] A Bill with no kept line is rejected as a missing line
- [ ] An unfinished form may show a footer of 0, and Save stays disabled while the preview Total bill is not greater than 0
- [ ] A create, an update, or a preview that sends a discount is rejected, including a discount of 0, and the message names the discount
- [ ] A saved Bill has no discount percent, a saved line has no reduced price, and a later read returns Price, the tax, and the totals
- [ ] The printed summary has no Discount row, Total Taxable Value equals Total value, Final Amount equals Total bill, and the CGST, SGST, and IGST rows stay
- [ ] Every Bill in local and sandbox is deleted with its lines, and Orders, including their discount, advance, and total due, stay
- [ ] The Bills list has no discount column, and Edit taxes the rate the operator types
- [ ] The receiver copy, the bill number, the bank block, and the tax shapes stay as they are
- [ ] Tests on the bill module, using an in-memory stand-in, cover the 46200 bill, the two-line full-price totals, the 10.72 rounding, a rate of 0 beside a positive line, the zero-total rejection, the sent-discount rejection, a read with no discount, and a blank-form preview of 0
- [ ] The glossary drops Bill discount, Total bill means the amount after the tax, and one decision supersedes the percent-before-tax decision
- [ ] The discount stories in the Bill PRD match this rule

## Blocked by

None - can start immediately
