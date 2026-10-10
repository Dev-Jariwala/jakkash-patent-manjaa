import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getShopBankAccount,
  saveShopBankAccount,
} from "../services/shopBankAccount.js";
import { ShopBankAccountValidationError } from "../services/shopBankAccountErrors.js";
import {
  createShopBankAccountWorld,
  validShopBankAccountPayload,
} from "./helpers/shopBankAccountWorld.mjs";

describe("getShopBankAccount", () => {
  it("returns no account before any save", async () => {
    const world = createShopBankAccountWorld();
    const account = await getShopBankAccount(world.deps);
    assert.equal(account, null);
  });
});

describe("saveShopBankAccount", () => {
  it("creates the shop bank account on first save", async () => {
    const world = createShopBankAccountWorld();
    const saved = await saveShopBankAccount(world.deps, validShopBankAccountPayload());

    assert.equal(saved.bank_name, "HDFC Bank");
    assert.equal(saved.bank_address, "MG Road, Bengaluru");
    assert.equal(saved.account_number, "012345678");
    assert.equal(saved.ifsc, "HDFC0000123");
    assert.ok(saved.updated_at);

    const loaded = await getShopBankAccount(world.deps);
    assert.deepEqual(loaded, saved);
  });

  it("stores a lowercase IFSC in uppercase", async () => {
    const world = createShopBankAccountWorld();
    const saved = await saveShopBankAccount(
      world.deps,
      validShopBankAccountPayload({ ifsc: "hdfc0000123" })
    );
    assert.equal(saved.ifsc, "HDFC0000123");
  });

  it("keeps a leading zero on the account number", async () => {
    const world = createShopBankAccountWorld();
    const saved = await saveShopBankAccount(
      world.deps,
      validShopBankAccountPayload({ account_number: "012345678901" })
    );
    assert.equal(saved.account_number, "012345678901");
  });

  it("updates the same account on a second save and leaves only one row", async () => {
    const world = createShopBankAccountWorld();
    await saveShopBankAccount(world.deps, validShopBankAccountPayload());

    const updated = await saveShopBankAccount(
      world.deps,
      validShopBankAccountPayload({
        bank_name: "ICICI Bank",
        bank_address: "Brigade Road, Bengaluru",
        account_number: "987654321098",
        ifsc: "ICIC0001234",
      })
    );

    assert.equal(updated.bank_name, "ICICI Bank");
    assert.equal(world.getRow().shop_bank_account_id, 1);

    const loaded = await getShopBankAccount(world.deps);
    assert.equal(loaded.bank_name, "ICICI Bank");
    assert.equal(loaded.account_number, "987654321098");
  });

  for (const [field, label] of [
    ["bank_name", "Bank name"],
    ["bank_address", "Bank address"],
    ["account_number", "Account number"],
    ["ifsc", "IFSC"],
  ]) {
    it(`rejects a blank ${field}`, async () => {
      const world = createShopBankAccountWorld();
      await assert.rejects(
        () =>
          saveShopBankAccount(
            world.deps,
            validShopBankAccountPayload({ [field]: "   " })
          ),
        (error) => {
          assert.ok(error instanceof ShopBankAccountValidationError);
          assert.match(error.message, new RegExp(label, "i"));
          return true;
        }
      );
    });
  }

  it("rejects a bank name longer than 120 characters", async () => {
    const world = createShopBankAccountWorld();
    await assert.rejects(
      () =>
        saveShopBankAccount(
          world.deps,
          validShopBankAccountPayload({ bank_name: "x".repeat(121) })
        ),
      ShopBankAccountValidationError
    );
  });

  it("rejects a bank address longer than 255 characters", async () => {
    const world = createShopBankAccountWorld();
    await assert.rejects(
      () =>
        saveShopBankAccount(
          world.deps,
          validShopBankAccountPayload({ bank_address: "x".repeat(256) })
        ),
      ShopBankAccountValidationError
    );
  });

  it("rejects an account number that is too short", async () => {
    const world = createShopBankAccountWorld();
    await assert.rejects(
      () =>
        saveShopBankAccount(
          world.deps,
          validShopBankAccountPayload({ account_number: "12345678" })
        ),
      (error) => {
        assert.ok(error instanceof ShopBankAccountValidationError);
        assert.match(error.message, /9 to 18 digits/i);
        return true;
      }
    );
  });

  it("rejects an account number that is too long", async () => {
    const world = createShopBankAccountWorld();
    await assert.rejects(
      () =>
        saveShopBankAccount(
          world.deps,
          validShopBankAccountPayload({ account_number: "1".repeat(19) })
        ),
      (error) => {
        assert.ok(error instanceof ShopBankAccountValidationError);
        assert.match(error.message, /9 to 18 digits/i);
        return true;
      }
    );
  });

  it("rejects an account number that is not all digits", async () => {
    const world = createShopBankAccountWorld();
    await assert.rejects(
      () =>
        saveShopBankAccount(
          world.deps,
          validShopBankAccountPayload({ account_number: "12345678a" })
        ),
      (error) => {
        assert.ok(error instanceof ShopBankAccountValidationError);
        assert.match(error.message, /9 to 18 digits/i);
        return true;
      }
    );
  });

  it("rejects an IFSC whose fifth character is not 0", async () => {
    const world = createShopBankAccountWorld();
    await assert.rejects(
      () =>
        saveShopBankAccount(
          world.deps,
          validShopBankAccountPayload({ ifsc: "HDFC1000123" })
        ),
      (error) => {
        assert.ok(error instanceof ShopBankAccountValidationError);
        assert.match(error.message, /11-character IFSC/i);
        return true;
      }
    );
  });

  it("rejects an IFSC of the wrong length", async () => {
    const world = createShopBankAccountWorld();
    await assert.rejects(
      () =>
        saveShopBankAccount(
          world.deps,
          validShopBankAccountPayload({ ifsc: "HDFC00001" })
        ),
      (error) => {
        assert.ok(error instanceof ShopBankAccountValidationError);
        assert.match(error.message, /11-character IFSC/i);
        return true;
      }
    );
  });

  it("rejects an IFSC with a space inside the code", async () => {
    const world = createShopBankAccountWorld();
    await assert.rejects(
      () =>
        saveShopBankAccount(
          world.deps,
          validShopBankAccountPayload({ ifsc: "HDFC 000123" })
        ),
      (error) => {
        assert.ok(error instanceof ShopBankAccountValidationError);
        assert.match(error.message, /11-character IFSC/i);
        return true;
      }
    );
  });

  it("rejects a later save that clears a field", async () => {
    const world = createShopBankAccountWorld();
    await saveShopBankAccount(world.deps, validShopBankAccountPayload());

    await assert.rejects(
      () =>
        saveShopBankAccount(
          world.deps,
          validShopBankAccountPayload({ bank_name: "" })
        ),
      (error) => {
        assert.ok(error instanceof ShopBankAccountValidationError);
        assert.match(error.message, /Bank name/i);
        return true;
      }
    );

    const loaded = await getShopBankAccount(world.deps);
    assert.equal(loaded.bank_name, "HDFC Bank");
  });
});
