// src/components/Exports/ExportDialog.jsx
import { useEffect, useMemo, useState } from "react";
import {
  FileDown,
  FileSpreadsheet,
  FileText,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  X,
  Loader2,
  Settings,
  Eye,
  Columns,
} from "lucide-react";
import { exportToCSV, exportToXLSX, exportToPDF } from "@/utils/exporters";
import useIsMobile from "@/hooks/useIsMobile";

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatValue(val, type = "text") {
  if (val == null) return "";
  switch (type) {
    case "number":
      return new Intl.NumberFormat("es-HN").format(Number(val) || 0);
    case "currency":
      return new Intl.NumberFormat("es-HN", {
        style: "currency",
        currency: "HNL",
        maximumFractionDigits: 2,
      }).format(Number(val) || 0);
    case "date": {
      const d = new Date(val);
      if (isNaN(d)) return String(val);
      return new Intl.DateTimeFormat("es-HN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(d);
    }
    default:
      return String(val);
  }
}

const DEFAULT_LOGO = "/newLogoTecnasa.png";
const DEFAULT_FOOTER = "#6fe6b1";

// ── Toggle switch nativo ───────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
        checked ? "bg-primary" : "bg-muted-foreground/30"
      }`}>
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// ── Campo de formulario ────────────────────────────────────────────────────────
function Field({ label, children, className = "" }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Input nativo ───────────────────────────────────────────────────────────────
const inputCls =
  "w-full bg-muted/40 dark:bg-slate-800/50 border border-border/60 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/50";

// ── Select nativo ──────────────────────────────────────────────────────────────
const selectCls =
  "w-full bg-muted/40 dark:bg-slate-800/50 border border-border/60 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all cursor-pointer";

// ── Botón de icono pequeño ─────────────────────────────────────────────────────
function IconBtn({ onClick, disabled, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="p-1.5 rounded-lg bg-muted/50 dark:bg-slate-800 border border-border/50 hover:bg-muted dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
      {children}
    </button>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function ExportDialog({
  open,
  onClose,
  rows = [],
  pageRows = [],
  columns = [],
  defaultTitle = "Reporte",
  defaultSheetName = "Hoja1",
  defaultFilenameBase = "export",
  defaultOrientation = "landscape",
  logoUrl = DEFAULT_LOGO,
}) {
  const isMobile = useIsMobile(768);

  // Tab activo en mobile
  const [activeTab, setActiveTab] = useState("options"); // "options" | "preview"

  // Estado del formulario
  const [fileNameBase, setFileNameBase] = useState(defaultFilenameBase);
  const [title, setTitle] = useState(defaultTitle);
  const [orientation, setOrientation] = useState(defaultOrientation);
  const [sheetName, setSheetName] = useState(defaultSheetName);
  const [scope, setScope] = useState("all");
  const [includeGeneratedStamp, setIncludeGeneratedStamp] = useState(true);
  const [logo] = useState(logoUrl);
  const [footerColor, setFooterColor] = useState(DEFAULT_FOOTER);
  const [busy, setBusy] = useState(null);

  const initialCols = useMemo(
    () =>
      columns.map((c, idx) => ({
        id: idx,
        origIdx: idx,                          // índice original para recuperar la definición con get()
        label: c.label ?? c.key ?? `Col ${idx + 1}`,
        key: c.key ?? `col_${idx}`,
        enabled: true,
        type: "text",
        align: "center",
      })),
    [columns]
  );
  const [cols, setCols] = useState(initialCols);

  // Reset al abrir
  useEffect(() => {
    if (open) {
      setFileNameBase(defaultFilenameBase);
      setTitle(defaultTitle);
      setOrientation(defaultOrientation);
      setSheetName(defaultSheetName);
      setScope("all");
      setIncludeGeneratedStamp(true);
      setFooterColor(DEFAULT_FOOTER);
      setCols(initialCols);
      setBusy(null);
      setActiveTab("options");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Datos según alcance
  const dataRows = scope === "page" ? (pageRows?.length ? pageRows : []) : rows;
  const previewRows = useMemo(() => dataRows.slice(0, 5), [dataRows]);
  const selectedCols = cols.filter((c) => c.enabled);

  // Lookup por origIdx: evita la colisión de columnas sin key (get-only)
  const exporterColumns = useMemo(
    () =>
      selectedCols.map((c) => ({
        label: c.label,
        key: c.key,
        get: (r, i) => {
          const base = columns[c.origIdx] ?? {};          // siempre la def original
          const raw = typeof base.get === "function"
            ? base.get(r, i)
            : r[c.key];
          return formatValue(raw, c.type);
        },
      })),
    [selectedCols, columns]
  );

  function move(idx, dir) {
    const j = idx + dir;
    if (j < 0 || j >= cols.length) return;
    const next = cols.slice();
    [next[idx], next[j]] = [next[j], next[idx]];
    setCols(next);
  }

  function fullFileName(ext) {
    const now = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15);
    return `${fileNameBase || "export"}_${now}.${ext}`;
  }

  const runBusy = async (type, fn) => {
    if (busy) return;
    try {
      setBusy(type);
      await fn();
    } catch (e) {
      console.error(`Export ${type} failed`, e);
    } finally {
      setBusy(null);
    }
  };

  const doCSV  = () => exportToCSV({ rows: dataRows, columns: exporterColumns, filename: fullFileName("csv") });
  const doXLSX = () => exportToXLSX({ rows: dataRows, columns: exporterColumns, sheetName, filename: fullFileName("xlsx"), title, orientation, logoUrl: logo, footerBgHex: footerColor, includeGeneratedStamp });
  const doPDF  = () => exportToPDF({ title, rows: dataRows, columns: exporterColumns, filename: fullFileName("pdf"), orientation, logoUrl: logo, footerBgHex: footerColor, includeGeneratedStamp });

  if (!open) return null;

  // ── Panel de opciones ────────────────────────────────────────────────────────
  const OptionsPanel = () => (
    <div className="flex flex-col gap-5 p-5 overflow-y-auto flex-1">

      {/* General */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Settings size={14} className="text-muted-foreground" />
          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">General</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Nombre de archivo">
            <input
              className={inputCls}
              value={fileNameBase}
              onChange={(e) => setFileNameBase(e.target.value)}
              placeholder="nombre_archivo"
            />
          </Field>
          <Field label="Título del reporte">
            <input
              className={inputCls}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título"
            />
          </Field>
          <Field label="Orientación">
            <select
              className={selectCls}
              value={orientation}
              onChange={(e) => setOrientation(e.target.value)}>
              <option value="portrait">Vertical (Portrait)</option>
              <option value="landscape">Horizontal (Landscape)</option>
            </select>
          </Field>
          <Field label="Alcance">
            <select
              className={selectCls}
              value={scope}
              onChange={(e) => setScope(e.target.value)}>
              <option value="all">Todo el filtro ({rows.length} filas)</option>
              <option value="page">Página actual ({pageRows?.length ?? 0} filas)</option>
            </select>
          </Field>
          <Field label="Nombre hoja (Excel)">
            <input
              className={inputCls}
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
              placeholder="Hoja1"
            />
          </Field>
          <Field label="Color pie de página (hex)">
            <div className="flex gap-2 items-center">
              <input
                className={`${inputCls} flex-1`}
                value={footerColor}
                onChange={(e) => setFooterColor(e.target.value)}
                placeholder="#6fe6b1"
              />
              <div
                className="w-9 h-9 rounded-xl border border-border/60 shrink-0 shadow-inner"
                style={{ backgroundColor: footerColor || "#e5e7eb" }}
              />
            </div>
          </Field>
        </div>

        <div className="flex items-center justify-between bg-muted/40 dark:bg-slate-800/50 border border-border/50 rounded-2xl px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Incluir fecha de generación</p>
            <p className="text-xs text-muted-foreground mt-0.5">Agrega un sello de fecha/hora al documento</p>
          </div>
          <Toggle checked={includeGeneratedStamp} onChange={setIncludeGeneratedStamp} />
        </div>
      </div>

      <div className="h-px bg-border/40" />

      {/* Columnas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Columns size={14} className="text-muted-foreground" />
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Columnas</span>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            {selectedCols.length} / {cols.length} activas
          </span>
        </div>

        <div className="bg-card dark:bg-slate-900/60 border border-border/60 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1.5rem_1fr_100px_90px_56px] gap-2 px-3 py-2 bg-muted/30 dark:bg-slate-800/40 border-b border-border/40">
            <div />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Etiqueta</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Tipo</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Alineación</span>
            <div />
          </div>

          {/* Filas */}
          <div className={`overflow-y-auto ${isMobile ? "max-h-56" : "max-h-72"}`}>
            {cols.map((c, idx) => (
              <div
                key={c.id}
                className={`grid grid-cols-[1.5rem_1fr_100px_90px_56px] gap-2 items-center px-3 py-2 border-b border-border/30 last:border-0 transition-colors ${
                  c.enabled ? "" : "opacity-50"
                }`}>
                {/* Toggle */}
                <Toggle
                  checked={c.enabled}
                  onChange={(v) =>
                    setCols((prev) =>
                      prev.map((p, i) => (i === idx ? { ...p, enabled: v } : p))
                    )
                  }
                />

                {/* Etiqueta */}
                <input
                  className="bg-muted/40 dark:bg-slate-800 border border-border/50 rounded-lg px-2 py-1 text-xs outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/15 transition-all w-full"
                  value={c.label}
                  onChange={(e) =>
                    setCols((prev) =>
                      prev.map((p, i) => (i === idx ? { ...p, label: e.target.value } : p))
                    )
                  }
                />

                {/* Tipo */}
                <select
                  className="bg-muted/40 dark:bg-slate-800 border border-border/50 rounded-lg px-2 py-1 text-xs outline-none focus:border-primary/50 transition-all cursor-pointer"
                  value={c.type}
                  onChange={(e) =>
                    setCols((prev) =>
                      prev.map((p, i) => (i === idx ? { ...p, type: e.target.value } : p))
                    )
                  }>
                  <option value="text">Texto</option>
                  <option value="number">Número</option>
                  <option value="currency">Moneda</option>
                  <option value="date">Fecha</option>
                </select>

                {/* Alineación */}
                <select
                  className="bg-muted/40 dark:bg-slate-800 border border-border/50 rounded-lg px-2 py-1 text-xs outline-none focus:border-primary/50 transition-all cursor-pointer"
                  value={c.align}
                  onChange={(e) =>
                    setCols((prev) =>
                      prev.map((p, i) => (i === idx ? { ...p, align: e.target.value } : p))
                    )
                  }>
                  <option value="left">Izquierda</option>
                  <option value="center">Centro</option>
                  <option value="right">Derecha</option>
                </select>

                {/* Subir / Bajar */}
                <div className="flex gap-0.5">
                  <IconBtn onClick={() => move(idx, -1)} disabled={idx === 0} title="Subir">
                    <ChevronUp size={13} />
                  </IconBtn>
                  <IconBtn onClick={() => move(idx, +1)} disabled={idx === cols.length - 1} title="Bajar">
                    <ChevronDown size={13} />
                  </IconBtn>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ── Panel de previsualización ─────────────────────────────────────────────────
  const PreviewPanel = () => (
    <div className="flex flex-col gap-4 p-5 overflow-y-auto flex-1">
      <div className="flex items-center gap-2">
        <Eye size={14} className="text-muted-foreground" />
        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Vista previa (primeras 5 filas)</span>
      </div>

      {/* Cabecera del documento */}
      <div className="bg-white dark:bg-slate-900 border border-border/60 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          {logo ? (
            <img src={logo} alt="logo" className="h-8 w-auto object-contain shrink-0" />
          ) : (
            <div className="w-20" />
          )}
          <p className="text-sm font-bold text-center flex-1 truncate">{title || "—"}</p>
          <div className="w-20 shrink-0" />
        </div>
        {includeGeneratedStamp && (
          <p className="text-[10px] text-center text-muted-foreground pb-2">
            Generado: {new Date().toLocaleString("es-HN")}
          </p>
        )}
      </div>

      {/* Tabla de previsualización */}
      <div className="bg-card dark:bg-slate-900/60 border border-border/60 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 dark:bg-slate-800/40">
                {selectedCols.map((c) => (
                  <th
                    key={c.key}
                    className="px-3 py-2.5 font-black uppercase tracking-wider text-muted-foreground/70 whitespace-nowrap"
                    style={{ textAlign: c.align === "left" ? "left" : c.align === "right" ? "right" : "center" }}>
                    {c.label}
                  </th>
                ))}
                {selectedCols.length === 0 && (
                  <th className="px-3 py-2.5 text-center text-muted-foreground/50">Sin columnas activas</th>
                )}
              </tr>
            </thead>
            <tbody>
              {previewRows.length > 0 ? (
                previewRows.map((r, i) => (
                  <tr key={i} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                    {selectedCols.map((c) => {
                      const base = columns[c.origIdx] ?? {};
                      const raw = typeof base.get === "function" ? base.get(r, i) : r[c.key];
                      return (
                        <td
                          key={c.key}
                          className="px-3 py-2 text-foreground whitespace-nowrap"
                          style={{ textAlign: c.align === "left" ? "left" : c.align === "right" ? "right" : "center" }}>
                          {formatValue(raw, c.type)}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={selectedCols.length || 1}
                    className="px-3 py-8 text-center text-xs text-muted-foreground">
                    Sin datos para previsualizar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Franja de color de pie */}
        <div
          className="h-1.5 w-full rounded-b-2xl"
          style={{ backgroundColor: footerColor || "#e5e7eb" }}
        />
      </div>

      {dataRows.length > 5 && (
        <p className="text-[11px] text-center text-muted-foreground">
          … y {dataRows.length - 5} fila{dataRows.length - 5 !== 1 ? "s" : ""} más en el archivo final
        </p>
      )}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={busy ? undefined : onClose}
      />

      {/* Panel lateral */}
      <div className="fixed right-0 top-0 z-50 h-full w-full md:w-[1100px] max-w-full flex flex-col bg-card dark:bg-slate-900 border-l border-border/60 shadow-2xl animate-in slide-in-from-right duration-300">

        {/* Header fijo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-card dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <FileDown size={16} className="text-primary" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">Exportar reporte</h2>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                {dataRows.length} fila{dataRows.length !== 1 ? "s" : ""} · {selectedCols.length} columna{selectedCols.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={busy ? undefined : onClose}
            disabled={!!busy}
            className="p-2 rounded-xl hover:bg-muted/60 dark:hover:bg-slate-800 transition-colors text-muted-foreground hover:text-foreground disabled:opacity-40">
            <X size={18} />
          </button>
        </div>

        {/* Tabs en mobile */}
        {isMobile && (
          <div className="flex border-b border-border/40 shrink-0 bg-card dark:bg-slate-900">
            {[
              { id: "options",  icon: Settings,  label: "Opciones" },
              { id: "preview",  icon: Eye,        label: "Vista previa" },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold border-b-2 transition-colors ${
                  activeTab === id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}>
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Cuerpo: opciones + preview */}
        <div className="flex flex-1 overflow-hidden">
          {/* Panel opciones */}
          {(!isMobile || activeTab === "options") && (
            <div className={`flex flex-col overflow-hidden ${isMobile ? "flex-1" : "w-[440px] border-r border-border/40"}`}>
              <OptionsPanel />
            </div>
          )}

          {/* Panel previsualización */}
          {(!isMobile || activeTab === "preview") && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <PreviewPanel />
            </div>
          )}
        </div>

        {/* Footer fijo — botones de exportación */}
        <div className="shrink-0 px-5 py-4 border-t border-border/40 bg-muted/10 dark:bg-slate-800/20">
          <div className={`flex gap-2.5 ${isMobile ? "flex-col" : "flex-row justify-end"}`}>
            {/* CSV */}
            <button
              type="button"
              onClick={() => runBusy("csv", doCSV)}
              disabled={!!busy || dataRows.length === 0}
              className="inline-flex items-center justify-center gap-2 px-5 h-10 rounded-2xl text-sm font-bold border border-border/60 bg-card dark:bg-slate-800 hover:bg-muted/60 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm">
              {busy === "csv" ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />}
              {busy === "csv" ? "Exportando..." : "CSV"}
            </button>

            {/* Excel */}
            <button
              type="button"
              onClick={() => runBusy("xlsx", doXLSX)}
              disabled={!!busy || dataRows.length === 0}
              className="inline-flex items-center justify-center gap-2 px-5 h-10 rounded-2xl text-sm font-bold border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm">
              {busy === "xlsx" ? <Loader2 size={15} className="animate-spin" /> : <FileSpreadsheet size={15} />}
              {busy === "xlsx" ? "Exportando..." : "Excel (.xlsx)"}
            </button>

            {/* PDF */}
            <button
              type="button"
              onClick={() => runBusy("pdf", doPDF)}
              disabled={!!busy || dataRows.length === 0}
              className="inline-flex items-center justify-center gap-2 px-5 h-10 rounded-2xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-primary/20">
              {busy === "pdf" ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
              {busy === "pdf" ? "Exportando..." : "PDF"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
