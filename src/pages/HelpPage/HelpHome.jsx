// src/pages/HelpPage/HelpHome.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HelpCircle,
  PlayCircle,
  BookOpen,
  Megaphone,
  ArrowRight,
  Clock,
  Loader2,
  Mail,
  MessageCircle,
} from "lucide-react";
import HelpSearchBox from "@/components/Help/HelpSearchBox";
import { listFaqs, listTutorials, listChangelogs } from "@/services/help.api";

const SUPPORT_EMAIL =
  import.meta.env.VITE_SUPPORT_EMAIL || "micros.teh@tecnasadesk.com";
const WHATSAPP_URL =
  import.meta.env.VITE_SUPPORT_WHATSAPP || "https://wa.me/50495989756";

function stripHtml(s = "") {
  const el = document.createElement("div");
  el.innerHTML = s;
  return (el.textContent || el.innerText || "").trim();
}

function fmtDate(d) {
  try {
    return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch { return ""; }
}

/* ── Sección wrapper ─────────────────────────────────────────────── */
function Section({ title, icon: Icon, actionLabel = "Mostrar todos", onAction, children }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={16} className="text-muted-foreground/60" />}
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
            {title}
          </span>
        </div>
        {onAction && (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline transition-colors">
            {actionLabel} <ArrowRight size={12} />
          </button>
        )}
      </div>
      {children}
      <div className="h-px bg-border/40" />
    </div>
  );
}

/* ── Skeleton card ───────────────────────────────────────────────── */
function SkeletonCard({ aspect }) {
  return (
    <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-2xl overflow-hidden animate-pulse">
      {aspect && <div className="bg-muted/50 dark:bg-slate-800/60" style={{ aspectRatio: "16/9" }} />}
      <div className="p-4 space-y-2">
        <div className="h-3.5 bg-muted/60 dark:bg-slate-700/60 rounded-lg w-4/5" />
        <div className="h-3 bg-muted/40 dark:bg-slate-700/40 rounded-lg w-3/5" />
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────── */
export default function HelpHome() {
  const navigate = useNavigate();
  const [faqs, setFaqs] = useState([]);
  const [tuts, setTuts] = useState([]);
  const [changelogs, setChangelogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [f, t, cl] = await Promise.all([
          listFaqs({ limit: 6, isActive: 1, visibility: "public" }),
          listTutorials({ limit: 4, visibility: "public" }),
          listChangelogs({ limit: 5, _ts: Date.now() }),
        ]);
        setFaqs(f?.items || []);
        setTuts(t?.items || []);
        setChangelogs(cl?.items || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const quickTopics = useMemo(() => {
    const cats = (faqs || []).map((x) => x.category).filter(Boolean).slice(0, 8);
    return cats.length ? cats : ["Precios", "Evaluaciones", "Calendario", "Políticas", "Cuentas", "Reportes"];
  }, [faqs]);

  return (
    <div className="pb-10 animate-in fade-in duration-500">

      {/* ── HERO ── */}
      <div className="border-b border-border/50 bg-gradient-to-b from-primary/5 to-transparent dark:from-primary/10">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-10 md:py-14 flex flex-col items-center text-center gap-6">
          <div className="p-3 rounded-2xl bg-primary/10 ring-1 ring-primary/20">
            <HelpCircle size={28} className="text-primary" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              Hola, ¿qué quieres aprender?
            </h1>
            <p className="text-muted-foreground text-sm mt-2">
              Encuentra guías, tutoriales y respuestas a tus preguntas.
            </p>
          </div>

          <HelpSearchBox
            placeholder="Busca artículos y mucho más"
            onSubmitNavigate={(q) =>
              navigate(`/admin/help/search?q=${encodeURIComponent(q)}`)
            }
          />

          {/* Quick topics */}
          {quickTopics.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {quickTopics.map((c) => (
                <button
                  key={c}
                  onClick={() => navigate(`/admin/help/search?q=${encodeURIComponent(c)}`)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold bg-card dark:bg-slate-800 border border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all">
                  {c}
                </button>
              ))}
            </div>
          )}

          {/* Contacto */}
          <div className="flex flex-col sm:flex-row items-center gap-2 px-4 py-2.5 rounded-full bg-muted/50 border border-border/50">
            <span className="text-sm text-muted-foreground">¿No encuentras lo que buscas?</span>
            <div className="flex gap-2">
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all">
                <Mail size={12} /> Escribir a soporte
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-all">
                <MessageCircle size={12} /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENIDO ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 space-y-8">

        {/* Acceso rápido */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: HelpCircle,  label: "Preguntas frecuentes", sub: "Respuestas rápidas",        href: "/admin/help/faqs",      color: "text-primary bg-primary/10 dark:bg-primary/15" },
            { icon: PlayCircle,  label: "Tutoriales",           sub: "Videos y guías paso a paso", href: "/admin/help/tutorials", color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400" },
            { icon: Megaphone,   label: "Novedades",            sub: "Cambios y actualizaciones",  href: "/admin/help/changelog", color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400" },
            { icon: BookOpen,    label: "Manual de usuario",    sub: "Guía completa del sistema",  href: "/admin/help/manual",    color: "text-violet-600 bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400" },
          ].map(({ icon: Icon, label, sub, href, color }) => (
            <button
              key={href}
              onClick={() => navigate(href)}
              className="group flex flex-col items-start gap-3 bg-card dark:bg-slate-900/40 border border-border/60 rounded-2xl p-4 text-left hover:-translate-y-0.5 hover:shadow-md hover:border-border/80 transition-all duration-200">
              <div className={`p-2.5 rounded-xl ${color}`}>
                <Icon size={17} />
              </div>
              <div>
                <p className="font-black text-sm group-hover:text-primary transition-colors leading-snug">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Tutoriales */}
        <Section
          title="Tutoriales y guías"
          icon={PlayCircle}
          onAction={() => navigate("/admin/help/tutorials")}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(loading ? Array.from({ length: 4 }) : tuts.slice(0, 4)).map((t, i) =>
              loading ? (
                <SkeletonCard key={i} aspect />
              ) : (
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
                  <div className="p-3">
                    <p className="font-bold text-sm line-clamp-2 leading-snug">{t.title}</p>
                    <div className="flex items-center gap-1 mt-1.5 text-primary text-xs font-bold">
                      <PlayCircle size={11} /> Ver tutorial
                    </div>
                  </div>
                </button>
              )
            )}
          </div>
        </Section>

        {/* FAQs */}
        <Section
          title="Preguntas frecuentes"
          icon={HelpCircle}
          onAction={() => navigate("/admin/help/faqs")}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(loading ? Array.from({ length: 6 }) : faqs.slice(0, 6)).map((f, i) =>
              loading ? (
                <SkeletonCard key={i} />
              ) : (
                <button
                  key={f.id}
                  onClick={() => navigate(`/admin/help/faqs/${encodeURIComponent(f.slug || f.id)}`)}
                  className="group bg-card dark:bg-slate-900/40 border border-border/60 rounded-2xl p-4 text-left hover:-translate-y-0.5 hover:shadow-md hover:border-border/80 transition-all duration-200 flex flex-col gap-2">
                  <p className="font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                    {f.question}
                  </p>
                  {f.answer && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {stripHtml(f.answer)}
                    </p>
                  )}
                  {f.category && (
                    <span className="mt-auto inline-block text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                      {f.category}
                    </span>
                  )}
                </button>
              )
            )}
          </div>
        </Section>

        {/* Novedades */}
        <Section
          title="Novedades y anuncios"
          icon={Megaphone}
          onAction={() => navigate("/admin/help/changelog")}>
          <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-5 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-2.5 h-2.5 rounded-full bg-muted/60 dark:bg-slate-700 mt-1.5 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 bg-muted/60 dark:bg-slate-700/60 rounded-lg w-3/4" />
                      <div className="h-3 bg-muted/40 dark:bg-slate-700/40 rounded-lg w-2/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : changelogs.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No hay novedades aún.</div>
            ) : (
              <div className="divide-y divide-border/40">
                {changelogs.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/admin/help/changelog/${encodeURIComponent(c.slug || c.id)}`)}
                    className="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-muted/20 dark:hover:bg-slate-800/20 transition-colors group">
                    <div className="w-2 h-2 rounded-full bg-primary/60 mt-2 shrink-0 group-hover:bg-primary transition-colors" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">{c.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock size={10} className="text-muted-foreground/50" />
                        <p className="text-[11px] text-muted-foreground">
                          {c.date ? fmtDate(c.date) : ""}{c.type ? ` · ${c.type}` : ""}
                        </p>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-muted-foreground/40 shrink-0 mt-1 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </Section>

      </div>
    </div>
  );
}
