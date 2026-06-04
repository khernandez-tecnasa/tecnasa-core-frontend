// src/pages/HelpPage/HelpChangelogList.jsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate, Link as RouterLink } from "react-router-dom";
import { Megaphone, Pin, AlertTriangle, X, ArrowRight, Clock, ArrowLeft } from "lucide-react";
import { listChangelogs } from "@/services/help.api";
import PaginationLite from "@/components/common/PaginationLite.jsx";

/* Colores por tipo */
const TYPE_CLASSES = {
  Added:       "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  Changed:     "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Fixed:       "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Removed:     "bg-neutral-100 text-neutral-600 dark:bg-neutral-800/50 dark:text-neutral-400",
  Deprecated:  "bg-neutral-100 text-neutral-600 dark:bg-neutral-800/50 dark:text-neutral-400",
  Security:    "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  Performance: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

const DOT_CLASSES = {
  Added:       "bg-emerald-500",
  Changed:     "bg-amber-500",
  Fixed:       "bg-blue-500",
  Removed:     "bg-neutral-400",
  Deprecated:  "bg-neutral-400",
  Security:    "bg-rose-500",
  Performance: "bg-emerald-500",
};

function TypeBadge({ type }) {
  const cls = TYPE_CLASSES[type] || "bg-muted/60 text-muted-foreground";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${cls}`}>
      {type}
    </span>
  );
}

function fmtDate(d) {
  try {
    return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch { return String(d || ""); }
}

const TYPES = ["Added", "Changed", "Fixed", "Removed", "Deprecated", "Security", "Performance"];
const AUDIENCES = [
  { value: "all",       label: "Todos" },
  { value: "admins",    label: "Admins" },
  { value: "customers", label: "Clientes" },
  { value: "internal",  label: "Interno" },
];

export default function HelpChangelogList() {
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();

  const page       = Math.max(1, Number(sp.get("page") || 1));
  const limit      = Math.min(30, Math.max(6, Number(sp.get("limit") || 12)));
  const type       = sp.get("type") || "";
  const audience   = sp.get("audience") || "";
  const pinnedOnly = sp.get("pinned") === "1";

  const [loading, setLoading] = useState(true);
  const [items, setItems]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [error, setError]     = useState(null);

  const totalPages = Math.max(1, Math.ceil((total || 0) / limit));
  const filtersActive = useMemo(() => Boolean(type || audience || pinnedOnly), [type, audience, pinnedOnly]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await listChangelogs({
          page, limit,
          type: type || undefined,
          audience: audience || undefined,
          pinned: pinnedOnly ? 1 : undefined,
          _ts: Date.now(),
        });
        setItems(res?.items || []);
        setTotal(res?.total || 0);
      } catch (e) {
        setError(e?.message || "No se pudieron cargar las novedades.");
      } finally {
        setLoading(false);
      }
    })();
  }, [page, limit, type, audience, pinnedOnly]);

  const setParam = (k, v) => {
    const next = new URLSearchParams(sp);
    if (v === "" || v == null) next.delete(k); else next.set(k, String(v));
    if (k !== "page") next.delete("page");
    setSp(next, { replace: true });
  };

  const clearFilters = () => {
    const next = new URLSearchParams();
    next.set("page", "1");
    setSp(next, { replace: true });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6 animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="space-y-3">
        <RouterLink
          to="/admin/help"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={15} /> Centro de ayuda
        </RouterLink>
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-primary/10 dark:bg-primary/15 ring-1 ring-primary/20 shrink-0">
            <Megaphone size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">
              Novedades y anuncios
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm font-medium mt-0.5">
              Cambios, mejoras y actualizaciones del sistema
            </p>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Tipo */}
        <select
          value={type}
          onChange={(e) => setParam("type", e.target.value)}
          className="h-9 px-3 rounded-xl border border-border/60 bg-card text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all cursor-pointer">
          <option value="">Todos los tipos</option>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        {/* Audiencia */}
        <select
          value={audience}
          onChange={(e) => setParam("audience", e.target.value)}
          className="h-9 px-3 rounded-xl border border-border/60 bg-card text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all cursor-pointer">
          <option value="">Toda la audiencia</option>
          {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>

        {/* Fijados */}
        <button
          onClick={() => setParam("pinned", pinnedOnly ? "" : "1")}
          className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border text-sm font-bold transition-all ${
            pinnedOnly
              ? "bg-primary/10 border-primary/30 text-primary"
              : "bg-card border-border/60 text-muted-foreground hover:border-primary/30"
          }`}>
          <Pin size={13} /> {pinnedOnly ? "Solo fijados" : "Fijados"}
        </button>

        {filtersActive && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
            <X size={13} /> Limpiar filtros
          </button>
        )}

        {!loading && (
          <span className="text-xs text-muted-foreground/70 font-medium ml-auto">
            <span className="font-bold text-foreground">{total}</span> novedad{total !== 1 ? "es" : ""}
          </span>
        )}
      </div>

      {/* CONTENIDO */}
      {loading ? (
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm overflow-hidden divide-y divide-border/40">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-6 py-5 animate-pulse">
              <div className="w-2.5 h-2.5 rounded-full bg-muted/60 dark:bg-slate-700 mt-1.5 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted/60 dark:bg-slate-700/60 rounded-lg w-3/5" />
                <div className="h-3 bg-muted/40 dark:bg-slate-700/40 rounded-lg w-2/5" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200/60 rounded-2xl">
          <AlertTriangle size={18} className="text-rose-500 shrink-0" />
          <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl flex flex-col items-center justify-center gap-3 py-20">
          <div className="w-14 h-14 rounded-3xl bg-muted/50 dark:bg-slate-800/50 flex items-center justify-center">
            <Megaphone size={26} className="text-muted-foreground/30" />
          </div>
          <p className="font-bold text-sm">No hay novedades</p>
          <p className="text-xs text-muted-foreground">
            {filtersActive ? "Prueba ajustando los filtros" : "Vuelve pronto para ver las últimas actualizaciones"}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm overflow-hidden">
            <div className="divide-y divide-border/40">
              {items.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/admin/help/changelog/${encodeURIComponent(c.slug || c.id)}`)}
                  className="w-full flex items-start gap-4 px-6 py-5 text-left hover:bg-muted/20 dark:hover:bg-slate-800/20 transition-colors group">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${DOT_CLASSES[c.type] || "bg-muted-foreground/40"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm group-hover:text-primary transition-colors">
                        {c.title}
                      </p>
                      {c.pinned && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <Pin size={9} /> Fijado
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {c.type && <TypeBadge type={c.type} />}
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock size={10} />
                        {c.date ? fmtDate(c.date) : ""}
                        {c.audience ? ` · ${c.audience}` : ""}
                      </span>
                    </div>
                    {c.description && (
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{c.description}</p>
                    )}
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground/40 shrink-0 mt-1 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col items-center gap-2">
              <PaginationLite
                page={page}
                count={totalPages}
                onChange={(p) => setParam("page", String(p))}
                siblingCount={1}
                boundaryCount={1}
                showFirstLast={false}
              />
              <p className="text-xs text-muted-foreground/60">Página {page} de {totalPages}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
