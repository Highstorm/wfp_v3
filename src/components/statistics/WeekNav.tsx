import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatWeekLabel } from "../../utils/stats.utils";

interface WeekNavProps {
  weekStart: Date;
  isCurrentWeek: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function WeekNav({
  weekStart,
  isCurrentWeek,
  onPrev,
  onNext,
  onToday,
}: WeekNavProps) {
  return (
    <div className="flex items-center justify-between">
      <button
        onClick={onPrev}
        className="btn-ghost p-2"
        aria-label="Vorherige Woche"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-2">
        <span className="font-bold text-sm">{formatWeekLabel(weekStart)}</span>
        {!isCurrentWeek && (
          <button
            onClick={onToday}
            className="btn-ghost text-sm px-2 py-1"
            aria-label="Aktuelle Woche"
          >
            Heute
          </button>
        )}
      </div>

      <button
        onClick={onNext}
        className="btn-ghost p-2"
        aria-label="Nächste Woche"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
