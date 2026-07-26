import type { MealType } from "../types";

interface MealTypeSelectorProps {
  value: MealType;
  onChange: (value: MealType) => void;
  disabled?: boolean;
}

export function MealTypeSelector({ value, onChange, disabled }: MealTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 rounded-xl bg-[#ECECEA] p-1" aria-label="用餐类型">
      {(
        [
          ["main_meal", "正餐"],
          ["late_night", "宵夜"],
        ] as const
      ).map(([option, label]) => (
        <button
          key={option}
          type="button"
          disabled={disabled}
          aria-pressed={value === option}
          className={`min-h-11 rounded-[10px] px-4 text-base font-medium transition ${
            value === option ? "bg-brand-soft text-brand shadow-sm" : "text-muted"
          }`}
          onClick={() => onChange(option)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
