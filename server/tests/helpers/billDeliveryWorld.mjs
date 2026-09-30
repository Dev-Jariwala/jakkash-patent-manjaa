import { clone, createBill, createSilentLogger } from "./fixtures.mjs";

/**
 * An in-memory stand-in for the one bill row the worker operates on.
 *
 * The delivery guarantees this suite is about — a cancel beating a late
 * success, a resend orphaning the previous attempt — live in the `WHERE`
 * clauses of `whatsappBillDeliveryPersistence.js`, not in the worker. So this
 * store reimplements exactly those conditions: a write that the real SQL would
 * match no row for must return `persisted: false` here too. Keep the two in
 * step; a guard relaxed here would make the worker tests pass on behaviour the
 * database would refuse.
 */
export function createBillDeliveryWorld({
  metadata,
  bill: billOverrides = {},
  onFetch,
} = {}) {
  const bill = { ...createBill(billOverrides), whatsapp_metadata: metadata };
  const calls = {
    fetches: 0,
    pdfGenerations: 0,
    sends: [],
    outcomeWrites: [],
    cancelWrites: [],
  };

  const world = {
    bill,
    calls,

    /** Current metadata, as the database holds it. */
    get metadata() {
      return bill.whatsapp_metadata;
    },

    /** Simulates an operator cancel or a resend landing mid-job. */
    setMetadata(next) {
      bill.whatsapp_metadata = next;
    },

    deps: {
      logger: createSilentLogger(),

      async fetchBillForDelivery({ billId, collectionId }) {
        calls.fetches += 1;
        // Runs before the copy is handed out so a hook can stage the concurrent
        // write this fetch is supposed to observe.
        await onFetch?.(world, calls.fetches);

        if (billId !== bill.bill_id || collectionId !== bill.collection_id) {
          const error = new Error(`Bill ${billId} not found`);
          error.code = "BILL_NOT_FOUND";
          throw error;
        }

        return clone(bill);
      },

      async generateBillPdfBuffer() {
        calls.pdfGenerations += 1;
        return Buffer.from("%PDF-1.7 fake");
      },

      buildBillPdfFilename(billForFilename) {
        return `Jakkash-Bill-${billForFilename.bill_no}.pdf`;
      },

      async sendBillDocumentOnWhatsApp({ pdfBuffer, filename, bill: sentBill }) {
        calls.sends.push({ pdfBuffer, filename, bill: sentBill });
        return { providerMessageId: `wamid.${calls.sends.length}` };
      },

      // Mirrors the guarded outcome UPDATE: the job must still own the bill and
      // no cancel may have been recorded.
      async persistWhatsAppDeliveryOutcome({ metadata: next, jobId }) {
        calls.outcomeWrites.push({ metadata: next, jobId });
        const current = bill.whatsapp_metadata;
        const owns = current?.queue_job_id === jobId;
        const canceled = Boolean(current?.cancel_requested) || current?.status === "canceled";

        if (!owns || canceled) {
          return { persisted: false, bill: null };
        }

        bill.whatsapp_metadata = next;
        return { persisted: true, bill: clone(bill) };
      },

      // Mirrors the guarded cancel UPDATE: same job (null matches null) and the
      // current status must be one the caller is allowed to overwrite.
      async persistWhatsAppDeliveryCancellation({ metadata: next, jobId, allowedStatuses }) {
        calls.cancelWrites.push({ metadata: next, jobId, allowedStatuses });
        const current = bill.whatsapp_metadata;
        const sameJob = (current?.queue_job_id ?? null) === (jobId ?? null);

        if (!sameJob || !allowedStatuses.includes(current?.status)) {
          return { persisted: false, bill: null };
        }

        bill.whatsapp_metadata = next;
        return { persisted: true, bill: clone(bill) };
      },
    },
  };

  return world;
}

export function createJob({ world, jobId = "job-a" }) {
  return {
    id: jobId,
    data: { billId: world.bill.bill_id, collectionId: world.bill.collection_id },
  };
}
