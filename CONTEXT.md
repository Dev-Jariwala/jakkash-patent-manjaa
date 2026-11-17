# Jakkash Billing

This context covers Orders, Bills, client records, and outbound delivery of orders. It exists to keep the billing language consistent as the app grows beyond local PDF viewing into message-driven delivery flows.

## Language

**Order**:
The commercial record created for a retail or wholesale sale, including client details, line items, totals, and delivery/payment state.
_Avoid_: Bill, invoice, receipt

**Client**:
The person or business identified by mobile number who receives an order.
_Avoid_: Customer, buyer, account

**Client profile**:
Pincode, state, city, GST, contact person, and contact number for a client. GST is one of three states: blank (empty GST number, mark off), a 15-character GSTIN, or GST not applicable (mark on, GST number empty). Maintained only from the clients screen; order create updates name and address but does not write the profile. Stores a state id and a city id only, not a country.
_Avoid_: Customer account, invoice address

**GST not applicable**:
A client profile mark that means the client has no GSTIN. The GST number stays empty; list, CSV, and report show N/A. Many clients may carry the mark. The letters N/A are not stored in the GST number.
_Avoid_: White Bill, regular client, typing N/A as a GST number

**Country**:
A shared location row in the countries list, identified by name and ISO codes. The client form resolves India without a country control; Masters shows every country row, including inactive ones.
_Avoid_: Nation, region

**State**:
A shared location row tied to a country. A client profile stores a state id. The client form offers active states for India only; Masters shows every state row, including inactive ones, with the country name.
_Avoid_: Province, territory

**City**:
A shared location row tied to a state. A client profile stores a city id that must belong to the selected state. The client form offers active cities for the selected state; Masters shows every city row, including inactive ones, with the state name.
_Avoid_: Town, locality

**Product**:
An item in one collection whose category is Product or Labour, and that may name one tax code. When it does, Product names an HSN and Labour names a SAC; it stores the tax code id only, shows the type, code, and description currently on that Masters row, and does not keep CGST, SGST, or IGST rates.
_Avoid_: Bill line, storing rates on the product, a required tax code

**Inactive product**:
A product the operator has turned off. It stays listed: the products list opens on active products, with a status control for inactive products and for all products. It is not available for a new choice on an Order, a Bill, or stock-in, and a new collection leaves it out.
_Avoid_: deleted, the unused delete flag

**Stock in hand**:
The quantity of a Product currently held in a collection. Labour is counted the same way. Receiving stock adds to it; an Order or a Bill takes from it. A Bill refuses a save when the sum of that Product's line quantities is more than stock in hand can cover.
_Avoid_: Inventory, available count, total stock

**Tax code**:
A catalog row on Masters (HSN/SAC tab) for goods or services: a stable id, a digits-only statutory code, a required description, and default CGST, SGST, and IGST rates. HSN is 4, 6, or 8 digits; SAC is 6 digits. The code is unique within its type; the same digits may exist once as HSN and once as SAC. Type is fixed at create; there is no delete. A product may name one tax code by id.
_Avoid_: Live rate lookup on a saved Bill line

**Shop bank account**:
The shop's one current account of bank name, bank address, account number, and IFSC, maintained on Bank details. The first save creates the only row; every later save updates that same row. There is no delete.
_Avoid_: Bank details as a second concept, a list of accounts

**Bill bank block**:
The copy of bank name, bank address, account number, and IFSC stored on a Bill when it is raised and printed only on that Bill's PDF. It does not store a bank id and is not refreshed when the shop bank account or the Bill is edited later.
_Avoid_: Live account lookup on the Bill PDF, bank fields on the Order PDF

**Bill**:
A GST document entered directly for one collection. It is not created from an Order, and it takes the products it names out of stock.
_Avoid_: Order, invoice, calling it an invoice or an Order

**Bill number**:
The three-part number of a Bill, stored as one hyphenated value, unique within the collection it was raised in. On a new Bill the series is chosen, the year is the collection's current bill year, and the serial is generated. Once saved, the number does not change.
_Avoid_: Invoice number, order number, typing the year or the serial

**Bill series**:
The name printed on a Bill, fixed once saved, active or inactive, and a new Bill will offer it only while it is active.
_Avoid_: shop code, and a label besides the name

**Bill year**:
The year a collection stores, printed as the second part of a Bill raised while that year is current. A saved Bill keeps the year it was raised with.
_Avoid_: the collection name

**Bill serial**:
The generated third part, counted inside one collection for one bill series and one bill year.
_Avoid_: a shop-wide sequence, and a typed number

**Receiver**:
A client with a GSTIN or GST not applicable that a Bill was raised to. A client whose GST is blank is not a Receiver. The Bill stores that client's id and a copy of the name, address, GST number (a GSTIN or the words N/A when the client is GST not applicable), contact person, and contact number taken when that client was chosen for the save.
_Avoid_: Live client lookup, customer, any client with blank GST

**Tax shape**:
A Bill's single choice of which copied rates are charged. Within-state charges the copied CGST and SGST. Interstate charges the copied IGST. A new Bill opens on within-state. The client's state does not set it.
_Avoid_: A three-way CGST, SGST, or IGST switch, outside-state, intrastate

**Bill line**:
A line on a Bill: one Product at one rate. The same Product may appear on more than one Bill line when each line's rate differs; the same Product at the same rate is one line. It stores the product id, a copy of the product name, and the rate charged, plus the tax code id and a copy of the code, the tax code's description, and the tax code's CGST, SGST, and IGST from when that product was chosen. The Bill's tax shape decides which of those rates are charged. A line saved before tax shape stores the percents charged until that product is chosen again on a Bill whose lines share one shape.
_Avoid_: Order line, joining the live product or tax code at display time, a separate HSN/SAC choice on the Bill, calling the stored numbers the percents charged on a new Bill, a live rate lookup

**Total bill**:
The amount of a Bill after the tax.
_Avoid_: Total invoice, amount due

**Export**:
One PDF of printed Bills for a span of Bills in the active collection.
_Avoid_: Report, a downloaded file, a zip, Order Delivery

**Order Delivery**:
The act of sending an order to a client through an outbound channel after the order has been created.
_Avoid_: Share, forward, export

**WhatsApp Order Delivery**:
An automatic order delivery attempt that uses a WhatsApp template and an attached order document for the order's mobile number.
_Avoid_: Manual WhatsApp share, chat open

**Send Order on WhatsApp**:
An operator choice on order creation that controls whether the system should attempt WhatsApp order delivery for that order.
_Avoid_: Auto share, notify client

**WhatsApp Delivery Status**:
The current lifecycle state of an order's WhatsApp order delivery, used by operators to see whether the order has not been sent, is being sent, was sent successfully, or failed.
_Avoid_: Message state, share status

**Processing**:
The WhatsApp delivery status that means an order has been accepted for asynchronous delivery and should not be resent yet.
_Avoid_: Pending, queued, sending

**Processing Timer**:
The live elapsed time shown in the UI while an order remains in `processing`, starting from the moment delivery is enqueued.
_Avoid_: Stale threshold, timeout badge

**Resend Order**:
An operator-triggered request to start a new WhatsApp order delivery attempt for an order whose current WhatsApp delivery status is not in progress.
_Avoid_: Retry job, duplicate send

**Send Updated Order**:
An operator choice shown after editing an order that decides whether the system should trigger the same delivery flow used for resend.
_Avoid_: Update notification, edit sync

**Force Cancel Delivery**:
An operator action that stops a stuck in-progress WhatsApp order delivery so the order can be edited and optionally sent again.
_Avoid_: Soft cancel, ignore job

**Canceled Delivery**:
The latest WhatsApp delivery outcome that means an operator force-canceled the in-progress delivery before the system completed it.
_Avoid_: Failed, expired

**WhatsApp Delivery Queue**:
The asynchronous work pipeline that performs WhatsApp bill delivery after order creation without blocking the order creation request.
_Avoid_: Background thread, async send

**Order Delivery Template**:
The single WhatsApp template used for automatic order delivery for both retail and wholesale orders.
_Avoid_: Retail template, wholesale template

**WhatsApp Metadata**:
The latest WhatsApp order delivery summary stored on the order as a single JSON object, including status and the latest attempt result fields.
_Avoid_: Attempt history, delivery log

**WhatsApp Service Toggle**:
An operator-controlled setting that enables or disables WhatsApp order delivery for the shop, with the default state set to disabled.
_Avoid_: Developer flag, temporary hack

**WhatsApp Service Setting**:
The persistent database-backed shop setting that stores whether WhatsApp order delivery is enabled or disabled.
_Avoid_: Env-only flag, local UI state

**Global WhatsApp Service Setting**:
The single application-wide WhatsApp service setting that applies to all billing flows rather than varying by collection.
_Avoid_: Per-collection WhatsApp toggle, local override

**Disabled Service Reason**:
The operator-facing explanation shown when WhatsApp order delivery actions are unavailable because the WhatsApp service toggle is off.
_Avoid_: Silent disable, hidden block
