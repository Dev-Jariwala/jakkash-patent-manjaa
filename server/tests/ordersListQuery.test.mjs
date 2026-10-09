import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ORDER_SORT_FIELDS,
  resolveOrdersListOrdering,
  resolveOrdersListPagination,
} from "../controllers/orders.js";

describe("orders list ordering", () => {
  it("defaults to the newest order first", () => {
    assert.deepEqual(resolveOrdersListOrdering({}), {
      column: "o.order_no",
      direction: "DESC",
    });
  });

  it("accepts the columns an order can be sorted by", () => {
    for (const [field, column] of Object.entries(ORDER_SORT_FIELDS)) {
      assert.deepEqual(resolveOrdersListOrdering({ sortField: field, sortOrder: "asc" }), {
        column,
        direction: "ASC",
      });
    }
  });

  it("maps every sortable field onto a qualified orders column", () => {
    for (const column of Object.values(ORDER_SORT_FIELDS)) {
      assert.match(column, /^o\.[a-z_]+$/);
    }
  });

  it("falls back to the default rather than trusting the query string", () => {
    for (const sortField of [
      "order_no; DROP TABLE orders",
      "(SELECT 1)",
      "whatsapp_metadata",
      "",
      undefined,
      null,
      "constructor",
      "__proto__",
    ]) {
      assert.equal(
        resolveOrdersListOrdering({ sortField }).column,
        "o.order_no",
        `"${sortField}" must not reach the ORDER BY clause`
      );
    }
  });

  it("narrows the sort direction to the two keywords", () => {
    assert.equal(resolveOrdersListOrdering({ sortOrder: "ASC" }).direction, "ASC");
    assert.equal(resolveOrdersListOrdering({ sortOrder: "asc" }).direction, "ASC");
    assert.equal(resolveOrdersListOrdering({ sortOrder: "desc" }).direction, "DESC");
    assert.equal(
      resolveOrdersListOrdering({ sortOrder: "asc; DELETE FROM orders" }).direction,
      "DESC"
    );
  });
});

describe("orders list pagination", () => {
  it("reads a normal page request", () => {
    assert.deepEqual(resolveOrdersListPagination({ page: "3", limit: "20" }), {
      page: 3,
      limit: 20,
      offset: 40,
    });
  });

  it("defaults a missing or unusable page request", () => {
    assert.deepEqual(resolveOrdersListPagination({}), { page: 1, limit: 10, offset: 0 });
    assert.deepEqual(resolveOrdersListPagination({ page: "abc", limit: "abc" }), {
      page: 1,
      limit: 10,
      offset: 0,
    });
  });

  it("never produces a negative offset or an empty page", () => {
    assert.deepEqual(resolveOrdersListPagination({ page: "-5", limit: "10" }), {
      page: 1,
      limit: 10,
      offset: 0,
    });
    assert.equal(resolveOrdersListPagination({ page: "1", limit: "0" }).limit, 10);
    assert.equal(resolveOrdersListPagination({ page: "1", limit: "-20" }).limit, 1);
  });

  it("caps how many orders one request can pull", () => {
    assert.equal(resolveOrdersListPagination({ page: "1", limit: "100000" }).limit, 200);
  });
});
