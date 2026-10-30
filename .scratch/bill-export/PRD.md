Status: ready-for-agent

# Bill Export PRD

## Problem Statement

An operator who needs a run of Bills has to open them one at a time. The order Report already takes a from and a to, but that PDF is a summary table of orders, not the Bills themselves, and a Bill is not an Order. What the operator needs is those printed Bills, together, in one PDF.

## Solution

Bills gains an Export. The operator picks one span, either a bill number or a bill date, fills both ends, and submits. The PDF viewer then opens under the form on that same page. The PDF is one document. Each matching Bill is the printed Bill already used when that Bill is opened on its own, and the next Bill starts on the next page. The operator prints or saves from the viewer.

The span is for the active collection only. A bill-number span is one series, typed once, and a from and to on the third part. A bill-date span is every Bill on those dates, whatever the bill number is. A span with nothing in it, or a bill number that is not one series of whole numbers, leaves the form up and does not open the viewer.

## User Stories

1. As an operator, I want an Export control on the Bills list, so that I can gather Bills without opening them one by one.
2. As an operator, I want Export to open its own page, so that the Bills list stays a list.
3. As an operator, I want to pick Bill number or Bill date before I submit, so that one Export is one span.
4. As an operator, I want the span I did not pick to be hidden, so that I cannot submit a series and dates together.
5. As an operator, I want both ends of the span required, so that a blank end is not treated as the first Bill or the latest Bill.
6. As an operator, I want a bill-number span to ask for the series once, as two parts, so that I do not type the same series on From and on To.
7. As an operator, I want From and To on a bill-number span to be the third part only, so that `JPM` `2526` from `1` to `10` is one series.
8. As an operator, I want a bill date chosen the same way as the date on a Bill, so that the span is a calendar date.
9. As an operator, I want a successful Export to show the PDF under the form, so that I can change the span and submit again.
10. As an operator, I want a refused Export to leave the form in place and not open the viewer, so that an empty viewer is not the failure.
11. As an operator, I want changing the active collection to clear the PDF, so that I do not keep seeing another collection.
12. As an operator, I want Export to include only Bills in the active collection, so that the same bill number in another collection stays out.
13. As an operator, I want `JPM-2526` from `1` to `10` to include `JPM-2526-1`, `JPM-2526-2`, and `JPM-2526-10`, so that the span is the third part as a number.
14. As an operator, I want that PDF ordered `1`, then `2`, then `10`, so that `10` does not sort before `2`.
15. As an operator, I want `JPM-2526-08` and `JPM-2526-8` both included in `1` through `10`, so that leading zeros are the same number.
16. As an operator, I want those Bills ordered `1`, then `08`, then `8`, then `10`, so that the same number has a stable order.
17. As an operator, I want `JPM-2526-10A` left out of `1` through `10`, so that a third part that is not digits is not a number.
18. As an operator, I want `2` and `10` included when `1` was never raised, so that a missing number is a gap.
19. As an operator, I want From `10` To `1` to mean `1` through `10`, so that typing the higher end first still works.
20. As an operator, I want From `5` To `5` to include `JPM-2526-5` when that Bill exists, so that one number is a span.
21. As an operator, I want `ABC-2526-4` left out of a `JPM-2526` span, so that another series stays out.
22. As an operator, I want `jpm-2526-1` left out of a `JPM-2526` span, so that the series matches the stored text, including case.
23. As an operator, I want From `10A` or To `10A` refused, so that the ends of a bill-number span are whole numbers.
24. As an operator, I want a series part that is empty, longer than 20 characters, or contains a hyphen refused, so that the series follows the bill number.
25. As an operator, I want a typed series trimmed, so that a space around `JPM` is still the series `JPM`.
26. As an operator, I want a bill-number span with no matching Bills to stay on the form and tell me there are no Bills in that span, so that I know the span was accepted and empty.
27. As an operator, I want a bill date from 1 Apr through 3 Apr to include `JPM-2526-1` on 1 Apr, `JPM-2526-10` on 2 Apr, and `ABC-2526-4` on 3 Apr, so that a date span ignores the series.
28. As an operator, I want `JPM-2526-2` on 5 Apr left out of 1 Apr through 3 Apr, so that the later date is outside.
29. As an operator, I want a From date after the To date to still run from the earlier date through the later date, so that the order of the two dates does not matter.
30. As an operator, I want one date missing, or a date that is not a real calendar date, refused, so that a date span has two dates.
31. As an operator, I want Bills on the same date ordered by the stored series, then by a digits-only third part as a number, then by any other third part, so that the PDF is stable.
32. As an operator, I want Bills all dated 2 Apr to come out `ABC-2526-3`, `JPM-2526-2`, `JPM-2526-08`, `JPM-2526-A`, `jpm-2526-1`, so that `JPM` and `jpm` stay different series and `A` follows the numbers.
33. As an operator, I want a later date to follow an earlier date, so that 1 Apr is before 2 Apr even when the bill numbers would sort the other way.
34. As an operator, I want a date span with no Bills to stay on the form and tell me there are no Bills in that span, so that an empty month does not open a viewer.
35. As an operator, I want each Bill in the PDF to be the printed Bill I already see when I open that Bill, so that Export does not invent a second layout.
36. As an operator, I want the next Bill to start after the previous Bill's page, so that one PDF can hold many Bills.
37. As an operator, I want every matching Bill in the PDF, with no cutoff, so that a long span is still the whole span.
38. As an operator, I want the receiver, the bill lines, the tax shape, the totals, and the bank block on each page to be the copies stored on that Bill, so that Export does not look them up live.
39. As an operator, I want to print or save from the viewer, so that Export is not a zip and not one file per Bill.
40. As an operator, I want opening one Bill from the list to stay the same printed Bill, so that Export does not restyle a single Bill.
41. As an operator, I want the Bills list to stay bill number, date, receiver, and total bill, so that Export does not add a column or change search.
42. As an operator, I want a Bill in another collection, with the same number or the same date, left out, so that the span does not cross collections.

## Implementation Decisions

- The bill module gains one read, beside list and the read of one Bill. The screen calls that read. List stays a paged summary of bill number, date, receiver, and total bill. The Export read returns each matching Bill in the same shape as opening one Bill, including lines, the receiver copy, the tax shape, and the bank block. It does not join the live client, product, or tax code.
- The read takes the collection and one span. A bill-number span is two series parts and two third parts. A bill-date span is two calendar dates. Both spans at once is rejected. A missing end is rejected.
- Series parts follow the bill number: trimmed, required, no hyphen, at most 20 characters. A bad series part is rejected.
- The third parts on a bill-number span must be digits after trim. Leading zeros are allowed. A sign, a decimal point, a letter, or a blank is rejected. The reason the operator sees is that the bill number is not one series of whole numbers. Comparison uses the integer value, including a value up to 20 digits, not alphabetical order and not a floating-point compare. The span runs from the lower integer through the higher integer, inclusive.
- A stored Bill is inside a bill-number span when its first two parts equal the typed series, including case, and its third part is digits whose integer lies in the span. A stored third part that is not digits is left out. A number that was never raised is left out. Order is that integer, then the stored third part as text, so `08` comes before `8`.
- A stored Bill is inside a bill-date span when its bill date is on the earlier date through the later date, inclusive. Order is bill date, then the first part as stored text, then the second part as stored text, then digit third parts by integer and stored text, then any other third part by stored text. The text order is case-sensitive, so `JPM` and `jpm` are different series and `ABC` comes before `JPM`, which comes before `jpm`.
- A legal span with no Bills returns no Bills. The screen stays on the form and says there are no Bills in that span. It does not open the viewer. A rejected span also leaves the form up and does not open the viewer.
- There is no page cap. Every Bill the read returns is in the PDF.
- The Export page is opened from Bills. The operator picks Bill number or Bill date. The other pair is not shown and is not submitted. Both ends are required. On success the viewer sits under the form. Changing the active collection clears the viewer.
- The PDF is one document. Each returned Bill is drawn with the printed Bill page already used for one Bill, in the order the read returned. The next Bill starts on the next page. The page used when opening one Bill does not change.
- No schema change. The bill number stays one hyphenated value, unique within the collection.
- The read is a different request from opening one Bill by id, so the word export is not treated as a bill id.
- The glossary adds Export: one PDF of printed Bills for a span of Bills in the active collection. Avoid Report, a downloaded file, a zip, and Order Delivery. Order Delivery keeps its own note to avoid the word export.
- One decision records why Export stacks the existing printed Bill, why the series is typed once, and why the third part is an integer that keeps leading zeros. The rejected alternatives are a zip, a summary like the order Report, alphabetical bill numbers, and a layout used only for Export.

## Testing Decisions

- A good test asserts what an operator would notice on the PDF: which Bills came back, in which order, that a gap was skipped, that another collection was left out, or that the span was rejected. It does not assert SQL text, private helpers, HTTP status lines, or React state.
- There is one seam: the bill module. Tests call the Export read with the in-memory stand-in already used for list, read, create, and update. They do not open a database, boot HTTP, or render the screen or the PDF.
- The suite covers `JPM-2526` from `1` to `10` as `1`, `08`, `8`, `10`, with `10A` left out and a missing `1` skipped. It covers From `10` To `1` as the same span, From `5` To `5` as that one Bill, and `jpm` left out of `JPM`. It covers a bad series part and a third part that is not digits as a rejection. It covers 1 Apr through 3 Apr including another series and excluding 5 Apr, and the 2 Apr order `ABC-2526-3`, `JPM-2526-2`, `JPM-2526-08`, `JPM-2526-A`, `jpm-2526-1`. It covers an empty legal span as no Bills, and the same bill number in another collection left out. It covers a returned Bill still carrying its lines, receiver copy, tax shape, and bank block.
- List still returns bill number, date, receiver, and total bill. Order tests are unchanged.
- No new frontend test suite. Rendering the PDF is not a second seam. The page draws the Bills the read returns, with the printed Bill that already exists.
- Prior art is the bill module suite and its in-memory stand-in.

## Out of Scope

- Any change to an Order, including the order Report.
- A zip, one PDF per Bill, or a download that does not open the viewer.
- A printed layout used only for Export, or any change to the printed Bill shown for one Bill.
- Combining a series and a date span in one Export.
- A span with one end blank.
- A cap on how many Bills one Export may include.
- Deleting Bills, or including a Bill from another collection.
- Stock, WhatsApp, and Order Delivery.
- A second test seam for HTTP, for the Export page, or for the PDF.

## Further Notes

- This PRD is published in the local issue tracker. `Status: ready-for-agent` is the triage label.
- The order Report remains a summary of orders. Export is the printed Bills.
