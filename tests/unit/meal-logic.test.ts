import { describe, expect, it } from "vitest";
import { calculateGapForShop, normalizeShopName } from "../../src/features/draw/mealLogic";
import type { MealRecord, MealType } from "../../src/types";

function record(
  id: string,
  shopName: string,
  mealType: MealType,
  date: string,
  time: string,
): MealRecord {
  return {
    id,
    user_id: "user-1",
    shop_name: shopName,
    food_name: null,
    eat_date: date,
    eat_time: time,
    meal_type: mealType,
    client_action_id: `action-${id}`,
    created_at: `${date}T${time}:00+08:00`,
    updated_at: `${date}T${time}:00+08:00`,
  };
}

describe("meal gap logic", () => {
  it("trims only the ends of shop names", () => {
    expect(normalizeShopName("  老张黄焖鸡  ")).toBe("老张黄焖鸡");
    expect(normalizeShopName("老张  黄焖鸡")).toBe("老张  黄焖鸡");
  });

  it("counts only later records of the same meal type", () => {
    const records = [
      record("1", "老张黄焖鸡", "main_meal", "2026-07-20", "12:00"),
      record("2", "陈记烧烤", "late_night", "2026-07-20", "23:00"),
      record("3", "面馆", "main_meal", "2026-07-21", "12:00"),
      record("4", "饭馆", "main_meal", "2026-07-22", "12:00"),
    ];
    expect(calculateGapForShop(records, "main_meal", "老张黄焖鸡")).toBe(2);
  });

  it("uses time to order multiple meals on the same date", () => {
    const records = [
      record("1", "早午餐店", "main_meal", "2026-07-20", "10:00"),
      record("2", "晚饭店", "main_meal", "2026-07-20", "18:30"),
    ];
    expect(calculateGapForShop(records, "main_meal", "早午餐店")).toBe(1);
  });

  it("returns zero for the most recent shop and null for an unknown shop", () => {
    const records = [record("1", "面馆", "main_meal", "2026-07-20", "12:00")];
    expect(calculateGapForShop(records, "main_meal", "面馆")).toBe(0);
    expect(calculateGapForShop(records, "main_meal", "不存在")).toBeNull();
  });
});
