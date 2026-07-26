import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Feedback } from "../components/Feedback";
import { LoadingState } from "../components/LoadingState";
import { MealPeriodSelector } from "../components/MealPeriodSelector";
import {
  createMealRecord,
  deleteMealRecord,
  getMealRecord,
  updateMealRecord,
} from "../features/meals/api";
import { getErrorMessage } from "../lib/errors";
import { currentShanghaiDateTime } from "../lib/time";
import type { MealPeriod } from "../types";

interface FormState {
  shopName: string;
  foodName: string;
  eatDate: string;
  eatTime: string;
  mealPeriod: MealPeriod;
}

const now = currentShanghaiDateTime();
const emptyForm: FormState = {
  shopName: "",
  foodName: "",
  eatDate: now.date,
  eatTime: now.time,
  mealPeriod: "noon",
};

export function MealFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  const recordQuery = useQuery({
    queryKey: ["meal-record", id],
    queryFn: () => getMealRecord(id!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (!recordQuery.data) return;
    setForm({
      shopName: recordQuery.data.shop_name,
      foodName: recordQuery.data.food_name ?? "",
      eatDate: recordQuery.data.eat_date,
      eatTime: recordQuery.data.eat_time.slice(0, 5),
      mealPeriod: recordQuery.data.meal_period ?? (recordQuery.data.meal_type === "late_night" ? "late_night" : (Number(recordQuery.data.eat_time.slice(0, 2)) < 16 ? "noon" : "evening")),
    });
  }, [recordQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const shopName = form.shopName.trim();
      const foodName = form.foodName.trim();
      if (!shopName) throw new Error("请填写店名");
      if (!form.eatDate) throw new Error("请选择吃饭日期");
      if (!form.eatTime) throw new Error("请选择用餐时间");

      const input = {
        shop_name: shopName,
        food_name: foodName || null,
        eat_date: form.eatDate,
        meal_period: form.mealPeriod,
      };

      if (isEditing) return updateMealRecord(id!, input);
      return createMealRecord({ ...input, client_action_id: crypto.randomUUID() });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["history"] });
      await queryClient.invalidateQueries({ queryKey: ["meal-count"] });
      navigate("/history", {
        replace: true,
        state: { feedback: isEditing ? "记录已更新" : "记录已保存" },
      });
    },
    onError: (error) => setValidationError(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteMealRecord(id!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["history"] });
      await queryClient.invalidateQueries({ queryKey: ["meal-count"] });
      navigate("/history", { replace: true, state: { feedback: "记录已删除" } });
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    setValidationError(null);
    saveMutation.mutate();
  }

  if (recordQuery.isLoading) return <LoadingState label="正在加载记录" />;

  return (
    <div>
      <button className="flex min-h-11 items-center gap-2 text-sm text-muted" type="button" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-5 w-5" />
        返回
      </button>
      <header className="mt-4">
        <h1 className="text-[28px] font-semibold">{isEditing ? "编辑记录" : "记录外卖"}</h1>
        <p className="mt-2 text-base text-muted">记下今天吃了什么</p>
      </header>

      {recordQuery.error ? (
        <div className="mt-6">
          <Feedback
            message={getErrorMessage(recordQuery.error, "记录加载失败")}
            actionLabel="重试"
            onAction={() => void recordQuery.refetch()}
          />
        </div>
      ) : null}

      <form className="mt-8 space-y-5" onSubmit={submit}>
        <div>
          <label className="field-label" htmlFor="shop-name">
            店名
          </label>
          <input
            id="shop-name"
            className="field"
            value={form.shopName}
            maxLength={100}
            autoComplete="off"
            placeholder="请输入店名"
            onChange={(event) => setForm({ ...form, shopName: event.target.value })}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="food-name">
            菜名（选填）
          </label>
          <input
            id="food-name"
            className="field"
            value={form.foodName}
            maxLength={100}
            autoComplete="off"
            placeholder="例如：鸡腿饭"
            onChange={(event) => setForm({ ...form, foodName: event.target.value })}
          />
        </div>

        <div>
          <div>
            <label className="field-label" htmlFor="eat-date">
              用餐日期
            </label>
            <input
              id="eat-date"
              className="field px-3"
              type="date"
              value={form.eatDate}
              onChange={(event) => setForm({ ...form, eatDate: event.target.value })}
            />
          </div>
          <div className="hidden">
            <label className="field-label" htmlFor="eat-time">
              用餐时间
            </label>
            <input
              id="eat-time"
              className="field px-3"
              type="hidden"
              value={form.mealPeriod}
              readOnly
            />
          </div>
        </div>

        <fieldset>
          <legend className="field-label">用餐时间</legend>
          <MealPeriodSelector
            value={form.mealPeriod}
            onChange={(mealPeriod) => setForm({ ...form, mealPeriod })}
          />
        </fieldset>

        {validationError || deleteMutation.error ? (
          <Feedback message={validationError ?? getErrorMessage(deleteMutation.error)} />
        ) : null}

        <button className="button-primary" type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "正在保存…" : "保存记录"}
        </button>
      </form>

      {isEditing ? (
        <button
          className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-[14px] text-base font-medium text-danger"
          type="button"
          onClick={() => setShowDelete(true)}
        >
          <Trash2 className="h-5 w-5" />
          删除这条记录
        </button>
      ) : null}

      <ConfirmDialog
        open={showDelete}
        title="删除这条记录？"
        description="删除后会立即影响候选店和间隔顿数，且无法恢复。"
        confirmLabel="确认删除"
        isPending={deleteMutation.isPending}
        onCancel={() => setShowDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}
