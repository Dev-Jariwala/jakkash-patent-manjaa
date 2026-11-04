import { query } from "../utils/query.js";

export function createBillSeriesDeps() {
  return {
    async listBillSeries({ limit, offset }) {
      const [{ count: totalCount }] = await query(
        `select count(*)::int as count from bill_series`
      );
      const rows = await query(
        `select bill_series_id, name, is_active
         from bill_series
         order by name
         limit $1 offset $2`,
        [limit, offset]
      );
      return { rows, totalCount };
    },

    async getBillSeriesById(billSeriesId) {
      const [row] = await query(
        `select bill_series_id, name, is_active
         from bill_series
         where bill_series_id = $1`,
        [billSeriesId]
      );
      return row ?? null;
    },

    async getBillSeriesByName(name) {
      const [row] = await query(
        `select bill_series_id, name, is_active
         from bill_series
         where name = $1`,
        [name]
      );
      return row ?? null;
    },

    async insertBillSeries(row) {
      const [inserted] = await query(
        `insert into bill_series (name, is_active)
         values ($1, true)
         returning bill_series_id, name, is_active`,
        [row.name]
      );
      return inserted;
    },

    async updateBillSeriesActive(billSeriesId, isActive) {
      const [updated] = await query(
        `update bill_series
         set is_active = $1
         where bill_series_id = $2
         returning bill_series_id, name, is_active`,
        [isActive, billSeriesId]
      );
      return updated ?? null;
    },
  };
}
