import { query } from "../utils/query.js";

export function createTaxCodeMaintenanceDeps() {
  return {
    async listTaxCodes({ limit, offset }) {
      const [{ count: totalCount }] = await query(
        `select count(*)::int as count from tax_codes`
      );
      const rows = await query(
        `select tax_code_id, type, code, description, cgst, sgst, igst
         from tax_codes
         order by type, code
         limit $1 offset $2`,
        [limit, offset]
      );
      return { rows, totalCount };
    },

    async getTaxCodeById(taxCodeId) {
      const [row] = await query(
        `select tax_code_id, type, code, description, cgst, sgst, igst
         from tax_codes
         where tax_code_id = $1`,
        [taxCodeId]
      );
      return row ?? null;
    },

    async getTaxCodeByTypeAndCode(type, code) {
      const [row] = await query(
        `select tax_code_id, type, code, description, cgst, sgst, igst
         from tax_codes
         where type = $1 and code = $2`,
        [type, code]
      );
      return row ?? null;
    },

    async insertTaxCode(row) {
      const [inserted] = await query(
        `insert into tax_codes (type, code, description, cgst, sgst, igst)
         values ($1, $2, $3, $4, $5, $6)
         returning tax_code_id, type, code, description, cgst, sgst, igst`,
        [row.type, row.code, row.description, row.cgst, row.sgst, row.igst]
      );
      return inserted;
    },

    async updateTaxCode(taxCodeId, row) {
      const [updated] = await query(
        `update tax_codes
         set code = $1, description = $2, cgst = $3, sgst = $4, igst = $5
         where tax_code_id = $6
         returning tax_code_id, type, code, description, cgst, sgst, igst`,
        [row.code, row.description, row.cgst, row.sgst, row.igst, taxCodeId]
      );
      return updated ?? null;
    },
  };
}
