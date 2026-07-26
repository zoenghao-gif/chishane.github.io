import type {
  DrawCandidate,
  MealRecord,
  MealRecordInput,
  MealType,
  UserSettings,
} from "../../types";

export const HISTORY_PAGE_SIZE = 20;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  const body = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) throw new Error(body.error || "请求失败，请重试");
  return body;
}

export async function listMealRecords(page: number) {
  return request<MealRecord[]>(`/api/meals?page=${page}&limit=${HISTORY_PAGE_SIZE}`);
}

export async function getMealRecord(id: string) {
  return request<MealRecord>(`/api/meals/${encodeURIComponent(id)}`);
}

export async function countMealsByType(mealType: MealType) {
  const result = await request<{ count: number }>(`/api/count?meal_type=${mealType}`);
  return result.count;
}

export async function createMealRecord(input: MealRecordInput) {
  return request<MealRecord>("/api/meals", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function confirmMealRecord(input: MealRecordInput) {
  return createMealRecord(input);
}

export async function updateMealRecord(id: string, input: Omit<MealRecordInput, "client_action_id">) {
  return request<MealRecord>(`/api/meals/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteMealRecord(id: string) {
  await request<{ deleted: boolean }>(`/api/meals/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function drawCandidate(mealType: MealType, excludedShopNames: string[]) {
  const result = await request<{ candidate: DrawCandidate | null }>("/api/draw", {
    method: "POST",
    body: JSON.stringify({ mealType, excludedShopNames }),
  });
  return result.candidate;
}

export async function getSettings() {
  return request<UserSettings>("/api/settings");
}

export async function updateGapSetting(requiredGapMeals: number) {
  return request<UserSettings>("/api/settings", {
    method: "PUT",
    body: JSON.stringify({ required_gap_meals: requiredGapMeals }),
  });
}

export async function deleteAccount() {
  await request<{ deleted: boolean }>("/api/account", { method: "DELETE" });
}
