import { useMemo, useState, useCallback } from "react";
import { ChevronUp, MoreVertical, Pencil, Trash2, RotateCcw, QrCode, Car, History } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import useIsMobile from "@/hooks/useIsMobile";

/* ── Status badge ──────────────────────────────────────────────────────── */

const STATUS_CLASSES = {
  disponible:         "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  en_uso:             "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  "en uso":           "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  en_mantenimiento:   "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
  "en mantenimiento": "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
  reservado:          "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  reservado_para_mantenimiento: "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  "reservado para mantenimiento": "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  inactivo:           "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700",
};

function estadoClasses(estado) {
  const key = (estado || "").toLowerCase().replace(/-/g, "_");
  return STATUS_CLASSES[key] || STATUS_CLASSES.inactivo;
}

function EstadoBadge({ estado, t }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${estadoClasses(estado)}`}>
      {t?.(`vehiculos.states.${(estado || "").toLowerCase().replace(/\s+/g, "_")}`, estado) || estado || "—"}
    </span>
  );
}

/* ── Sortable header ───────────────────────────────────────────────────── */

function SortTh({ label, field, sortField, sortOrder, onSort }) {
  const active = sortField === field;
  return (
    <th className="px-5 py-3.5 text-left">
      <button
        onClick={() => onSort(field)}
        className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors group"
      >
        {label}
        <ChevronUp
          size={11}
          className={`transition-all ${
            active
              ? `opacity-100 text-primary ${sortOrder === "desc" ? "rotate-180" : ""}`
              : "opacity-0 group-hover:opacity-40"
          }`}
        />
      </button>
    </th>
  );
}

/* ── Main ──────────────────────────────────────────────────────────────── */

export default function VehiculosTable({
  t,
  vehiculos = [],
  onEdit,
  onDelete,
  onRestore,
  onShowQR,
  onHistorial,
  canEdit = false,
  canDelete = false,
  canRestore = false,
  canQR = false,
  highlightId,
  focusedRef,
  highlightStyle,
}) {
  const isMobile = useIsMobile(768);
  const [sortField, setSortField] = useState("placa");
  const [sortOrder, setSortOrder] = useState("asc");

  const handleSort = useCallback((field) => {
    if (field === sortField) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  }, [sortField]);

  const sorted = useMemo(() => {
    const arr = [...(Array.isArray(vehiculos) ? vehiculos : [])];
    arr.sort((a, b) => {
      const A = (a?.[sortField] ?? "").toString().toLowerCase();
      const B = (b?.[sortField] ?? "").toString().toLowerCase();
      if (A < B) return sortOrder === "asc" ? -1 : 1;
      if (A > B) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [vehiculos, sortField, sortOrder]);

  const isInactive = (v) => (v?.estado || "").toLowerCase() === "inactivo";
  const getStyle   = (id) => (typeof highlightStyle === "function" ? highlightStyle(id) : {});
  const hasActions = (canEdit && onEdit) || (canDelete && onDelete) || (canRestore && onRestore) || (canQR && onShowQR) || Boolean(onHistorial);

  /* ── Actions dropdown ── */
  const ActionsMenu = ({ v }) => {
    const inactive = isInactive(v);
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            <MoreVertical size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44 rounded-2xl shadow-xl border-border/60">
          {canEdit && onEdit && (
            <DropdownMenuItem
              onClick={() => onEdit(v)}
              className="rounded-xl cursor-pointer gap-2 text-sm"
            >
              <Pencil size={13} />
              {t?.("vehiculos.edit", "Editar")}
            </DropdownMenuItem>
          )}
          {onHistorial && (
            <DropdownMenuItem
              onClick={() => onHistorial(v)}
              className="rounded-xl cursor-pointer gap-2 text-sm"
            >
              <History size={13} />
              {t?.("vehiculos.historial", "Historial")}
            </DropdownMenuItem>
          )}
          {canQR && onShowQR && (
            <DropdownMenuItem
              onClick={() => onShowQR(v)}
              className="rounded-xl cursor-pointer gap-2 text-sm"
            >
              <QrCode size={13} />
              {t?.("vehiculos.view_qr", "Ver QR registro")}
            </DropdownMenuItem>
          )}

          {(canDelete || canRestore) && <DropdownMenuSeparator />}

          {!inactive && canDelete && onDelete && (
            <DropdownMenuItem
              onClick={() => onDelete(v.id)}
              className="text-amber-600 focus:text-amber-600 focus:bg-amber-50 dark:focus:bg-amber-950/30 rounded-xl cursor-pointer gap-2 text-sm"
            >
              <Trash2 size={13} />
              {t?.("vehiculos.disable", "Inactivar")}
            </DropdownMenuItem>
          )}
          {inactive && canRestore && onRestore && (
            <DropdownMenuItem
              onClick={() => onRestore(v.id)}
              className="text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50 dark:focus:bg-emerald-950/30 rounded-xl cursor-pointer gap-2 text-sm"
            >
              <RotateCcw size={13} />
              {t?.("vehiculos.restore", "Restaurar")}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  /* ── Mobile: cards ── */
  if (isMobile) {
    return (
      <div className="divide-y divide-border/50">
        {sorted.map((v) => {
          const highlighted = highlightId === v.id;
          const inactive    = isInactive(v);
          return (
            <div
              key={v.id}
              ref={highlighted ? focusedRef : null}
              style={getStyle(v.id)}
              className={`p-4 flex items-center gap-3 transition-colors ${
                highlighted ? "" : "hover:bg-muted/20 dark:hover:bg-slate-800/30"
              } ${inactive ? "opacity-60" : ""}`}
            >
              <div className="w-10 h-10 shrink-0 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Car size={18} className="text-gray-400 dark:text-gray-500" />
              </div>

              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-sm text-gray-900 dark:text-gray-100">{v.placa}</p>
                  <EstadoBadge estado={v.estado_efectivo || v.estado} t={t} />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {[v.marca, v.modelo].filter(Boolean).join(" · ")}
                </p>
                {v.nombre_ubicacion && (
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                    {v.nombre_ubicacion}
                  </p>
                )}
              </div>

              {hasActions && <ActionsMenu v={v} />}
            </div>
          );
        })}
      </div>
    );
  }

  /* ── Desktop: table ── */
  const cols = [
    { label: t?.("vehiculos.col_vehicle",  "Vehículo"),  key: "placa" },
    { label: t?.("vehiculos.col_brand",    "Marca"),      key: "marca" },
    { label: t?.("vehiculos.col_model",    "Modelo"),     key: "modelo" },
    { label: t?.("vehiculos.col_status",   "Estado"),     key: "estado" },
    { label: t?.("vehiculos.col_location", "Ubicación"),  key: "nombre_ubicacion" },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/60 bg-muted/20 dark:bg-slate-800/30">
            {cols.map((c) => (
              <SortTh
                key={c.key}
                label={c.label}
                field={c.key}
                sortField={sortField}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
            ))}
            {hasActions && (
              <th className="px-5 py-3.5 text-right">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  {t?.("vehiculos.col_actions", "")}
                </span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {sorted.map((v) => {
            const highlighted = highlightId === v.id;
            const inactive    = isInactive(v);
            return (
              <tr
                key={v.id}
                ref={highlighted ? focusedRef : null}
                style={getStyle(v.id)}
                className={`border-b border-border/30 last:border-0 transition-colors ${
                  highlighted ? "" : "hover:bg-muted/20 dark:hover:bg-slate-800/20"
                } ${inactive ? "opacity-60" : ""}`}
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 shrink-0 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Car size={14} className="text-gray-400 dark:text-gray-500" />
                    </div>
                    <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{v.placa}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-400">{v.marca || "—"}</td>
                <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-400">{v.modelo || "—"}</td>
                <td className="px-5 py-3.5">
                  <EstadoBadge estado={v.estado_efectivo || v.estado} t={t} />
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-400">
                  {v.nombre_ubicacion || <span className="text-gray-300 dark:text-gray-600">—</span>}
                </td>
                {hasActions && (
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end">
                      <ActionsMenu v={v} />
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
