import { randomUUID } from "node:crypto";

export function createBillSeriesWorld() {
  const rowsById = new Map();

  const deps = {
    async listBillSeries({ limit, offset }) {
      const all = [...rowsById.values()].sort((a, b) =>
        a.name < b.name ? -1 : a.name > b.name ? 1 : 0
      );
      const rows = all.slice(offset, offset + limit);
      return { rows, totalCount: all.length };
    },

    async getBillSeriesById(billSeriesId) {
      return rowsById.get(billSeriesId) ?? null;
    },

    async getBillSeriesByName(name) {
      return [...rowsById.values()].find((row) => row.name === name) ?? null;
    },

    async insertBillSeries(row) {
      const billSeries = {
        bill_series_id: randomUUID(),
        name: row.name,
        is_active: true,
      };
      rowsById.set(billSeries.bill_series_id, billSeries);
      return billSeries;
    },

    async updateBillSeriesActive(billSeriesId, isActive) {
      const existing = rowsById.get(billSeriesId);
      if (!existing) {
        return null;
      }
      const updated = { ...existing, is_active: isActive };
      rowsById.set(billSeriesId, updated);
      return updated;
    },
  };

  return { deps, rowsById };
}
