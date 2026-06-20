# WhatsApp Bill Delivery PRD

## Problem Statement

Shopkeepers currently collect a client's phone number while creating retail and wholesale bills, but bill delivery still depends on manual follow-up. The bill PDF is rendered only in the frontend today, so there is no reliable backend-owned artifact that can be sent automatically through WhatsApp. The result is extra operator effort, inconsistent bill delivery, no delivery status visibility, no safe retry or cancel flow, and no maintenance switch for periods when WhatsApp delivery should be paused without affecting normal billing.

## Solution

Add an optional WhatsApp bill delivery workflow that automatically sends a newly created bill to the client's WhatsApp number using a single global bill delivery template. The workflow is guarded by a global database-backed WhatsApp service setting that defaults to disabled. When enabled, bill creation shows a checked-by-default `Send Bill on WhatsApp` option, enqueues asynchronous delivery work, and tracks the latest delivery status directly on the bill. Delivery runs through a BullMQ worker backed by Redis so bill creation stays fast. Operators can see statuses such as `no`, `processing`, `success`, `failed`, and `canceled`, watch a live processing timer, force-cancel stuck sends, resend eligible bills later, and temporarily disable the entire WhatsApp service without changing how ordinary billing works.

## User Stories

1. As a shopkeeper, I want WhatsApp bill delivery to be disabled by default, so that nothing changes in my billing flow until I intentionally turn it on.
2. As a shopkeeper, I want a global WhatsApp service setting, so that I can enable or disable the feature for the whole app from one place.
3. As a shopkeeper, I want billing to work exactly as it does today when the WhatsApp service is disabled, so that maintenance or non-use of the feature never blocks sales.
4. As a shopkeeper, I want the `Send Bill on WhatsApp` checkbox to appear only when the service is enabled, so that the create-bill form stays simple when the feature is off.
5. As a shopkeeper, I want the create-bill checkbox to default to checked, so that most bills are sent without extra clicks once I have enabled the feature.
6. As a shopkeeper, I want to uncheck bill sending for a specific bill, so that I can skip delivery for exceptions without turning off the whole service.
7. As a shopkeeper, I want bill creation to complete quickly even when WhatsApp delivery is enabled, so that messaging never slows down the counter workflow.
8. As a shopkeeper, I want the bill PDF sent through WhatsApp to match the bill I already see in the app, so that clients receive the same document I trust internally.
9. As a shopkeeper, I want the system to generate the bill PDF on the server, so that automatic delivery does not depend on my browser tab or device.
10. As a shopkeeper, I want the system to discard generated PDFs after a send attempt completes or fails, so that the app does not introduce ongoing file storage for bills.
11. As a shopkeeper, I want WhatsApp delivery to run in the background through a queue, so that temporary provider slowness does not interrupt bill creation.
12. As a shopkeeper, I want the worker concurrency to be configurable, so that operations can tune throughput safely.
13. As a shopkeeper, I want a bill sent with WhatsApp enabled to move to `processing` immediately after enqueue, so that I know the system accepted it for delivery.
14. As a shopkeeper, I want each bill to show its latest WhatsApp delivery status, so that I can tell at a glance what happened.
15. As a shopkeeper, I want the bill list and bill details to show `no`, `processing`, `success`, `failed`, or `canceled`, so that each delivery outcome is explicit.
16. As a shopkeeper, I want `processing` to show a live elapsed timer such as `processing(30s)`, so that I can tell how long the current send has been running.
17. As a shopkeeper, I want the UI to poll for the latest bill status while a bill is processing, so that the status updates automatically without a manual refresh.
18. As a shopkeeper, I want the polling interval to be configurable, so that the team can tune freshness versus load.
19. As a shopkeeper, I want to cancel a processing send immediately from the bill UI, so that I do not have to wait for a stuck or unwanted send to finish.
20. As a shopkeeper, I want the cancel action to be shown next to the processing status, so that it is easy to discover when a bill is in progress.
21. As a shopkeeper, I want cancel to ask for confirmation, so that I do not accidentally interrupt a valid send.
22. As a shopkeeper, I want force-cancel to remove a waiting queue job if it has not started, so that cancel works quickly when the worker has not picked it up yet.
23. As a shopkeeper, I want force-cancel to mark an active job as canceled and let the worker stop safely, so that the system does not pretend it can instantly abort an external call already in flight.
24. As a shopkeeper, I want a canceled send to show `canceled` rather than `failed`, so that I can distinguish my own deliberate action from a provider problem.
25. As a shopkeeper, I want resend to be unavailable while a bill is `processing`, so that only one delivery attempt can be in flight for a bill at a time.
26. As a shopkeeper, I want resend to be available when the latest status is `no`, `success`, `failed`, or `canceled`, so that I can send a bill again whenever there is no active delivery.
27. As a shopkeeper, I want resend to use a dedicated backend action, so that delivery retries remain separate from bill editing.
28. As a shopkeeper, I want only user-triggered retries, so that the system never auto-retries and risks duplicate sends without my intent.
29. As a shopkeeper, I want a bill in `processing` to be non-editable, so that the system does not mix bill changes with an active delivery.
30. As a shopkeeper, I want to force-cancel a processing bill, edit it, and then resend it, so that I can recover from long-running deliveries without losing control of the bill.
31. As a shopkeeper, I want the update-bill flow to ask whether I want to send the updated bill, so that resending remains an explicit choice after edits.
32. As a shopkeeper, I want the update flow to reuse resend logic instead of inventing a separate delivery path, so that the behavior stays predictable.
33. As a shopkeeper, I want the system to remember the latest delivery result fields on the bill, so that I can see timestamps, errors, and provider IDs without opening logs.
34. As a shopkeeper, I want those latest fields stored in `whatsapp_metadata`, so that the schema can evolve without needing a separate attempt-history table.
35. As a shopkeeper, I want constant failures to be survivable by disabling the service temporarily, so that normal billing can continue while the WhatsApp integration is under maintenance.
36. As a shopkeeper, I want resend to be blocked when the service is disabled, so that disabling WhatsApp truly stops all new delivery attempts.
37. As a shopkeeper, I want a clear explanation when resend is blocked by the service toggle, so that I understand why the action failed instead of seeing a silent disabled state.
38. As a shopkeeper, I want the blocked resend experience to guide me to settings, so that I can re-enable the feature quickly when I am ready.
39. As an operator, I want the backend to hard-reject create or resend delivery attempts when the service is disabled, so that stale frontend state cannot accidentally enqueue work.
40. As an operator, I want the worker to re-fetch the latest bill state before generating and sending, so that delivery always uses current persisted data.
41. As an operator, I want the worker to check cancel state between major steps, so that forced cancel behaves safely during long-running jobs.
42. As an operator, I want the system to record the BullMQ job ID in bill metadata, so that cancellation and debugging can target the correct in-flight job.
43. As an operator, I want the worker to avoid applying success after a cancel request has been recorded, so that canceled deliveries do not flip back to success incorrectly.
44. As a developer, I want the existing React PDF bill layout reused in the backend, so that there is one canonical bill document instead of two drifting implementations.
45. As a developer, I want this feature to center around one high-level workflow seam, so that testing and future maintenance focus on external delivery behavior instead of scattered low-level internals.

## Implementation Decisions

- The feature will be built around one high seam: a single WhatsApp bill delivery workflow that spans settings enforcement, bill enqueueing, worker execution, cancellation, resend, and UI state transitions.
- The current bill domain language remains centered on `Bill`, `Client`, `Bill Delivery`, `WhatsApp Bill Delivery`, `WhatsApp Delivery Status`, `Resend Bill`, `Force Cancel Delivery`, `WhatsApp Metadata`, and `WhatsApp Service Toggle`.
- A global database-backed WhatsApp service setting will control whether WhatsApp bill delivery is enabled. Its default value is disabled.
- The setting is application-wide, not collection-specific.
- When the service is disabled, bill creation, bill updates, and ordinary billing behavior continue exactly as they do today, but all new WhatsApp delivery attempts are blocked.
- The backend is the source of truth for service enablement and must hard-reject delivery actions when the feature is off, even if the frontend is stale.
- The create-bill UI will show `Send Bill on WhatsApp` only when the service is enabled. It defaults to checked.
- The update-bill UI will not include the create-bill checkbox. Instead, after a successful edit, the user can choose whether to send the updated bill using the same resend workflow.
- WhatsApp bill delivery will use one global bill delivery template for both retail and wholesale bills.
- Bill creation and WhatsApp delivery are separate outcomes. A bill is created first; delivery is an asynchronous follow-on workflow.
- The latest WhatsApp delivery state will be stored on the bill in a `whatsapp_metadata` JSONB object rather than in a separate delivery-attempt table.
- The `whatsapp_metadata` object will store the latest delivery summary, including the latest status and related timestamps, error message, provider message ID, queue job ID, cancel state, and processing support fields.
- The canonical statuses are `no`, `processing`, `success`, `failed`, and `canceled`.
- When a bill is eligible for automatic send at creation time, its status becomes `processing` immediately after the delivery job is enqueued.
- Delivery runs asynchronously through BullMQ backed by Redis, using a separate worker process with configurable concurrency. The initial concurrency target is controlled by configuration rather than hard-coded.
- No automatic retries will be used. Each queue enqueue produces one attempt. Any later retry must be a user-triggered resend.
- The bill PDF will be generated on the server from persisted bill data after bill creation.
- The server-generated PDF must reuse the existing React PDF layout so the WhatsApp document matches the current bill view exactly.
- The generated PDF is ephemeral. It is created in the worker, uploaded to WhatsApp, used for delivery, and discarded on success or failure. No object storage or persistent file storage is introduced for this feature.
- The worker will fetch fresh bill data before generating a PDF and before final state transitions that depend on cancellation.
- Resend will use a dedicated delivery action, separate from bill editing.
- Resend is allowed only when the latest status is not `processing` and when the global service setting is enabled.
- Bills with an active `processing` delivery are not editable through the normal update path.
- A bill in `processing` can be force-canceled. If the queue job is still waiting, the system removes it from BullMQ. If the job is already active, the system records a cancellation request in `whatsapp_metadata` and relies on the worker to stop safely between major steps.
- Force-cancel is best-effort. The system does not promise that it can instantly abort an external request already in flight.
- After a successful force-cancel, the bill becomes editable again and can later be resent.
- The UI will show `processing(XXs)` using a live processing timer derived from the bill's enqueue or start timestamp.
- While a bill is in `processing`, the UI will poll for fresh bill data on a configurable interval, initially expected to be around three seconds.
- The bill list and detail surfaces will expose the latest WhatsApp status and allowed actions, including processing timer, resend availability, cancel availability, and disabled-service explanations.
- If the service is disabled and a user attempts resend, the UI should explain that the feature is disabled and guide the user to the settings surface where the feature can be re-enabled.
- The WhatsApp integration should be isolated behind a service wrapper that owns media upload, template send, provider response normalization, and provider error normalization.
- Configuration must cover Redis connectivity, worker concurrency, WhatsApp provider credentials and identifiers, template details, and frontend polling interval.

## Testing Decisions

- Good tests for this feature should verify externally visible behavior and workflow outcomes rather than implementation details such as internal queue helper calls or local state setters.
- The highest-priority seam to test is the WhatsApp bill delivery workflow end to end at the module boundary where a bill transitions through service-gated enqueueing, status updates, cancellation, resend eligibility, and worker-driven completion.
- Server-side tests should cover service-toggle enforcement, enqueue decisions during create and resend, status transitions stored in `whatsapp_metadata`, force-cancel behavior for waiting and active jobs, edit blocking during processing, and update-then-resend decision handling.
- Worker-oriented tests should cover server-side PDF generation from persisted bill data, use of the shared bill document, provider upload and template-send success paths, failure paths, cancellation checks between steps, and prevention of late success after cancel.
- Frontend tests should cover checkbox visibility when the service is enabled or disabled, default checked behavior on create, status rendering, `processing(XXs)` display, polling while processing, cancel confirmation modal behavior, resend affordances, and disabled-service explanations that guide users to settings.
- PDF parity tests should focus on the invariant that the backend-generated document uses the same bill layout as the current frontend bill document, so delivery output stays consistent.
- Existing seams should be preferred over inventing many low-level ones. This feature should bias toward a small number of behavior-oriented tests around bill services, delivery actions, worker orchestration, and bill status presentation.
- Prior art in the codebase should come from the current bill creation, bill fetching, bill view, and React PDF rendering flows, as these are the closest existing behavioral surfaces to extend rather than bypass.

## Out of Scope

- Full attempt history for every WhatsApp send or resend.
- Persistent storage of generated bill PDFs.
- Multiple WhatsApp templates split by bill type.
- Automatic retry policies or exponential backoff.
- Per-collection WhatsApp enablement or per-collection maintenance switches.
- Instant hard-stop cancellation guarantees for requests already in flight with the provider.
- Alternate outbound delivery channels such as SMS, email, or manual WhatsApp deep-link sharing.
- Reworking the overall bill layout or redesigning the current bill PDF beyond the extraction needed to share it between frontend and backend.

## Further Notes

- This PRD is based on the agreed billing glossary in `CONTEXT.md` and the ADR series under `docs/adr/`.
- The main technical risk is extracting the existing React PDF bill document into a shared module that renders identically in both frontend and backend contexts.
- Before publishing this PRD to the repo's actual issue tracker with the `ready-for-agent` label, the repo still needs a configured issue-tracker setup under `docs/agents/` or an equivalent project convention.
