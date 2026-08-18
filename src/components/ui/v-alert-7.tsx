import { CircleAlertIcon, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./alert";

export type VAlert7Props = {
  title?: string;
  message?: string;
  onClose?: () => void;
};

export default function VAlert7({
  title = "Error!",
  message = "Please try again. If the problem persists, contact support.",
  onClose,
}: VAlert7Props) {
  return (
    <Alert variant="error" className="relative flex items-center justify-between gap-3 p-4">
      <CircleAlertIcon className="h-5 w-5 text-red-600 shrink-0" />
      <div className="min-w-0 flex-1 pl-2">
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-gray-400 hover:bg-red-100/50 hover:text-red-700 transition-colors"
          title="Tutup Pesan"
        >
          <X size={16} />
        </button>
      )}
    </Alert>
  );
}
