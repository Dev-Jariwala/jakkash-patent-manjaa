import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  BILL_SORT_FIELDS,
  resolveBillsListOrdering,
  resolveBillsListPagination,
} from "../controllers/bills.js";

/**
 * The bills list is where the WhatsApp delivery status is read, and its sort and
 * pagination values come straight off the query string. A SQL identifier cannot
 * be bound as a parameter, so these resolvers are the only thing standing
 * between the query string and the `ORDER BY` clause.
 */
describe("bills list ordering", () => {
  it("defaults to the newest bill first", () => {
    assert.deepEqual(resolveBillsListOrdering({}), {
      column: "b.bill_no",
      direction: "DESC",
    });
  });

  it("accepts the columns a bill can be sorted by", () => {
    for (const [field, column] of Object.entries(BILL_SORT_FIELDS)) {
      assert.deepEqual(resolveBillsListOrdering({ sortField: field, sortOrder: "asc" }), {
        column,
        direction: "ASC",
      });
    }
  });

  it("maps every sortable field onto a qualified bills column", () => {
    // An unqualified name would be ambiguous against the joined clients table.
    for (const column of Object.values(BILL_SORT_FIELDS)) {
      assert.match(column, /^b\.[a-z_]+$/);
    }
  });

  it("falls back to the default rather than trusting the query string", () => {
    for (const sortField of [
      "bill_no; DROP TABLE bills",
      "(SELECT 1)",
      "whatsapp_metadata",
      "",
      undefined,
      null,
      "constructor",
      "__proto__",
    ]) {
      assert.equal(
        resolveBillsListOrdering({ sortField }).column,
        "b.bill_no",
        `"${sortField}" must not reach the ORDER BY clause`
      );
    }
  });

  it("narrows the sort direction to the two keywords", () => {
    assert.equal(resolveBillsListOrdering({ sortOrder: "ASC" }).direction, "ASC");
    assert.equal(resolveBillsListOrdering({ sortOrder: "asc" }).direction, "ASC");
    assert.equal(resolveBillsListOrdering({ sortOrder: "desc" }).direction, "DESC");
    assert.equal(
      resolveBillsListOrdering({ sortOrder: "asc; DELETE FROM bills" }).direction,
      "DESC"
    );
  });
});

describe("bills list pagination", () => {
  it("reads a normal page request", () => {
    assert.deepEqual(resolveBillsListPagination({ page: "3", limit: "20" }), {
      page: 3,
      limit: 20,
      offset: 40,
    });
  });

  it("defaults a missing or unusable page request", () => {
    assert.deepEqual(resolveBillsListPagination({}), { page: 1, limit: 10, offset: 0 });
    assert.deepEqual(resolveBillsListPagination({ page: "abc", limit: "abc" }), {
      page: 1,
      limit: 10,
      offset: 0,
    });
  });

  it("never produces a negative offset or an empty page", () => {
    assert.deepEqual(resolveBillsListPagination({ page: "-5", limit: "10" }), {
      page: 1,
      limit: 10,
      offset: 0,
    });
    assert.equal(resolveBillsListPagination({ page: "1", limit: "0" }).limit, 10);
    assert.equal(resolveBillsListPagination({ page: "1", limit: "-20" }).limit, 1);
  });

  it("caps how many bills one request can pull", () => {
    assert.equal(resolveBillsListPagination({ page: "1", limit: "100000" }).limit, 200);
  });
});
