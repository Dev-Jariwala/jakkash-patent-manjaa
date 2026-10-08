import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applyBillCreateClientSync,
  createClient,
  normalizeGstNumber,
  parseCreateClientInput,
  updateClient,
} from "../services/clientMaintenance.js";
import {
  ClientGstExistsError,
  ClientMobileExistsError,
  ClientNotFoundError,
  ClientValidationError,
} from "../services/clientMaintenanceErrors.js";
import {
  createClientMaintenanceWorld,
  GUJARAT_STATE_ID,
  SURAT_CITY_ID,
  validCreatePayload,
  validUpdatePayload,
} from "./helpers/clientMaintenanceWorld.mjs";
import { randomUUID } from "node:crypto";

describe("createClient", () => {
  it("creates a client with required fields and location", async () => {
    const world = createClientMaintenanceWorld();
    const client = await createClient(world.deps, validCreatePayload());

    assert.equal(client.name, "Acme Traders");
    assert.equal(client.mobile, "9876543210");
    assert.equal(client.state_name, "Gujarat");
    assert.equal(client.city_name, "Surat");
    assert.equal(world.clientsByMobile.size, 1);
  });

  it("rejects a duplicate mobile", async () => {
    const world = createClientMaintenanceWorld();
    await createClient(world.deps, validCreatePayload());

    await assert.rejects(
      () => createClient(world.deps, validCreatePayload({ mobile: "9876543210" })),
      ClientMobileExistsError
    );
    assert.equal(world.clientsByMobile.get("9876543210").name, "Acme Traders");
  });

  it("requires state and city", async () => {
    const world = createClientMaintenanceWorld();

    await assert.rejects(
      () => createClient(world.deps, validCreatePayload({ state_id: "" })),
      ClientValidationError
    );
    await assert.rejects(
      () => createClient(world.deps, validCreatePayload({ city_id: "" })),
      ClientValidationError
    );
  });

  it("rejects a city that does not belong to the selected state", async () => {
    const otherStateId = randomUUID();
    const otherCityId = randomUUID();
    const world = createClientMaintenanceWorld({
      states: [
        {
          state_id: otherStateId,
          country_id: "313df106-720a-464d-a26c-fa483e5cc111",
          name: "Maharashtra",
          is_active: true,
        },
      ],
      cities: [
        {
          city_id: otherCityId,
          state_id: otherStateId,
          name: "Mumbai",
          is_active: true,
        },
      ],
    });

    await assert.rejects(
      () =>
        createClient(
          world.deps,
          validCreatePayload({ state_id: GUJARAT_STATE_ID, city_id: otherCityId })
        ),
      (error) => {
        assert.ok(error instanceof ClientValidationError);
        assert.match(error.message, /does not belong/i);
        return true;
      }
    );
  });

  it("stores optional profile fields as empty when omitted", async () => {
    const world = createClientMaintenanceWorld();
    const client = await createClient(world.deps, validCreatePayload());

    assert.equal(client.pincode, null);
    assert.equal(client.gst_number, null);
    assert.equal(client.contact_person, null);
    assert.equal(client.contact_number, null);
  });

  it("validates pincode, contact number, and GST formats when present", async () => {
    const world = createClientMaintenanceWorld();

    await assert.rejects(
      () => createClient(world.deps, validCreatePayload({ pincode: "12345" })),
      ClientValidationError
    );
    await assert.rejects(
      () => createClient(world.deps, validCreatePayload({ contact_number: "123" })),
      ClientValidationError
    );
    await assert.rejects(
      () => createClient(world.deps, validCreatePayload({ gst_number: "SHORT" })),
      ClientValidationError
    );
  });

  it("normalizes GST to uppercase without spaces before storing", async () => {
    const world = createClientMaintenanceWorld();
    const gst = world.validGst;
    const spaced = `${gst.slice(0, 2)} ${gst.slice(2, 7)} ${gst.slice(7)}`.toLowerCase();

    const client = await createClient(
      world.deps,
      validCreatePayload({ mobile: "9000000001", gst_number: spaced })
    );

    assert.equal(client.gst_number, gst);
    assert.equal(normalizeGstNumber(spaced), gst);
  });

  it("rejects a second client that reuses a stored GST number", async () => {
    const world = createClientMaintenanceWorld();
    const gst = world.validGst;

    await createClient(
      world.deps,
      validCreatePayload({ mobile: "9000000001", gst_number: gst })
    );

    await assert.rejects(
      () =>
        createClient(
          world.deps,
          validCreatePayload({ mobile: "9000000002", gst_number: gst })
        ),
      ClientGstExistsError
    );
  });

  it("allows several clients with no GST number", async () => {
    const world = createClientMaintenanceWorld();

    await createClient(world.deps, validCreatePayload({ mobile: "9000000001" }));
    await createClient(world.deps, validCreatePayload({ mobile: "9000000002" }));

    assert.equal(world.clientsByGst.size, 0);
    assert.equal(world.clientsByMobile.size, 2);
  });

  it("treats blank optional strings as empty in parseCreateClientInput", () => {
    const parsed = parseCreateClientInput(
      validCreatePayload({
        pincode: "   ",
        gst_number: "",
        contact_person: "",
        contact_number: "",
      })
    );

    assert.equal(parsed.pincode, null);
    assert.equal(parsed.gstNumber, null);
    assert.equal(parsed.contactPerson, null);
    assert.equal(parsed.contactNumber, null);
  });

  it("allows contact number to match billing mobile", async () => {
    const world = createClientMaintenanceWorld();
    const client = await createClient(
      world.deps,
      validCreatePayload({ contact_number: "9876543210" })
    );
    assert.equal(client.contact_number, "9876543210");
  });
});

describe("updateClient", () => {
  it("updates profile for an existing mobile without changing mobile", async () => {
    const world = createClientMaintenanceWorld();
    await applyBillCreateClientSync(world.deps, {
      mobile: "9876543210",
      name: "Bill Buyer",
      address: "Market Road",
    });

    const client = await updateClient(
      world.deps,
      "9876543210",
      validUpdatePayload({ name: "Bill Buyer", address: "Market Road" })
    );

    assert.equal(client.mobile, "9876543210");
    assert.equal(client.state_name, "Gujarat");
    assert.equal(client.city_name, "Surat");
    assert.equal(world.clientsByMobile.get("9876543210").name, "Bill Buyer");
  });

  it("allows saving the client's own GST number again", async () => {
    const world = createClientMaintenanceWorld();
    const gst = world.validGst;
    await createClient(
      world.deps,
      validCreatePayload({ mobile: "9000000001", gst_number: gst })
    );

    const client = await updateClient(
      world.deps,
      "9000000001",
      validUpdatePayload({ mobile: "9000000001", gst_number: gst, name: "Renamed" })
    );

    assert.equal(client.gst_number, gst);
    assert.equal(client.name, "Renamed");
  });

  it("rejects edit when the client does not exist", async () => {
    const world = createClientMaintenanceWorld();
    await assert.rejects(
      () => updateClient(world.deps, "9000000099", validUpdatePayload()),
      ClientNotFoundError
    );
  });

  it("still accepts an inactive state and city already stored on the client", async () => {
    const world = createClientMaintenanceWorld();
    await createClient(world.deps, validCreatePayload({ mobile: "9000000003" }));
    const state = world.stateById.get(GUJARAT_STATE_ID);
    const city = world.cityById.get(SURAT_CITY_ID);
    state.is_active = false;
    city.is_active = false;

    const client = await updateClient(
      world.deps,
      "9000000003",
      validUpdatePayload({ mobile: "9000000003", name: "Still Here" })
    );

    assert.equal(client.state_name, "Gujarat");
    assert.equal(client.city_name, "Surat");
    assert.equal(client.name, "Still Here");
  });
});

describe("applyBillCreateClientSync", () => {
  it("inserts a client with an empty profile for a new mobile", async () => {
    const world = createClientMaintenanceWorld();
    const client = await applyBillCreateClientSync(world.deps, {
      mobile: "9111111111",
      name: "Walk-in",
      address: "Shop Front",
    });

    assert.equal(client.mobile, "9111111111");
    assert.equal(client.pincode, null);
    assert.equal(client.state_id, null);
    assert.equal(client.gst_number, null);
  });

  it("replaces only name and address on a later bill while the profile stays", async () => {
    const world = createClientMaintenanceWorld();
    const gst = world.validGst;

    await applyBillCreateClientSync(world.deps, {
      mobile: "9222222222",
      name: "First Bill Name",
      address: "First Bill Address",
    });

    await updateClient(
      world.deps,
      "9222222222",
      validUpdatePayload({
        mobile: "9222222222",
        name: "First Bill Name",
        address: "First Bill Address",
        pincode: "395007",
        gst_number: gst,
        contact_person: "Ravi",
        contact_number: "9000000004",
      })
    );

    const afterBill = await applyBillCreateClientSync(world.deps, {
      mobile: "9222222222",
      name: "Second Bill Name",
      address: "Second Bill Address",
    });

    assert.equal(afterBill.name, "Second Bill Name");
    assert.equal(afterBill.address, "Second Bill Address");
    assert.equal(afterBill.pincode, "395007");
    assert.equal(afterBill.gst_number, gst);
    assert.equal(afterBill.contact_person, "Ravi");
    assert.equal(afterBill.contact_number, "9000000004");
    assert.equal(afterBill.state_id, GUJARAT_STATE_ID);
    assert.equal(afterBill.city_id, SURAT_CITY_ID);
  });

  it("leaves an empty profile empty when a later bill updates name and address", async () => {
    const world = createClientMaintenanceWorld();

    await applyBillCreateClientSync(world.deps, {
      mobile: "9333333333",
      name: "Thin Client",
      address: "No Profile Yet",
    });

    const afterBill = await applyBillCreateClientSync(world.deps, {
      mobile: "9333333333",
      name: "Updated Thin",
      address: "Still No Profile",
    });

    assert.equal(afterBill.pincode, null);
    assert.equal(afterBill.state_id, null);
    assert.equal(afterBill.gst_number, null);
  });
});
