# WhatsApp Bill Delivery — Phase 10 Closeout

Phase 10 is hardening, verification, and cleanup. No new product scope was added.
This records what changed, what the earlier review (`whatsapp-bill-delivery-phases-1-6-remarks.md`)
left open, and the two remarks deliberately not acted on.

## Defects fixed

| Where | Problem | Fix |
| --- | --- | --- |
| `server/utils/query.js` | The connection-reset retry called `pgquery`, which does not exist, so every retry threw a `ReferenceError` instead of reconnecting | Calls `query` |
| `server/controllers/bills.js` `getBills` | `sortField`, `sortOrder`, `limit`, `offset` and the search term were interpolated straight into SQL — an injection reachable from the bills list query string | Sort column resolved through a whitelist (own-property lookup, so `sortField=constructor` cannot pull a value off `Object.prototype`), direction narrowed to `ASC`/`DESC`, pagination parsed and clamped, search bound as a parameter |
| `server/controllers/bills.js` `getBills` | The count query filtered on `bills.name` while the list filtered on `clients.name`, so the pager could report pages the list could not fill | Both share one filter |
| `server/services/whatsappProvider.js` | Any number longer than 10 digits was passed through unchanged, so a malformed number would be delivered to whoever does own it and recorded as a success | Normalizes `00` and trunk prefixes, bounds length to E.164, rejects the rest |
| `server/services/whatsappProvider.js` | Graph API calls had no timeout; a hung request would hold a worker slot and strand the bill in `processing` | Bounded by `WHATSAPP_REQUEST_TIMEOUT_MS` (30s default), surfaced as `WHATSAPP_API_TIMEOUT` |
| `server/queues/whatsappBillDeliveryQueue.js` | `removeOnFail: false` kept failed jobs in Redis forever | Retained for 7 days / 1000 jobs; the bill metadata is the durable record |

## Hardening

- The worker probes provider configuration at boot and names the missing
  variables once, instead of failing every bill with a config error.
- The worker shuts down gracefully on `SIGINT`/`SIGTERM`: it stops taking jobs,
  lets in-flight deliveries finish, and force-exits after a 20s grace period.
  Unhandled rejections and uncaught exceptions are logged rather than silent.
- The API closes its queue connection on shutdown.
- `handleError` keeps surfacing deliberate domain errors verbatim — the resend
  and edit-lock UX depends on their `code` — but no longer echoes an unexpected
  internal error's text to clients when `NODE_ENV=production`.
- `server/error.log` is no longer tracked in git.

## Tests

The phase-numbered smoke scripts became a `node --test` suite under
`server/tests/`, named by what they cover. Every assertion they made was kept.

New coverage:

- **Worker orchestration** (`whatsappDeliveryWorker.test.mjs`) — the seam the PRD
  names highest priority (PRD 45) and the one that had none. The real job runs
  against an in-memory bill store that enforces the same write guards as the SQL,
  so the cancel-versus-success ordering is tested without a database or Redis:
  cancel before the send, cancel after the provider accepted, a resend orphaning
  the previous attempt, failure-during-cancel, and the persistence-failed-after-send
  path.
- **Provider wrapper** — recipient normalization, template payload shape, error
  and timeout normalization, missing-message-id handling.
- **Create-flow gating** — the three toggle/checkbox combinations.
- **PDF** — real buffer generation for both layouts, and the parity invariant
  that viewer and generator import the same shared document.
- **Client** (vitest + Testing Library) — status rendering including
  `processing(XXs)` and its live tick, resend affordances and the disabled-service
  explanation, cancel confirmation, and the post-update send prompt.

To make the worker testable, `processWhatsAppBillDeliveryJob` takes an optional
dependency object; production uses the module defaults, and a string second
argument (BullMQ's job token) is ignored.

## Operator feedback

A `processing` bill only changes when a worker writes to it, so a stopped worker
shows as a counter climbing with no explanation. After two minutes the status
chip turns amber and its tooltip says the delivery looks stuck and that force
cancel unlocks the bill.

The poll interval is clamped to a 1000 ms floor, so a mistyped
`VITE_WHATSAPP_DELIVERY_POLL_INTERVAL_MS` cannot turn every open bills view into
a request flood.

## Earlier remarks now closed

Items 1–3 and 5–6 of the earlier review's "Recommended Next Steps" were resolved
during phases 7–9 (unique job ids, worker cancel checkpoints, provider fields
preserved on failure, PDF formatting parity, `provider_accepted_at` in the
migration). Item 4 (duplicate React in `shared/bill-pdf`) is resolved: the shared
package declares its React stack as peer dependencies only, and
`scripts/link-bill-pdf-peers.mjs` links the server's copies. Items 7 and 8
(config documentation, `handleError` status propagation) are closed by this phase
and `docs/whatsapp-bill-delivery-runbook.md`.

## Deliberately not changed

- **The WhatsApp column stays visible by default when the service is disabled.**
  Hiding it would also hide the delivery history of bills sent before the service
  was switched off, which is exactly what an operator wants to see during a
  maintenance window. The column is already toggleable.
- **Authentication on the settings and bills routes.** No route in this
  application is currently authenticated; adding it to these two would be new
  scope and would not make the app secure. It belongs in its own piece of work.
