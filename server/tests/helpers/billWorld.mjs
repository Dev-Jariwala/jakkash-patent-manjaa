import { randomUUID } from "node:crypto";

export function validShopBankAccount() {
  return {
    bank_name: "HDFC Bank",
    bank_address: "MG Road, Bengaluru",
    account_number: "012345678",
    ifsc: "HDFC0000123",
    updated_at: new Date().toISOString(),
  };
}

export function createBillWorld({
  collections = [],
  clients = [],
  products = [],
  taxCodes = [],
  shopBankAccount = validShopBankAccount(),
} = {}) {
  const billsById = new Map();
  const linesByBillId = new Map();
  const billByCollectionAndNumber = new Map();
  const clientsByMobile = new Map(clients.map((c) => [c.mobile, c]));
  const productsById = new Map(products.map((p) => [p.product_id, p]));
  const taxCodesById = new Map(taxCodes.map((t) => [t.tax_code_id, t]));
  const collectionIds = new Set(collections.map((c) => c.collection_id));

  let billSaveCount = 0;

  const deps = {
    async getShopBankAccount() {
      return shopBankAccount;
    },

    async getClientByMobile(mobile) {
      return clientsByMobile.get(mobile) ?? null;
    },

    async getProductById(productId) {
      return productsById.get(productId) ?? null;
    },

    async getTaxCodeById(taxCodeId) {
      return taxCodesById.get(taxCodeId) ?? null;
    },

    async listBillsByCollection(collectionId) {
      return [...billsById.values()]
        .filter((bill) => bill.collection_id === collectionId)
        .sort((a, b) => {
          if (a.bill_date !== b.bill_date) {
            return a.bill_date < b.bill_date ? 1 : -1;
          }
          return a.saved_at < b.saved_at ? 1 : -1;
        })
        .map((bill) => ({
          bill_id: bill.bill_id,
          bill_number: bill.bill_number,
          bill_date: bill.bill_date,
          receiver_name: bill.receiver_name,
          total_bill: bill.total_bill,
          saved_at: bill.saved_at,
        }));
    },

    async getBillById(billId) {
      return billsById.get(billId) ?? null;
    },

    async getBillByBillNumber(collectionId, billNumber) {
      const id = billByCollectionAndNumber.get(`${collectionId}:${billNumber}`);
      return id ? billsById.get(id) : null;
    },

    async listBillLines(billId) {
      return linesByBillId.get(billId) ?? [];
    },

    async insertBill(billRow, lineRows) {
      billsById.set(billRow.bill_id, billRow);
      billByCollectionAndNumber.set(
        `${billRow.collection_id}:${billRow.bill_number}`,
        billRow.bill_id
      );
      linesByBillId.set(
        billRow.bill_id,
        lineRows.map((line) => ({ ...line }))
      );
    },

    async replaceBillLines(billId, lineRows, billRow) {
      const previous = billsById.get(billId);
      if (previous && previous.bill_number !== billRow.bill_number) {
        billByCollectionAndNumber.delete(`${previous.collection_id}:${previous.bill_number}`);
        billByCollectionAndNumber.set(
          `${billRow.collection_id}:${billRow.bill_number}`,
          billId
        );
      }
      billsById.set(billId, billRow);
      linesByBillId.set(
        billId,
        lineRows.map((line) => ({ ...line, bill_id: billId }))
      );
    },

    async noteBillSaved() {
      billSaveCount += 1;
    },
  };

  return {
    deps,
    collectionIds,
    setShopBankAccount(account) {
      shopBankAccount = account;
    },
    getBillSaveCount: () => billSaveCount,
    seedCollection(id = randomUUID()) {
      const collection_id = id;
      collectionIds.add(collection_id);
      return collection_id;
    },
    seedClient(overrides = {}) {
      const client = {
        mobile: "9876543210",
        name: "Acme Fabrics",
        address: "Ring Road, Surat",
        gst_number: "24AABCU9603R1ZM",
        contact_person: "Ravi",
        contact_number: "9123456789",
        ...overrides,
      };
      clientsByMobile.set(client.mobile, client);
      return client;
    },
    seedProduct(collectionId, overrides = {}) {
      const product = {
        product_id: randomUUID(),
        collection_id: collectionId,
        product_name: "Cotton fabric",
        wholesale_price: 220,
        tax_code_id: null,
        ...overrides,
      };
      productsById.set(product.product_id, product);
      return product;
    },
    seedTaxCode(overrides = {}) {
      const taxCode = {
        tax_code_id: randomUUID(),
        type: "HSN",
        code: "5209",
        description: "Woven fabrics of cotton",
        cgst: 2.5,
        sgst: 2.5,
        igst: 5,
        ...overrides,
      };
      taxCodesById.set(taxCode.tax_code_id, taxCode);
      return taxCode;
    },
  };
}

export function standardBillPayload({
  world,
  collectionId,
  product,
  taxCode,
  client,
  overrides = {},
}) {
  world.seedProduct(collectionId, {
    product_id: product.product_id,
    collection_id: collectionId,
    product_name: product.product_name,
    wholesale_price: product.wholesale_price,
    tax_code_id: taxCode.tax_code_id,
  });

  return {
    bill_number_parts: ["9", "26", "15"],
    bill_date: "2026-10-11",
    receiver_mobile: client.mobile,
    lines: [
      {
        product_id: product.product_id,
        tax_code_id: taxCode.tax_code_id,
        quantity: 200,
        rate: 220,
        cgst_percent: 2.5,
        sgst_percent: 2.5,
        igst_percent: 0,
      },
    ],
    ...overrides,
  };
}

export function updatePayloadFromBill(bill, overrides = {}) {
  return {
    bill_number_parts: bill.bill_number_parts ?? bill.bill_number.split("-"),
    bill_date: bill.bill_date,
    receiver_mobile: bill.receiver_mobile,
    lines: bill.lines.map((line) => {
      const mapped = {
        bill_line_id: line.bill_line_id,
        product_id: line.product_id,
        tax_code_id: line.tax_code_id,
        quantity: line.quantity,
        rate: line.rate,
        cgst_percent: line.cgst_percent,
        sgst_percent: line.sgst_percent,
        igst_percent: line.igst_percent,
      };
      if (line.product_chosen_again) {
        mapped.product_chosen_again = true;
      }
      return mapped;
    }),
    ...overrides,
  };
}
