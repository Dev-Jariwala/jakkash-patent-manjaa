import { randomUUID } from "node:crypto";
import { TAX_SHAPE_WITHIN_STATE } from "../../services/bill.js";
import { BillDuplicateNumberError, BillInsufficientStockError } from "../../services/billErrors.js";

function applyStockDeltasInWorld(productsById, collectionId, stockDeltas) {
  for (const entry of stockDeltas ?? []) {
    const product = productsById.get(entry.product_id);
    if (!product) {
      continue;
    }
    const delta = Number(entry.delta);
    if (!Number.isFinite(delta) || delta === 0) {
      continue;
    }
    if (delta > 0) {
      if (product.stock_in_hand < delta) {
        throw new BillInsufficientStockError(
          entry.product_name ?? product.product_name,
          product.stock_in_hand,
          delta
        );
      }
      product.stock_in_hand -= delta;
    } else {
      product.stock_in_hand += -delta;
    }
  }
}

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
  const collectionsById = new Map(
    collections.map((collection) => [
      collection.collection_id,
      {
        collection_id: collection.collection_id,
        bill_year: Object.hasOwn(collection, "bill_year") ? collection.bill_year : "26",
      },
    ])
  );
  const collectionIds = new Set(collectionsById.keys());
  const billSeriesByName = new Map();
  let explicitBillSeries = false;

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

    async getCollection(collectionId) {
      return collectionsById.get(collectionId) ?? null;
    },

    async listActiveBillSeries() {
      if (!explicitBillSeries) {
        return [{ bill_series_id: "permissive", name: "ST", is_active: true }];
      }
      return [...billSeriesByName.values()].filter((row) => row.is_active);
    },

    async getBillSeriesByName(name) {
      if (!explicitBillSeries) {
        if (!name) {
          return null;
        }
        return { bill_series_id: name, name, is_active: true };
      }
      return billSeriesByName.get(name) ?? null;
    },

    async listBillsByCollection(collectionId, { limit, offset, search } = {}) {
      const term = String(search ?? "").toLowerCase();
      const matched = [...billsById.values()]
        .filter((bill) => bill.collection_id === collectionId)
        .filter((bill) => {
          if (!search) {
            return true;
          }
          return [bill.bill_number, bill.receiver_name, bill.receiver_mobile].some((value) =>
            String(value ?? "").toLowerCase().includes(term)
          );
        })
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

      const start = offset ?? 0;
      const end = limit == null ? matched.length : start + limit;
      return {
        rows: matched.slice(start, end),
        totalItems: matched.length,
      };
    },

    async listAllBillsByCollection(collectionId) {
      return [...billsById.values()].filter((bill) => bill.collection_id === collectionId);
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

    async insertBill(billRow, lineRows, stockDeltas) {
      const numberKey = `${billRow.collection_id}:${billRow.bill_number}`;
      const existingId = billByCollectionAndNumber.get(numberKey);
      if (existingId && existingId !== billRow.bill_id) {
        throw new BillDuplicateNumberError();
      }
      applyStockDeltasInWorld(productsById, billRow.collection_id, stockDeltas);
      const rowWithStock = {
        ...billRow,
        stock_applied: billRow.stock_applied ?? true,
      };
      billsById.set(billRow.bill_id, rowWithStock);
      billByCollectionAndNumber.set(
        `${billRow.collection_id}:${billRow.bill_number}`,
        billRow.bill_id
      );
      linesByBillId.set(
        billRow.bill_id,
        lineRows.map((line) => ({ ...line }))
      );
    },

    async replaceBillLines(billId, lineRows, billRow, stockDeltas) {
      applyStockDeltasInWorld(productsById, billRow.collection_id, stockDeltas);
      const previous = billsById.get(billId);
      if (previous && previous.bill_number !== billRow.bill_number) {
        billByCollectionAndNumber.delete(`${previous.collection_id}:${previous.bill_number}`);
        billByCollectionAndNumber.set(
          `${billRow.collection_id}:${billRow.bill_number}`,
          billId
        );
      }
      billsById.set(billId, {
        ...billRow,
        stock_applied: billRow.stock_applied ?? true,
      });
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
    getProductStock(productId) {
      return productsById.get(productId)?.stock_in_hand;
    },
    setProductStock(productId, stockInHand) {
      const product = productsById.get(productId);
      if (product) {
        product.stock_in_hand = stockInHand;
      }
    },
    seedCollection(id = randomUUID(), options = {}) {
      const collection_id = id;
      const bill_year = Object.hasOwn(options, "bill_year") ? options.bill_year : "26";
      collectionsById.set(collection_id, { collection_id, bill_year });
      collectionIds.add(collection_id);
      return collection_id;
    },
    seedBillSeries({ name, is_active = true } = {}) {
      explicitBillSeries = true;
      const existing = billSeriesByName.get(name);
      const row = {
        bill_series_id: existing?.bill_series_id ?? randomUUID(),
        name,
        is_active,
      };
      billSeriesByName.set(name, row);
      return row;
    },
    setBillSeriesActive(name, isActive) {
      const row = billSeriesByName.get(name);
      if (!row) {
        return null;
      }
      row.is_active = isActive;
      return row;
    },
    seedClient(overrides = {}) {
      const client = {
        mobile: "9876543210",
        name: "Acme Fabrics",
        address: "Ring Road, Surat",
        gst_number: "24AABCU9603R1ZM",
        gst_not_applicable: false,
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
        stock_in_hand: 10000,
        total_stock: 10000,
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
    stock_in_hand: product.stock_in_hand,
    total_stock: product.total_stock,
  });

  return {
    bill_number_parts: ["9", "26", "15"],
    bill_date: "2026-10-11",
    receiver_mobile: client.mobile,
    tax_shape: TAX_SHAPE_WITHIN_STATE,
    lines: [
      {
        product_id: product.product_id,
        tax_code_id: taxCode.tax_code_id,
        quantity: 200,
        rate: 220,
        cgst_percent: taxCode.cgst,
        sgst_percent: taxCode.sgst,
        igst_percent: taxCode.igst,
      },
    ],
    ...overrides,
  };
}

export function copyTrioPercentsFromTaxCode(taxCode) {
  return {
    cgst_percent: taxCode.cgst,
    sgst_percent: taxCode.sgst,
    igst_percent: taxCode.igst,
  };
}

export async function insertLegacyBill(
  world,
  {
    collectionId,
    client,
    billNumber = "7-7-7",
    billDate = "2026-10-11",
    taxShape = null,
    lines,
    totals = null,
  }
) {
  const billId = randomUUID();
  const savedAt = new Date().toISOString();
  const totalValue = totals?.total_value ?? lines.reduce((sum, line) => sum + line.price, 0);
  const totalTax =
    totals?.total_tax ??
    lines.reduce(
      (sum, line) => sum + line.cgst_amount + line.sgst_amount + line.igst_amount,
      0
    );
  const totalBill = totals?.total_bill ?? totalValue + totalTax;

  await world.deps.insertBill(
    {
      bill_id: billId,
      collection_id: collectionId,
      bill_number: billNumber,
      bill_date: billDate,
      receiver_mobile: client.mobile,
      receiver_name: client.name,
      receiver_address: client.address,
      receiver_gst_number: client.gst_number,
      receiver_contact_person: client.contact_person,
      receiver_contact_number: client.contact_number,
      total_value: totalValue,
      total_tax: totalTax,
      total_bill: totalBill,
      tax_shape: taxShape,
      bank_name: "HDFC Bank",
      bank_address: "MG Road",
      bank_account_number: "012345678",
      bank_ifsc: "HDFC0000123",
      saved_at: savedAt,
      stock_applied: false,
    },
    lines.map((line, index) => ({
      bill_id: billId,
      line_order: index,
      tax_rates_are_copy: false,
      ...line,
    }))
  );

  return { billId, savedAt };
}

export function updatePayloadFromBill(bill, overrides = {}) {
  return {
    bill_number_parts: bill.bill_number_parts ?? bill.bill_number.split("-"),
    bill_date: bill.bill_date,
    receiver_mobile: bill.receiver_mobile,
    ...(bill.tax_shape ? { tax_shape: bill.tax_shape } : {}),
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
