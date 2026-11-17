Status: ready-for-agent

## What to build

A client who is GST not applicable can be a Receiver, alongside a client who has a GSTIN. A client whose GST is blank stays out of the Bill.

The Receiver dropdown still shows the client name. The GST box beside it shows N/A for a marked client and the GSTIN for a client who has one. Saving a new Bill copies the words N/A onto the receiver GST when the chosen client is GST not applicable, and copies the GSTIN when the client has one. The bill preview prints that copied value on the GST line. Tax, tax shape, and the TAX INVOICE layout stay as they are.

A Bill keeps the receiver GST it copied when that client was chosen. Marking the client later does not rewrite Bills already saved. Saving a Bill again for the same receiver keeps the copied name, address, GST, contact person, and contact number. Changing the receiver copies the newly chosen client, including N/A when that client is GST not applicable.

The server still refuses a blank-GST receiver. The Bill form accepts a marked client and refuses a blank GST before save. Orders are unchanged.

Bill save tests, through the existing in-memory bill world, cover a marked client accepted with receiver GST N/A, a blank GST still refused, an edit that keeps the same receiver, and an edit that changes the receiver. The existing Bill form check accepts a marked client and still rejects a blank GST. The clients list, CSV, client report, and bill preview are not rendered.

## Acceptance criteria

- [ ] A marked client appears in the Bill receiver list, and a client with a GSTIN still appears
- [ ] A blank-GST client stays out of that list
- [ ] The Receiver dropdown shows the client name, and the GST box shows N/A or the GSTIN
- [ ] A new Bill copies N/A for a marked client and copies the GSTIN for a client who has one
- [ ] The bill preview GST line shows that copied N/A
- [ ] Saving a Bill again for the same receiver keeps the copied GST
- [ ] Changing the receiver copies the new client's GSTIN or N/A
- [ ] A later change to the client does not rewrite Bills already saved
- [ ] The server refuses a blank-GST receiver
- [ ] The Bill form accepts a marked client and refuses a blank GST before save
- [ ] Tax, tax shape, and the TAX INVOICE layout are unchanged
- [ ] Orders are unchanged
- [ ] Bill save tests cover the N/A copy, the blank-GST refusal, a same-receiver edit, and a receiver change
- [ ] The Bill form check accepts a marked client and rejects a blank GST

## Blocked by

- [01 — Mark a client GST not applicable](01-mark-a-client-gst-not-applicable.md)
