// src/pages/HelpPage/HelpTutorialDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import {
  ArrowLeft, PlayCircle, Download, Clock, FolderOpen,
  List, ExternalLink, AlertTriangle,
} from "lucide-react";
import { getTutorialBySlug } from "@/services/help.api";

/* ── Helpers ───────────────────────────────────────────────── */
function minutesFromSeconds(s) {
  const n = Number(s || 0);
  if (!n) return null;
  return Math.max(1, Math.round(n / 60));
}
function fmtDate(d) {
  try {
    return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch { return ""; }
}
function isYouTube(url = "") { return /youtu\.be|youtube\.com/i.test(url); }
function isVimeo(url = "")   { return /vimeo\.com/i.test(url); }
function toYouTubeEmbed(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return `https://www.youtube.com/embed/${u.pathname.replace("/", "")}`;
    const id = u.searchParams.get("v");
    return id ? `https://www.youtube.com/embed/${id}` : url;
  } catch { return url; }
}
function toVimeoEmbed(url) {
  try {
    const u  = new URL(url);
    const id = u.pathname.split("/").filter(Boolean).pop();
    return id ? `https://player.vimeo.com/video/${id}` : url;
  } catch { return url; }
}

export default function HelpTutorialDetail() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [tut,     setTut]     = useState(null);
  const [error,   setError]   = useState(null);

  const durationMin = useMemo(() => minutesFromSeconds(tut?.duration_seconds), [tut?.duration_seconds]);
  const canEmbed    = useMemo(() => !!tut?.videoUrl && (isYouTube(tut.videoUrl) || isVimeo(tut.videoUrl)), [tut?.videoUrl]);
  const embedSrc    = useMemo(() => {
    if (!tut?.videoUrl) return null;
    if (isYouTube(tut.videoUrl)) return toYouTubeEmbed(tut.videoUrl);
    if (isVimeo(tut.videoUrl))   return toVimeoEmbed(tut.videoUrl);
    return null;
  }, [tut?.videoUrl]);

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      try {
        const t = await getTutorialBySlug(slug);
        setTut(t);
      } catch (e) { setError(e?.message || "No se pudo cargar el tutorial."); }
      finally { setLoading(false); }
    })();
  }, [slug]);

  return (
    <div className="pb-10 animate-in fade-in duration-300">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="border-b border-border/60 bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 space-y-3">
          <RouterLink
            to="/admin/help/tutorials"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={15} /> Volver a tutoriales
          </RouterLink>

          {loading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-7 bg-muted/60 dark:bg-slate-700/60 rounded-lg w-3/5" />
              <div className="flex gap-2">
                <div className="h-6 bg-muted/50 rounded-full w-20" />
                <div className="h-6 bg-muted/50 rounded-full w-16" />
              </div>
            </div>
          ) : error ? (
            <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
          ) : (
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-snug">
                {tut?.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                {tut?.category && (
                  <span className="inline-block px-2.5 py-1 rounded-full text-xs font-black bg-primary/10 text-primary">
                    {tut.category}
                  </span>
                )}
                {durationMin && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-muted/60 text-muted-foreground">
                    <Clock size={10} /> {durationMin} min
                  </span>
                )}
                {tut?.published_at && (
                  <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-muted/60 text-muted-foreground">
                    Publicado: {fmtDate(tut.published_at)}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6 space-y-4">

        {/* Portada: video embed o imagen */}
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="bg-muted/50 animate-pulse" style={{ aspectRatio: "16/9" }} />
          ) : (canEmbed || tut?.imageUrl) ? (
            <div className="overflow-hidden" style={{ aspectRatio: "16/9" }}>
              {canEmbed ? (
                <iframe
                  src={embedSrc}
                  title={tut?.title || "video"}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0 block"
                />
              ) : (
                <img
                  src={tut?.imageUrl}
                  alt={tut?.title || "cover"}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground/40" style={{ aspectRatio: "16/9" }}>
              <PlayCircle size={48} />
              <p className="text-sm text-muted-foreground">Sin portada</p>
            </div>
          )}
        </div>

        {/* Grid 2 columnas */}
        <div className="flex flex-col lg:flex-row gap-4">

          {/* Columna principal */}
          <div className="flex-1 min-w-0">
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
                  {/* Descripción */}
                  {tut?.description && (
                    <>
                      <p className="font-black text-sm mb-2">Descripción</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {tut.description}
                      </p>
                      <div className="h-px bg-border/40 my-5" />
                    </>
                  )}

                  {/* Pasos */}
                  {Array.isArray(tut?.steps) && tut.steps.length > 0 ? (
                    <>
                      <div className="flex items-center gap-2 mb-3">
                        <List size={15} className="text-primary" />
                        <p className="font-black text-sm">Pasos</p>
                      </div>
                      <div className="space-y-3">
                        {[...tut.steps]
                          .sort((a, b) => (a.step_no || 0) - (b.step_no || 0))
                          .map((s, idx) => (
                            <div
                              key={s.id || idx}
                              className="bg-muted/20 dark:bg-slate-800/30 border border-border/40 rounded-2xl p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-[10px] font-black bg-primary text-primary-foreground">
                                  {s.step_no ?? idx + 1}
                                </span>
                                <p className="font-bold text-sm">
                                  {s.title || `Paso ${s.step_no ?? idx + 1}`}
                                </p>
                              </div>
                              {s.body && (
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap pl-8">
                                  {s.body}
                                </p>
                              )}
                              {s.imageUrl && (
                                <div className="mt-3 rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
                                  <img
                                    src={s.imageUrl}
                                    alt={s.title || ""}
                                    loading="lazy"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Este tutorial no incluye pasos detallados.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-72 shrink-0 space-y-4">

            {/* CTAs */}
            {!loading && (tut?.videoUrl || tut?.source_url) && (
              <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm p-4 space-y-2">
                {tut.videoUrl && (
                  <a
                    href={tut.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full h-9 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all">
                    <PlayCircle size={15} /> Abrir video
                  </a>
                )}
                {tut.source_url && (
                  <a
                    href={tut.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full h-9 rounded-xl bg-muted/60 dark:bg-slate-800 text-foreground text-sm font-bold hover:bg-muted dark:hover:bg-slate-700 transition-all">
                    <ExternalLink size={14} /> Ver fuente
                  </a>
                )}
              </div>
            )}

            {/* Metadatos */}
            {!loading && tut && (
              <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm p-4 space-y-3">
                <p className="font-black text-sm">Información</p>
                <div className="h-px bg-border/40" />
                <div className="space-y-2">
                  {tut.category && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FolderOpen size={13} className="shrink-0" /> {tut.category}
                    </div>
                  )}
                  {durationMin && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock size={13} className="shrink-0" /> {durationMin} min
                    </div>
                  )}
                  {tut.published_at && (
                    <p className="text-xs text-muted-foreground">
                      Publicado: {fmtDate(tut.published_at)}
                    </p>
                  )}
                  {tut.updated_at && (
                    <p className="text-xs text-muted-foreground">
                      Actualizado: {fmtDate(tut.updated_at)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Adjuntos */}
            {!loading && Array.isArray(tut?.attachments) && tut.attachments.length > 0 && (
              <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm p-4 space-y-3">
                <p className="font-black text-sm">Archivos</p>
                <div className="h-px bg-border/40" />
                <div className="space-y-1.5">
                  {tut.attachments.map((a) => (
                    <a
                      key={a.id}
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors">
                      <Download size={11} /> {a.name || a.url}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
