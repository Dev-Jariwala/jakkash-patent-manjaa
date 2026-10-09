# ADR 0013: Rename bills to orders in place

## Status

Accepted

## Context

Operators already see **Order No** on the printed sale document, while navigation, APIs, and database tables still called the same record a bill. Two names for one commercial row (client, line items, totals, payment, delivery, WhatsApp state) added friction and risked divergent behavior.

## Decision

Rename the existing `bills` / `bill_items` tables and their id, number, and type columns to `orders` / `order_items` with `order_*` names, using a migration that only `ALTER RENAME`s objects and a down path that renames back. Do not copy rows into new tables or regenerate ids (printed QR codes store the row id).

Operator-facing language, collection API paths, and core module names use **order**. WhatsApp delivery queue name, approved template name, and stored delivery status values stay unchanged so in-flight jobs and provider configuration keep working.

## Consequences

- Bookmarks to `/bills` redirect to `/orders` with the same sale id and retail/wholesale choice.
- Historical ADRs and PRDs may still say bill; new work follows `CONTEXT.md` glossary terms.
