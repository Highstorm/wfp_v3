import { useSearchParams } from "react-router-dom";
import { startOfISOWeek, addWeeks, subWeeks, format } from "date-fns";

export function useWeekParam() {
  const [params, setParams] = useSearchParams();

  const weekParam = params.get("week");
  const weekStart = weekParam
    ? startOfISOWeek(new Date(weekParam))
    : startOfISOWeek(new Date());

  const weekStartISO = format(weekStart, "yyyy-MM-dd");

  const currentWeekStart = startOfISOWeek(new Date());
  const isCurrentWeek =
    format(weekStart, "yyyy-MM-dd") === format(currentWeekStart, "yyyy-MM-dd");

  function prev() {
    setParams({ week: format(subWeeks(weekStart, 1), "yyyy-MM-dd") });
  }

  function next() {
    setParams({ week: format(addWeeks(weekStart, 1), "yyyy-MM-dd") });
  }

  function today() {
    setParams({ week: format(currentWeekStart, "yyyy-MM-dd") });
  }

  return { weekStart, weekStartISO, isCurrentWeek, prev, next, today };
}
