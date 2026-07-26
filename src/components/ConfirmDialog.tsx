import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  isPending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  isPending,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center">
      <div
        className="w-full max-w-md rounded-2xl border border-line bg-white p-5 shadow-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <h2 id="dialog-title" className="text-xl font-semibold">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button ref={cancelRef} className="button-secondary" type="button" disabled={isPending} onClick={onCancel}>
            取消
          </button>
          <button className="button-danger" type="button" disabled={isPending} onClick={onConfirm}>
            {isPending ? "处理中…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
