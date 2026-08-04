import { generateBillPdfBuffer } from "../services/billPdfGeneration.js";

const bill = {
  bill_id: 1,
  bill_no: 1,
  name: "Test",
  address: "Addr",
  mobile: "9876543210",
  order_date: "2026-01-01",
  delivery_date: "2026-01-02",
  products: Array.from({ length: 20 }, (_, i) => ({
    product_name: `Product ${i + 1}`,
    quantity: 1,
    price: 100,
  })),
  total_firki: 20,
  sub_total: 2000,
  discount: 0,
  advance: 0,
  total_due: 2000,
};

const buf = await generateBillPdfBuffer(bill);
console.log(`PDF smoke test passed (${buf.length} bytes)`);
