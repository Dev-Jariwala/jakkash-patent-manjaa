import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createBillSeries,
  deleteBillSeries,
  listBillSeries,
  updateBillSeries,
} from "../services/billSeries.js";
import {
  BillSeriesDeleteError,
  BillSeriesDuplicateError,
  BillSeriesRenameError,
  BillSeriesValidationError,
} from "../services/billSeriesErrors.js";
import { createBillSeriesWorld } from "./helpers/billSeriesWorld.mjs";

const listAll = (deps) => listBillSeries(deps, { limit: 10, offset: 0 });

describe("createBillSeries", () => {
  it("saves ST and 00 as the whole row", async () => {
    const world = createBillSeriesWorld();
    const st = await createBillSeries(world.deps, { name: "ST" });
    const shop = await createBillSeries(world.deps, { name: "00" });

    assert.equal(st.name, "ST");
    assert.equal(st.is_active, true);
    assert.equal(st.shop_code, undefined);
    assert.equal(st.label, undefined);
    assert.equal(shop.name, "00");
    assert.equal(shop.shop_code, undefined);
    assert.equal(shop.label, undefined);

    const { billSeries, totalCount } = await listAll(world.deps);
    assert.equal(totalCount, 2);
    assert.deepEqual(
      billSeries.map((row) => row.name).sort(),
      ["00", "ST"]
    );
  });

  it("stores a space around ST as ST", async () => {
    const world = createBillSeriesWorld();
    const created = await createBillSeries(world.deps, { name: "  ST  " });

    assert.equal(created.name, "ST");

    await assert.rejects(
      () => createBillSeries(world.deps, { name: "ST" }),
      BillSeriesDuplicateError
    );
  });

  it("rejects an empty name", async () => {
    const world = createBillSeriesWorld();
    for (const name of ["", "   "]) {
      await assert.rejects(
        () => createBillSeries(world.deps, { name }),
        (error) => {
          assert.ok(error instanceof BillSeriesValidationError);
          assert.match(error.message, /bill series/i);
          return true;
        }
      );
    }
    const { totalCount } = await listAll(world.deps);
    assert.equal(totalCount, 0);
  });

  it("rejects a name that contains a hyphen", async () => {
    const world = createBillSeriesWorld();
    await assert.rejects(
      () => createBillSeries(world.deps, { name: "ST-1" }),
      (error) => {
        assert.ok(error instanceof BillSeriesValidationError);
        assert.match(error.message, /hyphen/i);
        return true;
      }
    );
  });

  it("rejects a name longer than 20 characters", async () => {
    const world = createBillSeriesWorld();
    const twenty = "A".repeat(20);
    const created = await createBillSeries(world.deps, { name: twenty });
    assert.equal(created.name, twenty);

    await assert.rejects(
      () => createBillSeries(world.deps, { name: "B".repeat(21) }),
      (error) => {
        assert.ok(error instanceof BillSeriesValidationError);
        assert.match(error.message, /20/);
        return true;
      }
    );
  });

  it("rejects a second ST", async () => {
    const world = createBillSeriesWorld();
    await createBillSeries(world.deps, { name: "ST" });

    await assert.rejects(
      () => createBillSeries(world.deps, { name: "ST" }),
      (error) => {
        assert.ok(error instanceof BillSeriesDuplicateError);
        assert.match(error.message, /already exists/i);
        return true;
      }
    );

    const { totalCount } = await listAll(world.deps);
    assert.equal(totalCount, 1);
  });

  it("keeps st beside ST", async () => {
    const world = createBillSeriesWorld();
    const upper = await createBillSeries(world.deps, { name: "ST" });
    const lower = await createBillSeries(world.deps, { name: "st" });

    assert.equal(upper.name, "ST");
    assert.equal(lower.name, "st");

    const { billSeries, totalCount } = await listAll(world.deps);
    assert.equal(totalCount, 2);
    assert.deepEqual(
      billSeries.map((row) => row.name).sort(),
      ["ST", "st"]
    );
  });
});

describe("updateBillSeries", () => {
  it("lists an inactive series as inactive and makes it active again", async () => {
    const world = createBillSeriesWorld();
    const created = await createBillSeries(world.deps, { name: "ST" });

    const turnedOff = await updateBillSeries(world.deps, created.bill_series_id, {
      is_active: false,
    });
    assert.equal(turnedOff.name, "ST");
    assert.equal(turnedOff.is_active, false);

    const listedOff = await listAll(world.deps);
    assert.equal(listedOff.totalCount, 1);
    assert.equal(listedOff.billSeries[0].name, "ST");
    assert.equal(listedOff.billSeries[0].is_active, false);

    const turnedOn = await updateBillSeries(world.deps, created.bill_series_id, {
      is_active: true,
    });
    assert.equal(turnedOn.name, "ST");
    assert.equal(turnedOn.is_active, true);

    const listedOn = await listAll(world.deps);
    assert.equal(listedOn.billSeries[0].is_active, true);
    assert.equal(listedOn.billSeries[0].name, "ST");
  });

  it("refuses to rename a bill series", async () => {
    const world = createBillSeriesWorld();
    const created = await createBillSeries(world.deps, { name: "ST" });

    await assert.rejects(
      () =>
        updateBillSeries(world.deps, created.bill_series_id, {
          name: "ADI",
          is_active: true,
        }),
      (error) => {
        assert.ok(error instanceof BillSeriesRenameError);
        assert.match(error.message, /cannot be renamed/i);
        return true;
      }
    );

    const { billSeries } = await listAll(world.deps);
    assert.equal(billSeries.length, 1);
    assert.equal(billSeries[0].name, "ST");
    assert.equal(billSeries[0].is_active, true);
  });
});

describe("deleteBillSeries", () => {
  it("refuses to delete a bill series and leaves it listed", async () => {
    const world = createBillSeriesWorld();
    const created = await createBillSeries(world.deps, { name: "ST" });

    await assert.rejects(
      () => deleteBillSeries(world.deps, created.bill_series_id),
      (error) => {
        assert.ok(error instanceof BillSeriesDeleteError);
        assert.match(error.message, /cannot be deleted/i);
        return true;
      }
    );

    const { billSeries, totalCount } = await listAll(world.deps);
    assert.equal(totalCount, 1);
    assert.equal(billSeries[0].name, "ST");
  });
});
