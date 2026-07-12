"use client";

import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { useEffect } from "react";

type AlertType = "success" | "error" | "info";

interface AlertProps {
  type: AlertType;
  message: string;
  onClose?: () => void;
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const styles = {
  success: "bg-emerald-50 text-emerald-800 border-emerald-200",
  error: "bg-red-50 text-red-800 border-red-200",
  info: "bg-blue-50 text-blue-800 border-blue-200",
};

export function Alert({ type, message, onClose }: AlertProps) {
  const Icon = icons[type];

  useEffect(() => {
    if (onClose) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [onClose]);

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${styles[type]}`}
      role="alert"
    >
      <Icon className="h-5 w-5 shrink-0" />
      <p className="flex-1">{message}</p>
      {onClose && (
        <button onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
