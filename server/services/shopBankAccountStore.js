import { query } from "../utils/query.js";

export function createShopBankAccountDeps() {
  return {
    async getShopBankAccount() {
      const [row] = await query(
        `select shop_bank_account_id, bank_name, bank_address, account_number, ifsc, updated_at
         from shop_bank_account
         where shop_bank_account_id = 1`
      );
      return row ?? null;
    },

    async insertShopBankAccount(account) {
      const [inserted] = await query(
        `insert into shop_bank_account (bank_name, bank_address, account_number, ifsc, updated_at)
         values ($1, $2, $3, $4, $5)
         returning shop_bank_account_id, bank_name, bank_address, account_number, ifsc, updated_at`,
        [
          account.bank_name,
          account.bank_address,
          account.account_number,
          account.ifsc,
          account.updated_at,
        ]
      );
      return inserted;
    },

    async updateShopBankAccount(account) {
      const [updated] = await query(
        `update shop_bank_account
         set bank_name = $1,
             bank_address = $2,
             account_number = $3,
             ifsc = $4,
             updated_at = $5
         where shop_bank_account_id = 1
         returning shop_bank_account_id, bank_name, bank_address, account_number, ifsc, updated_at`,
        [
          account.bank_name,
          account.bank_address,
          account.account_number,
          account.ifsc,
          account.updated_at,
        ]
      );
      return updated ?? null;
    },
  };
}
