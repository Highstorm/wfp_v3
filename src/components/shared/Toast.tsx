import { useToast } from "../../lib/toast";
import { createPortal } from "react-dom";

export const Toast = () => {
  const { message, type } = useToast();

  if (!message || !type) return null;

  return createPortal(
    <div
      className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
        type === "success" ? "bg-green-500" : "bg-red-500"
      } text-white`}
    >
      {message}
    </div>,
    document.body
  );
};
