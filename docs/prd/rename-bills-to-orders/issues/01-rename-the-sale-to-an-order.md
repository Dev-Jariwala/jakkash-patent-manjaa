Status: ready-for-agent

## What to build

An operator opens Orders and finds every existing sale still there, with the same number, client, totals, payment, physical delivery, and WhatsApp status. Creating an order continues the number sequence for that collection and sale type. Editing keeps every amount and line the operator did not touch. A new mobile still inserts a client with name, mobile, and address. A later order for an existing mobile still replaces only name and address, and an edit still does not change the client. The printed document keeps its layout and Order No label, and a QR code already on paper still scans. Paid, delivered, scanner, settings, and WhatsApp actions say order and follow the same rules, including the processing lock, force cancel, and Send Order on WhatsApp defaulting to checked only when delivery is enabled. The approved WhatsApp template, the delivery queue, and the stored delivery statuses stay as they are. The dashboard says Total Orders and shows the same count. An old list, create, view, or edit link opens the matching Orders screen. The glossary calls this record an order. Range, wholesale, and client reports still return the same sales, so those screens are not empty before their wording changes.

## Acceptance criteria

- [ ] The sidebar, list, breadcrumbs, and dashboard say Orders, and Total Orders is the same count as before
- [ ] Retail and wholesale stay separate lists and separate number sequences, with search, sort, and paging unchanged and the newest order first by default
- [ ] An existing sale keeps its id, number, sale type, client details, line items, totals, dates, payment, delivery, and WhatsApp status through the rename and through a rollback
- [ ] Create, fetch, update, next number, mark paid, and mark delivered use order names and return the same totals, dates, client, and WhatsApp status that were saved
- [ ] Order create still inserts a client for a new mobile and replaces only name and address for an existing mobile; editing an order does not write the client
- [ ] The printed document keeps its layout, prices, shop phone, page split, and Order No label, and existing QR codes still resolve
- [ ] WhatsApp send, resend, cancel, the processing timer, the edit lock, and the settings switch keep their current behavior, say order, and do not change the template, the delivery queue, or the stored delivery statuses
- [ ] Send Order on WhatsApp is offered and checked by default only when delivery is enabled, and declining the post-edit prompt leaves the order saved and unsent
- [ ] An old list, create, view, or edit link opens the same sale, including its sale type
- [ ] Product, stock, and purchase report documents are unchanged
- [ ] The orders API tests cover create, list, fetch, update, next number, mark paid, and mark delivered against an in-memory store, and the migration test shows one pre-rename row surviving up and down
- [ ] The glossary defines Order as this record and lists Bill, invoice, and receipt as words to avoid, and a decision record explains the in-place rename

## Blocked by

None - can start immediately
