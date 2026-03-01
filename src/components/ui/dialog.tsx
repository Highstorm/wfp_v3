import { Fragment } from "react";
import {
  Dialog as HeadlessDialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
  Description,
} from "@headlessui/react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

function Dialog({ open, onClose, children, className }: DialogProps) {
  return (
    <Transition show={open} as={Fragment}>
      <HeadlessDialog onClose={onClose} className="relative z-50">
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-normal"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-fast"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-[2px]"
            aria-hidden="true"
          />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-normal"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-fast"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel
              className={cn(
                "w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-elevated",
                className
              )}
            >
              {children}
            </DialogPanel>
          </TransitionChild>
        </div>
      </HeadlessDialog>
    </Transition>
  );
}

interface DialogHeaderProps {
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

function DialogHeader({ children, onClose, className }: DialogHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)}>
      <div>{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
          aria-label="Schliessen"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function DialogTitleComponent({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogTitle>) {
  return (
    <DialogTitle
      className={cn("text-lg font-semibold font-display", className)}
      {...props}
    >
      {children}
    </DialogTitle>
  );
}

function DialogDescription({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Description>) {
  return (
    <Description
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    >
      {children}
    </Description>
  );
}

interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

function DialogFooter({ children, className }: DialogFooterProps) {
  return (
    <div className={cn("mt-6 flex justify-end gap-3", className)}>
      {children}
    </div>
  );
}

export {
  Dialog,
  DialogHeader,
  DialogTitleComponent as DialogTitle,
  DialogDescription,
  DialogFooter,
};
