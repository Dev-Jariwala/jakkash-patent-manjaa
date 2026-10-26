import { normalizeBillCalendarDate } from "../utils/billCalendarDate.js";
import { query, withTransaction } from "../utils/query.js";
import { createShopBankAccountDeps } from "./shopBankAccountStore.js";

function mapBillRow(row) {
  if (!row) {
    return null;
  }
  return {
    ...row,
    bill_date: normalizeBillCalendarDate(row.bill_date),
  };
}

export function createBillDeps() {
  const shopBankDeps = createShopBankAccountDeps();

  return {
    async getShopBankAccount() {
      return shopBankDeps.getShopBankAccount();
    },

    async getClientByMobile(mobile) {
      const [row] = await query(
        `select mobile, name, address, gst_number, contact_person, contact_number
         from clients
         where mobile = $1`,
        [mobile]
      );
      return row ?? null;
    },

    async getProductById(productId) {
      const [row] = await query(
        `select product_id, collection_id, product_name, wholesale_price, tax_code_id
         from products
         where product_id = $1`,
        [productId]
      );
      return row ?? null;
    },

    async getTaxCodeById(taxCodeId) {
      const [row] = await query(
        `select tax_code_id, type, code, description, cgst, sgst, igst
         from tax_codes
         where tax_code_id = $1`,
        [taxCodeId]
      );
      return row ?? null;
    },

    async listBillsByCollection(collectionId, { limit, offset, search } = {}) {
      const params = [collectionId];
      let searchClause = "";
      if (search) {
        params.push(`%${search}%`);
        searchClause = `and (
           bill_number ilike $2
           or receiver_name ilike $2
           or receiver_mobile ilike $2
         )`;
      }

      const [{ total_count }] = await query(
        `select count(*) as total_count
         from gst_bills
         where collection_id = $1
         ${searchClause}`,
        params
      );

      const limitParam = params.length + 1;
      const offsetParam = params.length + 2;
      const rows = await query(
        `select bill_id, bill_number, bill_date, receiver_name, total_bill, saved_at
         from gst_bills
         where collection_id = $1
         ${searchClause}
         order by bill_date desc, saved_at desc
         limit $${limitParam} offset $${offsetParam}`,
        [...params, limit, offset]
      );

      return {
        rows: rows.map(mapBillRow),
        totalItems: Number(total_count),
      };
    },

    async getBillById(billId) {
      const [row] = await query(`select * from gst_bills where bill_id = $1`, [billId]);
      return mapBillRow(row);
    },

    async getBillByBillNumber(collectionId, billNumber) {
      const [row] = await query(
        `select * from gst_bills where collection_id = $1 and bill_number = $2`,
        [collectionId, billNumber]
      );
      return mapBillRow(row);
    },

    async listBillLines(billId) {
      return query(
        `select *
         from gst_bill_lines
         where bill_id = $1
         order by line_order`,
        [billId]
      );
    },

    async insertBill(billRow, lineRows) {
      await query(
        `insert into gst_bills (
          bill_id, collection_id, bill_number, bill_date,
          receiver_mobile, receiver_name, receiver_address, receiver_gst_number,
          receiver_contact_person, receiver_contact_number,
          total_value, total_tax, total_bill, tax_shape,
          bank_name, bank_address, bank_account_number, bank_ifsc, saved_at
        ) values (
          $1, $2, $3, $4,
          $5, $6, $7, $8,
          $9, $10,
          $11, $12, $13, $14,
          $15, $16, $17, $18, $19
        )`,
        [
          billRow.bill_id,
          billRow.collection_id,
          billRow.bill_number,
          billRow.bill_date,
          billRow.receiver_mobile,
          billRow.receiver_name,
          billRow.receiver_address,
          billRow.receiver_gst_number,
          billRow.receiver_contact_person,
          billRow.receiver_contact_number,
          billRow.total_value,
          billRow.total_tax,
          billRow.total_bill,
          billRow.tax_shape ?? null,
          billRow.bank_name,
          billRow.bank_address,
          billRow.bank_account_number,
          billRow.bank_ifsc,
          billRow.saved_at,
        ]
      );

      for (const line of lineRows) {
        await query(
          `insert into gst_bill_lines (
            bill_line_id, bill_id, line_order,
            product_id, product_name, tax_code_id, tax_code, tax_code_description,
            quantity, rate, price,
            cgst_percent, sgst_percent, igst_percent,
            cgst_amount, sgst_amount, igst_amount,
            tax_rates_are_copy,
            line_total
          ) values (
            $1, $2, $3,
            $4, $5, $6, $7, $8,
            $9, $10, $11,
            $12, $13, $14,
            $15, $16, $17,
            $18,
            $19
          )`,
          [
            line.bill_line_id,
            line.bill_id,
            line.line_order,
            line.product_id,
            line.product_name,
            line.tax_code_id,
            line.tax_code,
            line.tax_code_description,
            line.quantity,
            line.rate,
            line.price,
            line.cgst_percent,
            line.sgst_percent,
            line.igst_percent,
            line.cgst_amount,
            line.sgst_amount,
            line.igst_amount,
            line.tax_rates_are_copy ?? false,
            line.line_total,
          ]
        );
      }
    },

    async replaceBillLines(billId, lineRows, billRow) {
      await withTransaction(async (txQuery) => {
        await txQuery(`delete from gst_bill_lines where bill_id = $1`, [billId]);
        await txQuery(
          `update gst_bills
           set bill_number = $2,
               bill_date = $3,
               receiver_mobile = $4,
               receiver_name = $5,
               receiver_address = $6,
               receiver_gst_number = $7,
               receiver_contact_person = $8,
               receiver_contact_number = $9,
               total_value = $10,
               total_tax = $11,
               total_bill = $12,
               tax_shape = $13,
               saved_at = $14
           where bill_id = $1`,
          [
            billId,
            billRow.bill_number,
            billRow.bill_date,
            billRow.receiver_mobile,
            billRow.receiver_name,
            billRow.receiver_address,
            billRow.receiver_gst_number,
            billRow.receiver_contact_person,
            billRow.receiver_contact_number,
            billRow.total_value,
            billRow.total_tax,
            billRow.total_bill,
            billRow.tax_shape ?? null,
            billRow.saved_at,
          ]
        );

        for (const line of lineRows) {
          await txQuery(
            `insert into gst_bill_lines (
              bill_line_id, bill_id, line_order,
              product_id, product_name, tax_code_id, tax_code, tax_code_description,
              quantity, rate, price,
              cgst_percent, sgst_percent, igst_percent,
              cgst_amount, sgst_amount, igst_amount,
              tax_rates_are_copy,
              line_total
            ) values (
              $1, $2, $3,
              $4, $5, $6, $7, $8,
              $9, $10, $11,
              $12, $13, $14,
              $15, $16, $17,
              $18,
              $19
            )`,
            [
              line.bill_line_id,
              billId,
              line.line_order,
              line.product_id,
              line.product_name,
              line.tax_code_id,
              line.tax_code,
              line.tax_code_description,
              line.quantity,
              line.rate,
              line.price,
              line.cgst_percent,
              line.sgst_percent,
              line.igst_percent,
              line.cgst_amount,
              line.sgst_amount,
              line.igst_amount,
              line.tax_rates_are_copy ?? false,
              line.line_total,
            ]
          );
        }
      });
    },
  };
}
