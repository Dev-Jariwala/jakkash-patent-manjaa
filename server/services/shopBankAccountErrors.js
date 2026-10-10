export class ShopBankAccountValidationError extends Error {
  constructor(message, { code = "SHOP_BANK_ACCOUNT_VALIDATION_ERROR" } = {}) {
    super(message);
    this.name = "ShopBankAccountValidationError";
    this.code = code;
    this.statusCode = 400;
  }
}
