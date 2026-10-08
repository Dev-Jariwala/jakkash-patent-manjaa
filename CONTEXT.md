# Jakkash Billing

This context covers bill creation, client records, and outbound delivery of bills. It exists to keep the billing language consistent as the app grows beyond local PDF viewing into message-driven delivery flows.

## Language

**Bill**:
The commercial record created for a retail or wholesale sale, including client details, line items, totals, and delivery/payment state.
_Avoid_: Invoice, receipt

**Client**:
The person or business identified by mobile number who receives a bill.
_Avoid_: Customer, buyer, account

**Client profile**:
Pincode, state, city, GST number, contact person, and contact number for a client. Maintained only from the clients screen; bill create updates name and address but does not write the profile.
_Avoid_: Customer account, invoice address

**Bill Delivery**:
The act of sending a bill to a client through an outbound channel after the bill has been created.
_Avoid_: Share, forward, export

**WhatsApp Bill Delivery**:
An automatic bill delivery attempt that uses a WhatsApp template and an attached bill document for the bill's mobile number.
_Avoid_: Manual WhatsApp share, chat open

**Send Bill on WhatsApp**:
An operator choice on bill creation that controls whether the system should attempt WhatsApp bill delivery for that bill.
_Avoid_: Auto share, notify client

**WhatsApp Delivery Status**:
The current lifecycle state of a bill's WhatsApp bill delivery, used by operators to see whether the bill has not been sent, is being sent, was sent successfully, or failed.
_Avoid_: Message state, share status

**Processing**:
The WhatsApp delivery status that means a bill has been accepted for asynchronous delivery and should not be resent yet.
_Avoid_: Pending, queued, sending

**Processing Timer**:
The live elapsed time shown in the UI while a bill remains in `processing`, starting from the moment delivery is enqueued.
_Avoid_: Stale threshold, timeout badge

**Resend Bill**:
An operator-triggered request to start a new WhatsApp bill delivery attempt for a bill whose current WhatsApp delivery status is not in progress.
_Avoid_: Retry job, duplicate send

**Send Updated Bill**:
An operator choice shown after editing a bill that decides whether the system should trigger the same delivery flow used for resend.
_Avoid_: Update notification, edit sync

**Force Cancel Delivery**:
An operator action that stops a stuck in-progress WhatsApp bill delivery so the bill can be edited and optionally sent again.
_Avoid_: Soft cancel, ignore job

**Canceled Delivery**:
The latest WhatsApp delivery outcome that means an operator force-canceled the in-progress delivery before the system completed it.
_Avoid_: Failed, expired

**WhatsApp Delivery Queue**:
The asynchronous work pipeline that performs WhatsApp bill delivery after bill creation without blocking the bill creation request.
_Avoid_: Background thread, async send

**Bill Delivery Template**:
The single WhatsApp template used for automatic bill delivery for both retail and wholesale bills.
_Avoid_: Retail template, wholesale template

**WhatsApp Metadata**:
The latest WhatsApp bill delivery summary stored on the bill as a single JSON object, including status and the latest attempt result fields.
_Avoid_: Attempt history, delivery log

**WhatsApp Service Toggle**:
An operator-controlled setting that enables or disables WhatsApp bill delivery for the shop, with the default state set to disabled.
_Avoid_: Developer flag, temporary hack

**WhatsApp Service Setting**:
The persistent database-backed shop setting that stores whether WhatsApp bill delivery is enabled or disabled.
_Avoid_: Env-only flag, local UI state

**Global WhatsApp Service Setting**:
The single application-wide WhatsApp service setting that applies to all billing flows rather than varying by collection.
_Avoid_: Per-collection WhatsApp toggle, local override

**Disabled Service Reason**:
The operator-facing explanation shown when WhatsApp bill delivery actions are unavailable because the WhatsApp service toggle is off.
_Avoid_: Silent disable, hidden block
