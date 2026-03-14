import React from "react";

interface StomachPainTrackerProps {
  stomachPainLevel: number | undefined;
  onStomachPainChange: (level: number) => void;
  isEnabled: boolean;
}

const getPainLevelLabel = (level: number): string => {
  const labels = [
    "Kein Bauchweh",
    "Sehr leicht",
    "Leicht",
    "Leicht bis mäßig",
    "Mäßig",
    "Mäßig bis stark",
    "Stark",
    "Sehr stark",
    "Extrem stark",
    "Unerträglich",
    "Bauchkrämpfe"
  ];
  return labels[level] || "Unbekannt";
};

const getPainLevelColor = (level: number): string => {
  if (level === 0) return "text-green-600";
  if (level <= 3) return "text-yellow-600";
  if (level <= 6) return "text-orange-600";
  return "text-red-600";
};

const getPainLevelIcon = (level: number): string => {
  if (level === 0) return "😊";
  if (level <= 2) return "🙂";
  if (level <= 4) return "😐";
  if (level <= 6) return "😕";
  if (level <= 8) return "😖";
  return "😫";
};

export const StomachPainTracker: React.FC<StomachPainTrackerProps> = ({
  stomachPainLevel = 0,
  onStomachPainChange,
  isEnabled,
}) => {
  if (!isEnabled) {
    return null;
  }

  return (
    <div className="border-t border-border pt-4 mb-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label
            htmlFor="stomachPainSlider"
            className="block text-base sm:text-lg font-medium"
          >
            Bauchweh-Level
          </label>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">
              {getPainLevelIcon(stomachPainLevel)}
            </span>
            <span className={`text-sm font-medium ${getPainLevelColor(stomachPainLevel)}`}>
              {stomachPainLevel}/10
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          <input
            id="stomachPainSlider"
            type="range"
            min="0"
            max="10"
            step="1"
            value={stomachPainLevel}
            onChange={(e) => onStomachPainChange(parseInt(e.target.value))}
            className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #10b981 0%, #f59e0b 50%, #ef4444 100%)`
            }}
          />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0</span>
            <span>5</span>
            <span>10</span>
          </div>
          
          <div className="text-center">
            <span className={`text-sm font-medium ${getPainLevelColor(stomachPainLevel)}`}>
              {getPainLevelLabel(stomachPainLevel)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
