import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalizeBillCalendarDate } from "../utils/billCalendarDate.js";

describe("normalizeBillCalendarDate", () => {
  it("keeps a calendar day that the database driver returns as local midnight", () => {
    const storedAsLocalMidnight = new Date(2026, 9, 11);
    assert.equal(normalizeBillCalendarDate(storedAsLocalMidnight), "2026-10-11");
    assert.equal(
      normalizeBillCalendarDate(storedAsLocalMidnight.toISOString()),
      "2026-10-11"
    );
  });

  it("keeps a date that is already YYYY-MM-DD", () => {
    assert.equal(normalizeBillCalendarDate("2026-10-11"), "2026-10-11");
  });
});
