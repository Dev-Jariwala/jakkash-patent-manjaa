Status: ready-for-agent

## Parent

[Bill Export PRD](../PRD.md)

## What to build

An operator on the Bills list opens Export. The page asks for one series, typed once as two parts, and a From and To on the third part. Both ends are required. Submitting `JPM` `2526` from `1` to `10` opens one PDF under the form. The PDF holds the printed Bill already used when one Bill is opened, one Bill after another, in the order `JPM-2526-1`, `JPM-2526-08`, `JPM-2526-8`, `JPM-2526-10`. `JPM-2526-10A` is left out. A missing `1` is a gap, not an error. From `10` to `1` is the same span. From `5` to `5` is that one Bill when it exists.

`ABC-2526-4` and `jpm-2526-1` stay out of a `JPM` series. A series part that is empty, longer than 20 characters, or contains a hyphen is refused. A third part that is not digits, such as `10A`, is refused. The form stays up, the viewer does not open, and the operator is told the bill number is not one series of whole numbers. A space around `JPM` is still the series `JPM`. A legal span with no Bills stays on the form and says there are no Bills in that span.

Each page uses the copies stored on that Bill: receiver, lines, tax shape, totals, and bank block. There is no cutoff. Opening one Bill from the list is unchanged, and the list stays bill number, date, receiver, and total bill. A Bill in another collection is left out, even with the same number. Changing the active collection clears the PDF. The operator prints or saves from the viewer. This is not a zip.

A bill-date span is the next slice. Orders, including the order Report, are unchanged.

The glossary adds Export: one PDF of printed Bills for a span of Bills in the active collection. Avoid Report, a downloaded file, a zip, and Order Delivery. Order Delivery keeps its own note to avoid the word export. One decision records why Export stacks the existing printed Bill, why the series is typed once, and why the third part is an integer that keeps leading zeros. The rejected alternatives are a zip, a summary like the order Report, alphabetical bill numbers, and a layout used only for Export.

Tests call the bill module with the in-memory stand-in. They do not render the PDF.

## Acceptance criteria

- [ ] Export on the Bills list opens an Export page that asks for the series once and for From and To on the third part
- [ ] Both ends are required, and a blank end is refused
- [ ] `JPM` `2526` from `1` to `10` returns `JPM-2526-1`, `JPM-2526-08`, `JPM-2526-8`, `JPM-2526-10`, with `10A` left out and a missing `1` skipped
- [ ] From `10` to `1` is that same span, and From `5` to `5` is that one Bill
- [ ] `ABC-2526-4` and `jpm-2526-1` stay out of series `JPM` `2526`
- [ ] A bad series part, or a third part that is not digits, is refused, the form stays, and the viewer does not open
- [ ] A space around the series is trimmed
- [ ] A legal span with no Bills stays on the form, says there are no Bills in that span, and does not open the viewer
- [ ] A successful Export shows one PDF under the form, each Bill the printed Bill already used for one Bill, the next Bill on the next page, with no cutoff
- [ ] Each Bill still carries its stored lines, receiver copy, tax shape, totals, and bank block
- [ ] Opening one Bill is unchanged, and the list stays bill number, date, receiver, and total bill
- [ ] The same bill number in another collection is left out, and changing the active collection clears the PDF
- [ ] Tests on the bill module, using the in-memory stand-in, cover the order, the gap, the other series, the other collection, the empty span, and the rejections
- [ ] The glossary records Export, and a decision records the stacked printed Bill, the series typed once, and the integer third part
- [ ] A bill-date span is left for the next slice, and Orders are unchanged

## Blocked by

None - can start immediately
