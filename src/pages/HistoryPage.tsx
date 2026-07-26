import { useInfiniteQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Feedback } from "../components/Feedback";
import { LoadingState } from "../components/LoadingState";
import { ShopAvatar } from "../components/ShopAvatar";
import { HISTORY_PAGE_SIZE, listMealRecords } from "../features/meals/api";
import { getErrorMessage } from "../lib/errors";
import { formatMealDate, formatMealTime } from "../lib/time";
import type { MealRecord } from "../types";
import { mealPeriodLabels } from "../types";

function groupByDate(records: MealRecord[]) {
  return records.reduce<Record<string, MealRecord[]>>((groups, record) => {
    (groups[record.eat_date] ??= []).push(record);
    return groups;
  }, {});
}

export function HistoryPage() {
  const location = useLocation();
  const state = location.state as { feedback?: string } | null;
  const historyQuery = useInfiniteQuery({
    queryKey: ["history"],
    queryFn: ({ pageParam }) => listMealRecords(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.length === HISTORY_PAGE_SIZE ? lastPageParam + 1 : undefined,
  });

  useEffect(() => {
    if (state) window.history.replaceState({}, document.title);
  }, [state]);

  const records = historyQuery.data?.pages.flat() ?? [];
  const groups = groupByDate(records);

  return (
    <div>
      <header>
        <h1 className="text-[28px] font-semibold">历史记录</h1>
        <p className="mt-2 text-base text-muted">按实际用餐顺序保存</p>
      </header>

      {state?.feedback ? (
        <div className="mt-6">
          <Feedback type="success" message={state.feedback} />
        </div>
      ) : null}

      {historyQuery.isLoading ? <LoadingState label="正在加载历史记录" /> : null}

      {historyQuery.error ? (
        <div className="mt-7">
          <Feedback
            message={getErrorMessage(historyQuery.error, "历史记录加载失败")}
            actionLabel="重试"
            onAction={() => void historyQuery.refetch()}
          />
        </div>
      ) : null}

      {!historyQuery.isLoading && !historyQuery.error && records.length === 0 ? (
        <section className="card mt-8 p-6 text-center">
          <h2 className="text-xl font-semibold">还没有记录</h2>
          <p className="mt-3 text-sm text-muted">先记录一家吃过的店。</p>
          <Link className="button-primary mt-6 flex items-center justify-center" to="/record">
            记录一家
          </Link>
        </section>
      ) : null}

      <div className="mt-8 space-y-7">
        {Object.entries(groups).map(([date, dateRecords]) => (
          <section key={date}>
            <h2 className="mb-3 text-sm font-semibold text-muted">{formatMealDate(date)}</h2>
            <div className="card divide-y divide-line overflow-hidden">
              {dateRecords.map((record) => (
                <Link
                  key={record.id}
                  className="flex min-h-[76px] items-center gap-3 px-4 py-3 transition hover:bg-canvas"
                  to={`/record/${record.id}`}
                >
                  <ShopAvatar name={record.shop_name} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-medium">{record.shop_name}</span>
                    <span className="mt-1 block truncate text-sm text-muted">
                      {record.food_name || formatMealTime(record.eat_time)}
                    </span>
                  </span>
                  <span className="rounded-lg bg-canvas px-2 py-1 text-xs text-muted">
                    {record.meal_period ? mealPeriodLabels[record.meal_period] : (record.meal_type === "late_night" ? "宵夜" : "正餐")}
                  </span>
                  <ChevronRight className="h-4 w-4 text-subtle" />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      {historyQuery.hasNextPage ? (
        <button
          className="button-secondary mt-6"
          type="button"
          disabled={historyQuery.isFetchingNextPage}
          onClick={() => void historyQuery.fetchNextPage()}
        >
          {historyQuery.isFetchingNextPage ? "正在加载…" : "加载更多"}
        </button>
      ) : null}
    </div>
  );
}
