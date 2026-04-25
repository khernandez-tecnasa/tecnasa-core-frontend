import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

/**
 * Generic confirmation modal — reusable across the app.
 * Props:
 *   open          boolean
 *   onConfirm     () => void
 *   onCancel      () => void
 *   title         string
 *   description   string
 *   confirmLabel  string   (default "Confirmar")
 *   cancelLabel   string   (default "Cancelar")
 *   variant       "danger" | "warning" | "primary"  (default "danger")
 *   icon          ReactNode (optional, overrides default icon)
 */
export default function ConfirmModal({
  open,
  onConfirm,
  onCancel,
  title = "¿Confirmar acción?",
  description = "Esta acción no se puede deshacer.",
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
  icon,
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const colors = {
    danger:  { ring: "bg-red-50 dark:bg-red-950",    icon: "text-red-500 dark:text-red-400",    btn: "bg-red-600 hover:bg-red-700 active:bg-red-800" },
    warning: { ring: "bg-amber-50 dark:bg-amber-950", icon: "text-amber-500 dark:text-amber-400", btn: "bg-amber-500 hover:bg-amber-600 active:bg-amber-700" },
    primary: { ring: "bg-primary/10",                 icon: "text-primary",                       btn: "bg-primary hover:opacity-90 active:opacity-80" },
  };
  const c = colors[variant] || colors.danger;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 600 }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-[fadeIn_0.2s_ease]">
        <div className="flex justify-center mb-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${c.ring}`}>
            {icon ?? <AlertTriangle className={`w-7 h-7 ${c.icon}`} />}
          </div>
        </div>
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors ${c.btn}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
