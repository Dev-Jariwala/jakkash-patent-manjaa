import {
  buildProcessingWhatsAppMetadata,
  createInitialWhatsAppMetadata,
} from "../../services/whatsappBillMetadata.js";

/** Minimal Express `res` double: records the status and body a handler sends. */
export function createMockResponse() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

/** A bill mid-delivery under `queueJobId` — the starting point for most cases. */
export function processingMetadata(queueJobId = "job-a") {
  return buildProcessingWhatsAppMetadata(
    createInitialWhatsAppMetadata({ deliveryRequested: true }),
    { queueJobId }
  );
}

/** Swallows the worker's progress logging so test output stays readable. */
export function createSilentLogger() {
  const lines = { log: [], warn: [], error: [] };
  return {
    lines,
    log: (...args) => lines.log.push(args),
    warn: (...args) => lines.warn.push(args),
    error: (...args) => lines.error.push(args),
  };
}

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createBill(overrides = {}) {
  return {
    bill_id: "11111111-1111-1111-1111-111111111111",
    collection_id: "22222222-2222-2222-2222-222222222222",
    bill_no: 101,
    bill_type: "retail",
    name: "Test Client",
    client_name: "Test Client",
    mobile: "9876543210",
    address: "12 Market Road",
    order_date: "2026-01-01T00:00:00.000Z",
    delivery_date: "2026-01-05T00:00:00.000Z",
    notes: "",
    total_firki: 2,
    sub_total: 500,
    discount: 0,
    advance: 100,
    total_due: 400,
    products: [
      { product_id: "p-1", product_name: "Manja 6 Cord", quantity: 2, price: 250 },
    ],
    ...overrides,
  };
}
