// src/pages/Inventario/ImportarActivosDrawer.jsx
import { useState, useMemo, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  Upload,
  X,
  ClipboardList,
  FileSpreadsheet,
  PackagePlus,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { createActivoEnBodega } from "../../services/ActivosBodegaServices";

/* ─── small helpers ──────────────────────────────────────────────── */
function TabBtn({ active, icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
        active
          ? "bg-violet-500/15 text-violet-600 dark:text-violet-400"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
      }`}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

function MappingSelect({ label, required, value, onChange, headers }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
        {required && (
          <span className="ml-0.5 text-rose-500">*</span>
        )}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-border/60 bg-background px-3 py-2 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/60 transition-all"
        >
          <option value="">— Ninguna —</option>
          {headers.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
      </div>
    </div>
  );
}

/* ─── main component ─────────────────────────────────────────────── */
export default function ImportarActivosDrawer({
  open,
  onClose,
  idBodega,
  onSaved,
}) {
  const { userData } = useAuth();
  const { showToast } = useToast();

  const [tab, setTab] = useState(0);
  const [saving, setSaving] = useState(false);

  /* close on Escape */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  /* lock body scroll while open */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  /* ── PEGAR ─────────────────────────────────────────────────────── */
  const [raw, setRaw] = useState("");
  const pastedRows = useMemo(
    () =>
      raw
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => l.split("\t")),
    [raw]
  );

  const handleImportPasted = async () => {
    if (!pastedRows.length) {
      showToast("Pegá primero las filas 😅", "warning");
      return;
    }
    setSaving(true);
    let created = 0;
    try {
      for (const cols of pastedRows) {
        const [nombre, modelo, serial, tipo, estatus] = cols;
        if (!nombre) continue;
        await createActivoEnBodega({
          nombre: nombre.trim(),
          modelo: modelo || null,
          serial_number: serial || null,
          tipo: tipo || "Otro",
          estatus: estatus || "Activo",
          id_bodega: idBodega,
          usuario_responsable: userData?.id_usuario ?? userData?.id ?? null,
        });
        created++;
      }
      showToast(`Se importaron ${created} activos`, "success");
      onSaved?.();
      onClose?.();
      setRaw("");
    } catch (err) {
      showToast(err?.message || "Error al importar", "danger");
    } finally {
      setSaving(false);
    }
  };

  /* ── EXCEL ─────────────────────────────────────────────────────── */
  const [fileRows, setFileRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [fileName, setFileName] = useState("");
  const [mapping, setMapping] = useState({
    nombre: "",
    modelo: "",
    serial: "",
    tipo: "",
    estatus: "",
  });

  const fileInputRef = useRef(null);
  const [isOver, setIsOver] = useState(false);

  const parseExcelFile = async (file) => {
    setFileName(file.name);
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    if (!json.length) {
      showToast("El archivo está vacío", "warning");
      return;
    }
    const hdrs = Object.keys(json[0]);
    setHeaders(hdrs);
    setFileRows(json);

    const autoMap = (target) => {
      const lower = target.toLowerCase();
      const exact = hdrs.find((h) => h.toLowerCase() === lower);
      if (exact) return exact;
      const contains = hdrs.find((h) => h.toLowerCase().includes(lower));
      return contains || "";
    };

    setMapping({
      nombre: autoMap("nombre"),
      modelo: autoMap("modelo"),
      serial: autoMap("serie"),
      tipo: autoMap("tipo"),
      estatus: autoMap("estatus"),
    });
  };

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await parseExcelFile(file);
    } catch (err) {
      console.error(err);
      showToast("No se pudo leer el archivo 😢", "danger");
    } finally {
      e.target.value = "";
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    try {
      await parseExcelFile(file);
    } catch (err) {
      console.error(err);
      showToast("No se pudo leer el archivo 😢", "danger");
    }
  };

  const handleImportFile = async () => {
    if (!fileRows.length) {
      showToast("Subí primero un Excel 😅", "warning");
      return;
    }
    if (!mapping.nombre) {
      showToast("Mapeá al menos la columna de Nombre", "warning");
      return;
    }

    setSaving(true);
    let created = 0;
    try {
      for (const r of fileRows) {
        const nombre = (r[mapping.nombre] || "").trim();
        if (!nombre) continue;
        await createActivoEnBodega({
          nombre,
          modelo: r[mapping.modelo] || null,
          serial_number: r[mapping.serial] || null,
          tipo: r[mapping.tipo] || "Otro",
          estatus: r[mapping.estatus] || "Activo",
          id_bodega: idBodega,
          usuario_responsable: userData?.id_usuario ?? userData?.id ?? null,
        });
        created++;
      }
      showToast(`Se importaron ${created} activos`, "success");
      onSaved?.();
      onClose?.();
      setFileRows([]);
      setHeaders([]);
      setFileName("");
    } catch (err) {
      showToast(err?.message || "Error al importar Excel", "danger");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-full md:w-[520px] flex flex-col bg-card dark:bg-slate-900 border-l border-border/60 shadow-2xl animate-in slide-in-from-right duration-300">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
              <PackagePlus size={18} className="text-violet-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground leading-tight">
                Importar activos
              </h2>
              <p className="text-xs text-muted-foreground">
                Carga masiva desde portapapeles o Excel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────── */}
        <div className="px-5 pt-4 pb-0 shrink-0">
          <div className="flex items-center gap-1 bg-muted/40 rounded-2xl p-1 w-fit">
            <TabBtn
              active={tab === 0}
              icon={ClipboardList}
              label="Pegar"
              onClick={() => setTab(0)}
            />
            <TabBtn
              active={tab === 1}
              icon={FileSpreadsheet}
              label="Excel"
              onClick={() => setTab(1)}
            />
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* ===== TAB 0: PEGAR ===================================== */}
          {tab === 0 && (
            <>
              {/* Format hint */}
              <div className="flex items-start gap-2 bg-violet-500/8 border border-violet-500/20 rounded-2xl px-4 py-3">
                <AlertCircle size={15} className="text-violet-500 mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Orden esperado:{" "}
                  <span className="font-semibold text-foreground">
                    Nombre | Modelo | Serie | Tipo | Estatus
                  </span>
                  <br />
                  Separa columnas con <kbd className="mx-0.5 px-1 py-0.5 rounded bg-muted text-[10px] font-mono">Tab</kbd> y filas con salto de línea.
                </p>
              </div>

              {/* Textarea */}
              <textarea
                rows={6}
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                disabled={saving}
                placeholder={"Impresora HP\tLaserJet 2030\tSN-123\tImpresora\tActivo"}
                className="w-full resize-none rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/60 transition-all font-mono disabled:opacity-50"
              />

              {/* Preview table */}
              {pastedRows.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Vista previa
                    </p>
                    <span className="text-xs bg-violet-500/10 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full font-medium">
                      {pastedRows.length} filas
                    </span>
                  </div>
                  <div className="rounded-2xl border border-border/60 overflow-hidden">
                    <div className="overflow-x-auto max-h-52 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/60 sticky top-0">
                          <tr>
                            {["Nombre", "Modelo", "Serie", "Tipo", "Estatus"].map(
                              (h) => (
                                <th
                                  key={h}
                                  className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap"
                                >
                                  {h}
                                </th>
                              )
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {pastedRows.map((r, i) => (
                            <tr
                              key={i}
                              className="hover:bg-muted/30 transition-colors"
                            >
                              <td className="px-3 py-1.5 text-foreground font-medium">
                                {r[0] || "—"}
                              </td>
                              <td className="px-3 py-1.5 text-muted-foreground">
                                {r[1] || "—"}
                              </td>
                              <td className="px-3 py-1.5 text-muted-foreground">
                                {r[2] || "—"}
                              </td>
                              <td className="px-3 py-1.5">
                                <span className="bg-muted px-1.5 py-0.5 rounded-lg text-muted-foreground">
                                  {r[3] || "Otro"}
                                </span>
                              </td>
                              <td className="px-3 py-1.5">
                                <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded-lg">
                                  {r[4] || "Activo"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ===== TAB 1: EXCEL ===================================== */}
          {tab === 1 && (
            <>
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={onFileChange}
                className="hidden"
              />

              {/* Drop zone */}
              <div
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsOver(true); }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsOver(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsOver(false); }}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed px-6 py-8 text-center cursor-pointer transition-all duration-200 ${
                  isOver
                    ? "border-violet-500 bg-violet-500/8 scale-[1.01]"
                    : "border-border/60 bg-muted/20 hover:border-violet-400/60 hover:bg-violet-500/5"
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  isOver ? "bg-violet-500/20" : "bg-muted"
                }`}>
                  <Upload
                    size={22}
                    className={`transition-colors ${
                      isOver ? "text-violet-500" : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {fileName
                      ? fileName
                      : isOver
                      ? "Soltá el archivo aquí"
                      : "Seleccionar o arrastrar archivo"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    .xlsx, .xls o .csv — Lee la primera hoja automáticamente
                  </p>
                </div>
                {fileName && (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 size={13} />
                    Archivo cargado
                  </span>
                )}
              </div>

              {/* Column mapping */}
              {headers.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-3">
                    Mapea las columnas del archivo
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ["nombre", "Nombre", true],
                      ["modelo", "Modelo", false],
                      ["serial", "Serie", false],
                      ["tipo", "Tipo", false],
                      ["estatus", "Estatus", false],
                    ].map(([key, label, required]) => (
                      <MappingSelect
                        key={key}
                        label={label}
                        required={required}
                        value={mapping[key] ?? ""}
                        onChange={(v) =>
                          setMapping((m) => ({ ...m, [key]: v }))
                        }
                        headers={headers}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Preview table */}
              {fileRows.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Vista previa
                    </p>
                    <span className="text-xs bg-violet-500/10 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full font-medium">
                      {fileRows.length} filas
                    </span>
                  </div>
                  <div className="rounded-2xl border border-border/60 overflow-hidden">
                    <div className="overflow-x-auto max-h-52 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/60 sticky top-0">
                          <tr>
                            {["Nombre", "Modelo", "Serie", "Tipo", "Estatus"].map(
                              (h) => (
                                <th
                                  key={h}
                                  className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap"
                                >
                                  {h}
                                </th>
                              )
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {fileRows.map((r, i) => (
                            <tr
                              key={i}
                              className="hover:bg-muted/30 transition-colors"
                            >
                              <td className="px-3 py-1.5 text-foreground font-medium">
                                {mapping.nombre ? r[mapping.nombre] : "—"}
                              </td>
                              <td className="px-3 py-1.5 text-muted-foreground">
                                {mapping.modelo ? r[mapping.modelo] : "—"}
                              </td>
                              <td className="px-3 py-1.5 text-muted-foreground">
                                {mapping.serial ? r[mapping.serial] : "—"}
                              </td>
                              <td className="px-3 py-1.5">
                                <span className="bg-muted px-1.5 py-0.5 rounded-lg text-muted-foreground">
                                  {mapping.tipo ? r[mapping.tipo] : "Otro"}
                                </span>
                              </td>
                              <td className="px-3 py-1.5">
                                <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded-lg">
                                  {mapping.estatus
                                    ? r[mapping.estatus]
                                    : "Activo"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div className="shrink-0 px-5 py-4 border-t border-border/60 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all disabled:opacity-40"
          >
            Cancelar
          </button>

          <button
            onClick={tab === 0 ? handleImportPasted : handleImportFile}
            disabled={saving || (tab === 0 ? !pastedRows.length : !fileRows.length)}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-violet-500 hover:bg-violet-600 text-white shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Importando…
              </>
            ) : (
              <>
                <PackagePlus size={15} />
                {tab === 0 ? "Importar pegado" : "Importar Excel"}
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
