import { useState } from "react";
import { cn } from "../../lib/utils";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: "top" | "bottom";
  className?: string;
}

function Tooltip({
  content,
  children,
  side = "top",
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={cn(
            "absolute z-50 whitespace-nowrap rounded-md bg-foreground px-3 py-1.5 text-xs text-background shadow-md animate-fade-in",
            side === "top" && "bottom-full left-1/2 -translate-x-1/2 mb-2",
            side === "bottom" && "top-full left-1/2 -translate-x-1/2 mt-2",
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}

export { Tooltip };
