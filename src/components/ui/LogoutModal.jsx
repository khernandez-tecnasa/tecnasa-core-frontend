import { useEffect } from "react";
import { LogOut } from "lucide-react";

export default function LogoutModal({ open, onConfirm, onCancel }) {
  // Lock body scroll while open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 600 }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Card */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-[fadeIn_0.2s_ease]">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-950 flex items-center justify-center">
            <LogOut className="w-7 h-7 text-red-500 dark:text-red-400" />
          </div>
        </div>

        {/* Text */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            ¿Cerrar sesión?
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Se cerrará tu sesión actual. Deberás iniciar sesión nuevamente para continuar.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="
              flex-1 px-4 py-2.5 rounded-xl text-sm font-medium
              border border-gray-200 dark:border-gray-700
              text-gray-700 dark:text-gray-300
              hover:bg-gray-50 dark:hover:bg-gray-800
              transition-colors duration-150
            "
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="
              flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold
              bg-red-600 hover:bg-red-700 active:bg-red-800
              text-white transition-colors duration-150
            "
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
