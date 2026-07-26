import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Feedback } from "../components/Feedback";
import { MealPeriodSelector } from "../components/MealPeriodSelector";
import { ShopAvatar } from "../components/ShopAvatar";
import { clearRound, readRound, startRound, writeRound } from "../features/draw/roundState";
import { confirmMealRecord, drawCandidate } from "../features/meals/api";
import { getErrorMessage } from "../lib/errors";
import { currentShanghaiDateTime } from "../lib/time";
import type { MealPeriod } from "../types";

export function ResultPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [round, setRound] = useState(readRound);
  const [exhausted, setExhausted] = useState(false);
  const actionId = useRef(crypto.randomUUID());
  const candidate = round?.currentResult;
  const [mealPeriod, setMealPeriod] = useState<MealPeriod>(round?.mealType === "late_night" ? "late_night" : "noon");

  const changeMutation = useMutation({
    mutationFn: async () => {
      if (!round || !candidate) return null;
      const excluded = [...round.excludedShopNames, candidate.shop_name.trim()];
      const next = await drawCandidate(round.mealType, excluded);
      if (!next) {
        writeRound({ ...round, excludedShopNames: excluded, currentResult: null });
        setRound({ ...round, excludedShopNames: excluded, currentResult: null });
        setExhausted(true);
        return null;
      }
      const nextRound = { ...round, excludedShopNames: excluded, currentResult: next };
      writeRound(nextRound);
      setRound(nextRound);
      actionId.current = crypto.randomUUID();
      return next;
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!round || !candidate) throw new Error("本轮结果已失效");
      const now = currentShanghaiDateTime();
      return confirmMealRecord({
        shop_name: candidate.shop_name,
        food_name: candidate.food_name,
        eat_date: now.date,
        meal_period: mealPeriod,
        client_action_id: actionId.current,
      });
    },
    onSuccess: async () => {
      clearRound();
      await queryClient.invalidateQueries({ queryKey: ["meal-count"] });
      await queryClient.invalidateQueries({ queryKey: ["history"] });
      navigate("/home", { replace: true, state: { feedback: "已经记下这顿了" } });
    },
  });

  if (!round) return <Navigate to="/home" replace />;
  function restart() {
    startRound(round!.mealType);
    navigate(`/drawing?type=${round!.mealType}`, { replace: true });
  }

  if (exhausted || !candidate) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-[520px] items-center bg-canvas px-5">
        <section className="card w-full p-6 text-center">
          <h1 className="text-2xl font-semibold">当前候选都看过了</h1>
          <p className="mt-3 text-sm leading-6 text-muted">可以重新看一轮，或者记录一家新店。</p>
          <button className="button-primary mt-7 flex items-center justify-center gap-2" type="button" onClick={restart}>
            <RefreshCw className="h-5 w-5" />
            重新开始本轮
          </button>
          <button className="button-secondary mt-3" type="button" onClick={() => navigate("/record")}>
            去记录新店
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-dvh max-w-[520px] bg-canvas px-5 pb-8 pt-[max(24px,env(safe-area-inset-top))]">
      <button className="flex min-h-11 items-center gap-2 text-sm text-muted" type="button" onClick={() => navigate("/home")}>
        <ArrowLeft className="h-5 w-5" />
        返回首页
      </button>

      <p className="mt-7 text-center text-base font-medium text-brand">
        {round.mealType === "main_meal" ? "这顿正餐吃这个" : "今晚宵夜吃这个"}
      </p>

      <section className="card mt-5 p-7 text-center">
        <div className="flex justify-center">
          <ShopAvatar name={candidate.shop_name} />
        </div>
        <h1 className="mt-5 text-[30px] font-semibold leading-tight">{candidate.shop_name}</h1>
        {candidate.food_name ? (
          <p className="mt-3 text-base text-muted">{candidate.food_name}</p>
        ) : null}
        <p className="mt-8 text-sm text-muted">
          你已经 <strong className="font-semibold text-ink">{candidate.gap_meals}</strong> 顿
          {round.mealType === "late_night" ? "宵夜" : ""}没吃这家了
        </p>
      </section>

      <div className="mt-5">
        <p className="field-label">用餐时间</p>
        <MealPeriodSelector value={mealPeriod} onChange={setMealPeriod} />
      </div>

      {confirmMutation.error || changeMutation.error ? (
        <div className="mt-5">
          <Feedback
            message={getErrorMessage(confirmMutation.error ?? changeMutation.error)}
          />
        </div>
      ) : null}

      <div className="mt-7 space-y-3">
        <button
          className="button-primary"
          type="button"
          disabled={confirmMutation.isPending || changeMutation.isPending}
          onClick={() => confirmMutation.mutate()}
        >
          {confirmMutation.isPending ? "正在记录…" : "就它了"}
        </button>
        <button
          className="button-secondary"
          type="button"
          disabled={confirmMutation.isPending || changeMutation.isPending}
          onClick={() => changeMutation.mutate()}
        >
          {changeMutation.isPending ? "正在换…" : "换一个"}
        </button>
      </div>
    </main>
  );
}
