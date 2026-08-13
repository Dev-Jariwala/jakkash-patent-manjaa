# WhatsApp Bill Delivery — Operations Runbook

Everything needed to run, configure, and recover the WhatsApp bill delivery
workflow. Terminology follows `CONTEXT.md`; the behaviour it describes is
specified in `docs/prd/whatsapp-bill-delivery-prd.md` and the ADR series.

## Processes

The feature needs **two** processes plus Redis. Running the API alone leaves
bills stuck in `processing` forever, because only the worker settles them.

| Process | Command | Responsibility |
| --- | --- | --- |
| API | `npm run dev` (or your process manager) | Serves bills, enforces the service toggle, enqueues delivery work |
| Delivery worker | `npm run worker:whatsapp-delivery` | Generates the PDF, sends it, records the outcome |
| Redis | external | Holds the BullMQ `whatsapp-bill-delivery` queue |

Both processes read the same `.env`. The worker runs under `tsx` because the
shared bill document is JSX.

Deploy note: restart the worker on every release. It closes on `SIGTERM`, stops
taking new jobs, and waits up to 20s for in-flight deliveries before exiting.

## Configuration

### Server (`server/.env`)

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `WHATSAPP_TOKEN` | yes | — | Meta Graph API access token |
| `WHATSAPP_PHONE_NUMBER_ID` | yes | — | Sending phone number ID (legacy name `id` also accepted) |
| `WHATSAPP_TEMPLATE_NAME` | yes | — | Approved bill delivery template |
| `WHATSAPP_TEMPLATE_LANGUAGE` | no | `en` | Template language code |
| `WHATSAPP_API_VERSION` | no | `v21.0` | Graph API version |
| `WHATSAPP_DEFAULT_COUNTRY_CODE` | no | `91` | Prepended to 10-digit bill mobiles |
| `WHATSAPP_REQUEST_TIMEOUT_MS` | no | `30000` | Per-request timeout for Graph API calls |
| `WHATSAPP_DELIVERY_WORKER_CONCURRENCY` | no | `2` | Deliveries the worker runs at once |
| `REDIS_URL` | no | — | Takes precedence over the host/port pair |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | no | `127.0.0.1` / `6379` / — | Queue connection |
| `NODE_ENV` | no | — | `production` stops unexpected internal errors being echoed to clients |
| `DB_SSL` | no | on for remote hosts | Forces database TLS on or off |

The three required variables are only read when a job runs, so the worker probes
them at startup and logs the missing names once rather than failing every bill
individually.

### Client (`client/.env`)

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_BACKEND_URL` | — | API base URL, trailing slash required |
| `VITE_WHATSAPP_DELIVERY_POLL_INTERVAL_MS` | `3000` | Poll interval while a bill is `processing`; clamped to a 1000 ms floor |

### Template contract

The single bill delivery template must accept:

- a **document header** — the generated bill PDF;
- **two body parameters** — client name, then bill number.

A template whose parameters do not match is rejected by Meta and the bill lands
on `failed` with the provider's message on the status chip.

## Migrations

Managed by [dbmate](https://github.com/amacneil/dbmate), installed as a dev
dependency — no global install needed. It needs `DATABASE_URL` in `server/.env`
(the app itself still reads the separate `DB_*` vars; keep the two in sync).

From `server/`:

| Command | What it does |
| --- | --- |
| `npm run db:status` | Lists applied and pending migrations |
| `npm run db:up` | Applies everything pending |
| `npm run db:new <name>` | Creates a timestamped migration file |
| `npm run db:rollback` | Reverts the most recent migration |

dbmate tracks what has run in a `schema_migrations` table and wraps each
migration in a transaction. Each file has a `-- migrate:up` section and a
`-- migrate:down` section; new files created with `db:new` are stubbed with both.

Existing migrations, in order — all three are re-runnable, so pointing dbmate at
a database that already has them applied is safe:

1. `server/migrations/001_app_settings.sql` — the settings table, seeded with
   `whatsapp_service_enabled = FALSE`.
2. `server/migrations/002_bills_whatsapp_metadata.sql` — the `whatsapp_metadata`
   column.
3. `server/migrations/003_whatsapp_metadata_provider_accepted_at.sql` — adds
   `provider_accepted_at` to the default and to existing rows.

`server/schema.sql` remains the hand-maintained full-schema snapshot for standing
up a fresh database; dbmate's schema dump is disabled (`--no-dump-schema`) so it
never overwrites that file. After adding a migration, mirror the change there.

## Enabling the feature

The service ships **disabled**. Nothing about ordinary billing changes until an
operator turns it on in Settings. While it is off, the create-bill checkbox is
hidden and the backend rejects every delivery request, including one submitted
by a stale browser tab.

## Delivery statuses

| Status | Meaning | Editable | Resend | Cancel |
| --- | --- | --- | --- | --- |
| `no` | Never requested, or the operator unchecked the box | yes | yes | no |
| `processing` | Accepted for delivery, attempt in flight | **no** | no | yes |
| `success` | The provider accepted the message | yes | yes | no |
| `failed` | The attempt failed; the reason is on the chip | yes | yes | no |
| `canceled` | An operator force-canceled the attempt | yes | yes | no |

Only `processing` blocks editing. Force cancel is the way out of it.

## Operational scenarios

### Bills stay in `processing` and the timer keeps climbing

The status only changes when a worker writes to the bill, so a growing timer
means nothing is working on it. After two minutes the status chip turns amber and
says so. Check, in order:

1. Is the delivery worker running?
2. Is Redis reachable? The API logs `Redis connection unavailable` at startup and
   an enqueue failure records the bill as `failed` rather than leaving it
   `processing`.
3. Did the worker log missing provider configuration at boot?

Force cancel unlocks any bill stuck this way; the bill can then be edited and
resent.

### Every delivery fails

Read the error on the status chip — it is the provider's own message. Common
causes: an expired token, a template that is not approved, or a bill mobile that
is not a valid recipient. While the integration is being repaired, disable the
WhatsApp service toggle: ordinary billing continues unaffected and no further
attempts are made.

### `reconciliation required` in the worker log

The provider accepted the message but the outcome could not be written to the
bill. The client **has** the bill; the row does not know it. The log line carries
the provider message id. Resolve by hand — resending would deliver a duplicate.

This is the only outcome the system cannot settle on its own.

### A canceled bill shows a provider message id

Cancellation is best-effort (ADR 0006). The operator canceled after the message
had already left, so the client may still receive that copy. The bill correctly
stays `canceled` — a delivery that reached the provider is never relabelled
`success` once a cancel is recorded, and vice versa.

## Queue behaviour

- One attempt per enqueue; **no automatic retries**. Every retry is an operator
  resend, so the system can never send a duplicate the operator did not ask for.
- Each attempt gets a fresh job id, recorded on the bill as `queue_job_id`. A
  write from an older attempt is refused once a newer one owns the bill.
- Completed jobs are removed immediately. Failed jobs are kept for 7 days or
  1000 jobs, whichever comes first — the bill's `whatsapp_metadata` is the
  durable record.
- Cancel removes the job outright if the worker has not started it. If it has,
  the cancel is recorded on the bill and the worker stops at its next checkpoint.

## Generated PDFs

The bill document is rendered in the worker, uploaded, and discarded. No PDF is
written to disk or object storage at any point.

## Tests

```
cd server && npm test      # node --test, no database or Redis required
cd client && npm test      # vitest
```

The server suite drives the real delivery job with the database and provider
replaced by a store that enforces the same write guards as the SQL, so the
cancel-versus-success ordering is covered without infrastructure.
