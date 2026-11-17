import { describe, expect, it } from "vitest";
import { clientGstListDisplay } from "./clientGstDisplay";

describe("clientGstListDisplay", () => {
  it("shows N/A when the client is GST not applicable", () => {
    expect(clientGstListDisplay({ gst_not_applicable: true, gst_number: null })).toBe("N/A");
  });

  it("stays blank when GST is empty and the mark is off", () => {
    expect(clientGstListDisplay({ gst_not_applicable: false, gst_number: null })).toBe("");
  });

  it("shows the GSTIN when present", () => {
    expect(
      clientGstListDisplay({ gst_not_applicable: false, gst_number: "24AABCU9603R1ZM" })
    ).toBe("24AABCU9603R1ZM");
  });
});