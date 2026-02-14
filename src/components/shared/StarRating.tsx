import React from "react";

interface StarRatingProps {
  rating: number;
  onChange: (rating: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onChange,
  readOnly = false,
  size = "md",
}) => {
  // Ermittle die Größe der Sterne basierend auf der size-Prop
  const starSize = {
    sm: "w-4 h-4 sm:w-5 sm:h-5",
    md: "w-5 h-5 sm:w-6 sm:h-6",
    lg: "w-6 h-6 sm:w-8 sm:h-8",
  }[size];

  // Padding für bessere Touch-Fläche
  const touchPadding = {
    sm: "p-1 sm:p-1",
    md: "p-1.5 sm:p-1.5",
    lg: "p-2 sm:p-2",
  }[size];

  // Funktion zum Rendern eines einzelnen Sterns
  const renderStar = (starPosition: number) => {
    const isFilled = starPosition <= rating;

    return (
      <button
        key={starPosition}
        type="button"
        className={`${touchPadding} ${
          readOnly ? "cursor-default" : "cursor-pointer"
        } focus:outline-none transition-colors rounded-full`}
        onClick={() => {
          if (!readOnly) {
            // Wenn auf den gleichen Stern erneut geklickt wird, setze die Bewertung zurück
            onChange(starPosition === rating ? 0 : starPosition);
          }
        }}
        disabled={readOnly}
        aria-label={`${starPosition} ${
          starPosition === 1 ? "Stern" : "Sterne"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={isFilled ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={isFilled ? "0" : "1.5"}
          className={`${starSize} ${
            isFilled ? "text-yellow-400" : "text-gray-300 hover:text-yellow-200"
          } transition-colors`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
          />
        </svg>
      </button>
    );
  };

  return (
    <div className="inline-flex items-center -mx-0.5 sm:-mx-1.5 flex-shrink-0">
      {[1, 2, 3, 4, 5].map(renderStar)}
    </div>
  );
};
