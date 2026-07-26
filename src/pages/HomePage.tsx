import { useQuery } from "@tanstack/react-query";
import { Dices, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Feedback } from "../components/Feedback";
import { LoadingState } from "../components/LoadingState";
import { MealTypeSelector } from "../components/MealTypeSelector";
import { startRound } from "../features/draw/roundState";
import { countMealsByType } from "../features/meals/api";
import { getErrorMessage } from "../lib/errors";
import type { MealType } from "../types";
import { mealTypeLabels } from "../types";

type HomeState = { feedback?: string; error?: string; noCandidate?: boolean } | null;

export function HomePage() {
  const [mealType, setMealType] = useState<MealType>("main_meal");
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as HomeState;
  const {
    data: mealCount,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["meal-count", mealType],
    queryFn: () => countMealsByType(mealType),
  });

  useEffect(() => {
    if (state) {
      window.history.replaceState({}, document.title);
    }
  }, [state]);

  function changeMealType(nextType: MealType) {
    setMealType(nextType);
  }

  function draw() {
    startRound(mealType);
    navigate(`/drawing?type=${mealType}`);
  }

  const label = mealTypeLabels[mealType];

  return (
    <div>
      <header>
        <h1 className="text-[30px] font-semibold tracking-tight">今天吃什么</h1>
        <p className="mt-2 text-base text-muted">从吃过的店里，帮你快点做决定</p>
      </header>

      {state?.feedback ? (
        <div className="mt-6">
          <Feedback type="success" message={state.feedback} />
        </div>
      ) : null}
      {state?.error ? (
        <div className="mt-6">
          <Feedback message={state.error} />
        </div>
      ) : null}

      <section className="mt-8">
        <MealTypeSelector value={mealType} onChange={changeMealType} />
        <p className="mt-4 text-center text-sm text-muted">
          现在要抽：<strong className="font-medium text-brand">{label}</strong>
        </p>
      </section>

      {isLoading ? <LoadingState label={`正在读取${label}记录`} /> : null}

      {error ? (
        <div className="mt-7">
          <Feedback
            message={getErrorMessage(error, "记录加载失败")}
            actionLabel="重试"
            onAction={() => void refetch()}
          />
        </div>
      ) : null}

      {!isLoading && !error && mealCount === 0 ? (
        <section className="card mt-7 p-6 text-center">
          <h2 className="text-xl font-semibold">还没有记录过{label}</h2>
          <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-muted">
            先记下几家吃过的{label}，之后就能帮你抽。
          </p>
          <Link className="button-primary mt-6 flex items-center justify-center gap-2" to="/record">
            <Plus className="h-5 w-5" />
            记录一家
          </Link>
        </section>
      ) : null}

      {!isLoading && !error && (mealCount ?? 0) > 0 && state?.noCandidate ? (
        <section className="card mt-7 p-6 text-center">
          <h2 className="text-xl font-semibold">最近这类吃得有点勤</h2>
          <p className="mt-3 text-sm leading-6 text-muted">当前没有达到间隔条件的店。</p>
          <Link className="button-primary mt-6 flex items-center justify-center gap-2" to="/record">
            <Plus className="h-5 w-5" />
            去记录新店
          </Link>
        </section>
      ) : null}

      {!isLoading && !error && (mealCount ?? 0) > 0 && !state?.noCandidate ? (
        <button
          type="button"
          className="card mt-7 flex h-[200px] w-full flex-col items-center justify-center transition hover:border-brand/40 active:scale-[0.99]"
          onClick={draw}
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <Dices className="h-7 w-7" strokeWidth={1.8} />
          </span>
          <strong className="mt-5 text-xl font-semibold">吃啥呢</strong>
          <span className="mt-2 text-sm text-muted">点一下抽一个</span>
        </button>
      ) : null}

      <Link className="mt-6 block min-h-11 text-center text-sm font-medium leading-[44px] text-brand" to="/record">
        记录今天吃了什么
      </Link>
    </div>
  );
}
