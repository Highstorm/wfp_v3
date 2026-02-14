import { createPortal } from "react-dom";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  planDate: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

export const DeleteConfirmDialog = ({
  isOpen,
  planDate,
  onConfirm,
  onCancel,
  isDeleting,
}: DeleteConfirmDialogProps) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="card w-full max-w-md p-6">
        <h3 className="mb-4 text-lg font-medium">Tagesplan löschen?</h3>
        <p className="mb-6 text-sm text-muted-foreground">
          Möchtest du den Tagesplan für den{" "}
          {new Date(planDate).toLocaleDateString("de-DE")} wirklich löschen?
          Diese Aktion kann nicht rückgängig gemacht werden.
        </p>
        <div className="flex justify-end gap-4">
          <button onClick={onCancel} className="btn-secondary">
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className={`btn-primary ${
              isDeleting ? "cursor-not-allowed opacity-50" : ""
            }`}
          >
            {isDeleting ? "Wird gelöscht..." : "Endgültig löschen"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
