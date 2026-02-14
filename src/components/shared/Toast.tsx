import { useToast } from "../../lib/toast";
import { createPortal } from "react-dom";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "../../lib/utils";

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const colorMap = {
  success: "border-success bg-success/10 text-success",
  error: "border-destructive bg-destructive/10 text-destructive",
  info: "border-primary bg-primary/10 text-primary",
  warning: "border-warning bg-warning/10 text-warning",
};

export const Toast = () => {
  const { message, type, hideToast } = useToast();

  if (!message || !type) return null;

  const Icon = iconMap[type] || Info;

  return createPortal(
    <div className="fixed top-4 right-4 left-4 sm:left-auto z-50 animate-slide-in-from-top">
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg border p-4 shadow-glass sm:min-w-[320px] sm:max-w-md bg-card",
          colorMap[type]
        )}
        role="alert"
      >
        <Icon className="h-5 w-5 shrink-0" />
        <p className="flex-1 text-sm font-medium text-foreground">
          {message}
        </p>
        <button
          onClick={hideToast}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          aria-label="Benachrichtigung schliessen"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>,
    document.body
  );
};
