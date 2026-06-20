# WhatsApp Bill Delivery Phased Execution Plan

This plan turns the WhatsApp bill delivery PRD into sequential execution phases that can be handed to one AI session at a time.

Use it like this:

1. Start a new AI chat.
2. Point it at the phase section below.
3. Ask it to read the listed reference files first.
4. Tell it to complete only that phase end-to-end.
5. After the phase is done, start a fresh chat for the next phase.

## Global References

Every phase should read these first:

- `CONTEXT.md`
- `docs/prd/whatsapp-bill-delivery-prd.md`
- `docs/adr/0001-server-generated-pdf-for-whatsapp-bill-delivery.md`
- `docs/adr/0002-track-whatsapp-delivery-status-separately-from-bill-creation.md`
- `docs/adr/0003-use-bullmq-worker-for-whatsapp-bill-delivery.md`
- `docs/adr/0004-store-latest-whatsapp-delivery-state-in-bill-metadata.md`
- `docs/adr/0005-block-editing-during-processing-with-force-cancel-escape-hatch.md`
- `docs/adr/0006-use-best-effort-force-cancel-for-whatsapp-delivery.md`
- `docs/adr/0007-use-operator-controlled-whatsapp-service-toggle.md`
- `docs/adr/0008-block-resend-when-whatsapp-service-is-disabled.md`
- `docs/adr/0009-store-whatsapp-service-toggle-in-database.md`
- `docs/adr/0010-use-a-single-global-whatsapp-service-setting.md`

## Phase 1: Global WhatsApp Service Setting

### Goal

Introduce the global database-backed WhatsApp service setting, default it to disabled, expose it in backend and frontend settings, and make the backend the source of truth.

### Read First

- `server/app.js`
- current server route/controller structure for settings or similar config flows
- current frontend settings/config pages if they exist
- current bills create/resend services to see where enforcement will later plug in

### Scope

- Add persistent database storage for the global WhatsApp service setting.
- Add backend read and update APIs for that setting.
- Add frontend settings UI to enable or disable the setting.
- Default the setting to `false`.
- Add backend hard-check helpers that later phases can reuse for delivery gating.

### Do Not Do Yet

- No BullMQ.
- No worker.
- No bill send checkbox.
- No resend logic.
- No status UI.

### Deliverables

- Schema change or settings persistence mechanism for the global toggle.
- Backend settings endpoints.
- Frontend settings page/control.
- Basic validation and error handling.

### Done When

- A shopkeeper can enable or disable the WhatsApp service from the app.
- Reloading the app keeps the chosen value.
- Default behavior on a fresh system is disabled.
- Backend returns the current setting through an API.

### Handoff Prompt

Implement only Phase 1 from `docs/plan/whatsapp-bill-delivery-phases.md`. Read all global references first, then read the Phase 1 files listed there. Complete the phase end-to-end, including schema/API/UI and verification, but do not start any later phase.

## Phase 2: Shared Bill PDF Extraction

### Goal

Make the existing bill PDF layout reusable from both frontend and backend without changing the current bill view behavior.

### Read First

- `client/src/components/bill-pdf/BillPDF2.jsx`
- `client/src/components/bill-pdf/SinglePagePDF.jsx`
- `client/src/components/bill-pdf/DoublePagePDF.jsx`
- `client/src/pages/bills.js/components/BillsView.jsx`

### Scope

- Extract a shared React PDF bill document module.
- Keep the current frontend bill view working exactly as before.
- Make the shared document importable from server-side code in a later phase.

### Do Not Do Yet

- No actual server-side PDF generation pipeline.
- No WhatsApp integration.
- No queue work.

### Deliverables

- Shared bill PDF document abstraction.
- Frontend bill view updated to use the shared abstraction.
- Confidence that current rendered bill output is unchanged.

### Done When

- The existing bill view still renders correctly.
- There is one canonical bill document definition instead of duplicated frontend-only layout ownership.

### Handoff Prompt

Implement only Phase 2 from `docs/plan/whatsapp-bill-delivery-phases.md`. Read all global references first, then the Phase 2 files. Extract the shared bill PDF document so frontend rendering stays unchanged, and stop after this phase.

## Phase 3: Bill Metadata and Create-Flow Gating

### Goal

Add `whatsapp_metadata` to bills and prepare the create-bill flow to respect the global service setting, without sending anything yet.

### Read First

- `server/controllers/bills.js`
- `server/routes/bills.js`
- `server/validators/bills.js`
- `client/src/pages/bills.js/components/BillsForm.jsx`
- `client/src/services/bills.js`

### Scope

- Add `whatsapp_metadata` storage to bills.
- Define latest delivery state shape with initial statuses.
- Show `Send Bill on WhatsApp` checkbox on create only when service is enabled.
- Default checkbox to checked.
- If unchecked, create bill with status `no`.
- If enabled and checked, create bill with status prepared for later `processing` enqueue flow, but do not wire queue yet.
- Hide the checkbox entirely when the service is disabled.

### Do Not Do Yet

- No BullMQ enqueue.
- No real sending.
- No resend/cancel endpoints.

### Deliverables

- Bill schema support for `whatsapp_metadata`.
- Create-bill UI checkbox behind service setting.
- Persisted initial metadata on bill creation.

### Done When

- Bills can be created whether the service is enabled or disabled.
- When disabled, create flow behaves like normal billing and the checkbox is absent.
- When enabled, checkbox is visible and default checked.
- New bills persist the correct latest WhatsApp status seed data.

### Handoff Prompt

Implement only Phase 3 from `docs/plan/whatsapp-bill-delivery-phases.md`. Read all global references plus the Phase 3 files. Add `whatsapp_metadata` and create-flow gating, but do not add queueing or sending yet.

## Phase 4: Queue Bootstrap and Enqueue on Create

### Goal

Introduce BullMQ and Redis, enqueue delivery work during bill creation, and move eligible bills to `processing` immediately without slowing create-bill response time.

### Read First

- all Phase 3 outputs
- `server/package.json`
- server startup structure and environment loading
- any shared server utility patterns for external service modules

### Scope

- Add BullMQ and Redis dependencies/config.
- Create queue module and worker bootstrap.
- Add configurable worker concurrency.
- On create-bill, if service is enabled and checkbox is checked, set status to `processing`, assign job metadata, and enqueue delivery work.
- Keep create-bill request fast and independent from worker completion.
- Add backend hard reject if delivery is requested while service is disabled.

### Do Not Do Yet

- No real WhatsApp send implementation.
- No resend endpoint.
- No cancel endpoint.
- No UI status polling yet.

### Deliverables

- BullMQ wiring.
- Delivery enqueue path from bill creation.
- `processing` status and job metadata persistence.

### Done When

- Bill creation returns quickly.
- Eligible bills move to `processing` immediately on enqueue.
- Queue jobs are visible to the worker process.
- Delivery request is hard-rejected if the service is disabled.

### Handoff Prompt

Implement only Phase 4 from `docs/plan/whatsapp-bill-delivery-phases.md`. Read all global references and Phase 4 dependencies. Add BullMQ, Redis config, and create-flow enqueueing. Stop before real WhatsApp sending.

## Phase 5: Worker Send Flow and Latest Outcome Persistence

### Goal

Make the worker generate the PDF on the server, upload/send through WhatsApp, discard the PDF, and persist the latest success or failure outcome.

### Read First

- all Phase 2 and Phase 4 outputs
- shared bill PDF module
- bill fetch/query paths needed for fresh worker reads

### Scope

- Implement server-side PDF generation using the shared React PDF layout.
- Add WhatsApp provider service wrapper for media upload and template send.
- Make the worker fetch fresh bill data before generating and sending.
- Persist latest success and failure fields into `whatsapp_metadata`.
- Discard generated PDF bytes after each attempt.

### Do Not Do Yet

- No resend UI.
- No cancel flow.
- No edit-blocking.

### Deliverables

- Worker send pipeline.
- Provider integration wrapper.
- Latest outcome persistence.

### Done When

- A created bill in `processing` can transition to `success` after worker completion.
- Failure updates latest status to `failed` with useful latest error metadata.
- No PDF files are persisted after the attempt ends.

### Handoff Prompt

Implement only Phase 5 from `docs/plan/whatsapp-bill-delivery-phases.md`. Read all global references and the outputs from Phases 2 and 4. Build the real worker send flow and persist latest outcomes, but do not start resend or cancel work yet.

## Phase 6: Bills UI Status Visibility and Polling

### Goal

Show the latest WhatsApp delivery state in the bills UI, including `processing(XXs)` and polling while processing.

### Read First

- bills list and bill detail components
- bill fetching services
- any existing polling/query usage patterns in frontend

### Scope

- Add WhatsApp delivery status column in bill list.
- Add status rendering in bill detail or relevant bill surfaces.
- Show `no`, `processing`, `success`, `failed`, `canceled`.
- Show `processing(XXs)` timer.
- Poll latest bill data while status is `processing`.
- Make polling interval configurable.

### Do Not Do Yet

- No resend action.
- No cancel modal/action.
- No edit blocking.

### Deliverables

- Bills UI status presentation.
- Timer rendering.
- Polling behavior.

### Done When

- Operators can see latest WhatsApp state in the UI.
- `processing` shows a live elapsed timer.
- UI refreshes status automatically while processing.

### Handoff Prompt

Implement only Phase 6 from `docs/plan/whatsapp-bill-delivery-phases.md`. Read all global references and the bills UI/service files. Add status visibility, timer rendering, and polling only.

## Phase 7: Resend Flow with Service-Gated UX

### Goal

Add resend as a dedicated action with proper status rules, backend enforcement, and disabled-service explanation.

### Read First

- all Phase 5 and Phase 6 outputs
- bill routes/controllers/services
- bills UI action surfaces

### Scope

- Add dedicated resend endpoint.
- Allow resend only for `no`, `success`, `failed`, `canceled`.
- Block resend for `processing`.
- Block resend when the global service is disabled.
- Re-enqueue resend as `processing`.
- Add UI resend action.
- If disabled by service toggle, show clear explanation and navigation path to settings.

### Deliverables

- Resend API.
- Resend UI action.
- Disabled-service user explanation flow.

### Done When

- Resend works for eligible bills.
- Resend is blocked during processing.
- Resend is blocked when the service is disabled, with a clear operator-facing reason.

### Handoff Prompt

Implement only Phase 7 from `docs/plan/whatsapp-bill-delivery-phases.md`. Read all global references plus the resend-related files. Add dedicated resend behavior with proper status and service-toggle enforcement.

## Phase 8: Force Cancel Delivery

### Goal

Let operators cancel a processing delivery safely, both from waiting and active queue states.

### Read First

- all Phase 4, 5, 6, and 7 outputs
- queue and worker code
- bills UI status/action rendering

### Scope

- Add cancel endpoint.
- Add confirmation modal from processing status UI.
- If job is waiting, remove it from BullMQ.
- If job is active, set cancel-request metadata and make worker self-abort between major steps.
- Persist final `canceled` state.
- Prevent late success after cancel has been recorded.

### Deliverables

- Cancel API.
- Cancel confirmation UI.
- Worker cancel checks.

### Done When

- Operators can cancel from `processing` immediately.
- Waiting jobs are removed cleanly.
- Active jobs stop safely on best effort.
- Final status becomes `canceled` instead of `failed`.

### Handoff Prompt

Implement only Phase 8 from `docs/plan/whatsapp-bill-delivery-phases.md`. Read all global references plus queue, worker, and bills UI files. Add force-cancel end-to-end and stop after that.

## Phase 9: Edit Blocking and Send Updated Bill

### Goal

Block normal editing while a bill is `processing`, and after updates allow the shopkeeper to choose whether to resend the updated bill.

### Read First

- `client/src/pages/bills.js/components/BillsForm.jsx`
- update bill backend paths
- all resend/cancel outputs from earlier phases

### Scope

- Prevent bill editing while WhatsApp status is `processing`.
- Surface force-cancel path when a bill is locked by processing.
- After successful update, ask whether to send the updated bill.
- If yes, reuse resend logic.
- If no, leave the bill updated without sending.

### Deliverables

- Edit-blocking behavior.
- Update confirmation flow.
- Update-to-resend integration.

### Done When

- Processing bills are not normally editable.
- Force-cancel unlocks them.
- Updated bills can optionally be resent using the same delivery workflow.

### Handoff Prompt

Implement only Phase 9 from `docs/plan/whatsapp-bill-delivery-phases.md`. Read all global references, the bill form/update flow, and the earlier resend/cancel phases. Complete only edit blocking and send-updated-bill behavior.

## Phase 10: Hardening, Verification, and Cleanup

### Goal

Stabilize the full workflow, add missing tests, improve operator feedback, and clean up any integration rough edges.

### Read First

- all outputs from Phases 1 through 9
- current test structure if any

### Scope

- Add or improve tests around the highest workflow seam.
- Verify service-toggle enforcement, enqueueing, worker outcomes, resend, cancel, edit blocking, and update resend.
- Tighten metadata handling and operator-facing errors.
- Confirm the shared PDF stays visually consistent.
- Clean up naming, config docs, and implementation gaps left by earlier phases.

### Deliverables

- Test coverage for key workflow behavior.
- Final config notes.
- Polished user-facing status and error handling.

### Done When

- The whole workflow is stable enough for real usage.
- Core scenarios from the PRD are verified.
- There are no known gaps in the end-to-end operator flow.

### Handoff Prompt

Implement only Phase 10 from `docs/plan/whatsapp-bill-delivery-phases.md`. Read all global references and all prior phase outputs. Focus on hardening, testing, and final cleanup without introducing new product scope.
