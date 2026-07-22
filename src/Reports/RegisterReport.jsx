// src/Reports/RegisterReport.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft, Search, X, Download, Calendar, Filter, Loader2, BarChart3, AlertCircle,
} from "lucide-react";

import PaginationLite from "@/components/common/PaginationLite";
import ReportCard from "@/components/ComponentsReport/RegisterReport/ReportCard.jsx";
import ReportDetailModal from "@/components/ComponentsReport/RegisterReport/ReportDetailModal.jsx";
import ExportDialog from "@/components/Exports/ExportDialog";
import { getRegisterReport } from "@/services/ReportServices";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const debounced = (fn, ms = 250) => { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); }; };
const fmtDateInput = (d) => { if (!d) return ""; const pad = (n) => String(n).padStart(2, "0"); const dt = d instanceof Date ? d : new Date(d); return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`; };
const todayStr = () => fmtDateInput(new Date());
const addDays = (date, days) => { const d = new Date(date); d.setDate(d.getDate() + days); return d; };

const RANGE_KEYS = ["all", "today", "7d", "month", "custom"];
const STATUS_KEYS = ["todos", "activos", "finalizados"];

export default function RegisterReport() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { search } = useLocation();
  const qs = useMemo(() => new URLSearchParams(search), [search]);

  const [query, setQuery] = useState(qs.get("q") || "");
  const [range, setRange] = useState(qs.get("range") || "all");
  const [from, setFrom] = useState(qs.get("from") || "");
  const [to, setTo] = useState(qs.get("to") || "");
  const [status, setStatus] = useState(qs.get("status") || "todos");
  const [page, setPage] = useState(Number(qs.get("p") || 1));
  const rowsPerPage = 9;

  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [selectedRegistro, setSelectedRegistro] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(search);
    query ? params.set("q", query) : params.delete("q");
    page > 1 ? params.set("p", String(page)) : params.delete("p");
    range !== "all" ? params.set("range", range) : params.delete("range");
    from ? params.set("from", from) : params.delete("from");
    to ? params.set("to", to) : params.delete("to");
    status !== "todos" ? params.set("status", status) : params.delete("status");
    const s = params.toString();
    window.history.replaceState(null, "", s ? `?${s}` : "");
  }, [query, page, range, from, to, status, search]);

  useEffect(() => {
    if (range === "custom") return;
    if (range === "all") { setFrom(""); setTo(""); }
    else if (range === "today") { const d = todayStr(); setFrom(d); setTo(d); }
    else if (range === "7d") { const now = new Date(); setFrom(fmtDateInput(addDays(now, -6))); setTo(todayStr()); }
    else if (range === "month") { const now = new Date(); setFrom(fmtDateInput(new Date(now.getFullYear(), now.getMonth(), 1))); setTo(todayStr()); }
    setPage(1);
  }, [range]);

  useEffect(() => {
    (async () => {
      setLoading(true); setErr(null);
      try {
        const data = await getRegisterReport({ from: from || undefined, to: to || undefined, status: status !== "todos" ? status : undefined });
        setRaw(Array.isArray(data) ? data : []);
      } catch (e) { console.error(e); setErr("reports.registerReport.error_detail"); }
      finally { setLoading(false); }
    })();
  }, [from, to, status]);

  const onChangeQuery = useRef(debounced((v) => { setPage(1); setQuery(v); }, 250)).current;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const fromTs = from ? new Date(from + "T00:00:00").getTime() : null;
    const toTs = to ? new Date(to + "T23:59:59").getTime() : null;

    return (raw || []).filter((r) => {
      const textOk = !q || [r.empleado?.nombre, r.vehiculo?.marca, r.vehiculo?.modelo, r.vehiculo?.placa]
        .map((v) => String(v ?? "").toLowerCase()).some((s) => s.includes(q));
      if (!textOk) return false;
      if (status === "activos" && r.fecha_regreso) return false;
      if (status === "finalizados" && !r.fecha_regreso) return false;
      if (!fromTs && !toTs) return true;
      const salidaTs = r.fecha_salida ? new Date(r.fecha_salida).getTime() : 0;
      if (fromTs && salidaTs < fromTs) return false;
      if (toTs && salidaTs > toTs) return false;
      return true;
    });
  }, [raw, query, status, from, to]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const pageSafe = Math.min(Math.max(page, 1), totalPages);
  const pageItems = useMemo(() => filtered.slice((pageSafe - 1) * rowsPerPage, pageSafe * rowsPerPage), [filtered, pageSafe]);

  const clearFilters = () => { setQuery(""); setRange("all"); setFrom(""); setTo(""); setStatus("todos"); setPage(1); };
  const hasFilters = query || range !== "all" || status !== "todos";

  const columnsExport = [
    { label: "Empleado",       get: (r) => r.empleado?.nombre || "" },
    { label: "Vehículo",       get: (r) => `${r.vehiculo?.marca || ""} ${r.vehiculo?.modelo || ""}` },
    { label: "Placa",          get: (r) => r.vehiculo?.placa || "" },
    { label: "Fecha Salida",   get: (r) => new Date(r.fecha_salida).toLocaleString() },
    { label: "Fecha Regreso",  get: (r) => r.fecha_regreso ? new Date(r.fecha_regreso).toLocaleString() : "—" },
    { label: "Km Salida",      key: "km_salida" },
    { label: "Km Regreso",     key: "km_regreso" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6 animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button onClick={() => navigate("/admin/reports")} className="p-2 rounded-2xl hover:bg-muted/60 dark:hover:bg-slate-800 transition-colors text-muted-foreground hover:text-foreground shrink-0"><ArrowLeft size={18} /></button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 dark:bg-blue-500/15 ring-1 ring-blue-500/20 dark:ring-blue-500/30 shadow-sm shadow-blue-500/10 shrink-0"><BarChart3 size={20} className="text-blue-600 dark:text-blue-400" /></div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight leading-none">{t("reports.registerReport.title")}</h1>
              <p className="text-muted-foreground text-xs font-medium mt-0.5">
                {loading ? t("reports.registerReport.loading") : t("reports.registerReport.count", { count: filtered.length })}
              </p>
            </div>
          </div>
        </div>
        <Button
          onClick={() => setExportOpen(true)}
          disabled={filtered.length === 0 || loading}
          className="rounded-2xl px-5 h-10 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200 gap-2 shrink-0 disabled:opacity-50">
          <Download size={15} /><span className="hidden sm:inline">{t("reports.common.export")}</span>
        </Button>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl p-4 space-y-3 shadow-sm">
        <div className="relative group">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors pointer-events-none" />
          <input
            type="text"
            placeholder={t("reports.registerReport.search_placeholder")}
            defaultValue={query}
            onChange={(e) => onChangeQuery(e.target.value)}
            className="w-full bg-muted/40 dark:bg-slate-800/50 border border-border/50 rounded-2xl pl-9 pr-10 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 focus:bg-card transition-all placeholder:text-muted-foreground/50"
          />
          {query && (
            <button onClick={() => { setQuery(""); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"><X size={14} /></button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground shrink-0"><Calendar size={13} />{t("reports.common.period")}</div>
            <div className="flex gap-1.5 flex-wrap">
              {RANGE_KEYS.map((r) => (
                <button key={r} onClick={() => setRange(r)} className={`px-3 py-1 rounded-full text-xs font-bold border transition-all duration-150 ${range === r ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-muted/50 dark:bg-slate-800 border-border/50 text-muted-foreground hover:bg-muted dark:hover:bg-slate-700 hover:text-foreground"}`}>
                  {t(`reports.ranges.${r}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden sm:block w-px bg-border/50 self-stretch" />

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground shrink-0"><Filter size={13} />{t("reports.registerReport.status_label")}</div>
            <div className="flex gap-1.5">
              {STATUS_KEYS.map((s) => (
                <button key={s} onClick={() => { setStatus(s); setPage(1); }} className={`px-3 py-1 rounded-full text-xs font-bold border transition-all duration-150 ${status === s ? "bg-foreground text-background border-foreground shadow-sm" : "bg-muted/50 dark:bg-slate-800 border-border/50 text-muted-foreground hover:bg-muted dark:hover:bg-slate-700 hover:text-foreground"}`}>
                  {t(`reports.status.${s}`)}
                </button>
              ))}
            </div>
          </div>

          {hasFilters && (
            <button onClick={clearFilters} className="ml-auto text-[11px] font-semibold text-muted-foreground hover:text-rose-500 transition-colors flex items-center gap-1"><X size={11} />{t("reports.common.clear_filters")}</button>
          )}
        </div>

        {range === "custom" && (
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-xs text-muted-foreground font-medium">{t("reports.common.from")}</span>
            <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="bg-muted/40 dark:bg-slate-800/50 border border-border/50 rounded-xl px-3 py-1.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all" />
            <span className="text-xs text-muted-foreground font-medium">{t("reports.common.to")}</span>
            <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className="bg-muted/40 dark:bg-slate-800/50 border border-border/50 rounded-xl px-3 py-1.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all" />
          </div>
        )}
      </div>

      {/* CONTENIDO */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-blue-500/15 flex items-center justify-center"><Loader2 size={22} className="animate-spin text-blue-500" /></div>
          <p className="text-sm text-muted-foreground font-medium">{t("reports.registerReport.loading")}</p>
        </div>
      ) : err ? (
        <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/30 rounded-3xl p-6 flex items-start gap-3">
          <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-rose-700 dark:text-rose-400">{t("reports.common.error_title")}</p>
            <p className="text-xs text-rose-600 dark:text-rose-500 mt-0.5">{t(err)}</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl flex flex-col items-center justify-center gap-4 py-20">
          <div className="w-16 h-16 rounded-3xl bg-muted/50 dark:bg-slate-800/50 flex items-center justify-center"><BarChart3 size={28} className="text-muted-foreground/40" /></div>
          <div className="text-center">
            <p className="font-bold text-sm">{t("reports.registerReport.empty_title")}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("reports.registerReport.empty_text")}</p>
          </div>
          {hasFilters && (
            <Button variant="outline" size="sm" className="rounded-2xl" onClick={clearFilters}>{t("reports.common.clear_filters")}</Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pageItems.map((registro) => (
              <ReportCard key={registro.id} registro={registro} onClick={() => { setSelectedRegistro(registro); setModalOpen(true); }} />
            ))}
          </div>
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground font-medium">{t("reports.common.page_of", { page: pageSafe, total: totalPages })}</p>
            <PaginationLite page={pageSafe} count={totalPages} onChange={setPage} />
          </div>
        </>
      )}

      <ReportDetailModal open={modalOpen} onClose={() => setModalOpen(false)} registro={selectedRegistro} />
      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} rows={filtered} columns={columnsExport} defaultTitle={t("reports.registerReport.export_title")} defaultFilename={`registros_${todayStr()}`} />
    </div>
  );
}
