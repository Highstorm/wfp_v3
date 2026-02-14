import { createPortal } from "react-dom";

interface DeleteDialogProps {
  isOpen: boolean;
  dishName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteDialog = ({
  isOpen,
  dishName,
  onConfirm,
  onCancel,
}: DeleteDialogProps) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="card p-6">
        <h3 className="mb-4 text-lg font-medium">Gericht löschen</h3>
        <p className="mb-6 text-sm sm:text-base text-muted-foreground">
          Bist du sicher, dass du das Gericht "{dishName}" löschen möchtest?
          Diese Aktion kann nicht rückgängig gemacht werden.
        </p>
        <div className="flex justify-end gap-2 sm:gap-4">
          <button onClick={onCancel} className="btn-secondary">
            Abbrechen
          </button>
          <button onClick={onConfirm} className="btn-primary">
            Löschen
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
