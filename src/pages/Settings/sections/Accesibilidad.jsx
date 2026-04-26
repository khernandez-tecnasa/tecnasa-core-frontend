import React, { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import useIsMobile from "@/hooks/useIsMobile";
import {
  Type,
  Contrast,
  Sparkles,
  ChevronRight,
  Accessibility,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Accesibilidad({ initialData, onSave, saving }) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const [baseState, setBaseState] = useState({
    fontSize:      "medium",
    reducedMotion: false,
    highContrast:  false,
  });

  const [form, setForm] = useState(baseState);
  const [openFont, setOpenFont] = useState(false);

  useEffect(() => {
    if (initialData) {
      const data = {
        fontSize:      initialData.fontSize      || "medium",
        reducedMotion: initialData.reducedMotion || false,
        highContrast:  initialData.highContrast  || false,
      };
      setBaseState(data);
      setForm(data);
    }
  }, [initialData]);

  /* Live preview */
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.style.fontSize =
      form.fontSize === "small" ? "90%" : form.fontSize === "large" ? "110%" : "100%";
    body.classList.toggle("reduce-motion", form.reducedMotion);
    body.classList.toggle("high-contrast", form.highContrast);
  }, [form]);

  const hasChanges = useMemo(
    () => JSON.stringify(baseState) !== JSON.stringify(form),
    [baseState, form],
  );

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveClick = async () => {
    await onSave(form);
    setBaseState(form);
  };

  const fontSizeLabel = (s) =>
    s === "small" ? "Pequeño" : s === "large" ? "Grande" : "Normal";

  /* ─── MOBILE ─── */
  if (isMobile) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* HEADER */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-primary/10 dark:bg-primary/20 ring-1 ring-primary/20 dark:ring-primary/40 shrink-0">
            <Accessibility size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight leading-none dark:text-slate-100">
              {t("settings.accessibility.title")}
            </h1>
            <p className="text-xs text-muted-foreground dark:text-slate-400 mt-0.5 font-medium">
              {t("settings.accessibility.subtitle")}
            </p>
          </div>
        </div>

        {/* OPCIONES */}
        <div className="bg-card dark:bg-slate-800/60 border border-border/60 dark:border-slate-700/60 rounded-3xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/60 dark:border-slate-700/50">
            <div className="p-1.5 bg-muted dark:bg-slate-700 rounded-xl">
              <Accessibility size={14} className="text-muted-foreground dark:text-slate-400" />
            </div>
            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400">
              Preferencias
            </h2>
          </div>

          <div className="divide-y divide-border/40 dark:divide-slate-700/50">
            {/* Tamaño de texto → abre modal */}
            <button
              onClick={() => setOpenFont(true)}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-muted/30 dark:hover:bg-slate-700/30 active:scale-[0.99] transition-all duration-150 group">
              <div className="p-1.5 bg-muted/60 dark:bg-slate-700/60 rounded-xl shrink-0">
                <Type size={13} className="text-muted-foreground dark:text-slate-400" />
              </div>
              <span className="flex-1 text-sm font-semibold text-foreground dark:text-slate-100">
                Tamaño de texto
              </span>
              <span className="text-xs text-muted-foreground dark:text-slate-400 font-medium">
                {fontSizeLabel(form.fontSize)}
              </span>
              <ChevronRight
                size={14}
                className="text-muted-foreground/40 dark:text-slate-600 group-hover:text-muted-foreground transition-colors shrink-0"
              />
            </button>

            {/* Reducir animaciones */}
            <div className="flex items-center gap-3 px-5 py-3.5">
              <div className="p-1.5 bg-muted/60 dark:bg-slate-700/60 rounded-xl shrink-0">
                <Sparkles size={13} className="text-muted-foreground dark:text-slate-400" />
              </div>
              <span className="flex-1 text-sm font-semibold text-foreground dark:text-slate-100">
                Reducir animaciones
              </span>
              <ToggleSwitch
                checked={form.reducedMotion}
                onChange={() => handleChange("reducedMotion", !form.reducedMotion)}
              />
            </div>

            {/* Alto contraste */}
            <div className="flex items-center gap-3 px-5 py-3.5">
              <div className="p-1.5 bg-muted/60 dark:bg-slate-700/60 rounded-xl shrink-0">
                <Contrast size={13} className="text-muted-foreground dark:text-slate-400" />
              </div>
              <span className="flex-1 text-sm font-semibold text-foreground dark:text-slate-100">
                Alto contraste
              </span>
              <ToggleSwitch
                checked={form.highContrast}
                onChange={() => handleChange("highContrast", !form.highContrast)}
              />
            </div>
          </div>
        </div>

        {/* GUARDAR */}
        {hasChanges && (
          <Button
            onClick={handleSaveClick}
            disabled={saving}
            className="w-full rounded-2xl h-11 font-bold gap-2 shadow-md shadow-primary/15 disabled:opacity-60">
            {saving && <Loader2 size={15} className="animate-spin" />}
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        )}

        {/* MODAL: TAMAÑO DE TEXTO */}
        <IOSModal
          open={openFont}
          onClose={() => setOpenFont(false)}
          title="Tamaño de texto">
          {["small", "medium", "large"].map((size) => (
            <IOSOption
              key={size}
              label={fontSizeLabel(size)}
              desc={size === "small" ? "Texto más compacto" : size === "large" ? "Texto más grande" : "Tamaño predeterminado"}
              active={form.fontSize === size}
              onClick={() => {
                handleChange("fontSize", size);
                setOpenFont(false);
              }}
            />
          ))}
        </IOSModal>
      </div>
    );
  }

  /* ─── DESKTOP ─── */
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-primary/10 dark:bg-primary/20 ring-1 ring-primary/20 dark:ring-primary/40 shrink-0">
          <Accessibility size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight leading-none dark:text-slate-100">
            {t("settings.accessibility.title")}
          </h1>
          <p className="text-xs text-muted-foreground dark:text-slate-400 mt-0.5 font-medium">
            {t("settings.accessibility.subtitle")}
          </p>
        </div>
      </div>

      {/* CARD DE OPCIONES */}
      <div className="bg-card dark:bg-slate-800/60 border border-border/60 dark:border-slate-700/60 rounded-3xl shadow-sm p-5 space-y-5">
        <div className="flex items-center gap-2.5 pb-1">
          <div className="p-1.5 bg-muted dark:bg-slate-700 rounded-xl">
            <Accessibility size={14} className="text-muted-foreground dark:text-slate-400" />
          </div>
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400">
            Preferencias de visualización
          </h2>
        </div>

        {/* Tamaño de texto */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 bg-muted/60 dark:bg-slate-700/60 rounded-xl shrink-0">
              <Type size={15} className="text-muted-foreground dark:text-slate-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground dark:text-slate-100 leading-none">
                Tamaño de texto
              </p>
              <p className="text-xs text-muted-foreground dark:text-slate-400 mt-0.5">
                Ajusta la legibilidad del contenido
              </p>
            </div>
          </div>
          <div className="flex gap-1.5 shrink-0">
            {["small", "medium", "large"].map((size) => {
              const active = form.fontSize === size;
              return (
                <button
                  key={size}
                  onClick={() => handleChange("fontSize", size)}
                  className={[
                    "px-3 py-1.5 rounded-xl text-sm font-bold transition-all duration-150 border",
                    active
                      ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                      : "border-border/60 dark:border-slate-700/60 text-muted-foreground dark:text-slate-400 hover:bg-muted/60 dark:hover:bg-slate-700/40",
                  ].join(" ")}>
                  {size === "small" ? "A" : size === "medium" ? "Aa" : "Aaa"}
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-border/40 dark:bg-slate-700/50" />

        {/* Reducir animaciones */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 bg-muted/60 dark:bg-slate-700/60 rounded-xl shrink-0">
              <Sparkles size={15} className="text-muted-foreground dark:text-slate-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground dark:text-slate-100 leading-none">
                Reducir animaciones
              </p>
              <p className="text-xs text-muted-foreground dark:text-slate-400 mt-0.5">
                Menos movimiento en la interfaz
              </p>
            </div>
          </div>
          <ToggleSwitch
            checked={form.reducedMotion}
            onChange={() => handleChange("reducedMotion", !form.reducedMotion)}
          />
        </div>

        <div className="h-px bg-border/40 dark:bg-slate-700/50" />

        {/* Alto contraste */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 bg-muted/60 dark:bg-slate-700/60 rounded-xl shrink-0">
              <Contrast size={15} className="text-muted-foreground dark:text-slate-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground dark:text-slate-100 leading-none">
                Alto contraste
              </p>
              <p className="text-xs text-muted-foreground dark:text-slate-400 mt-0.5">
                Mejora la visibilidad del contenido
              </p>
            </div>
          </div>
          <ToggleSwitch
            checked={form.highContrast}
            onChange={() => handleChange("highContrast", !form.highContrast)}
          />
        </div>
      </div>

      {/* GUARDAR */}
      {hasChanges && (
        <div className="flex justify-end">
          <Button
            onClick={handleSaveClick}
            disabled={saving}
            className="rounded-2xl h-10 px-6 font-bold gap-2 shadow-md shadow-primary/15 disabled:opacity-60">
            {saving && <Loader2 size={15} className="animate-spin" />}
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─── Toggle switch ─── */
function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      className={[
        "shrink-0 w-10 h-6 rounded-full transition-colors relative",
        checked ? "bg-primary" : "bg-muted dark:bg-slate-700",
      ].join(" ")}>
      <span
        className={[
          "absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-4" : "",
        ].join(" ")}
      />
    </button>
  );
}

/* ─── Bottom-sheet con drag-to-close ─── */
function IOSModal({ open, onClose, title, children }) {
  const [dragY, setDragY] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const startY = useRef(0);

  useEffect(() => {
    if (!open) {
      setDragY(0);
      setIsClosing(false);
    }
  }, [open]);

  if (!open) return null;

  const handleStart = (e) => {
    startY.current = e.touches ? e.touches[0].clientY : e.clientY;
  };

  const handleMove = (e) => {
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    const diff = y - startY.current;
    if (diff > 0) setDragY(diff);
  };

  const handleEnd = () => {
    if (dragY > 120) {
      setIsClosing(true);
      setTimeout(onClose, 200);
    } else {
      setDragY(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
      />
      <div
        style={{
          transform: `translateY(${dragY}px)`,
          transition: isClosing
            ? "transform 0.2s ease"
            : dragY === 0
              ? "transform 0.35s cubic-bezier(0.22,1,0.36,1)"
              : "none",
        }}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        className="relative z-10 w-full bg-card dark:bg-slate-900 rounded-t-3xl border-t border-border/40 dark:border-slate-700/50 shadow-2xl dark:shadow-black/50 p-5 pb-8">
        <div className="w-10 h-1 bg-muted dark:bg-slate-700 rounded-full mx-auto mb-4" />
        <p className="text-center font-black text-sm tracking-tight mb-4 dark:text-slate-100">
          {title}
        </p>
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
        <p className="text-sm font-semibold text-foreground dark:text-slate-100">
          {label}
        </p>
        {desc && (
          <p className="text-xs text-muted-foreground dark:text-slate-400 mt-0.5">
            {desc}
          </p>
        )}
      </div>
      {active && <Check size={16} className="text-primary shrink-0" />}
    </button>
  );
}
