export class ClientValidationError extends Error {
  constructor(message, { code = "CLIENT_VALIDATION_ERROR" } = {}) {
    super(message);
    this.name = "ClientValidationError";
    this.code = code;
    this.statusCode = 400;
  }
}

export class ClientMobileExistsError extends Error {
  constructor() {
    super("A client with this mobile number already exists");
    this.name = "ClientMobileExistsError";
    this.code = "CLIENT_MOBILE_EXISTS";
    this.statusCode = 409;
  }
}

export class ClientGstExistsError extends Error {
  constructor() {
    super("This GST number is already stored on another client");
    this.name = "ClientGstExistsError";
    this.code = "CLIENT_GST_EXISTS";
    this.statusCode = 409;
  }
}

export class ClientNotFoundError extends Error {
  constructor() {
    super("Client not found");
    this.name = "ClientNotFoundError";
    this.code = "CLIENT_NOT_FOUND";
    this.statusCode = 404;
  }
}
