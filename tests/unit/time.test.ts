import { describe, expect, it } from "vitest";
import { currentShanghaiDateTime, formatMealDate, formatMealTime } from "../../src/lib/time";

describe("meal time", () => {
  it("uses Asia/Shanghai for defaults", () => {
    const value = currentShanghaiDateTime(new Date("2026-07-25T16:30:00.000Z"));
    expect(value).toEqual({ date: "2026-07-26", time: "00:30" });
  });

  it("formats stored date and time for display", () => {
    expect(formatMealDate("2026-07-24")).toBe("2026年7月24日");
    expect(formatMealTime("18:05:00")).toBe("18:05");
  });
});
