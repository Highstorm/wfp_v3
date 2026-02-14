import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "../../lib/firebase";

interface MonthCalendarProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

export const MonthCalendar = ({
  selectedDate,
  onDateSelect,
}: MonthCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date(selectedDate));
  const [daysWithPlan, setDaysWithPlan] = useState<string[]>([]);

  const loadMonthPlans = async () => {
    if (!auth.currentUser?.uid) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    try {
      const q = query(
        collection(db, "mealPlans"),
        where("createdBy", "==", auth.currentUser.uid),
        where("date", ">=", firstDay.toISOString().split("T")[0]),
        where("date", "<=", lastDay.toISOString().split("T")[0])
      );

      const querySnapshot = await getDocs(q);
      const dates = querySnapshot.docs.map((doc) => doc.data().date);
      console.log("Gefundene Tagespläne:", dates);
      setDaysWithPlan(dates);
    } catch (error) {
      console.error("Fehler beim Laden der Tagespläne:", error);
    }
  };

  // Lade initial und bei Monatsänderung
  useEffect(() => {
    loadMonthPlans();
  }, [auth.currentUser?.uid, currentDate, db]);

  // Exportiere die Funktion für externe Nutzung
  useEffect(() => {
    // @ts-ignore
    window.refreshCalendar = loadMonthPlans;
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Korrigiere den Wochentag für Montag als ersten Tag (0 = Montag, 6 = Sonntag)
    let firstDayOfWeek = firstDay.getDay();
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    // Füge leere Tage für den Monatsbeginn hinzu
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    // Füge die Tage des Monats hinzu
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(i);
    }

    return days;
  };

  const formatDate = (day: number) => {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    // Berücksichtige die lokale Zeitzone
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    const formattedDate = localDate.toISOString().split("T")[0];
    return formattedDate;
  };

  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
  };

  const monthNames = [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
  ];

  return (
    <div className="card">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={previousMonth} className="btn-secondary">
            ←
          </button>
          <h3 className={`text-lg font-medium`}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <button onClick={nextMonth} className="btn-secondary">
            →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((day) => (
            <div
              key={day}
              className={`text-sm font-medium text-muted-foreground`}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {getDaysInMonth(currentDate).map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} />;
            }

            const dateString = formatDate(day);
            const hasPlan = daysWithPlan.includes(dateString);
            const isSelected = dateString === selectedDate;

            return (
              <button
                key={dateString}
                onClick={() => onDateSelect(dateString)}
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm
                  ${hasPlan ? "bg-primary text-primary-foreground" : ""}
                  ${isSelected ? "ring-2 ring-offset-2 ring-ring" : ""}
                  hover:opacity-80 transition-opacity
                `}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
