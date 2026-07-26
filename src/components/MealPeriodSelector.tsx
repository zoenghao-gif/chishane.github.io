import type { MealPeriod } from "../types";
import { mealPeriodLabels } from "../types";

const periods: MealPeriod[] = ["noon", "evening", "late_night"];

export function MealPeriodSelector({ value, onChange }: { value: MealPeriod; onChange: (value: MealPeriod) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {periods.map((period) => (
        <button
          key={period}
          type="button"
          className={value === period ? "button-primary px-3" : "button-secondary px-3"}
          onClick={() => onChange(period)}
        >
          {mealPeriodLabels[period]}
        </button>
      ))}
    </div>
  );
}
