import { useWeekParam } from "../../hooks/useWeekParam";
import { useWeeklyStats } from "../../hooks/useWeeklyStats";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { WeekNav } from "./WeekNav";
import { WeeklyBarChart } from "./WeeklyBarChart";
import { WeeklySummaryCards } from "./WeeklySummaryCards";
import { MacroAverages } from "./MacroAverages";

export default function StatisticsPage() {
  const { weekStart, weekStartISO, isCurrentWeek, prev, next, today } = useWeekParam();
  const { data, isLoading, isError, error } = useWeeklyStats(weekStartISO);

  return (
    <div className="space-y-4 p-4">
      <WeekNav
        weekStart={weekStart}
        isCurrentWeek={isCurrentWeek}
        onPrev={prev}
        onNext={next}
        onToday={today}
      />

      {isLoading && <LoadingSpinner />}

      {isError && (
        <div className="text-destructive text-sm text-center p-4">
          Fehler beim Laden der Daten: {error?.message ?? "Unbekannter Fehler"}
        </div>
      )}

      {data && (
        <>
          <div className="card p-4">
            <WeeklyBarChart
              days={data.days}
              goals={data.goals}
              loggedDayCount={data.loggedDayCount}
            />
          </div>

          <WeeklySummaryCards
            totalEatenCalories={data.totalEatenCalories}
            totalDeficit={data.totalDeficit}
            totalSportCalories={data.totalSportCalories}
            totalSportSessions={data.totalSportSessions}
          />

          <MacroAverages
            days={data.days}
            goals={data.goals}
            loggedDayCount={data.loggedDayCount}
          />
        </>
      )}
    </div>
  );
}
