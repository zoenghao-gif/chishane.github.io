interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = "正在加载" }: LoadingStateProps) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-muted" role="status">
      <span className="h-7 w-7 animate-spin rounded-full border-2 border-line border-t-brand" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
