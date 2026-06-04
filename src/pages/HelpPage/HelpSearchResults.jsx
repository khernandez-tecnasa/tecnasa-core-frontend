import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate, Link as RouterLink } from "react-router-dom";
import { Search, HelpCircle, PlayCircle, Megaphone, AlertTriangle, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import HelpSearchBox from "@/components/Help/HelpSearchBox";
import { listFaqs, listTutorials, listChangelogs } from "@/services/help.api";

function stripHtml(s = "") {
  const el = document.createElement("div");
  el.innerHTML = s;
  return (el.textContent || el.innerText || "").trim();
}

const KIND_CONFIG = {
  FAQ:     { icon: HelpCircle,  cls: "bg-primary/10 text-primary dark:bg-primary/20" },
  Tutorial:{ icon: PlayCircle,  cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  Novedad: { icon: Megaphone,   cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
};

export default function HelpSearchResults() {
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();

  const q     = sp.get("q") || "";
  const page  = Math.max(1, Number(sp.get("page") || 1));
  const limit = Math.min(50, Math.max(5, Number(sp.get("limit") || 10)));

  const [loading, setLoading] = useState(true);
  const [items, setItems]     = useState([]);
  const [error, setError]     = useState(null);

  useEffect(() => {
    (async () => {
      if (!q || q.trim().length < 2) { setItems([]); setLoading(false); return; }
      setLoading(true);
      setError(null);
      try {
        const [faqs, tuts, changelogs] = await Promise.all([
          listFaqs({ q, limit: 100, isActive: 1, visibility: "public" }),
          listTutorials({ q, limit: 100, visibility: "public" }),
          listChangelogs({ q, limit: 50, _ts: Date.now() }),
        ]);

        const A = (faqs?.items || []).map((f) => ({
          id: `faq-${f.id}`, kind: "FAQ",
          title: f.question,
          meta: [f.category || "General"].filter(Boolean).join(" · "),
          href: `/admin/help/faqs/${encodeURIComponent(f.slug || f.id)}`,
          snippet: stripHtml(f.answer || ""),
          score: (f.question || "").toLowerCase().startsWith(q.toLowerCase()) ? 1000
                : (f.question || "").toLowerCase().includes(q.toLowerCase()) ? 800 : 500,
        }));
        const B = (tuts?.items || []).map((t) => ({
          id: `tut-${t.id}`, kind: "Tutorial",
          title: t.title,
          meta: t.category || "Tutorial",
          href: `/admin/help/tutorials/${encodeURIComponent(t.slug || t.id)}`,
          snippet: stripHtml(t.description || ""),
          score: (t.title || "").toLowerCase().startsWith(q.toLowerCase()) ? 900
                : (t.title || "").toLowerCase().includes(q.toLowerCase()) ? 700 : 450,
        }));
        const C = (changelogs?.items || []).map((c) => ({
          id: `cl-${c.id}`, kind: "Novedad",
          title: c.title,
          meta: `${c.type} · ${new Date(c.date).toLocaleDateString()}`,
          href: `/admin/help/changelog/${encodeURIComponent(c.slug || c.id)}`,
          snippet: stripHtml(c.description || ""),
          score: (c.title || "").toLowerCase().includes(q.toLowerCase()) ? 600 : 300,
        }));

        setItems([...A, ...B, ...C].sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)));
      } catch (e) {
        setError(e?.message || "No se pudo realizar la búsqueda.");
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [q]);

  const total      = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start      = (page - 1) * limit;
  const pageItems  = useMemo(() => items.slice(start, start + limit), [items, start, limit]);

  const setParam = (k, v) => {
    const next = new URLSearchParams(sp);
    if (!v) next.delete(k); else next.set(k, String(v));
    if (k !== "page") next.delete("page");
    setSp(next, { replace: true });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6 animate-in fade-in duration-500">

      {/* Volver */}
      <RouterLink
        to="/admin/help"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={15} /> Centro de ayuda
      </RouterLink>

      {/* Buscador */}
      <HelpSearchBox
        defaultValue={q}
        onSubmitNavigate={(newQ) => navigate(`/admin/help/search?q=${encodeURIComponent(newQ)}`)}
      />

      {/* Título */}
      <div>
        <h1 className="text-xl font-black tracking-tight">Resultados de búsqueda</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {loading ? "Buscando…" : `${total} coincidencia${total !== 1 ? "s" : ""} para "${q}"`}
        </p>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-2xl p-4 animate-pulse space-y-2">
              <div className="h-4 bg-muted/60 dark:bg-slate-700/60 rounded-lg w-3/5" />
              <div className="h-3 bg-muted/40 dark:bg-slate-700/40 rounded-lg w-4/5" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200/60 rounded-2xl">
          <AlertTriangle size={18} className="text-rose-500 shrink-0" />
          <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
        </div>
      ) : !pageItems.length ? (
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl flex flex-col items-center gap-3 py-16">
          <div className="w-14 h-14 rounded-3xl bg-muted/50 dark:bg-slate-800/50 flex items-center justify-center">
            <Search size={26} className="text-muted-foreground/30" />
          </div>
          <p className="font-bold text-sm">No hay resultados para "{q}"</p>
          <p className="text-xs text-muted-foreground">Intenta con otros términos de búsqueda</p>
        </div>
      ) : (
        <>
          <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm overflow-hidden">
            <div className="divide-y divide-border/40">
              {pageItems.map((it) => {
                const cfg = KIND_CONFIG[it.kind] || KIND_CONFIG.FAQ;
                const Icon = cfg.icon;
                return (
                  <button
                    key={it.id}
                    onClick={() => navigate(it.href)}
                    className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-muted/20 dark:hover:bg-slate-800/20 transition-colors group">
                    <div className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center ${cfg.cls}`}>
                      <Icon size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm group-hover:text-primary transition-colors truncate">
                        {it.title}
                      </p>
                      {it.meta && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">{it.meta}</p>
                      )}
                      {it.snippet && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {it.snippet.slice(0, 200)}{it.snippet.length > 200 ? "…" : ""}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Paginación simple */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setParam("page", page - 1)}
                className="h-8 w-8 inline-flex items-center justify-center rounded-xl border border-border/60 bg-card hover:bg-muted/60 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(totalPages, 8) }).map((_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setParam("page", p)}
                    className={`h-8 w-8 inline-flex items-center justify-center rounded-xl text-sm font-bold transition-all ${
                      p === page
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "border border-border/60 bg-card hover:bg-muted/60"
                    }`}>
                    {p}
                  </button>
                );
              })}
              <button
                disabled={page >= totalPages}
                onClick={() => setParam("page", page + 1)}
                className="h-8 w-8 inline-flex items-center justify-center rounded-xl border border-border/60 bg-card hover:bg-muted/60 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <ChevronRight size={14} />
              </button>
            </div>
          )}
          <p className="text-xs text-muted-foreground/60 text-center">
            {start + 1}–{Math.min(start + limit, total)} de {total} resultados
          </p>
        </>
      )}
    </div>
  );
}
