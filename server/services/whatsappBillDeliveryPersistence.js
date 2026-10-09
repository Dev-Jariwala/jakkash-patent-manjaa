import { query } from "../utils/query.js";

export async function persistWhatsAppMetadata({ billId, collectionId, metadata }) {
  const [updatedBill] = await query(
    `UPDATE orders
     SET whatsapp_metadata = $1::jsonb
     WHERE order_id = $2 AND collection_id = $3
     RETURNING *`,
    [JSON.stringify(metadata), billId, collectionId]
  );

  if (!updatedBill) {
    throw new Error("Failed to persist WhatsApp delivery metadata");
  }

  return updatedBill;
}

/**
 * Worker-side outcome write that loses to a concurrent force-cancel.
 *
 * The worker re-reads cancel state between major steps, but a cancel can still
 * land in the gap between that read and the write. Pushing the same guard into
 * the `WHERE` clause closes the race in the database, which is what keeps a late
 * `success` from overwriting a recorded `canceled` (PRD 43, ADR 0006).
 *
 * The `queue_job_id` match additionally makes the write a no-op once a newer
 * attempt has taken over the bill.
 *
 * @returns {Promise<{persisted: boolean, bill: object|null}>} `persisted: false`
 *   means the bill was canceled or re-enqueued underneath this job.
 */
export async function persistWhatsAppDeliveryOutcome({
  billId,
  collectionId,
  metadata,
  jobId,
}) {
  const [updatedBill] = await query(
    `UPDATE orders
     SET whatsapp_metadata = $1::jsonb
     WHERE order_id = $2
       AND collection_id = $3
       AND whatsapp_metadata->>'queue_job_id' = $4
       AND COALESCE((whatsapp_metadata->>'cancel_requested')::boolean, false) = false
       AND whatsapp_metadata->>'status' <> 'canceled'
     RETURNING *`,
    [JSON.stringify(metadata), billId, collectionId, jobId]
  );

  return { persisted: Boolean(updatedBill), bill: updatedBill || null };
}

/**
 * Statuses the operator-facing cancel may overwrite. A delivery that already
 * settled as `success` or `failed` between the eligibility read and this write
 * must keep its real outcome rather than being relabelled `canceled`.
 */
export const OPERATOR_CANCEL_OVERWRITABLE_STATUSES = ["processing"];

/**
 * Statuses the worker may finalize a cancel over: the operator's `canceled`
 * write (which it is merely confirming) and a bare `cancel_requested` flag still
 * sitting on `processing`.
 */
export const WORKER_CANCEL_OVERWRITABLE_STATUSES = ["processing", "canceled"];

/**
 * Cancel write guarded against the two ways the bill can move underneath it.
 *
 * `queue_job_id` must still match the attempt being canceled, so a cancel never
 * lands on a newer attempt started by a resend. `allowedStatuses` keeps the write
 * off outcomes that already settled.
 *
 * The job id is compared with `IS NOT DISTINCT FROM` so a bill whose metadata
 * carries no job id (legacy rows) still matches on `null`.
 *
 * @returns {Promise<{persisted: boolean, bill: object|null}>}
 */
export async function persistWhatsAppDeliveryCancellation({
  billId,
  collectionId,
  metadata,
  jobId,
  allowedStatuses,
}) {
  const [updatedBill] = await query(
    `UPDATE orders
     SET whatsapp_metadata = $1::jsonb
     WHERE order_id = $2
       AND collection_id = $3
       AND whatsapp_metadata->>'queue_job_id' IS NOT DISTINCT FROM $4
       AND whatsapp_metadata->>'status' = ANY($5)
     RETURNING *`,
    [JSON.stringify(metadata), billId, collectionId, jobId ?? null, allowedStatuses]
  );

  return { persisted: Boolean(updatedBill), bill: updatedBill || null };
}
