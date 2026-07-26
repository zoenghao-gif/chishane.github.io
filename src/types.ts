export type MealType = "main_meal" | "late_night";
export type MealPeriod = "noon" | "evening" | "late_night";

export interface MealRecord {
  id: string;
  user_id: string;
  shop_name: string;
  food_name: string | null;
  eat_date: string;
  eat_time: string;
  meal_type: MealType;
  meal_period?: MealPeriod;
  client_action_id: string;
  created_at: string;
  updated_at: string;
}

export interface MealRecordInput {
  shop_name: string;
  food_name: string | null;
  eat_date: string;
  meal_period: MealPeriod;
  client_action_id: string;
}

export interface DrawCandidate {
  shop_name: string;
  food_name: string | null;
  gap_meals: number;
}

export interface UserSettings {
  user_id: string;
  required_gap_meals: number;
  created_at: string;
  updated_at: string;
}

export const mealTypeLabels: Record<MealType, string> = {
  main_meal: "正餐",
  late_night: "宵夜",
};

export const mealPeriodLabels: Record<MealPeriod, string> = {
  noon: "中午",
  evening: "晚上",
  late_night: "宵夜",
};
