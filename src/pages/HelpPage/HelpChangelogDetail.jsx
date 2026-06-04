// src/pages/HelpPage/HelpChangelogDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import {
  ArrowLeft, Pin, Copy, Check, Clock,
  Headphones, HelpCircle, ChevronRight, AlertTriangle,
} from "lucide-react";
import { getChangelogBySlug, listChangelogs } from "@/services/help.api";

const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL    || "micros.teh@tecnasadesk.com";
const WHATSAPP_URL  = import.meta.env.VITE_SUPPORT_WHATSAPP || "https://wa.me/50495989756";

const TYPE_BADGE = {
  Added:       "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  Changed:     "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Fixed:       "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Removed:     "bg-neutral-100 text-neutral-600 dark:bg-neutral-800/50 dark:text-neutral-400",
  Deprecated:  "bg-neutral-100 text-neutral-600 dark:bg-neutral-800/50 dark:text-neutral-400",
  Security:    "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  Performance: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

function fmtDate(d) {
  try {
    return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch { return ""; }
}

export default function HelpChangelogDetail() {
  const { slug } = useParams();

  const [loading,    setLoading]    = useState(true);
  const [item,       setItem]       = useState(null);
  const [error,      setError]      = useState(null);
  const [related,    setRelated]    = useState([]);
  const [loadingRel, setLoadingRel] = useState(false);
  const [copied,     setCopied]     = useState(false);

  /* Cargar novedad */
  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      try {
        const c = await getChangelogBySlug(slug);
        setItem(c || null);
      } catch (e) { setError(e?.message || "No se pudo cargar la novedad."); }
      finally { setLoading(false); }
    })();
  }, [slug]);

  /* Relacionadas */
  useEffect(() => {
    (async () => {
      if (!item) return;
      setLoadingRel(true);
      try {
        const params = item?.type ? { type: item.type, limit: 8 } : { limit: 8 };
        const res    = await listChangelogs({ ...params, _ts: Date.now() });
        let items    = (res?.items || []).filter(
          (x) => (x.slug || String(x.id)) !== (item.slug || String(item.id))
        );
        if (!items.length) {
          const res2 = await listChangelogs({ limit: 8, _ts: Date.now() });
          items = (res2?.items || []).filter(
            (x) => (x.slug || String(x.id)) !== (item.slug || String(item.id))
          );
        }
        setRelated(items.slice(0, 6));
      } catch { setRelated([]); }
      finally { setLoadingRel(false); }
    })();
  }, [item?.type, item?.slug, item?.id, item]);

  const isPinned = useMemo(
    () => item && (item.pinned === true || item.pinned === 1 || item.pinned === "1"),
    [item]
  );

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="pb-10 animate-in fade-in duration-300">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="border-b border-border/60 bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 space-y-3">
          <RouterLink
            to="/admin/help/changelog"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={15} /> Volver a Novedades
          </RouterLink>

          {loading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-7 bg-muted/60 dark:bg-slate-700/60 rounded-lg w-3/4" />
              <div className="flex gap-2">
                <div className="h-6 bg-muted/50 rounded-full w-20" />
                <div className="h-6 bg-muted/50 rounded-full w-32" />
              </div>
            </div>
          ) : error ? (
            <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
          ) : (
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-snug">
                {item?.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                {item?.type && (
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${TYPE_BADGE[item.type] || "bg-muted/60 text-muted-foreground"}`}>
                    {item.type}
                  </span>
                )}
                {item?.audience && (
                  <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-muted/60 text-muted-foreground">
                    Audiencia: {item.audience}
                  </span>
                )}
                {item?.date && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-muted/60 text-muted-foreground">
                    <Clock size={10} /> {fmtDate(item.date)}
                  </span>
                )}
                {isPinned && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <Pin size={9} /> Fijado
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Content + Sidebar ─────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Main */}
          <div className="flex-1 min-w-0 space-y-6">
            <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm p-5 md:p-6">
              {loading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 bg-muted/60 rounded-lg w-2/5" />
                  <div className="h-3 bg-muted/40 rounded-lg" />
                  <div className="h-3 bg-muted/40 rounded-lg w-11/12" />
                  <div className="h-3 bg-muted/40 rounded-lg w-4/5" />
                </div>
              ) : error ? (
                <div className="flex items-center gap-3 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200/60 rounded-2xl">
                  <AlertTriangle size={16} className="text-rose-500 shrink-0" />
                  <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
                </div>
              ) : (
                <>
                  {item?.description ? (
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none [&_p]:mb-3 [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:pl-5 [&_ol]:mb-3 [&_h1]:mt-4 [&_h2]:mt-4 [&_h3]:mt-4 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:bg-muted/60 [&_code]:text-xs"
                      dangerouslySetInnerHTML={{ __html: item.description }}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin descripción.</p>
                  )}

                  <div className="h-px bg-border/40 my-5" />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock size={11} />
                      Publicado {item?.date ? fmtDate(item.date) : "—"}
                    </span>
                    <button
                      onClick={copyLink}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all">
                      {copied
                        ? <Check size={13} className="text-emerald-500" />
                        : <Copy size={13} />}
                      {copied ? "¡Copiado!" : "Copiar enlace"}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Relacionadas */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="font-black text-sm">Novedades relacionadas</p>
                <RouterLink
                  to="/admin/help/changelog"
                  className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">
                  Ver todas
                </RouterLink>
              </div>

              {loadingRel ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-2xl p-3.5 animate-pulse space-y-1.5">
                      <div className="h-3.5 bg-muted/60 rounded-lg w-3/4" />
                      <div className="h-3 bg-muted/40 rounded-lg w-2/5" />
                    </div>
                  ))}
                </div>
              ) : !related.length ? (
                <p className="text-sm text-muted-foreground">No hay más anuncios por ahora.</p>
              ) : (
                <div className="space-y-2">
                  {related.map((c) => (
                    <RouterLink
                      key={c.id}
                      to={`/admin/help/changelog/${encodeURIComponent(c.slug || c.id)}`}
                      className="group flex items-start gap-3 bg-card dark:bg-slate-900/40 border border-border/60 rounded-2xl p-3.5 hover:-translate-y-0.5 hover:shadow-md hover:border-border/80 transition-all duration-200">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold group-hover:text-primary transition-colors truncate">{c.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {c.date ? fmtDate(c.date) : ""}{c.type ? ` · ${c.type}` : ""}
                        </p>
                      </div>
                      <ChevronRight size={14} className="text-muted-foreground/40 shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                    </RouterLink>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Sidebar ───────────────────────────────────────── */}
          <div className="w-full lg:w-80 shrink-0 space-y-4">
            <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 dark:bg-primary/15">
                  <Headphones size={16} className="text-primary" />
                </div>
                <p className="font-black text-sm">¿Necesitas más ayuda?</p>
              </div>
              <p className="text-xs text-muted-foreground">Nuestro equipo responde de L–V, 8:00–17:00.</p>
              <div className="space-y-2">
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="flex items-center justify-center w-full h-9 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all">
                  Escribir a soporte
                </a>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center w-full h-9 rounded-xl bg-muted/60 dark:bg-slate-800 text-foreground text-sm font-bold hover:bg-muted dark:hover:bg-slate-700 transition-all">
                  WhatsApp
                </a>
              </div>
              <div className="h-px bg-border/40" />
              <RouterLink
                to="/admin/help"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors">
                <HelpCircle size={12} /> Ir al Centro de ayuda
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
