import { ArrowRight, ShieldCheck } from "lucide-react";
import { Navigate, Link } from "react-router-dom";
import { Feedback } from "../components/Feedback";
import { LoadingState } from "../components/LoadingState";
import { useAuth } from "../features/auth/AuthProvider";

export function StartPage() {
  const { session, isLoading, error, begin, clearError } = useAuth();

  if (session) return <Navigate to="/home" replace />;
  if (isLoading && !error) {
    return (
      <div className="mx-auto min-h-dvh max-w-[520px] bg-canvas px-5 pt-20">
        <LoadingState label="正在准备" />
      </div>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-[520px] flex-col bg-canvas px-5 pb-8 pt-[max(56px,env(safe-area-inset-top))]">
      <div className="flex-1">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
          <ShieldCheck className="h-6 w-6" strokeWidth={1.8} />
        </span>
        <h1 className="mt-8 text-[30px] font-semibold tracking-tight">今天吃什么</h1>
        <p className="mt-2 max-w-xs text-lg leading-8 text-muted">
          从吃过的店里，
          <br />
          帮你快点做决定。
        </p>

        <section className="card mt-10 p-5">
          <h2 className="text-lg font-semibold">从自己的记录开始</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            不读取外卖订单，不使用图片，也不做 AI 推荐。你记下吃过的店，我们按间隔顿数帮你随机抽一家。
          </p>
          <div className="mt-5 rounded-xl bg-brand-soft px-4 py-3 text-sm leading-6 text-brand">
            数据保存在云端，但当前设备身份无法跨设备找回。清除浏览器数据或更换设备后，将无法访问原来的记录。
          </div>
          {error ? (
            <div className="mt-4">
              <Feedback message={error} actionLabel="关闭" onAction={clearError} />
            </div>
          ) : null}
          <button
            className="button-primary mt-5 flex items-center justify-center gap-2"
            type="button"
            disabled={isLoading}
            onClick={() => void begin()}
          >
            {isLoading ? "正在开始…" : "开始使用"}
            {!isLoading ? <ArrowRight className="h-5 w-5" /> : null}
          </button>
        </section>
      </div>

      <footer className="pt-8 text-center text-sm text-muted">
        <Link className="underline underline-offset-4" to="/privacy">
          隐私政策
        </Link>
        <span className="px-3 text-subtle">｜</span>
        <Link className="underline underline-offset-4" to="/terms">
          用户协议
        </Link>
      </footer>
    </main>
  );
}
