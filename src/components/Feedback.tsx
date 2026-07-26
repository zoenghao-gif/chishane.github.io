import { AlertCircle, CheckCircle2 } from "lucide-react";

interface FeedbackProps {
  type?: "error" | "success";
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function Feedback({ type = "error", message, actionLabel, onAction }: FeedbackProps) {
  const success = type === "success";
  const Icon = success ? CheckCircle2 : AlertCircle;
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
        success
          ? "border-brand/20 bg-brand-soft text-brand"
          : "border-danger/20 bg-red-50 text-danger"
      }`}
      role={success ? "status" : "alert"}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="flex-1">{message}</span>
      {actionLabel && onAction ? (
        <button className="font-medium underline" type="button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
