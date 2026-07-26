import { useEffect, useRef } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { drawCandidate } from "../features/meals/api";
import { readRound, writeRound } from "../features/draw/roundState";
import { mealTypeLabels } from "../types";

export function DrawingPage() {
  const navigate = useNavigate();
  const round = readRound();
  const started = useRef(false);

  useEffect(() => {
    if (!round || started.current) return;
    started.current = true;

    const minimumDelay = new Promise((resolve) => window.setTimeout(resolve, 420));
    void Promise.all([
      drawCandidate(round.mealType, round.excludedShopNames),
      minimumDelay,
    ])
      .then(([candidate]) => {
        if (!candidate) {
          navigate("/home", {
            replace: true,
            state: { noCandidate: round.excludedShopNames.length === 0 },
          });
          return;
        }
        writeRound({ ...round, currentResult: candidate });
        navigate("/result", { replace: true });
      })
      .catch(() => {
        navigate("/home", {
          replace: true,
          state: { error: "抽取失败，请稍后重试" },
        });
      });
  }, [navigate, round]);

  if (!round) return <Navigate to="/home" replace />;
  const label = mealTypeLabels[round.mealType];

  return (
    <main className="mx-auto flex min-h-dvh max-w-[520px] flex-col items-center justify-center bg-canvas px-5 text-center">
      <div className="flex gap-2" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="h-3 w-3 animate-pulse rounded-full bg-brand"
            style={{ animationDelay: `${index * 120}ms` }}
          />
        ))}
      </div>
      <h1 className="mt-7 text-2xl font-semibold">正在帮你挑{label}</h1>
      <p className="mt-2 text-base text-muted">稍等一下</p>
    </main>
  );
}
