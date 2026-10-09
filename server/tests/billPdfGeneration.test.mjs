import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

import {
  DOUBLE_PAGE_PRODUCT_THRESHOLD,
  SHOP_PHONE_NUMBERS,
} from "@jakkash/bill-pdf";
import {
  buildBillPdfFilename,
  generateBillPdfBuffer,
} from "../services/billPdfGeneration.js";
import { createBill } from "./helpers/fixtures.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function billWithProducts(count) {
  return createBill({
    products: Array.from({ length: count }, (_, index) => ({
      product_id: `p-${index}`,
      product_name: `Manja ${index + 1}`,
      quantity: index + 1,
      price: 100 + index,
    })),
  });
}

describe("server-side bill PDF generation", () => {
  it("renders a real PDF from persisted bill data", async () => {
    // Delivery must not depend on a browser tab (PRD 9), so the document has to
    // render in the worker from the row alone.
    const buffer = await generateBillPdfBuffer(billWithProducts(3));

    assert.ok(Buffer.isBuffer(buffer));
    assert.equal(buffer.subarray(0, 5).toString(), "%PDF-");
    assert.ok(buffer.length > 1000, "a real bill document should not be a stub");
  });

  it("renders the two-page layout for a long bill", async () => {
    const buffer = await generateBillPdfBuffer(
      billWithProducts(DOUBLE_PAGE_PRODUCT_THRESHOLD + 4)
    );

    assert.equal(buffer.subarray(0, 5).toString(), "%PDF-");
  });

  it("refuses a bill with no line items instead of sending an empty document", async () => {
    await assert.rejects(
      () => generateBillPdfBuffer(createBill({ products: [] })),
      (error) => {
        assert.equal(error.code, "BILL_PDF_NO_PRODUCTS");
        return true;
      }
    );
  });

  it("names the attachment after the bill number", async () => {
    assert.equal(buildBillPdfFilename(createBill({ order_no: 101 })), "Jakkash-Bill-101.pdf");
    assert.equal(buildBillPdfFilename({}), "Jakkash-Bill-unknown.pdf");
  });
});

describe("shared bill document", () => {
  it("is the same module the bill viewer renders", async () => {
    // The invariant behind PDF parity (PRD 8, 44): one document definition, not
    // a backend copy that can drift from what the operator approves on screen.
    const viewer = await readFile(
      path.join(repoRoot, "client/src/components/bill-pdf/BillPDF2.jsx"),
      "utf8"
    );
    const generator = await readFile(
      path.join(repoRoot, "server/services/billPdfGeneration.js"),
      "utf8"
    );

    assert.match(viewer, /from ["']@jakkash\/bill-pdf["']/);
    assert.match(generator, /from ["']@jakkash\/bill-pdf["']/);
  });

  it("keeps the page-split threshold in one place", async () => {
    // The threshold that chooses the layout and the slice that fills page one
    // drifted apart once already; the document imports the constant so they
    // cannot disagree again.
    const documentSource = await readFile(
      path.join(repoRoot, "shared/bill-pdf/DoublePagePDF.jsx"),
      "utf8"
    );

    assert.equal(typeof DOUBLE_PAGE_PRODUCT_THRESHOLD, "number");
    assert.match(documentSource, /DOUBLE_PAGE_PRODUCT_THRESHOLD/);
    assert.doesNotMatch(
      documentSource,
      /slice\(\s*0\s*,\s*\d+\s*\)/,
      "the first page must slice by the shared threshold, not a hard-coded count"
    );
  });

  it("keeps the shop phone display in the shared bill layouts", async () => {
    const [singlePageSource, doublePageSource] = await Promise.all([
      readFile(path.join(repoRoot, "shared/bill-pdf/SinglePagePDF.jsx"), "utf8"),
      readFile(path.join(repoRoot, "shared/bill-pdf/DoublePagePDF.jsx"), "utf8"),
    ]);

    assert.equal(SHOP_PHONE_NUMBERS, "9213487859");
    assert.match(singlePageSource, /SHOP_PHONE_NUMBERS/);
    assert.match(doublePageSource, /SHOP_PHONE_NUMBERS/);
  });
});
