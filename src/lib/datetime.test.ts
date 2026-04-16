import { describe, expect, it } from "vitest";
import {
  formatClinicTimeRange,
  fromClinicDateTimeLocalValue,
  getClinicDayBounds,
  toClinicDateInputValue,
  toClinicDateTimeLocalValue,
} from "@/lib/datetime";

describe("datetime helpers", () => {
  it("converts clinic wall time to UTC ISO", () => {
    expect(fromClinicDateTimeLocalValue("2026-04-20T09:00")).toBe("2026-04-20T12:00:00.000Z");
  });

  it("maps UTC timestamps back to clinic datetime-local values", () => {
    expect(toClinicDateTimeLocalValue("2026-04-20T12:00:00.000Z")).toBe("2026-04-20T09:00");
    expect(toClinicDateInputValue("2026-04-20T12:00:00.000Z")).toBe("2026-04-20");
  });

  it("builds Sao Paulo day bounds in UTC", () => {
    expect(getClinicDayBounds("2026-04-20")).toEqual({
      endExclusiveIso: "2026-04-21T03:00:00.000Z",
      startIso: "2026-04-20T03:00:00.000Z",
    });
  });

  it("formats agenda ranges in clinic time", () => {
    expect(formatClinicTimeRange("2026-04-20T12:00:00.000Z", 60)).toBe("09:00 - 10:00");
  });
});
