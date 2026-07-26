import type { DrawCandidate, MealType } from "../../types";

const STORAGE_KEY = "today-food-draw-round";

export interface DrawRound {
  mealType: MealType;
  excludedShopNames: string[];
  currentResult: DrawCandidate | null;
}

export function readRound(): DrawRound | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DrawRound) : null;
  } catch {
    return null;
  }
}

export function writeRound(round: DrawRound) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(round));
}

export function clearRound() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function startRound(mealType: MealType): DrawRound {
  const round = { mealType, excludedShopNames: [], currentResult: null };
  writeRound(round);
  return round;
}
