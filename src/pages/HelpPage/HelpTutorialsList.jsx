// src/pages/HelpPage/HelpTutorialsList.jsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate, Link as RouterLink } from "react-router-dom";
import { PlayCircle, Search, X, AlertTriangle, Clock, Tag, ArrowLeft } from "lucide-react";
import { listTutorials } from "@/services/help.api";
import PaginationLite from "@/components/common/PaginationLite.jsx";

function stripHtml(s = "") {
  const el = document.createElement("div");
  el.innerHTML = s;
  return (el.textContent || el.innerText || "").trim();
}

export default function HelpTutorialsList() {
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();

  const q        = sp.get("q") || "";
  const category = sp.get("category") || "";
  const page     = Math.max(1, Number(sp.get("page") || 1));
  const limit    = Math.min(24, Math.max(6, Number(sp.get("limit") || 12)));

  const [loading, setLoading] = useState(true);
  const [items, setItems]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [error, setError]     = useState(null);
  const [searchInput, setSearchInput] = useState(q);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await listTutorials({ q, category, page, limit, visibility: "public" });
        setItems(res?.items || []);
        setTotal(res?.total || 0);
      } catch (e) {
        setError(e?.message || "No se pudieron cargar los tutoriales.");
      } finally {
        setLoading(false);
      }
    })();
  }, [q, category, page, limit]);

  const categories = useMemo(() => {
    const s = new Set();
    (items || []).forEach((t) => t.category && s.add(t.category));
    return Array.from(s).slice(0, 12);
  }, [items]);

  const totalPages = Math.max(1, Math.ceil((total || 0) / limit));

  const setParam = (k, v) => {
    const next = new URLSearchParams(sp);
    if (!v) next.delete(k); else next.set(k, String(v));
    if (k !== "page") next.delete("page");
    setSp(next, { replace: true });
  };

  const onSearch = (e) => {
    e.preventDefault();
    setParam("q", searchInput.trim());
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
            <PlayCircle size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">
              Tutoriales y guías
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm font-medium mt-0.5">
              Aprende paso a paso con nuestros videos y guías interactivas
            </p>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="space-y-3">
        <form onSubmit={onSearch} className="flex items-center gap-3 flex-wrap">
          <div className="relative w-full max-w-sm group">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar tutoriales..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-card border border-border/60 rounded-xl pl-9 pr-8 py-2 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/50 shadow-sm"
            />
            {searchInput && (
              <button type="button" onClick={() => { setSearchInput(""); setParam("q", ""); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded-md transition-colors text-muted-foreground/60 hover:text-foreground">
                <X size={13} />
              </button>
            )}
          </div>
          <button type="submit" className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all">
            Buscar
          </button>
          {!loading && (
            <span className="text-xs text-muted-foreground/70 font-medium">
              <span className="font-bold text-foreground">{total}</span> tutorial{total !== 1 ? "es" : ""}
            </span>
          )}
        </form>

        {/* Chips de categoría */}
        {(category || categories.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {category && (
              <button
                onClick={() => setParam("category", "")}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all">
                <Tag size={10} /> {category} <X size={10} />
              </button>
            )}
            {categories.filter((c) => c !== category).map((c) => (
              <button
                key={c}
                onClick={() => setParam("category", c)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-card border border-border/60 hover:border-primary/30 hover:bg-primary/5 transition-all">
                <Tag size={10} /> {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* GRID */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-2xl overflow-hidden animate-pulse">
              <div className="bg-muted/50 dark:bg-slate-800/50" style={{ aspectRatio: "16/9" }} />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-muted/60 dark:bg-slate-700/60 rounded-lg w-4/5" />
                <div className="h-3 bg-muted/40 dark:bg-slate-700/40 rounded-lg w-3/5" />
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
            <PlayCircle size={26} className="text-muted-foreground/30" />
          </div>
          <p className="font-bold text-sm">{q ? "Sin resultados" : "No hay tutoriales disponibles"}</p>
          <p className="text-xs text-muted-foreground">
            {q ? `No hay coincidencias para "${q}"` : "Vuelve pronto para encontrar más contenido"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((t) => (
              <button
                key={t.id}
                onClick={() => navigate(`/admin/help/tutorials/${encodeURIComponent(t.slug || t.id)}`)}
                className="group bg-card dark:bg-slate-900/40 border border-border/60 rounded-2xl overflow-hidden text-left hover:-translate-y-1 hover:shadow-md hover:border-border/80 transition-all duration-200">
                <div className="overflow-hidden" style={{ aspectRatio: "16/9" }}>
                  <img
                    src={t.imageUrl || "https://images.unsplash.com/photo-1557800636-894a64c1696f?q=80&w=800&auto=format&fit=crop"}
                    alt={t.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4 space-y-2">
                  <p className="font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                    {t.title}
                  </p>
                  {t.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {stripHtml(t.description)}
                    </p>
                  )}
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    {t.category && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted/60 dark:bg-slate-800 text-muted-foreground">
                        <Tag size={9} /> {t.category}
                      </span>
                    )}
                    {t.duration_seconds ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted/60 dark:bg-slate-800 text-muted-foreground">
                        <Clock size={9} /> {Math.round(t.duration_seconds / 60)} min
                      </span>
                    ) : null}
                    <span className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-primary">
                      <PlayCircle size={12} /> Ver
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col items-center gap-2 mt-2">
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
