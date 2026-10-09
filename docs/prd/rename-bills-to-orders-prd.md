Status: ready-for-agent

# Rename Bills to Orders PRD

## Problem Statement

The shop treats each sale as an order. The printed document already labels the number Order No. The rest of the product still says Bill: the navigation, the dashboard, the create and edit screens, the scanner, settings, WhatsApp prompts, the API, and the stored tables. Operators have two names for one record. There is no separate order that later becomes a bill. Renaming the word must not change a number, a total, a payment, a delivery, a WhatsApp send, or a row that already exists.

## Solution

Order becomes the name of that same commercial record everywhere the operator, the API, and the database see it. Bill is retired as a synonym. Retail and wholesale stay retail and wholesale. Line items, totals, dates, payment, physical delivery, and WhatsApp delivery keep their current behavior. Existing rows are renamed in place, so the same UUID, number, and totals remain. The printed layout stays as it is, including the Order No label. A bookmark that still says Bills opens the Orders screen.

## User Stories

1. As an operator, I want the sales record called an order, so that the screen matches the word already printed on the document.
2. As an operator, I want one name for that record, so that I am not switching between Bill and Order for the same sale.
3. As an operator, I want the sidebar to say Orders, so that I open the sales list under the new name.
4. As an operator, I want Orders to open the retail list, so that the landing tab stays the one I use most.
5. As an operator, I want retail and wholesale as separate order lists, so that the two sale types stay where they are.
6. As an operator, I want the dashboard count to say Total Orders, so that the home screen uses the same word.
7. As an operator, I want Total Orders to be the same count as Total Bills was, so that the home number does not jump because of a rename.
8. As an operator, I want to search the order list the way I searched the bill list, so that finding a sale still works.
9. As an operator, I want to sort and page the order list the way I did before, so that the newest order is still first unless I choose otherwise.
10. As an operator, I want each row to show the same number, client, mobile, totals, payment, and delivery state, so that a renamed list is the same list.
11. As an operator, I want the number column labeled Order No, so that the list matches the printed document.
12. As an operator, I want to create an order, so that a new sale is stored under the new name.
13. As an operator, I want the next order number to continue the existing sequence for that collection and sale type, so that numbering does not restart.
14. As an operator, I want retail and wholesale to keep separate number sequences, so that a wholesale order does not consume a retail number.
15. As an operator, I want the order date and the delivery date to save as they do today, so that those dates do not move or get a new meaning.
16. As an operator, I want line items, firki, subtotal, discount, advance, and total due to calculate as they do today, so that the money on an order does not change.
17. As an operator, I want creating an order for a new mobile to insert the client with name, mobile, and address, so that client creation from a sale still happens.
18. As an operator, I want a later order for an existing mobile to replace only that client's name and address, so that the client profile is not wiped by the rename.
19. As an operator, I want editing an order to leave the client unchanged, so that an order edit still does not write the client.
20. As an operator, I want to edit an order and keep every amount and line I did not touch, so that a rename is not a data rewrite.
21. As an operator, I want an order that is locked while WhatsApp delivery is in progress to stay locked, so that the edit guard still holds.
22. As an operator, I want force cancel on a stuck delivery to unlock the order, so that I can still escape a stuck send and edit.
23. As an operator, I want the create form to offer Send Order on WhatsApp when WhatsApp delivery is enabled, so that the choice uses the new name.
24. As an operator, I want that choice hidden when WhatsApp delivery is disabled, so that a disabled service still leaves ordinary selling unchanged.
25. As an operator, I want Send Order on WhatsApp to default to checked when the service is on, so that the default I have today stays.
26. As an operator, I want to uncheck sending for one order, so that I can still skip delivery for an exception.
27. As an operator, I want a successful create to confirm that the order was created, so that the toast uses the new name.
28. As an operator, I want a create that saved the order but could not queue WhatsApp to say so, so that I still know the sale exists and the send did not start.
29. As an operator, I want after an edit to be asked whether to send the updated order, so that the same post-edit choice remains.
30. As an operator, I want declining that prompt to leave the order saved and unsent, so that declining still does not send.
31. As an operator, I want accepting that prompt to send through the same resend flow, so that an updated order uses the delivery path that already exists.
32. As an operator, I want WhatsApp delivery status to stay no, processing, success, failed, or canceled, so that the lifecycle words do not change.
33. As an operator, I want the processing timer to keep counting from the moment delivery was queued, so that a rename does not reset or hide the timer.
34. As an operator, I want resend called Resend Order, so that the action name matches the record.
35. As an operator, I want resend blocked while status is processing, so that two sends still cannot be in flight for one order.
36. As an operator, I want resend available from no, success, failed, and canceled, so that the cases where I can send again stay the same.
37. As an operator, I want force cancel called out as stopping the in-progress delivery, so that I can still cancel a stuck send.
38. As an operator, I want a disabled WhatsApp service to explain why send and resend are unavailable, so that the settings explanation still appears, under the order wording.
39. As an operator, I want settings to say WhatsApp order delivery, so that the switch label matches the record.
40. As an operator, I want the settings switch to keep enabling and disabling delivery for the whole shop, so that the global toggle does not become per collection or per sale type.
41. As an operator, I want marking an order paid to work as it does today, so that payment state survives the rename.
42. As an operator, I want marking an order delivered or not delivered to work as it does today, so that physical delivery survives the rename.
43. As an operator, I want the paid and delivered confirmations to say order, so that those prompts match the rest of the screen.
44. As an operator, I want the scanner to find an order from the printed QR code, so that codes already on paper still open the right sale.
45. As an operator, I want the scanner dialogs to say order, so that paid, delivered, missing, and invalid-code messages match the new name.
46. As an operator, I want a scanned order that is locked for WhatsApp to stay locked in the scanner, so that the scanner does not bypass the edit guard.
47. As an operator, I want to open the order document from the list, so that I can still view and print it.
48. As an operator, I want the printed document to keep its current layout, prices, shop phone, and Order No label, so that the paper a client receives does not get a new design.
49. As an operator, I want a long order to keep the two-page layout and a short order the one-page layout, so that the page split does not move.
50. As an operator, I want the QR on a new document to encode the same kind of id as before, so that a newly printed code still scans.
51. As a client, I want the WhatsApp message to use the same approved template, so that the message I receive does not change because the shop renamed the screen.
52. As a client, I want that message to still include my name and the order number, so that I can tell which sale it is.
53. As an operator, I want a range report for retail or wholesale orders, so that the from-number and to-number report still runs.
54. As an operator, I want the wholesale CSV and the wholesale PDF by mobile, so that those exports still exist under the order name.
55. As an operator, I want the client wholesale report to list that client's orders, so that client follow-up still shows the same sales.
56. As an operator, I want product, stock, and purchase reports to export as they do today, so that those reports are not rewritten by the order rename.
57. As an operator, I want an old Bills link to open the matching Orders screen, so that a bookmark or a copied link still lands on the sale.
58. As an operator, I want an old link that named a specific sale or sale type to open that same sale, so that the id and the retail or wholesale choice survive the redirect.
59. As an operator, I want error messages that used to say bill to say order, so that a missing sale, a failed save, or a failed list uses one word.
60. As an operator, I want every existing order still present after the rename is applied to the database, so that no sale is dropped or duplicated.
61. As an operator, I want each existing order to keep its id, number, sale type, client details, line items, totals, dates, payment, delivery, and WhatsApp status, so that history is the same history.
62. As an operator, I want the glossary to call this record an order, so that later work does not reintroduce Bill as the name.

## Implementation Decisions

- Order replaces Bill as the name of the same record. This is a rename. It does not add a second record, a status that means "ordered but not billed," or a step between the sale and the document.
- The glossary is updated with this work. Order is the commercial record: client, line items, totals, and delivery and payment state. Bill is listed to avoid, along with invoice and receipt. The derived terms follow: Order Delivery, WhatsApp Order Delivery, Send Order on WhatsApp, Resend Order, Send Updated Order, and Order Delivery Template. Older decision records and PRDs stay as historical text. A new decision record states why the rename is in place: the printed document already said Order No, and a separate order-then-bill flow was rejected.
- Stored tables are renamed in place. The sales table becomes orders. The line-item table becomes order items. The id, number, sale type, and line-item id columns take the order names. Constraints and indexes that used the old names are renamed with them. Values are not copied into new rows. The order date and delivery date columns already use those words and stay. Retail and wholesale remain the only sale types.
- The rename is a new migration that only renames. It has a down path that renames back. Migrations that have already run are left as they are. The fresh-install schema is updated to the new names so a new database matches a migrated one.
- The collection API moves from the bills paths to the orders paths: list, create, fetch, update, next number, range report, wholesale CSV, wholesale PDF by mobile, payment, delivered, WhatsApp resend, and WhatsApp cancel. Request and response fields use order, order id, order number, order type, and send order on WhatsApp. The dashboard count is total orders and is the same count query as before. The old API paths are not kept. The app and the API change together.
- The operator routes move from /bills to /orders, including create, view, update, retail, wholesale, and the range report. Query parameters use order id and order type. A visit to an old /bills URL redirects to the matching /orders URL, including those parameters, so a bookmark and the open-in-new-tab document link still resolve.
- Operator-facing copy uses order: navigation, breadcrumbs, dashboard, form labels, toasts, validation text, scanner dialogs, paid and delivered prompts, settings, and the WhatsApp send, resend, cancel, and send-updated prompts. Code names, modules, and the shared document package take the order name so the codebase matches the glossary.
- The printed document's layout, prices, shop phone, page split, and Order No label stay. The QR payload stays the row id. Existing printed codes keep scanning because those id values are not regenerated.
- WhatsApp delivery behavior is unchanged. The delivery queue keeps its current name so a job already waiting is still processed. The approved template name and its body stay as configured with the provider. Template parameters stay the client name and the number. The metadata object on the order keeps its current keys and the statuses no, processing, success, failed, and canceled. Cancel continues to look up the stored job id, so a job created before the rename can still be canceled. New job ids may use an order prefix; nothing parses that prefix to decide behavior.
- Client maintenance is unchanged. An order create for a new mobile inserts name, mobile, and address and an empty profile. An order create for an existing mobile replaces only name and address. An order edit does not write the client. In-progress client-profile work is left in place and is not reverted by this rename.
- Product, stock, and purchase report exports keep their current documents. They share a PDF helper with orders only as a rendering utility. Their columns and titles do not become orders.
- Analytics that sum line items by sale type keep the same sums, read through the renamed tables.

## Testing Decisions

- A good test asserts something an operator or a stored row would show: the response uses order names, the number and totals are the ones that were saved, a migrated row is the same row, a delivery status is the status that was stored. It does not assert private helper names, SQL string layout, or React state.
- There are two seams.
- The first seam is the orders API. Tests drive create, list, fetch, update, next number, mark paid, and mark delivered through the collection order routes, using an in-memory stand-in for storage the way client maintenance and WhatsApp delivery already do. They assert the response fields are the order names, that totals, dates, client, sale type, and WhatsApp status round-trip, and that the next number continues the sequence. They do not boot a live server and they do not open a database.
- The second seam is the rename migration. A test starts from a database that still has the old table and column names, inserts one sale with a line item, totals, dates, client fields, and WhatsApp metadata, runs the up migration, and reads that same id back under the new names with the same values. The down migration restores the old names and the same values. This is the only new database seam. It exists because an in-memory stand-in cannot show that a rename kept the rows.
- Existing list-ordering tests, server PDF tests, WhatsApp delivery tests, and the client WhatsApp action tests stay. They are updated to the order names so they still guard sort safety, a real PDF, delivery outcomes, and the send-updated prompt. They are prior art, not extra product seams.
- No new browser test harness. Operator screens are checked by walking the app: retail and wholesale list, create, edit, document, scanner, dashboard count, client wholesale report, settings, and the WhatsApp prompts.
- Prior art for the API seam is the in-memory client-maintenance world and the in-memory delivery world. Prior art for the migration seam is the dbmate migration runner. There is no existing migration test to extend.

## Out of Scope

- A separate order that is later turned into a bill, or any new status between sale and document.
- Changing totals, number sequences, retail versus wholesale, payment rules, or physical delivery rules.
- Redesigning the printed document, or changing the Order No label that is already on it.
- Editing the approved WhatsApp template name or the message body stored with the provider.
- Renaming the WhatsApp delivery queue, or changing metadata keys and delivery statuses.
- Rewriting historical decision records or older PRDs into the new word.
- Keeping the old API paths alive beside the new ones.
- Changing client profile rules, including what an order create writes on the client.
- Renaming product, stock, or purchase reports into orders.
- Regenerating ids, so existing printed QR codes would stop matching.

## Further Notes

- The glossary on disk still says Bill until this work updates it. The language in this PRD is the language agreed in the grilling session: Order is that record, and Bill is retired.
- The printed number is already Order No. The screens, API, and tables are the parts that still say Bill.
- QR codes store the row id only. The rename keeps those ids.
- This PRD is published under the repo's `docs/prd/` convention. The repo has no issue-tracker setup under `docs/agents/`. `Status: ready-for-agent` is recorded on this document the same way sliced issues in this repo record that role.
