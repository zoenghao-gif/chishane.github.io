import type { MealRecord, MealType } from "../../types";

export function normalizeShopName(name: string) {
  return name.trim();
}

function compareRecords(a: MealRecord, b: MealRecord) {
  return (
    a.eat_date.localeCompare(b.eat_date) ||
    a.eat_time.localeCompare(b.eat_time) ||
    a.created_at.localeCompare(b.created_at) ||
    a.id.localeCompare(b.id)
  );
}

export function calculateGapForShop(
  records: MealRecord[],
  mealType: MealType,
  shopName: string,
) {
  const typed = records.filter((record) => record.meal_type === mealType).sort(compareRecords);
  const normalized = normalizeShopName(shopName);
  let lastShopIndex = -1;
  typed.forEach((record, index) => {
    if (normalizeShopName(record.shop_name) === normalized) lastShopIndex = index;
  });
  return lastShopIndex < 0 ? null : typed.length - lastShopIndex - 1;
}
