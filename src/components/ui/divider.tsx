import { cn } from "../../lib/utils";

interface DividerProps extends React.HTMLAttributes<HTMLHRElement> {
  label?: string;
}

function Divider({ label, className, ...props }: DividerProps) {
  if (label) {
    return (
      <div className={cn("relative", className)}>
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {label}
          </span>
        </div>
      </div>
    );
  }

  return <hr className={cn("border-t border-border", className)} {...props} />;
}

export { Divider };
