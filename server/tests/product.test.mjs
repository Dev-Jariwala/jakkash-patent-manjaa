import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createProduct,
  getProduct,
  listProducts,
  updateProduct,
} from "../services/product.js";
import {
  ProductTaxCodeCategoryMismatchError,
  ProductTaxCodeNotFoundError,
  ProductTaxCodeRequiredError,
} from "../services/productErrors.js";
import {
  createProductWorld,
  validProductPayload,
} from "./helpers/productWorld.mjs";

const collectionId = "c1";

describe("createProduct", () => {
  it("saves a Product with an HSN", async () => {
    const world = createProductWorld();
    const hsn = world.insertTaxCode({
      type: "HSN",
      code: "5209",
      description: "Woven fabrics of cotton",
    });

    const saved = await createProduct(world.deps, collectionId, {
      ...validProductPayload({ tax_code_id: hsn.tax_code_id }),
      is_labour: 0,
    });

    assert.equal(saved.tax_code_id, hsn.tax_code_id);
    assert.equal(saved.tax_code_type, "HSN");
    assert.equal(saved.tax_code_code, "5209");
    assert.equal(saved.tax_code_description, "Woven fabrics of cotton");
    assert.equal(saved.is_labour, false);
  });

  it("saves Labour with a SAC", async () => {
    const world = createProductWorld();
    const sac = world.insertTaxCode({
      type: "SAC",
      code: "998821",
      description: "Embroidery services",
    });

    const saved = await createProduct(world.deps, collectionId, {
      ...validProductPayload({
        product_name: "Stitching",
        tax_code_id: sac.tax_code_id,
      }),
      is_labour: 1,
    });

    assert.equal(saved.tax_code_type, "SAC");
    assert.equal(saved.tax_code_code, "998821");
    assert.equal(saved.is_labour, true);
  });

  it("rejects a missing tax code", async () => {
    const world = createProductWorld();
    world.insertTaxCode({ type: "HSN", code: "5209", description: "Cotton" });

    await assert.rejects(
      () =>
        createProduct(world.deps, collectionId, {
          product_name: "Cotton",
          wholesale_price: 100,
          retail_price: 120,
          is_labour: 0,
        }),
      (error) => {
        assert.ok(error instanceof ProductTaxCodeRequiredError);
        assert.match(error.message, /HSN\/SAC is required/i);
        return true;
      }
    );
  });

  it("rejects an unknown tax code", async () => {
    const world = createProductWorld();
    await assert.rejects(
      () =>
        createProduct(world.deps, collectionId, {
          ...validProductPayload({ tax_code_id: "missing-id" }),
        }),
      ProductTaxCodeNotFoundError
    );
  });

  it("rejects a SAC on a Product", async () => {
    const world = createProductWorld();
    const sac = world.insertTaxCode({
      type: "SAC",
      code: "998821",
      description: "Embroidery services",
    });

    await assert.rejects(
      () =>
        createProduct(world.deps, collectionId, {
          ...validProductPayload({ tax_code_id: sac.tax_code_id }),
          is_labour: 0,
        }),
      (error) => {
        assert.ok(error instanceof ProductTaxCodeCategoryMismatchError);
        assert.match(error.message, /product must use an HSN or labour must use a SAC/i);
        return true;
      }
    );
  });

  it("rejects an HSN on Labour", async () => {
    const world = createProductWorld();
    const hsn = world.insertTaxCode({
      type: "HSN",
      code: "5209",
      description: "Cotton",
    });

    await assert.rejects(
      () =>
        createProduct(world.deps, collectionId, {
          ...validProductPayload({ tax_code_id: hsn.tax_code_id }),
          is_labour: 1,
        }),
      ProductTaxCodeCategoryMismatchError
    );
  });

  it("allows two products to name the same tax code", async () => {
    const world = createProductWorld();
    const hsn = world.insertTaxCode({
      type: "HSN",
      code: "5209",
      description: "Cotton",
    });

    await createProduct(world.deps, collectionId, {
      ...validProductPayload({ product_name: "Cotton A", tax_code_id: hsn.tax_code_id }),
    });
    const second = await createProduct(world.deps, collectionId, {
      ...validProductPayload({ product_name: "Cotton B", tax_code_id: hsn.tax_code_id }),
    });

    assert.equal(second.tax_code_id, hsn.tax_code_id);
  });
});

describe("updateProduct", () => {
  it("changes which tax code the product names", async () => {
    const world = createProductWorld();
    const hsnA = world.insertTaxCode({
      type: "HSN",
      code: "5209",
      description: "Cotton A",
    });
    const hsnB = world.insertTaxCode({
      type: "HSN",
      code: "5210",
      description: "Cotton B",
    });

    const created = await createProduct(world.deps, collectionId, {
      ...validProductPayload({ tax_code_id: hsnA.tax_code_id }),
    });

    const updated = await updateProduct(world.deps, created.product_id, {
      ...validProductPayload({ tax_code_id: hsnB.tax_code_id }),
    });

    assert.equal(updated.tax_code_id, hsnB.tax_code_id);
    assert.equal(updated.tax_code_code, "5210");
  });

  it("rejects clearing the tax code on edit", async () => {
    const world = createProductWorld();
    const hsn = world.insertTaxCode({
      type: "HSN",
      code: "5209",
      description: "Cotton",
    });
    const created = await createProduct(world.deps, collectionId, {
      ...validProductPayload({ tax_code_id: hsn.tax_code_id }),
    });

    await assert.rejects(
      () =>
        updateProduct(world.deps, created.product_id, {
          product_name: "Cotton",
          wholesale_price: 100,
          retail_price: 120,
          is_labour: 0,
          tax_code_id: "",
        }),
      ProductTaxCodeRequiredError
    );

    const loaded = await getProduct(world.deps, created.product_id);
    assert.equal(loaded.tax_code_id, hsn.tax_code_id);
  });
});

describe("getProduct and listProducts", () => {
  it("lists type and code, and a blank when the product has none", async () => {
    const world = createProductWorld();
    const hsn = world.insertTaxCode({
      type: "HSN",
      code: "5209",
      description: "Cotton",
    });
    await createProduct(world.deps, collectionId, {
      ...validProductPayload({ tax_code_id: hsn.tax_code_id }),
    });
    world.seedProduct({
      collection_id: collectionId,
      product_name: "Legacy",
      tax_code_id: null,
    });

    const { products } = await listProducts(world.deps, {
      collectionId,
      page: 1,
      limit: 10,
      search: "",
    });

    const withCode = products.find((p) => p.product_name === "Cotton");
    const legacy = products.find((p) => p.product_name === "Legacy");

    assert.equal(withCode.tax_code_type, "HSN");
    assert.equal(withCode.tax_code_code, "5209");
    assert.equal(legacy.tax_code_id, null);
    assert.equal(legacy.tax_code_type, null);
    assert.equal(legacy.tax_code_code, null);
  });

  it("shows the code currently on the Masters row after that row's code is edited", async () => {
    const world = createProductWorld();
    const hsn = world.insertTaxCode({
      type: "HSN",
      code: "5209",
      description: "Cotton",
    });
    const created = await createProduct(world.deps, collectionId, {
      ...validProductPayload({ tax_code_id: hsn.tax_code_id }),
    });

    world.updateTaxCode(hsn.tax_code_id, {
      code: "5211",
      description: "Cotton revised",
    });

    const loaded = await getProduct(world.deps, created.product_id);
    assert.equal(loaded.tax_code_code, "5211");
    assert.equal(loaded.tax_code_description, "Cotton revised");
  });

  it("returns every product when page is -1", async () => {
    const world = createProductWorld();
    const hsn = world.insertTaxCode({
      type: "HSN",
      code: "5209",
      description: "Cotton",
    });
    for (let i = 0; i < 12; i += 1) {
      await createProduct(world.deps, collectionId, {
        ...validProductPayload({
          product_name: `Bulk ${i}`,
          tax_code_id: hsn.tax_code_id,
        }),
      });
    }

    const { products, totalCount } = await listProducts(world.deps, {
      collectionId,
      page: -1,
      limit: undefined,
      search: "",
    });

    assert.equal(totalCount, 12);
    assert.equal(products.length, 12);
  });

  it("still limits a normal paged request", async () => {
    const world = createProductWorld();
    const hsn = world.insertTaxCode({
      type: "HSN",
      code: "5210",
      description: "Cotton",
    });
    for (let i = 0; i < 8; i += 1) {
      await createProduct(world.deps, collectionId, {
        ...validProductPayload({
          product_name: `Page ${i}`,
          tax_code_id: hsn.tax_code_id,
        }),
      });
    }

    const { products, totalCount } = await listProducts(world.deps, {
      collectionId,
      page: 1,
      limit: 3,
      search: "",
    });

    assert.equal(totalCount, 8);
    assert.equal(products.length, 3);
  });

  it("falls back to created_at when sortField is not a real column", async () => {
    const world = createProductWorld();
    const hsn = world.insertTaxCode({
      type: "HSN",
      code: "5211",
      description: "Cotton",
    });

    const older = world.seedProduct({
      collection_id: collectionId,
      product_name: "Older",
      tax_code_id: hsn.tax_code_id,
      created_at: "2020-01-01T00:00:00.000Z",
    });
    const newer = world.seedProduct({
      collection_id: collectionId,
      product_name: "Newer",
      tax_code_id: hsn.tax_code_id,
      created_at: "2024-01-01T00:00:00.000Z",
    });

    const { products } = await listProducts(world.deps, {
      collectionId,
      page: -1,
      search: "",
      sortField: "constructor",
      sortOrder: "desc",
    });

    assert.equal(products[0].product_id, newer.product_id);
    assert.equal(products[1].product_id, older.product_id);
  });

  it("requires a tax code when a legacy product without one is edited", async () => {
    const world = createProductWorld();
    const legacy = world.seedProduct({
      collection_id: collectionId,
      product_name: "Legacy",
      tax_code_id: null,
    });

    await assert.rejects(
      () =>
        updateProduct(world.deps, legacy.product_id, {
          product_name: "Legacy",
          wholesale_price: 100,
          retail_price: 120,
          is_labour: 0,
          tax_code_id: "",
        }),
      ProductTaxCodeRequiredError
    );
  });
});
