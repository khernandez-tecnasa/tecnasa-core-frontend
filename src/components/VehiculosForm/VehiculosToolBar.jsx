import { useState, useEffect } from "react";
import { Search, X, Plus, Archive } from "lucide-react";

export default function VehiculosToolBar({
  t,
  searchText,
  onSearch,
  showInactive = false,
  setShowInactive,
  canAdd = false,
  onAdd,
  addDisabledReason,
}) {
  const [local, setLocal] = useState(searchText ?? "");

  useEffect(() => {
    if (typeof searchText === "string") setLocal(searchText);
  }, [searchText]);

  const handleChange = (e) => {
    setLocal(e.target.value);
    onSearch?.(e.target.value);
  };

  const clear = () => {
    setLocal("");
    onSearch?.("");
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
      {/* Search */}
      <div className="relative flex-1 max-w-xs group">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors pointer-events-none"
        />
        <input
          type="text"
          placeholder={t?.("vehiculos.search_placeholder", "Buscar…")}
          value={local}
          onChange={handleChange}
          className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-8 py-2 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600 shadow-sm"
        />
        {local && (
          <button
            onClick={clear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={13} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Toggle inactivos */}
        <label className="flex items-center gap-2 cursor-pointer select-none group">
          <div
            onClick={() => setShowInactive?.(!showInactive)}
            className={`relative w-9 h-5 rounded-full border transition-all duration-200 cursor-pointer ${
              showInactive
                ? "bg-amber-500 border-amber-500"
                : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary/40"
            }`}>
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${
                showInactive ? "left-4" : "left-0.5"
              }`}
            />
          </div>
          <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
            <Archive size={12} />
            {t?.("vehiculos.show_inactive", "Ver inactivos")}
          </span>
        </label>

        {/* Add button */}
        <button
          onClick={canAdd ? onAdd : undefined}
          disabled={!canAdd}
          title={
            !canAdd
              ? addDisabledReason ||
                t?.("vehiculos.request_permission", "Sin permiso para crear")
              : t?.("vehiculos.add_vehicle", "Agregar vehículo")
          }
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${
            canAdd
              ? "bg-primary hover:opacity-90 active:opacity-80 shadow-primary/20 hover:shadow-primary/30"
              : "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
          }`}>
          <Plus size={16} strokeWidth={2.5} />
          {t?.("vehiculos.add_button", "Agregar")}
        </button>
      </div>
    </div>
  );
}
