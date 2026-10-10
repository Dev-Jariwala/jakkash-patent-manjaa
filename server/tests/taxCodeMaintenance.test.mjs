import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createTaxCode,
  listTaxCodes,
  updateTaxCode,
} from "../services/taxCodeMaintenance.js";
import {
  TaxCodeDuplicateError,
  TaxCodeNotFoundError,
  TaxCodeRatesMismatchError,
  TaxCodeTypeChangeError,
  TaxCodeValidationError,
} from "../services/taxCodeMaintenanceErrors.js";
import {
  createTaxCodeMaintenanceWorld,
  validTaxCodePayload,
} from "./helpers/taxCodeMaintenanceWorld.mjs";

describe("createTaxCode", () => {
  it("creates an HSN with 4 digits and lists it", async () => {
    const world = createTaxCodeMaintenanceWorld();
    const created = await createTaxCode(world.deps, validTaxCodePayload());

    assert.ok(created.tax_code_id);
    assert.equal(created.type, "HSN");
    assert.equal(created.code, "5209");
    assert.equal(created.description, "Woven fabrics of cotton");
    assert.equal(created.cgst, 2.5);
    assert.equal(created.sgst, 2.5);
    assert.equal(created.igst, 5);

    const { taxCodes, totalCount } = await listTaxCodes(world.deps, { limit: 10, offset: 0 });
    assert.equal(totalCount, 1);
    assert.equal(taxCodes[0].code, "5209");
  });

  for (const code of ["520910", "52091010"]) {
    it(`accepts HSN length ${code.length}`, async () => {
      const world = createTaxCodeMaintenanceWorld();
      const created = await createTaxCode(
        world.deps,
        validTaxCodePayload({ code, description: `HSN ${code.length}` })
      );
      assert.equal(created.code, code);
    });
  }

  it("creates a 6-digit SAC", async () => {
    const world = createTaxCodeMaintenanceWorld();
    const created = await createTaxCode(
      world.deps,
      validTaxCodePayload({
        type: "SAC",
        code: "998314",
        description: "Printing services",
        cgst: 9,
        sgst: 9,
        igst: 18,
      })
    );
    assert.equal(created.type, "SAC");
    assert.equal(created.code, "998314");
  });

  it("allows the same digits as HSN and SAC", async () => {
    const world = createTaxCodeMaintenanceWorld();
    await createTaxCode(
      world.deps,
      validTaxCodePayload({ type: "HSN", code: "520910", description: "Goods" })
    );
    const sac = await createTaxCode(
      world.deps,
      validTaxCodePayload({
        type: "SAC",
        code: "520910",
        description: "Services",
        cgst: 0,
        sgst: 0,
        igst: 0,
      })
    );
    assert.equal(sac.code, "520910");
    assert.equal(world.rowsById.size, 2);
  });

  it("rejects invalid HSN lengths", async () => {
    const world = createTaxCodeMaintenanceWorld();
    for (const code of ["520", "52091", "520910101"]) {
      await assert.rejects(
        () =>
          createTaxCode(
            world.deps,
            validTaxCodePayload({ code, description: "Bad length" })
          ),
        TaxCodeValidationError
      );
    }
  });

  it("rejects invalid SAC lengths", async () => {
    const world = createTaxCodeMaintenanceWorld();
    await assert.rejects(
      () =>
        createTaxCode(
          world.deps,
          validTaxCodePayload({
            type: "SAC",
            code: "99831",
            description: "Too short",
            cgst: 0,
            sgst: 0,
            igst: 0,
          })
        ),
      TaxCodeValidationError
    );
  });

  it("rejects a non-digit code", async () => {
    const world = createTaxCodeMaintenanceWorld();
    await assert.rejects(
      () => createTaxCode(world.deps, validTaxCodePayload({ code: "52A9" })),
      TaxCodeValidationError
    );
  });

  it("rejects a blank description", async () => {
    const world = createTaxCodeMaintenanceWorld();
    await assert.rejects(
      () => createTaxCode(world.deps, validTaxCodePayload({ description: "   " })),
      TaxCodeValidationError
    );
  });

  it("rejects a duplicate code of the same type", async () => {
    const world = createTaxCodeMaintenanceWorld();
    await createTaxCode(world.deps, validTaxCodePayload());

    await assert.rejects(
      () =>
        createTaxCode(
          world.deps,
          validTaxCodePayload({ description: "Another row" })
        ),
      (error) => {
        assert.ok(error instanceof TaxCodeDuplicateError);
        assert.match(error.message, /already exists for that type/i);
        return true;
      }
    );
  });

  it("rejects unequal CGST and SGST", async () => {
    const world = createTaxCodeMaintenanceWorld();
    await assert.rejects(
      () =>
        createTaxCode(
          world.deps,
          validTaxCodePayload({ cgst: 2.5, sgst: 3, igst: 5.5 })
        ),
      TaxCodeRatesMismatchError
    );
  });

  it("rejects IGST that is not CGST plus SGST", async () => {
    const world = createTaxCodeMaintenanceWorld();
    await assert.rejects(
      () =>
        createTaxCode(
          world.deps,
          validTaxCodePayload({ cgst: 2.5, sgst: 2.5, igst: 6 })
        ),
      (error) => {
        assert.ok(error instanceof TaxCodeRatesMismatchError);
        assert.match(error.message, /three rates do not match/i);
        return true;
      }
    );
  });

  it("accepts zero rates", async () => {
    const world = createTaxCodeMaintenanceWorld();
    const created = await createTaxCode(
      world.deps,
      validTaxCodePayload({ cgst: 0, sgst: 0, igst: 0 })
    );
    assert.equal(created.igst, 0);
  });

  it("rejects a negative rate", async () => {
    const world = createTaxCodeMaintenanceWorld();
    await assert.rejects(
      () =>
        createTaxCode(
          world.deps,
          validTaxCodePayload({ cgst: -1, sgst: -1, igst: -2 })
        ),
      TaxCodeValidationError
    );
  });

  it("rejects more than two decimal places", async () => {
    const world = createTaxCodeMaintenanceWorld();
    await assert.rejects(
      () =>
        createTaxCode(
          world.deps,
          validTaxCodePayload({ cgst: 2.555, sgst: 2.555, igst: 5.11 })
        ),
      TaxCodeValidationError
    );
  });

  it("rejects a missing rate", async () => {
    const world = createTaxCodeMaintenanceWorld();
    await assert.rejects(
      () =>
        createTaxCode(world.deps, {
          ...validTaxCodePayload(),
          igst: "",
        }),
      TaxCodeValidationError
    );
  });
});

describe("updateTaxCode", () => {
  it("changes code, description, and rates", async () => {
    const world = createTaxCodeMaintenanceWorld();
    const created = await createTaxCode(world.deps, validTaxCodePayload());

    const updated = await updateTaxCode(world.deps, created.tax_code_id, {
      type: "HSN",
      code: "5208",
      description: "Updated description",
      cgst: 6,
      sgst: 6,
      igst: 12,
    });

    assert.equal(updated.code, "5208");
    assert.equal(updated.description, "Updated description");
    assert.equal(updated.igst, 12);
  });

  it("allows saving the row's own code again", async () => {
    const world = createTaxCodeMaintenanceWorld();
    const created = await createTaxCode(world.deps, validTaxCodePayload());

    const updated = await updateTaxCode(world.deps, created.tax_code_id, {
      type: "HSN",
      code: "5209",
      description: "Tweaked description",
      cgst: 2.5,
      sgst: 2.5,
      igst: 5,
    });

    assert.equal(updated.code, "5209");
    assert.equal(updated.description, "Tweaked description");
  });

  it("rejects a code already used by another row of the same type", async () => {
    const world = createTaxCodeMaintenanceWorld();
    const first = await createTaxCode(world.deps, validTaxCodePayload({ code: "5209" }));
    const second = await createTaxCode(
      world.deps,
      validTaxCodePayload({ code: "5208", description: "Other" })
    );

    await assert.rejects(
      () =>
        updateTaxCode(world.deps, second.tax_code_id, {
          type: "HSN",
          code: "5209",
          description: "Collision",
          cgst: 2.5,
          sgst: 2.5,
          igst: 5,
        }),
      TaxCodeDuplicateError
    );
    assert.equal(world.rowsById.get(first.tax_code_id).code, "5209");
  });

  it("rejects a type change", async () => {
    const world = createTaxCodeMaintenanceWorld();
    const created = await createTaxCode(world.deps, validTaxCodePayload());

    await assert.rejects(
      () =>
        updateTaxCode(world.deps, created.tax_code_id, {
          type: "SAC",
          code: "998314",
          description: "Services",
          cgst: 2.5,
          sgst: 2.5,
          igst: 5,
        }),
      TaxCodeTypeChangeError
    );
  });

  it("returns not found for an unknown id", async () => {
    const world = createTaxCodeMaintenanceWorld();
    await assert.rejects(
      () =>
        updateTaxCode(world.deps, "00000000-0000-0000-0000-000000000000", {
          type: "HSN",
          code: "5209",
          description: "Missing",
          cgst: 0,
          sgst: 0,
          igst: 0,
        }),
      TaxCodeNotFoundError
    );
  });
});
