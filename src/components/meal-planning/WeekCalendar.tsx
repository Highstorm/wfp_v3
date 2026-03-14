import { useState, useMemo } from "react";
import { useMealPlans } from "../../hooks/useMealPlans";

interface WeekCalendarProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

export const WeekCalendar = ({
  selectedDate,
  onDateSelect,
}: WeekCalendarProps) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const date = new Date(selectedDate);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  });

  const { data: mealPlans } = useMealPlans();

  // Berechne den Montag der aktuellen Woche
  const getWeekDates = (startDate: Date) => {
    const week = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      week.push(currentDate);
    }
    return week;
  };

  const weekDays = getWeekDates(currentWeekStart);

  const formatDate = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split("T")[0];
  };

  const daysWithPlan = useMemo(() => {
    if (!mealPlans) return [];
    const firstDayStr = formatDate(weekDays[0]);
    const lastDayStr = formatDate(weekDays[6]);
    return mealPlans
      .map((p) => p.date)
      .filter((d) => d >= firstDayStr && d <= lastDayStr);
  }, [mealPlans, currentWeekStart]);

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(
      currentWeekStart.getDate() + (direction === "next" ? 7 : -7)
    );
    setCurrentWeekStart(newDate);
  };

  const dayNames = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

  const todayStr = formatDate(new Date());
  const isSelectedToday = selectedDate === todayStr;

  // Titel: "Heute" wenn heute ausgewählt, sonst Datum
  const title = isSelectedToday
    ? "Heute"
    : new Date(selectedDate).toLocaleDateString("de-DE", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });

  return (
    <div>
      {/* Title */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => navigateWeek("prev")}
          className="p-2 rounded-full text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors touch-manipulation"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-display font-extrabold text-2xl">{title}</h1>
        <button
          onClick={() => navigateWeek("next")}
          className="p-2 rounded-full text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors touch-manipulation"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Week days row */}
      <div className="flex gap-1">
        {weekDays.map((date, index) => {
          const dateString = formatDate(date);
          const hasPlan = daysWithPlan.includes(dateString);
          const isSelected = dateString === selectedDate;
          const isToday = dateString === todayStr;

          return (
            <button
              key={dateString}
              onClick={() => onDateSelect(dateString)}
              className={`
                flex-1 flex flex-col items-center py-2 rounded-xl transition-all touch-manipulation
                ${isSelected
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }
              `}
            >
              <span className={`text-xs ${isSelected ? "text-white/70 dark:text-zinc-500" : "text-muted-foreground"}`}>
                {dayNames[index]}
              </span>
              <span className={`text-lg font-semibold ${isToday && !isSelected ? "text-primary" : ""}`}>
                {date.getDate()}
              </span>
              {hasPlan && !isSelected && (
                <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />
              )}
              {hasPlan && isSelected && (
                <div className="w-1 h-1 rounded-full bg-white/50 dark:bg-zinc-500 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
