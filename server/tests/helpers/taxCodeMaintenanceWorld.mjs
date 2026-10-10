import { randomUUID } from "node:crypto";

export function createTaxCodeMaintenanceWorld() {
  const rowsById = new Map();

  const deps = {
    async listTaxCodes({ limit, offset }) {
      const all = [...rowsById.values()].sort((a, b) => {
        if (a.type !== b.type) {
          return a.type.localeCompare(b.type);
        }
        return a.code.localeCompare(b.code);
      });
      const rows = all.slice(offset, offset + limit);
      return { rows, totalCount: all.length };
    },

    async getTaxCodeById(taxCodeId) {
      return rowsById.get(taxCodeId) ?? null;
    },

    async getTaxCodeByTypeAndCode(type, code) {
      return (
        [...rowsById.values()].find((row) => row.type === type && row.code === code) ?? null
      );
    },

    async insertTaxCode(row) {
      const taxCode = {
        tax_code_id: randomUUID(),
        type: row.type,
        code: row.code,
        description: row.description,
        cgst: row.cgst,
        sgst: row.sgst,
        igst: row.igst,
      };
      rowsById.set(taxCode.tax_code_id, taxCode);
      return taxCode;
    },

    async updateTaxCode(taxCodeId, row) {
      const existing = rowsById.get(taxCodeId);
      if (!existing) {
        return null;
      }
      const updated = {
        ...existing,
        code: row.code,
        description: row.description,
        cgst: row.cgst,
        sgst: row.sgst,
        igst: row.igst,
      };
      rowsById.set(taxCodeId, updated);
      return updated;
    },
  };

  return { deps, rowsById };
}

export function validTaxCodePayload(overrides = {}) {
  return {
    type: "HSN",
    code: "5209",
    description: "Woven fabrics of cotton",
    cgst: 2.5,
    sgst: 2.5,
    igst: 5,
    ...overrides,
  };
}
