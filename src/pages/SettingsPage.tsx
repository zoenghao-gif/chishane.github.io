import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, ShieldAlert } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Feedback } from "../components/Feedback";
import { LoadingState } from "../components/LoadingState";
import { deleteAccount, getSettings, updateGapSetting } from "../features/meals/api";
import { clearRound } from "../features/draw/roundState";
import { getErrorMessage } from "../lib/errors";

export function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [gap, setGap] = useState("5");
  const [showDelete, setShowDelete] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
  });

  useEffect(() => {
    if (settingsQuery.data) setGap(String(settingsQuery.data.required_gap_meals));
  }, [settingsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const value = Number(gap);
      if (!Number.isInteger(value) || value < 0 || value > 99) {
        throw new Error("请输入 0–99 之间的整数");
      }
      return updateGapSetting(value);
    },
    onSuccess: async () => {
      setFeedback("候选间隔已保存");
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      queryClient.clear();
      clearRound();
      navigate("/", { replace: true });
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    setFeedback(null);
    saveMutation.mutate();
  }

  if (settingsQuery.isLoading) return <LoadingState label="正在加载设置" />;

  return (
    <div>
      <header>
        <h1 className="text-[28px] font-semibold">设置</h1>
        <p className="mt-2 text-base text-muted">只保留与候选规则有关的设置</p>
      </header>

      {settingsQuery.error ? (
        <div className="mt-6">
          <Feedback
            message={getErrorMessage(settingsQuery.error, "设置加载失败")}
            actionLabel="重试"
            onAction={() => void settingsQuery.refetch()}
          />
        </div>
      ) : null}

      <form className="card mt-8 p-5" onSubmit={submit}>
        <label className="field-label" htmlFor="gap">
          候选间隔顿数
        </label>
        <p className="mb-4 text-sm leading-6 text-muted">
          连续多少顿没有吃某家店后，它可以重新进入候选。填 0 表示立即参与。
        </p>
        <input
          id="gap"
          className="field"
          type="number"
          inputMode="numeric"
          min="0"
          max="99"
          step="1"
          value={gap}
          onChange={(event) => setGap(event.target.value)}
        />
        {feedback ? (
          <div className="mt-4">
            <Feedback type="success" message={feedback} />
          </div>
        ) : null}
        {saveMutation.error ? (
          <div className="mt-4">
            <Feedback message={getErrorMessage(saveMutation.error)} />
          </div>
        ) : null}
        <button className="button-primary mt-5" type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "正在保存…" : "保存设置"}
        </button>
      </form>

      <section className="hidden card mt-6 divide-y divide-line overflow-hidden">
        <Link className="flex min-h-14 items-center justify-between px-5" to="/privacy">
          <span>隐私政策</span>
          <ChevronRight className="h-5 w-5 text-subtle" />
        </Link>
        <Link className="flex min-h-14 items-center justify-between px-5" to="/terms">
          <span>用户协议</span>
          <ChevronRight className="h-5 w-5 text-subtle" />
        </Link>
      </section>

      <section className="hidden mt-8">
        <h2 className="text-sm font-semibold text-danger">危险操作</h2>
        <button
          className="card mt-3 flex min-h-14 w-full items-center gap-3 px-5 text-left text-danger"
          type="button"
          onClick={() => setShowDelete(true)}
        >
          <ShieldAlert className="h-5 w-5" />
          永久删除账户
        </button>
        {deleteMutation.error ? (
          <div className="mt-4">
            <Feedback message={getErrorMessage(deleteMutation.error, "账户删除失败")} />
          </div>
        ) : null}
      </section>

      <ConfirmDialog
        open={showDelete}
        title="永久删除账户？"
        description="所有外卖记录和候选设置都会永久删除，无法恢复。"
        confirmLabel="永久删除"
        isPending={deleteMutation.isPending}
        onCancel={() => setShowDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}
