import { useRef, useState } from "react";
import { Search, Loader2, HelpCircle, PlayCircle } from "lucide-react";
import { listFaqs, listTutorials } from "@/services/help.api";

function useDebounce() {
  const r = useRef();
  return (fn, ms = 250) =>
    (...args) => {
      clearTimeout(r.current);
      r.current = setTimeout(() => fn(...args), ms);
    };
}

export default function HelpSearchBox({
  defaultValue = "",
  placeholder = "Busca artículos y mucho más",
  onSubmitNavigate = (q) =>
    (window.location.href = `/admin/help/search?q=${encodeURIComponent(q)}`),
}) {
  const [q, setQ] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sug, setSug] = useState({ faqs: [], tutorials: [] });
  const debounced = useDebounce();

  const fetchSuggest = async (term) => {
    if (!term || term.trim().length < 2) {
      setOpen(false);
      setSug({ faqs: [], tutorials: [] });
      return;
    }
    setLoading(true);
    try {
      const [fs, ts] = await Promise.all([
        listFaqs({ q: term, limit: 5, isActive: 1, visibility: "public" }),
        listTutorials({ q: term, limit: 5, visibility: "public" }),
      ]);
      setSug({ faqs: fs?.items || [], tutorials: ts?.items || [] });
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const onChange = (e) => {
    const v = e.target.value;
    setQ(v);
    debounced(fetchSuggest, 250)(v);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const term = q.trim();
    if (term.length >= 2) onSubmitNavigate(term);
  };

  const hasSuggestions = sug.faqs.length > 0 || sug.tutorials.length > 0;

  return (
    <div className="w-full max-w-2xl relative">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1 group">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors pointer-events-none"
          />
          <input
            type="text"
            value={q}
            onChange={onChange}
            onFocus={() => q.length >= 2 && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder={placeholder}
            className="w-full h-12 bg-card dark:bg-slate-900/60 border border-border/60 rounded-2xl pl-11 pr-4 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/50 shadow-sm"
          />
        </div>
        <button
          type="submit"
          className="h-12 px-5 inline-flex items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-md shadow-primary/20 hover:bg-primary/90 transition-all">
          <Search size={18} />
        </button>
      </form>

      {/* Dropdown de sugerencias */}
      {open && (
        <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-50 bg-card dark:bg-slate-900 border border-border/60 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-2.5 border-b border-border/50">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
              Principales resultados
            </span>
          </div>
          <div className="p-2">
            {loading ? (
              <div className="flex items-center gap-2 px-3 py-3 text-muted-foreground">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-sm">Buscando...</span>
              </div>
            ) : !hasSuggestions ? (
              <p className="px-3 py-3 text-sm text-muted-foreground">Sin coincidencias.</p>
            ) : (
              <div className="space-y-0.5">
                {sug.faqs.map((f) => (
                  <a
                    key={`faq-${f.id}`}
                    href={`/admin/help/faqs/${encodeURIComponent(f.slug || f.id)}`}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-muted/60 dark:hover:bg-slate-800/60 transition-colors text-sm">
                    <HelpCircle size={13} className="text-primary/60 shrink-0" />
                    <span className="truncate">{f.question}</span>
                  </a>
                ))}
                {sug.tutorials.map((t) => (
                  <a
                    key={`tut-${t.id}`}
                    href={`/admin/help/tutorials/${encodeURIComponent(t.slug || t.id)}`}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-muted/60 dark:hover:bg-slate-800/60 transition-colors text-sm">
                    <PlayCircle size={13} className="text-emerald-500 shrink-0" />
                    <span className="truncate">{t.title}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
