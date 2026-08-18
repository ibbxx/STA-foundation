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
    <Alert variant="error" className="flex items-start gap-4 p-5 sm:p-6 shadow-2xl">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600 shadow-inner">
        <CircleAlertIcon className="h-6 w-6 text-red-600" />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100/80 text-gray-500 hover:bg-red-100 hover:text-red-700 transition-colors"
          title="Tutup Pesan"
        >
          <X size={18} />
        </button>
      )}
    </Alert>
  );
}
