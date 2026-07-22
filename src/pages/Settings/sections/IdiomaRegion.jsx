import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Clock, Calendar, Check, MapPin, Languages, ChevronRight, Globe } from "lucide-react";

import useIsMobile from "@/hooks/useIsMobile";

/* ─── Constantes ─── */
const LANGUAGES = [
  { code: "es-HN", label: "Español", flag: "🇪🇸" },
  { code: "en-US", label: "English", flag: "🇺🇸" },
];

const TIMEZONES = [
  { value: "America/Tegucigalpa", label: "(GMT-06:00) Tegucigalpa"         },
  { value: "America/Mexico_City", label: "(GMT-06:00) Ciudad de México"    },
  { value: "America/Bogota",      label: "(GMT-05:00) Bogotá, Lima, Quito" },
  { value: "America/New_York",    label: "(GMT-05:00) Nueva York"           },
  { value: "UTC",                 label: "(GMT+00:00) UTC"                  },
];

const DATE_FORMATS = [
  { value: "DD/MM/YYYY", label: "31/12/2025" },
  { value: "MM/DD/YYYY", label: "12/31/2025" },
  { value: "YYYY-MM-DD", label: "2025-12-31" },
];

/* ─── Helper: preview de fecha/hora ─── */
const formatPreview = (dateFormat, timeFormat, locale, timezone) => {
  const now = new Date();
  const timeOptions = { timeZone: timezone, hour: "numeric", minute: "2-digit", hour12: timeFormat === "12h" };
  const datePartsOptions = { timeZone: timezone, day: "2-digit", month: "2-digit", year: "numeric" };
  try {
    const timeStr = new Intl.DateTimeFormat(locale, timeOptions).format(now);
    const parts = new Intl.DateTimeFormat(locale, datePartsOptions).formatToParts(now);
    const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    const { day = "31", month = "12", year = "2025" } = map;
    let dateStr = `${day}/${month}/${year}`;
    if (dateFormat === "MM/DD/YYYY") dateStr = `${month}/${day}/${year}`;
    else if (dateFormat === "YYYY-MM-DD") dateStr = `${year}-${month}-${day}`;
    return { dateStr, timeStr };
  } catch {
    return { dateStr: "--/--/----", timeStr: "--:--" };
  }
};

/* ─── Componente principal ─── */
export default function IdiomaRegion({ initialData = {}, onSave }) {
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();
  const saveTimersRef = useRef({});

  const [form, setForm] = useState({
    language:   i18n.language || "es-HN",
    timezone:   "America/Tegucigalpa",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12h",
  });

  // Sincronizar form con datos del backend (timezone, dateFormat, timeFormat)
  // pero language siempre viene de i18n (localStorage)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setForm((prev) => ({
        ...prev,
        language:   i18n.language || prev.language,
        timezone:   initialData.timezone   || prev.timezone,
        dateFormat: initialData.dateFormat || prev.dateFormat,
        timeFormat: initialData.timeFormat || prev.timeFormat,
      }));
    }
  }, [initialData]);

  const scheduleSave = useCallback(
    (key, value) => {
      if (saveTimersRef.current[key]) clearTimeout(saveTimersRef.current[key]);
      saveTimersRef.current[key] = setTimeout(async () => {
        try {
          if (onSave) await onSave({ [key]: value });
        } catch {
          // error silencioso — el cambio ya se aplicó localmente
        }
      }, 500);
    },
    [onSave],
  );

  const handleChange = useCallback(
    (key, value) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      scheduleSave(key, value);
    },
    [scheduleSave],
  );

  const handleLanguageChange = useCallback(
    (code) => {
      setForm((prev) => ({ ...prev, language: code }));
      i18n.changeLanguage(code);   // aplica en tiempo real + guarda en localStorage
      scheduleSave("language", code);
    },
    [i18n, scheduleSave],
  );

  const preview = useMemo(
    () => formatPreview(form.dateFormat, form.timeFormat, form.language, form.timezone),
    [form.dateFormat, form.timeFormat, form.timezone, form.language],
  );

  const props = { t, form, handleChange, handleLanguageChange, preview };

  return isMobile ? <MobileRegion {...props} /> : <DesktopRegion {...props} />;
}

/* ─── DESKTOP ─── */
function DesktopRegion({ t, form, handleChange, handleLanguageChange, preview }) {
  const selectCls =
    "w-full rounded-xl border border-border dark:border-slate-700 px-4 py-2.5 text-sm bg-background dark:bg-slate-900/60 dark:text-slate-100 text-foreground outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-primary/10 dark:bg-primary/20 ring-1 ring-primary/20 dark:ring-primary/40 shrink-0">
          <Globe size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight leading-none dark:text-slate-100">
            {t("settings.region.title")}
          </h1>
          <p className="text-xs text-muted-foreground dark:text-slate-400 mt-0.5 font-medium">
            {t("settings.region.subtitle")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Columna izquierda ─── */}
        <div className="lg:col-span-2 space-y-6">

          {/* IDIOMA Y ZONA HORARIA */}
          <div className="bg-card dark:bg-slate-800/60 border border-border/60 dark:border-slate-700/60 rounded-3xl shadow-sm p-5 space-y-5">
            <div className="flex items-center gap-2.5 pb-1">
              <div className="p-1.5 bg-muted dark:bg-slate-700 rounded-xl">
                <Languages size={14} className="text-muted-foreground dark:text-slate-400" />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400">
                {t("settings.region.title")}
              </h2>
            </div>

            {/* Idioma */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400">
                {t("settings.region.language.label")}
              </label>
              <div className="flex gap-2">
                {LANGUAGES.map((l) => {
                  const active = form.language === l.code;
                  return (
                    <button
                      key={l.code}
                      onClick={() => handleLanguageChange(l.code)}
                      className={[
                        "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-200 border-2",
                        active
                          ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30 scale-[1.02]"
                          : "bg-background dark:bg-slate-900/80 border-border dark:border-slate-600 text-foreground dark:text-slate-200 hover:border-primary/50 hover:bg-muted/40 dark:hover:bg-slate-800/60",
                      ].join(" ")}>
                      <span className="text-base">{l.flag}</span>
                      <span>{l.label}</span>
                      {active
                        ? <Check size={15} className="ml-0.5 shrink-0" />
                        : <span className="w-[15px] shrink-0" />
                      }
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-px bg-border/40 dark:bg-slate-700/50" />

            {/* Zona horaria */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400">
                {t("settings.region.timezone.label")}
              </label>
              <select
                value={form.timezone}
                onChange={(e) => handleChange("timezone", e.target.value)}
                className={selectCls}>
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* FORMATOS */}
          <div className="bg-card dark:bg-slate-800/60 border border-border/60 dark:border-slate-700/60 rounded-3xl shadow-sm p-5 space-y-5">
            <div className="flex items-center gap-2.5 pb-1">
              <div className="p-1.5 bg-muted dark:bg-slate-700 rounded-xl">
                <Calendar size={14} className="text-muted-foreground dark:text-slate-400" />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400">
                {t("settings.region.formats.title")}
              </h2>
            </div>

            {/* Formato de fecha */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400">
                {t("settings.region.formats.date_label")}
              </label>
              <select
                value={form.dateFormat}
                onChange={(e) => handleChange("dateFormat", e.target.value)}
                className={selectCls}>
                {DATE_FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>{f.value} — {f.label}</option>
                ))}
              </select>
            </div>

            <div className="h-px bg-border/40 dark:bg-slate-700/50" />

            {/* Formato de hora */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400">
                {t("settings.region.formats.time_label")}
              </label>
              <div className="flex gap-2">
                {["12h", "24h"].map((fmt) => {
                  const active = form.timeFormat === fmt;
                  return (
                    <button
                      key={fmt}
                      onClick={() => handleChange("timeFormat", fmt)}
                      className={[
                        "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-200 border-2",
                        active
                          ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30 scale-[1.02]"
                          : "bg-background dark:bg-slate-900/80 border-border dark:border-slate-600 text-foreground dark:text-slate-200 hover:border-primary/50 hover:bg-muted/40 dark:hover:bg-slate-800/60",
                      ].join(" ")}>
                      {t(`settings.region.formats.${fmt}`)}
                      {active ? <Check size={15} className="shrink-0" /> : <span className="w-[15px] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Preview ─── */}
        <div className="space-y-4">
          <div className="bg-card dark:bg-slate-800/60 border border-border/60 dark:border-slate-700/60 rounded-3xl shadow-sm p-6 text-center">
            <div className="flex items-center gap-2 justify-center mb-4">
              <div className="p-1.5 bg-muted dark:bg-slate-700 rounded-xl">
                <Clock size={13} className="text-muted-foreground dark:text-slate-400" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400">
                {t("settings.region.preview.title")}
              </span>
            </div>
            <p className="text-4xl font-black tabular-nums tracking-tight dark:text-slate-100">
              {preview.timeStr}
            </p>
            <p className="text-sm text-muted-foreground dark:text-slate-400 mt-2 font-mono">
              {preview.dateStr}
            </p>
            <div className="mt-5 h-1.5 rounded-full bg-muted dark:bg-slate-700 overflow-hidden">
              <div className="h-full w-1/2 rounded-full bg-primary transition-all duration-300" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground/60 dark:text-slate-500 px-1 leading-relaxed">
            {t("settings.region.preview.desc")}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── MOBILE ─── */
function MobileRegion({ t, form, handleChange, handleLanguageChange, preview }) {
  const [openLang,     setOpenLang]     = useState(false);
  const [openTimezone, setOpenTimezone] = useState(false);
  const [openDate,     setOpenDate]     = useState(false);
  const [openTime,     setOpenTime]     = useState(false);

  const currentLang = LANGUAGES.find((l) => l.code === form.language);
  const currentTz   = TIMEZONES.find((tz) => tz.value === form.timezone);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-primary/10 dark:bg-primary/20 ring-1 ring-primary/20 dark:ring-primary/40 shrink-0">
          <Globe size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight leading-none dark:text-slate-100">
            {t("settings.region.title")}
          </h1>
          <p className="text-xs text-muted-foreground dark:text-slate-400 mt-0.5 font-medium">
            {t("settings.region.subtitle")}
          </p>
        </div>
      </div>

      {/* CONFIGURACIÓN */}
      <div className="bg-card dark:bg-slate-800/60 border border-border/60 dark:border-slate-700/60 rounded-3xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/60 dark:border-slate-700/50">
          <div className="p-1.5 bg-muted dark:bg-slate-700 rounded-xl">
            <Languages size={14} className="text-muted-foreground dark:text-slate-400" />
          </div>
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400">
            {t("settings.region.title")}
          </h2>
        </div>
        <div className="divide-y divide-border/40 dark:divide-slate-700/50">
          <MobileRow
            icon={Languages}
            label={t("settings.region.language.label")}
            value={currentLang ? `${currentLang.flag} ${currentLang.label}` : form.language}
            onClick={() => setOpenLang(true)}
          />
          <MobileRow
            icon={MapPin}
            label={t("settings.region.timezone.label")}
            value={currentTz?.label.replace(/^\(GMT[^)]+\)\s*/, "") || form.timezone}
            onClick={() => setOpenTimezone(true)}
          />
        </div>
      </div>

      {/* FORMATOS */}
      <div className="bg-card dark:bg-slate-800/60 border border-border/60 dark:border-slate-700/60 rounded-3xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/60 dark:border-slate-700/50">
          <div className="p-1.5 bg-muted dark:bg-slate-700 rounded-xl">
            <Calendar size={14} className="text-muted-foreground dark:text-slate-400" />
          </div>
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400">
            {t("settings.region.formats.title")}
          </h2>
        </div>
        <div className="divide-y divide-border/40 dark:divide-slate-700/50">
          <MobileRow
            icon={Calendar}
            label={t("settings.region.formats.date_label")}
            value={form.dateFormat}
            onClick={() => setOpenDate(true)}
          />
          <MobileRow
            icon={Clock}
            label={t("settings.region.formats.time_label")}
            value={t(`settings.region.formats.${form.timeFormat}`)}
            onClick={() => setOpenTime(true)}
          />
        </div>
      </div>

      {/* PREVIEW */}
      <div className="bg-card dark:bg-slate-800/60 border border-border/60 dark:border-slate-700/60 rounded-3xl shadow-sm p-5 text-center">
        <div className="flex items-center gap-2 justify-center mb-3">
          <div className="p-1.5 bg-muted dark:bg-slate-700 rounded-xl">
            <Clock size={13} className="text-muted-foreground dark:text-slate-400" />
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400">
            {t("settings.region.preview.title")}
          </span>
        </div>
        <p className="text-4xl font-black tabular-nums tracking-tight dark:text-slate-100">{preview.timeStr}</p>
        <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1.5 font-mono">{preview.dateStr}</p>
      </div>

      {/* ── MODALES ── */}

      {/* IDIOMA */}
      <IOSModal open={openLang} onClose={() => setOpenLang(false)} title={t("settings.region.language.label")}>
        {LANGUAGES.map((l) => (
          <IOSOption
            key={l.code}
            label={`${l.flag} ${l.label}`}
            active={form.language === l.code}
            onClick={() => {
              handleLanguageChange(l.code);
              setOpenLang(false);
            }}
          />
        ))}
      </IOSModal>

      {/* ZONA HORARIA */}
      <IOSModal open={openTimezone} onClose={() => setOpenTimezone(false)} title={t("settings.region.timezone.label")}>
        {TIMEZONES.map((tz) => (
          <IOSOption
            key={tz.value}
            label={tz.label}
            active={form.timezone === tz.value}
            onClick={() => { handleChange("timezone", tz.value); setOpenTimezone(false); }}
          />
        ))}
      </IOSModal>

      {/* FORMATO DE FECHA */}
      <IOSModal open={openDate} onClose={() => setOpenDate(false)} title={t("settings.region.formats.date_label")}>
        {DATE_FORMATS.map((f) => (
          <IOSOption
            key={f.value}
            label={f.value}
            desc={f.label}
            active={form.dateFormat === f.value}
            onClick={() => { handleChange("dateFormat", f.value); setOpenDate(false); }}
          />
        ))}
      </IOSModal>

      {/* FORMATO DE HORA */}
      <IOSModal open={openTime} onClose={() => setOpenTime(false)} title={t("settings.region.formats.time_label")}>
        {["12h", "24h"].map((f) => (
          <IOSOption
            key={f}
            label={t(`settings.region.formats.${f}`)}
            desc={f === "12h" ? "Ej: 2:30 PM" : "Ej: 14:30"}
            active={form.timeFormat === f}
            onClick={() => { handleChange("timeFormat", f); setOpenTime(false); }}
          />
        ))}
      </IOSModal>
    </div>
  );
}

/* ─── Fila de opción móvil ─── */
function MobileRow({ icon: Icon, label, value, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-muted/30 dark:hover:bg-slate-700/30 active:scale-[0.99] transition-all duration-150 group">
      <div className="p-1.5 bg-muted/60 dark:bg-slate-700/60 rounded-xl shrink-0">
        <Icon size={13} className="text-muted-foreground dark:text-slate-400" />
      </div>
      <span className="flex-1 text-sm font-semibold text-foreground dark:text-slate-100">{label}</span>
      <span className="text-xs text-muted-foreground dark:text-slate-400 font-medium truncate max-w-[140px] text-right shrink-0">{value}</span>
      <ChevronRight size={14} className="text-muted-foreground/40 dark:text-slate-600 group-hover:text-muted-foreground dark:group-hover:text-slate-400 transition-colors shrink-0" />
    </button>
  );
}

/* ─── Bottom-sheet con drag-to-close ─── */
function IOSModal({ open, onClose, title, children }) {
  const [dragY, setDragY] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const startY = useRef(0);

  useEffect(() => {
    if (!open) { setDragY(0); setIsClosing(false); }
  }, [open]);

  if (!open) return null;

  const handleStart = (e) => { startY.current = e.touches ? e.touches[0].clientY : e.clientY; };
  const handleMove  = (e) => {
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    const diff = y - startY.current;
    if (diff > 0) setDragY(diff);
  };
  const handleEnd = () => {
    if (dragY > 120) { setIsClosing(true); setTimeout(onClose, 200); }
    else setDragY(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div onClick={onClose} className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" />
      <div
        style={{
          transform: `translateY(${dragY}px)`,
          transition: isClosing ? "transform 0.2s ease" : dragY === 0 ? "transform 0.35s cubic-bezier(0.22,1,0.36,1)" : "none",
        }}
        onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={handleEnd}
        onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd}
        className="relative z-10 w-full bg-card dark:bg-slate-900 rounded-t-3xl border-t border-border/40 dark:border-slate-700/50 shadow-2xl dark:shadow-black/50 p-5 pb-8">
        <div className="w-10 h-1 bg-muted dark:bg-slate-700 rounded-full mx-auto mb-4" />
        <p className="text-center font-black text-sm tracking-tight mb-4 dark:text-slate-100">{title}</p>
        <div className="rounded-2xl overflow-hidden border border-border/60 dark:border-slate-700/50 divide-y divide-border/40 dark:divide-slate-700/40 bg-background dark:bg-slate-800/60">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─── Opción dentro del modal ─── */
function IOSOption({ label, desc, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 dark:hover:bg-slate-700/30 transition-colors text-left">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground dark:text-slate-100">{label}</p>
        {desc && <p className="text-xs text-muted-foreground dark:text-slate-400 mt-0.5 font-mono">{desc}</p>}
      </div>
      {active && <Check size={16} className="text-primary shrink-0" />}
    </button>
  );
}
