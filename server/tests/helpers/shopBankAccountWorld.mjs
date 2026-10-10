export function createShopBankAccountWorld() {
  let row = null;

  const deps = {
    async getShopBankAccount() {
      return row;
    },

    async insertShopBankAccount(account) {
      row = { shop_bank_account_id: 1, ...account };
      return row;
    },

    async updateShopBankAccount(account) {
      if (!row) {
        return null;
      }
      row = { ...row, ...account };
      return row;
    },
  };

  return { deps, getRow: () => row };
}

export function validShopBankAccountPayload(overrides = {}) {
  return {
    bank_name: "HDFC Bank",
    bank_address: "MG Road, Bengaluru",
    account_number: "012345678",
    ifsc: "HDFC0000123",
    ...overrides,
  };
}
