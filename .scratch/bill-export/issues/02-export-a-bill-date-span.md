Status: ready-for-agent

## Parent

[Bill Export PRD](../PRD.md)

## What to build

The Export page gains a pick: Bill number or Bill date. The span that is not picked is hidden and is not submitted. Bill date uses the same calendar date as the date on a Bill. Both dates are required.

From 1 Apr through 3 Apr includes `JPM-2526-1` on 1 Apr, `JPM-2526-10` on 2 Apr, and `ABC-2526-4` on 3 Apr, and leaves out `JPM-2526-2` on 5 Apr. Typing the later date first still runs from the earlier date through the later date. A missing date, or a date that is not a real calendar date, is refused. The form stays up and the viewer does not open.

Bills on the same date are ordered by the stored series, then by a digits-only third part as a number, then by any other third part. All dated 2 Apr, that is `ABC-2526-3`, `JPM-2526-2`, `JPM-2526-08`, `JPM-2526-A`, `jpm-2526-1`. A later date follows an earlier date even when the bill numbers would sort the other way. A legal date span with no Bills stays on the form and says there are no Bills in that span.

The PDF is the same one document as a bill-number Export: the printed Bill already used for one Bill, next Bill on the next page, in the order the read returned. A Bill on those dates in another collection stays out. Changing the active collection still clears the PDF. Sending a series and dates together is rejected.

The bill-number span from the previous slice still works. Orders are unchanged. Tests call the bill module with the in-memory stand-in. They do not render the PDF.

## Acceptance criteria

- [ ] The Export page offers Bill number or Bill date, and the span that is not picked is hidden
- [ ] A bill date is chosen the same way as the date on a Bill, and both dates are required
- [ ] 1 Apr through 3 Apr includes `JPM-2526-1`, `JPM-2526-10`, and `ABC-2526-4`, and leaves out a Bill on 5 Apr
- [ ] A From date after the To date still runs from the earlier date through the later date
- [ ] A missing date, or a date that is not a real calendar date, is refused, the form stays, and the viewer does not open
- [ ] Bills all dated 2 Apr come out `ABC-2526-3`, `JPM-2526-2`, `JPM-2526-08`, `JPM-2526-A`, `jpm-2526-1`
- [ ] A later date follows an earlier date
- [ ] A legal date span with no Bills stays on the form, says there are no Bills in that span, and does not open the viewer
- [ ] A Bill on those dates in another collection is left out, and changing the active collection clears the PDF
- [ ] A series and a date span sent together are rejected
- [ ] The PDF stacks the printed Bills in the order the read returned
- [ ] Tests on the bill module, using the in-memory stand-in, cover the 1 Apr span, the 2 Apr order, the empty span, the other collection, and a rejected date
- [ ] The bill-number Export still works, and Orders are unchanged

## Blocked by

- [01 — Export a bill-number span](01-export-a-bill-number-span.md)
