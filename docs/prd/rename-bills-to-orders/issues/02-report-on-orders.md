Status: ready-for-agent

## What to build

An operator runs the retail or wholesale range report, downloads the wholesale CSV, opens the wholesale PDF for a mobile, and opens a client's wholesale report. The sales, numbers, and totals are the ones those reports already showed. Labels, downloaded file names, and error text say order. An old report link opens the matching orders report.

## Acceptance criteria

- [ ] The retail and wholesale range reports list the same orders between the same from and to numbers
- [ ] The wholesale CSV and the wholesale PDF by mobile contain the same sales, under order wording
- [ ] The client wholesale report lists that client's orders with the same numbers and totals
- [ ] An old range-report, wholesale CSV, or wholesale PDF link opens the orders version of that report
- [ ] A missing or failed report says order, and an empty range is still empty

## Blocked by

- [01 — Rename the sale to an order](01-rename-the-sale-to-an-order.md)
