// src/pages/HelpPage/HelpFaqDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link as RouterLink, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ThumbsUp, ThumbsDown, Copy, Check,
  Headphones, HelpCircle, ChevronRight, AlertTriangle,
} from "lucide-react";
import { getFaqBySlug, voteFaqHelpful, listFaqs } from "@/services/help.api";

const SUPPORT_EMAIL  = import.meta.env.VITE_SUPPORT_EMAIL      || "soporte@tu-dominio.com";
const WHATSAPP_URL   = import.meta.env.VITE_SUPPORT_WHATSAPP   || "https://wa.me/50495989756";

function fmtDate(d) {
  try {
    return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch { return ""; }
}

export default function HelpFaqDetail() {
  const { slug } = useParams();
  const navigate  = useNavigate();

  const [loading,    setLoading]    = useState(true);
  const [faq,        setFaq]        = useState(null);
  const [error,      setError]      = useState(null);
  const [voted,      setVoted]      = useState(false);
  const [voteState,  setVoteState]  = useState(null); // "up" | "down"
  const [related,    setRelated]    = useState([]);
  const [loadingRel, setLoadingRel] = useState(false);
  const [copied,     setCopied]     = useState(false);

  const votedMsg = useMemo(() => {
    if (voteState === "up")   return "¡Gracias por tu opinión!";
    if (voteState === "down") return "Gracias. Usaremos tu feedback para mejorar este artículo.";
    return "";
  }, [voteState]);

  /* Cargar FAQ */
  useEffect(() => {
    (async () => {
      setLoading(true); setError(null); setVoted(false); setVoteState(null);
      try {
        const f = await getFaqBySlug(slug);
        setFaq(f || null);
      } catch (e) { setError(e?.message || "No se pudo cargar la FAQ."); }
      finally { setLoading(false); }
    })();
  }, [slug]);

  /* Relacionados por categoría */
  useEffect(() => {
    (async () => {
      if (!faq?.category) { setRelated([]); return; }
      setLoadingRel(true);
      try {
        const r = await listFaqs({ category: faq.category, limit: 8, visibility: "public", isActive: 1 });
        const items = (r?.items || []).filter(
          (x) => (x.slug || String(x.id)) !== (faq.slug || String(faq.id))
        );
        setRelated(items.slice(0, 6));
      } catch { setRelated([]); }
      finally { setLoadingRel(false); }
    })();
  }, [faq?.category, faq?.slug, faq?.id]);

  const onVote = async (up) => {
    if (!faq || voted) return;
    try { await voteFaqHelpful(faq.id, { up }); setVoted(true); setVoteState(up ? "up" : "down"); } catch {}
  };

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
            to="/admin/help/faqs"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={15} /> Volver a FAQs
          </RouterLink>

          {loading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-7 bg-muted/60 dark:bg-slate-700/60 rounded-lg w-3/4" />
              <div className="flex gap-2">
                <div className="h-6 bg-muted/50 rounded-full w-20" />
                <div className="h-6 bg-muted/50 rounded-full w-36" />
              </div>
            </div>
          ) : error ? (
            <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
          ) : (
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-snug">
                {faq?.question}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-black bg-primary/10 text-primary">
                  {faq?.category || "General"}
                </span>
                {faq?.updatedAt && (
                  <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-muted/60 text-muted-foreground">
                    Actualizado: {fmtDate(faq.updatedAt)}
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
                  {faq?.answer ? (
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none [&_p]:mb-3 [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:pl-5 [&_ol]:mb-3 [&_h1]:mt-4 [&_h2]:mt-4 [&_h3]:mt-4 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:bg-muted/60 [&_code]:text-xs"
                      dangerouslySetInnerHTML={{ __html: faq.answer }}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">Este artículo aún no tiene contenido.</p>
                  )}

                  <div className="h-px bg-border/40 my-5" />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Voto útil */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-muted-foreground">¿Te resultó útil?</span>
                      <button
                        onClick={() => onVote(true)}
                        disabled={voted}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-200 dark:hover:bg-emerald-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                        <ThumbsUp size={13} /> Sí
                      </button>
                      <button
                        onClick={() => onVote(false)}
                        disabled={voted}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-muted/60 text-muted-foreground text-xs font-bold hover:bg-muted transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        <ThumbsDown size={13} /> No
                      </button>
                      {voted && (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          <Check size={12} /> {votedMsg}
                        </span>
                      )}
                    </div>

                    {/* Copiar enlace */}
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

            {/* Relacionados */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="font-black text-sm">Artículos relacionados</p>
                <RouterLink
                  to="/admin/help/faqs"
                  className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">
                  Ver todos
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
                <p className="text-sm text-muted-foreground">No hay sugerencias en esta categoría.</p>
              ) : (
                <div className="space-y-2">
                  {related.map((f) => (
                    <RouterLink
                      key={f.id}
                      to={`/admin/help/faqs/${encodeURIComponent(f.slug || f.id)}`}
                      className="group flex items-start gap-3 bg-card dark:bg-slate-900/40 border border-border/60 rounded-2xl p-3.5 hover:-translate-y-0.5 hover:shadow-md hover:border-border/80 transition-all duration-200">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold group-hover:text-primary transition-colors truncate">{f.question}</p>
                        {f.category && (
                          <p className="text-xs text-muted-foreground mt-0.5">{f.category}</p>
                        )}
                      </div>
                      <ChevronRight size={14} className="text-muted-foreground/40 shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                    </RouterLink>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Sidebar ──────────────────────────────────────── */}
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
