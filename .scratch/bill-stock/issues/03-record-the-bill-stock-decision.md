Status: done

## Parent

[Bill stock PRD](../PRD.md)

## What to build

Record that a Bill now moves stock. Write ADR-0026, which supersedes ADR-0016, and leave ADR-0016 in place with a status note pointing at the new decision. Keep the glossary honest: Bill takes the Products it names out of stock, and Stock in hand is a term in its own right. Publish this PRD and its issues.

The decision records the shared stock pool, the create/update delta rule, the atomic guarded deduction, the no-backfill `stock_applied` cutover, the duplicate-Product rule, and the Labour-is-like-any-Product consequence. It also records the rejected alternatives: backfilling every existing Bill, keeping Bills out of stock, checking each line independently, merging duplicate lines by migration, and adding an add-stock control to Bills.

## Acceptance criteria

- [x] `docs/adr/0026-bills-deduct-stock-on-create-and-reconcile-on-update.md` records the decision
- [x] ADR-0016 carries a status note that it is superseded by ADR-0026, and its original text is left intact
- [x] `CONTEXT.md` says a Bill takes the Products it names out of stock
- [x] `CONTEXT.md` defines Stock in hand and avoids Inventory, available count, and total stock
- [x] The PRD and its issues are published under `.scratch/bill-stock/`
- [x] The rejected alternatives are recorded in the decision

## Blocked by

None — completed alongside the PRD
