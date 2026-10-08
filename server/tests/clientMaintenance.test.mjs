import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createClient,
  normalizeGstNumber,
  parseCreateClientInput,
} from "../services/clientMaintenance.js";
import {
  ClientGstExistsError,
  ClientMobileExistsError,
  ClientValidationError,
} from "../services/clientMaintenanceErrors.js";
import {
  createClientMaintenanceWorld,
  GUJARAT_STATE_ID,
  SURAT_CITY_ID,
  validCreatePayload,
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
