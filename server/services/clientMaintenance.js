import {
  ClientGstExistsError,
  ClientMobileExistsError,
  ClientNotFoundError,
  ClientValidationError,
} from "./clientMaintenanceErrors.js";

const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export function normalizeGstNumber(raw) {
  if (raw === undefined || raw === null) {
    return null;
  }
  const normalized = String(raw).replace(/\s+/g, "").toUpperCase();
  return normalized.length === 0 ? null : normalized;
}

function optionalText(raw, { maxLength, fieldLabel }) {
  if (raw === undefined || raw === null) {
    return null;
  }
  const trimmed = String(raw).trim();
  if (trimmed.length === 0) {
    return null;
  }
  if (maxLength && trimmed.length > maxLength) {
    throw new ClientValidationError(`${fieldLabel} is too long`);
  }
  return trimmed;
}

function requireText(raw, fieldLabel, maxLength) {
  const value = optionalText(raw, { maxLength, fieldLabel });
  if (value === null) {
    throw new ClientValidationError(`${fieldLabel} is required`);
  }
  return value;
}

function requireUuid(raw, fieldLabel) {
  const value = optionalText(raw, { fieldLabel });
  if (value === null) {
    throw new ClientValidationError(`${fieldLabel} is required`);
  }
  return value;
}

function normalizeMobile(raw) {
  const mobile = requireText(raw, "Mobile", 20);
  if (!/^\d{10}$/.test(mobile)) {
    throw new ClientValidationError("Mobile must be exactly 10 digits");
  }
  return mobile;
}

function normalizePincode(raw) {
  const pincode = optionalText(raw, { maxLength: 6, fieldLabel: "Pincode" });
  if (pincode === null) {
    return null;
  }
  if (!/^\d{6}$/.test(pincode)) {
    throw new ClientValidationError("Pincode must be exactly 6 digits");
  }
  return pincode;
}

function normalizeContactNumber(raw) {
  const contactNumber = optionalText(raw, { maxLength: 10, fieldLabel: "Contact number" });
  if (contactNumber === null) {
    return null;
  }
  if (!/^\d{10}$/.test(contactNumber)) {
    throw new ClientValidationError("Contact number must be exactly 10 digits");
  }
  return contactNumber;
}

function normalizeGst(raw) {
  const gstNumber = normalizeGstNumber(raw);
  if (gstNumber === null) {
    return null;
  }
  if (gstNumber.length !== 15 || !GSTIN_PATTERN.test(gstNumber)) {
    throw new ClientValidationError("GST number must be a valid 15-character GSTIN");
  }
  return gstNumber;
}

function parseClientProfileInput(raw, { includeMobile }) {
  const parsed = {
    name: requireText(raw?.name, "Name", 100),
    address: requireText(raw?.address, "Address", 255),
    pincode: normalizePincode(raw?.pincode),
    stateId: requireUuid(raw?.state_id, "State"),
    cityId: requireUuid(raw?.city_id, "City"),
    gstNumber: normalizeGst(raw?.gst_number),
    contactPerson: optionalText(raw?.contact_person, {
      maxLength: 100,
      fieldLabel: "Contact person",
    }),
    contactNumber: normalizeContactNumber(raw?.contact_number),
  };
  if (includeMobile) {
    parsed.mobile = normalizeMobile(raw?.mobile);
  }
  return parsed;
}

export function parseCreateClientInput(raw) {
  return parseClientProfileInput(raw, { includeMobile: true });
}

export function parseUpdateClientInput(raw) {
  return parseClientProfileInput(raw, { includeMobile: false });
}

async function assertCityBelongsToState(deps, { stateId, cityId }) {
  const city = await deps.getCityById(cityId);
  if (!city) {
    throw new ClientValidationError("City is not available");
  }
  if (city.state_id !== stateId) {
    throw new ClientValidationError("City does not belong to the selected state");
  }
  return city;
}

async function assertLocationForCreate(deps, { stateId, cityId }) {
  const state = await deps.getActiveStateInIndia(stateId);
  if (!state) {
    throw new ClientValidationError("State is not available");
  }

  const city = await deps.getActiveCity(cityId);
  if (!city) {
    throw new ClientValidationError("City is not available");
  }

  await assertCityBelongsToState(deps, { stateId, cityId });

  return { state, city };
}

async function assertLocationForUpdate(deps, existingClient, { stateId, cityId }) {
  const locationUnchanged =
    existingClient.state_id === stateId && existingClient.city_id === cityId;

  if (locationUnchanged) {
    const state = await deps.getStateById(stateId);
    if (!state) {
      throw new ClientValidationError("State is not available");
    }
    const city = await assertCityBelongsToState(deps, { stateId, cityId });
    return { state, city };
  }

  return assertLocationForCreate(deps, { stateId, cityId });
}

async function assertGstAvailableForSave(deps, gstNumber, existingMobile) {
  if (!gstNumber) {
    return;
  }
  const existingGst = await deps.getClientByGstNumber(gstNumber);
  if (!existingGst) {
    return;
  }
  if (existingMobile === null || existingGst.mobile !== existingMobile) {
    throw new ClientGstExistsError();
  }
}

function withLocationNames(client, state, city) {
  return {
    ...client,
    state_name: state.name,
    city_name: city.name,
  };
}

/**
 * Add a new client with a profile. Rejects duplicate mobile and duplicate GST.
 */
export async function createClient(deps, rawInput) {
  const input = parseCreateClientInput(rawInput);

  const existingMobile = await deps.getClientByMobile(input.mobile);
  if (existingMobile) {
    throw new ClientMobileExistsError();
  }

  await assertGstAvailableForSave(deps, input.gstNumber, null);

  const { state, city } = await assertLocationForCreate(deps, {
    stateId: input.stateId,
    cityId: input.cityId,
  });

  const client = await deps.insertClient({
    name: input.name,
    mobile: input.mobile,
    address: input.address,
    pincode: input.pincode,
    state_id: input.stateId,
    city_id: input.cityId,
    gst_number: input.gstNumber,
    contact_person: input.contactPerson,
    contact_number: input.contactNumber,
  });

  return withLocationNames(client, state, city);
}

/**
 * Edit name, address, and profile for an existing mobile. Mobile cannot change.
 */
export async function updateClient(deps, mobile, rawInput) {
  const normalizedMobile = normalizeMobile(mobile);
  const input = parseUpdateClientInput(rawInput);

  const existing = await deps.getClientByMobile(normalizedMobile);
  if (!existing) {
    throw new ClientNotFoundError();
  }

  await assertGstAvailableForSave(deps, input.gstNumber, normalizedMobile);

  const { state, city } = await assertLocationForUpdate(deps, existing, {
    stateId: input.stateId,
    cityId: input.cityId,
  });

  const client = await deps.updateClient(normalizedMobile, {
    name: input.name,
    address: input.address,
    pincode: input.pincode,
    state_id: input.stateId,
    city_id: input.cityId,
    gst_number: input.gstNumber,
    contact_person: input.contactPerson,
    contact_number: input.contactNumber,
  });

  return withLocationNames(client, state, city);
}

/**
 * Bill create: insert a thin client or replace only name and address on an existing mobile.
 */
export async function applyBillCreateClientSync(deps, { mobile, name, address }) {
  const normalizedMobile = normalizeMobile(mobile);

  const existing = await deps.getClientByMobile(normalizedMobile);
  if (!existing) {
    const billName = requireText(name, "Name", 100);
    const billAddress = requireText(address, "Address", 255);
    return deps.insertBillClient({
      name: billName,
      mobile: normalizedMobile,
      address: billAddress,
    });
  }

  const nextName =
    optionalText(name, { maxLength: 100, fieldLabel: "Name" }) ?? existing.name;
  const nextAddress =
    optionalText(address, { maxLength: 255, fieldLabel: "Address" }) ?? existing.address;

  return deps.updateClientNameAndAddress(existing.client_id, {
    name: nextName,
    address: nextAddress,
  });
}
