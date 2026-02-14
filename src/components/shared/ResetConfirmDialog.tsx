import { createPortal } from "react-dom";

interface ResetConfirmDialogProps {
  isOpen: boolean;
  planDate: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ResetConfirmDialog = ({
  isOpen,
  planDate,
  onConfirm,
  onCancel,
}: ResetConfirmDialogProps) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="card w-full max-w-md p-6">
        <h3 className="mb-4 text-lg font-medium">Formular zurücksetzen?</h3>
        <p className="mb-6 text-sm text-muted-foreground">
          Möchtest du das Formular für den{" "}
          {new Date(planDate).toLocaleDateString("de-DE")} wirklich
          zurücksetzen? Alle nicht gespeicherten Änderungen gehen verloren.
        </p>
        <div className="flex justify-end gap-4">
          <button onClick={onCancel} className="btn-secondary">
            Abbrechen
          </button>
          <button onClick={onConfirm} className="btn-primary">
            Zurücksetzen
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
