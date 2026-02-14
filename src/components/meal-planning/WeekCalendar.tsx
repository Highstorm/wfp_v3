import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

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

  const [daysWithPlan, setDaysWithPlan] = useState<string[]>([]);
  const auth = getAuth();
  const db = getFirestore();

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

  const loadWeekPlans = async () => {
    if (!auth.currentUser?.uid) return;

    try {
      const q = query(
        collection(db, "mealPlans"),
        where("createdBy", "==", auth.currentUser.uid),
        where("date", ">=", weekDays[0].toISOString().split("T")[0]),
        where("date", "<=", weekDays[6].toISOString().split("T")[0])
      );

      const querySnapshot = await getDocs(q);
      const dates = querySnapshot.docs.map((doc) => doc.data().date);
      setDaysWithPlan(dates);
    } catch (error) {
      console.error("Fehler beim Laden der Tagespläne:", error);
    }
  };

  useEffect(() => {
    loadWeekPlans();
  }, [auth.currentUser?.uid, currentWeekStart]);

  // Exportiere die Funktion für externe Nutzung
  useEffect(() => {
    // @ts-ignore
    window.refreshCalendar = loadWeekPlans;
  }, []);

  const formatDate = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split("T")[0];
  };

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(
      currentWeekStart.getDate() + (direction === "next" ? 7 : -7)
    );
    setCurrentWeekStart(newDate);
  };

  const dayNames = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

  return (
    <div className="rounded-lg bg-card">
      <div className="card p-4">
        {/* Navigation und Wochenbereich */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateWeek("prev")}
            className="btn-secondary"
          >
            ←
          </button>
          <span className={`text-base text-sm font-medium`}>
            {formatDisplayDate(weekDays[0])} - {formatDisplayDate(weekDays[6])}
          </span>
          <button
            onClick={() => navigateWeek("next")}
            className="btn-secondary"
          >
            →
          </button>
        </div>

        {/* Wochenansicht */}
        <div className="flex flex-wrap gap-2">
          {weekDays.map((date, index) => {
            const dateString = formatDate(date);
            const hasPlan = daysWithPlan.includes(dateString);
            const isSelected = dateString === selectedDate;
            const isToday = dateString === formatDate(new Date());

            return (
              <button
                key={dateString}
                onClick={() => onDateSelect(dateString)}
                className={`
                  flex-1 min-w-[100px] p-3 rounded-lg flex flex-col items-center justify-center
                  transition-all transform hover:scale-[1.02]
                  ${hasPlan ? "bg-primary text-primary-foreground" : "bg-muted"}
                  ${isSelected ? "ring-2 ring-offset-2 ring-ring" : ""}
                  ${isToday ? "font-bold" : ""}
                `}
              >
                <span className="text-sm font-medium mb-1">
                  {dayNames[index]}
                </span>
                <span className="text-lg">{date.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
