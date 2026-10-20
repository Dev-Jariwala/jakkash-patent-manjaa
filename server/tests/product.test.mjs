import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  copyProductsToCollection,
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
const sourceCollectionId = "default-collection";
const targetCollectionId = "2026-collection";

describe("copyProductsToCollection", () => {
  it("copies Cotton as Product with the same HSN and with prices and stock at 0", async () => {
    const world = createProductWorld();
    const hsn = world.insertTaxCode({
      type: "HSN",
      code: "5209",
      description: "Cotton fabric",
    });
    world.seedProduct({
      collection_id: sourceCollectionId,
      product_name: "Cotton",
      wholesale_price: 250,
      retail_price: 300,
      stock_in_hand: 40,
      total_stock: 100,
      is_labour: false,
      tax_code_id: hsn.tax_code_id,
    });

    const copied = await copyProductsToCollection(
      world.deps,
      sourceCollectionId,
      targetCollectionId
    );

    assert.equal(copied.length, 1);
    const cotton = copied[0];
    assert.equal(cotton.product_name, "Cotton");
    assert.equal(cotton.is_labour, false);
    assert.equal(cotton.tax_code_id, hsn.tax_code_id);
    assert.equal(cotton.tax_code_type, "HSN");
    assert.equal(cotton.tax_code_code, "5209");
    assert.equal(cotton.wholesale_price, 0);
    assert.equal(cotton.retail_price, 0);
    assert.equal(cotton.stock_in_hand, 0);
    assert.equal(cotton.total_stock, 0);
  });

  it("copies Stitching as Labour with the same SAC and with prices and stock at 0", async () => {
    const world = createProductWorld();
    const sac = world.insertTaxCode({
      type: "SAC",
      code: "998821",
      description: "Embroidery services",
    });
    world.seedProduct({
      collection_id: sourceCollectionId,
      product_name: "Stitching",
      wholesale_price: 80,
      retail_price: 120,
      stock_in_hand: 5,
      total_stock: 5,
      is_labour: true,
      tax_code_id: sac.tax_code_id,
    });

    const copied = await copyProductsToCollection(
      world.deps,
      sourceCollectionId,
      targetCollectionId
    );

    assert.equal(copied.length, 1);
    const stitching = copied[0];
    assert.equal(stitching.is_labour, true);
    assert.equal(stitching.tax_code_id, sac.tax_code_id);
    assert.equal(stitching.tax_code_type, "SAC");
    assert.equal(stitching.tax_code_code, "998821");
    assert.equal(stitching.wholesale_price, 0);
    assert.equal(stitching.retail_price, 0);
    assert.equal(stitching.stock_in_hand, 0);
    assert.equal(stitching.total_stock, 0);
  });

  it("copies a product with no tax code without one", async () => {
    const world = createProductWorld();
    world.seedProduct({
      collection_id: sourceCollectionId,
      product_name: "Legacy",
      tax_code_id: null,
    });

    const copied = await copyProductsToCollection(
      world.deps,
      sourceCollectionId,
      targetCollectionId
    );

    assert.equal(copied.length, 1);
    assert.equal(copied[0].tax_code_id, null);
    assert.equal(copied[0].tax_code_type, null);
    assert.equal(copied[0].tax_code_code, null);

    const { products } = await listProducts(world.deps, {
      collectionId: targetCollectionId,
      page: 1,
      limit: 10,
      search: "",
    });
    const legacy = products.find((p) => p.product_name === "Legacy");
    assert.equal(legacy.tax_code_code, null);
  });

  it("lets two products that share an HSN both keep it", async () => {
    const world = createProductWorld();
    const hsn = world.insertTaxCode({
      type: "HSN",
      code: "5209",
      description: "Cotton",
    });
    world.seedProduct({
      collection_id: sourceCollectionId,
      product_name: "Cotton A",
      tax_code_id: hsn.tax_code_id,
    });
    world.seedProduct({
      collection_id: sourceCollectionId,
      product_name: "Cotton B",
      tax_code_id: hsn.tax_code_id,
    });

    const copied = await copyProductsToCollection(
      world.deps,
      sourceCollectionId,
      targetCollectionId
    );

    assert.equal(copied.length, 2);
    assert.ok(copied.every((p) => p.tax_code_id === hsn.tax_code_id));
  });

  it("copies a name that contains a quote intact", async () => {
    const world = createProductWorld();
    const hsn = world.insertTaxCode({
      type: "HSN",
      code: "5209",
      description: "Cotton",
    });
    const quotedName = `Cotton "special", blend`;
    world.seedProduct({
      collection_id: sourceCollectionId,
      product_name: quotedName,
      tax_code_id: hsn.tax_code_id,
    });

    const copied = await copyProductsToCollection(
      world.deps,
      sourceCollectionId,
      targetCollectionId
    );

    assert.equal(copied[0].product_name, quotedName);
  });

  it("leaves the source collection unchanged", async () => {
    const world = createProductWorld();
    const hsn = world.insertTaxCode({
      type: "HSN",
      code: "5209",
      description: "Cotton",
    });
    const source = world.seedProduct({
      collection_id: sourceCollectionId,
      product_name: "Cotton",
      wholesale_price: 200,
      retail_price: 240,
      stock_in_hand: 15,
      total_stock: 50,
      is_labour: false,
      tax_code_id: hsn.tax_code_id,
    });

    await copyProductsToCollection(world.deps, sourceCollectionId, targetCollectionId);

    const unchanged = await getProduct(world.deps, source.product_id);
    assert.equal(unchanged.wholesale_price, 200);
    assert.equal(unchanged.retail_price, 240);
    assert.equal(unchanged.stock_in_hand, 15);
    assert.equal(unchanged.total_stock, 50);
    assert.equal(unchanged.is_labour, false);
    assert.equal(unchanged.tax_code_id, hsn.tax_code_id);
  });

  it("creates no products when the source collection is empty", async () => {
    const world = createProductWorld();

    const copied = await copyProductsToCollection(
      world.deps,
      sourceCollectionId,
      targetCollectionId
    );

    assert.equal(copied.length, 0);
    const { totalCount } = await listProducts(world.deps, {
      collectionId: targetCollectionId,
      page: 1,
      limit: 10,
      search: "",
    });
    assert.equal(totalCount, 0);
  });
});

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

  it("lists by serial number lowest first, and stays in that order after a tax code is set", async () => {
    const world = createProductWorld();
    const hsn = world.insertTaxCode({
      type: "HSN",
      code: "5209",
      description: "Cotton",
    });
    const first = world.seedProduct({
      collection_id: collectionId,
      product_name: "Early serial",
      tax_code_id: hsn.tax_code_id,
      created_at: "2020-01-01T00:00:00.000Z",
    });
    const middle = world.seedProduct({
      collection_id: collectionId,
      product_name: "Edited serial",
      tax_code_id: null,
      created_at: "2024-06-01T00:00:00.000Z",
    });
    const last = world.seedProduct({
      collection_id: collectionId,
      product_name: "Late serial",
      tax_code_id: hsn.tax_code_id,
      created_at: "2022-01-01T00:00:00.000Z",
    });

    const before = await listProducts(world.deps, {
      collectionId,
      page: 1,
      limit: 10,
      search: "",
    });

    assert.equal(before.totalCount, 3);
    assert.deepEqual(
      before.products.map((product) => product.product_id),
      [first.product_id, middle.product_id, last.product_id]
    );
    assert.deepEqual(
      before.products.map((product) => product.sr_no),
      [first.sr_no, middle.sr_no, last.sr_no]
    );
    assert.ok(first.sr_no < middle.sr_no && middle.sr_no < last.sr_no);

    const updated = await updateProduct(world.deps, middle.product_id, {
      product_name: middle.product_name,
      wholesale_price: middle.wholesale_price,
      retail_price: middle.retail_price,
      is_labour: 0,
      tax_code_id: hsn.tax_code_id,
    });

    assert.equal(updated.sr_no, middle.sr_no);
    assert.equal(updated.tax_code_id, hsn.tax_code_id);

    const after = await listProducts(world.deps, {
      collectionId,
      page: 1,
      limit: 10,
      search: "",
    });

    assert.equal(after.totalCount, before.totalCount);
    assert.deepEqual(
      after.products.map((product) => product.product_id),
      [first.product_id, middle.product_id, last.product_id]
    );
    assert.equal(after.products[1].sr_no, middle.sr_no);
    assert.equal(after.products[1].tax_code_code, "5209");
  });

  it("falls back to serial number lowest first when sortField is not a real column", async () => {
    const world = createProductWorld();
    const hsn = world.insertTaxCode({
      type: "HSN",
      code: "5211",
      description: "Cotton",
    });

    const lowerSerial = world.seedProduct({
      collection_id: collectionId,
      product_name: "Lower serial",
      tax_code_id: hsn.tax_code_id,
      created_at: "2020-01-01T00:00:00.000Z",
    });
    const higherSerial = world.seedProduct({
      collection_id: collectionId,
      product_name: "Higher serial",
      tax_code_id: hsn.tax_code_id,
      created_at: "2024-01-01T00:00:00.000Z",
    });

    const { products } = await listProducts(world.deps, {
      collectionId,
      page: -1,
      search: "",
      sortField: "constructor",
    });

    assert.equal(products[0].product_id, lowerSerial.product_id);
    assert.equal(products[1].product_id, higherSerial.product_id);
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
