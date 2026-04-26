import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useTranslation } from "react-i18next";
import {
  Check,
  Type,
  Palette,
  ChevronRight,
  Sun,
  Monitor,
  Loader2,
} from "lucide-react";

import { useColorScheme } from "@mui/joy/styles";
import { useAppTheme } from "@/context/AppThemeContext";
import useIsMobile from "@/hooks/useIsMobile";
import { Button } from "@/components/ui/button";

import SystemPreview from "./components/SystemPreview.jsx";

/* ─── Constantes ─── */
const BRAND_COLORS = [
  { value: "default", label: "Azul Tecnasa", hex: "#0B6BCB" },
  { value: "indigo",  label: "Índigo",       hex: "#6366f1" },
  { value: "forest",  label: "Bosque",        hex: "#10b981" },
  { value: "teams",   label: "Teams",         hex: "#6264A7" },
  { value: "orange",  label: "Naranja",       hex: "#f97316" },
  { value: "rose",    label: "Rose",          hex: "#e11d48" },
  { value: "purple",  label: "Purple",        hex: "#a855f7" },
  { value: "cyan",    label: "Cyan",          hex: "#06b6d4" },
  { value: "slate",   label: "Slate",         hex: "#64748b" },
  { value: "neon",    label: "Neon",          hex: "#d946ef" },
];

const FONTS = [
  { value: "Poppins, sans-serif",                        label: "Poppins"   },
  { value: "Inter, ui-sans-serif, system-ui, sans-serif", label: "Inter"     },
  { value: "Roboto, system-ui, sans-serif",              label: "Roboto"    },
  { value: "'Fira Code', monospace",                     label: "Fira Code" },
];

const getHex = (val) =>
  BRAND_COLORS.find((c) => c.value === val)?.hex ?? BRAND_COLORS[0].hex;

/* ─── Componente principal ─── */
export default function Apariencia({ initialData = {}, onSave, ...props }) {
  const { t } = useTranslation();
  const { mode, setMode } = useColorScheme();
  const { brand, setBrand, font, setFont } = useAppTheme();

  const [selectedFont, setSelectedFont] = useState(font);
  const [savingFont, setSavingFont] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (initialData) {
      if (initialData.mode && initialData.mode !== mode) setMode(initialData.mode);
      if (initialData.brand && initialData.brand !== brand) setBrand(initialData.brand);
      if (initialData.font) {
        setFont(initialData.font);
        setSelectedFont(initialData.font);
      }
    }
  }, [initialData]);

  const handleModeChange = useCallback(
    async (newMode) => {
      setMode(newMode);
      try { await onSave({ mode: newMode }); }
      catch (e) { console.error("Error al guardar tema:", e); }
    },
    [onSave, setMode],
  );

  const handleBrandChange = useCallback(
    async (newBrand) => {
      setBrand(newBrand);
      try { await onSave({ brand: newBrand }); }
      catch (e) { console.error("Error al guardar color:", e); }
    },
    [onSave, setBrand],
  );

  const handleApplyFont = useCallback(async () => {
    setSavingFont(true);
    try {
      await onSave({ font: selectedFont });
      window.location.reload();
    } catch (error) {
      console.error("Error guardando fuente:", error);
      setSavingFont(false);
    }
  }, [onSave, selectedFont]);

  const brandHex = useMemo(() => getHex(brand), [brand]);
  const hasPendingFontChange = selectedFont !== font;

  const themeOptions = [
    {
      value: "system",
      label: t("settings.appearance.theme.system"),
      desc:  t("settings.appearance.theme.system_desc"),
    },
    {
      value: "dark",
      label: t("settings.appearance.theme.dark"),
      desc:  t("settings.appearance.theme.dark_desc"),
    },
    {
      value: "light",
      label: t("settings.appearance.theme.light"),
      desc:  t("settings.appearance.theme.light_desc"),
    },
  ];

  const sharedProps = {
    t,
    mode,
    brand,
    brandHex,
    selectedFont,
    setSelectedFont,
    handleModeChange,
    handleBrandChange,
    handleApplyFont,
    savingFont,
    hasPendingFontChange,
    themeOptions,
    brandColors: BRAND_COLORS,
    fonts: FONTS,
    ...props,
  };

  return isMobile
    ? <MobileAppearance {...sharedProps} />
    : <DesktopAppearance {...sharedProps} />;
}

/* ─── DESKTOP ─── */
function DesktopAppearance({
  t, mode, brandHex, brand,
  selectedFont, setSelectedFont,
  handleModeChange, handleBrandChange,
  themeOptions, brandColors, fonts,
  hasPendingFontChange, handleApplyFont, savingFont,
}) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-primary/10 dark:bg-primary/20 ring-1 ring-primary/20 dark:ring-primary/40 shrink-0">
          <Palette size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight leading-none dark:text-slate-100">
            {t("settings.appearance.title")}
          </h1>
          <p className="text-xs text-muted-foreground dark:text-slate-400 mt-0.5 font-medium">
            {t("settings.appearance.subtitle")}
          </p>
        </div>
      </div>

      {/* VISTA PREVIA */}
      <div className="bg-card dark:bg-slate-800/60 border border-border/60 dark:border-slate-700/60 rounded-3xl shadow-sm p-5">
        <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-border/40 dark:border-slate-700/50">
          <div className="p-1.5 bg-muted dark:bg-slate-700 rounded-xl">
            <Monitor size={14} className="text-muted-foreground dark:text-slate-400" />
          </div>
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400">
            Vista Previa
          </h2>
        </div>
        <div className="space-y-2.5" style={{ fontFamily: selectedFont }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl shrink-0 transition-colors duration-300"
              style={{ background: brandHex }}
            />
            <div>
              <p className="text-sm font-semibold text-foreground dark:text-slate-100">
                Texto principal
              </p>
              <p className="text-xs text-muted-foreground dark:text-slate-400">
                Texto secundario
              </p>
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-muted dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: "60%", background: brandHex }}
            />
          </div>
        </div>
      </div>

      {/* TEMA */}
      <div className="bg-card dark:bg-slate-800/60 border border-border/60 dark:border-slate-700/60 rounded-3xl shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2.5 pb-1">
          <div className="p-1.5 bg-muted dark:bg-slate-700 rounded-xl">
            <Sun size={14} className="text-muted-foreground dark:text-slate-400" />
          </div>
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400">
            {t("settings.appearance.theme.title")}
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {themeOptions.map((item) => (
            <button
              key={item.value}
              onClick={() => handleModeChange(item.value)}
              className={[
                "relative rounded-2xl overflow-hidden border transition-all duration-200",
                mode === item.value
                  ? "border-primary ring-2 ring-primary/25 dark:ring-primary/30"
                  : "border-border/60 dark:border-slate-700/60 hover:scale-[1.02] hover:border-primary/40",
              ].join(" ")}>
              <SystemPreview
                mode={item.value === "system" ? "light" : item.value}
                brandHex={brandHex}
                font={selectedFont}
              />
              <div className="px-3 py-2 text-left bg-background dark:bg-slate-900/60">
                <p className="text-sm font-semibold text-foreground dark:text-slate-100">
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground dark:text-slate-400">
                  {item.desc}
                </p>
              </div>
              {mode === item.value && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-md">
                  <Check size={11} className="text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* COLOR DE ACENTO */}
      <div className="bg-card dark:bg-slate-800/60 border border-border/60 dark:border-slate-700/60 rounded-3xl shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2.5 pb-1">
          <div className="p-1.5 bg-muted dark:bg-slate-700 rounded-xl">
            <Palette size={14} className="text-muted-foreground dark:text-slate-400" />
          </div>
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400">
            Color de Acento
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {brandColors.map((color) => (
            <button
              key={color.value}
              onClick={() => handleBrandChange(color.value)}
              title={color.label}
              className="relative w-9 h-9 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
              style={{ background: color.hex }}>
              {brand === color.value && (
                <span className="absolute inset-0 rounded-full flex items-center justify-center">
                  <Check size={14} className="text-white drop-shadow" />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* TIPOGRAFÍA */}
      <div className="bg-card dark:bg-slate-800/60 border border-border/60 dark:border-slate-700/60 rounded-3xl shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2.5 pb-1">
          <div className="p-1.5 bg-muted dark:bg-slate-700 rounded-xl">
            <Type size={14} className="text-muted-foreground dark:text-slate-400" />
          </div>
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400">
            Tipografía
          </h2>
        </div>
        <select
          value={selectedFont}
          onChange={(e) => setSelectedFont(e.target.value)}
          className="w-full rounded-xl border border-border dark:border-slate-700 px-4 py-2.5 text-sm bg-background dark:bg-slate-900/60 dark:text-slate-100 text-foreground outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all">
          {fonts.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>

        {hasPendingFontChange && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10">
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
              Cambios pendientes de aplicar
            </p>
            <Button
              onClick={handleApplyFont}
              disabled={savingFont}
              size="sm"
              className="rounded-xl h-8 px-4 font-bold gap-1.5 shrink-0 disabled:opacity-60">
              {savingFont && <Loader2 size={12} className="animate-spin" />}
              {savingFont ? "Aplicando..." : "Aplicar"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── MOBILE ─── */
function MobileAppearance({
  t, mode, brand, selectedFont,
  handleModeChange, handleBrandChange,
  setSelectedFont, brandColors, fonts, themeOptions,
}) {
  const [openTheme, setOpenTheme] = useState(false);
  const [openColor, setOpenColor] = useState(false);
  const [openFont,  setOpenFont]  = useState(false);

  const currentThemeLabel = themeOptions.find((o) => o.value === mode)?.label || mode;
  const currentColorLabel = brandColors.find((c) => c.value === brand)?.label || brand;
  const currentColorHex   = brandColors.find((c) => c.value === brand)?.hex;
  const currentFontLabel  = fonts.find((f) => f.value === selectedFont)?.label || "Poppins";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-primary/10 dark:bg-primary/20 ring-1 ring-primary/20 dark:ring-primary/40 shrink-0">
          <Palette size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight leading-none dark:text-slate-100">
            {t("settings.appearance.title")}
          </h1>
          <p className="text-xs text-muted-foreground dark:text-slate-400 mt-0.5 font-medium">
            {t("settings.appearance.subtitle")}
          </p>
        </div>
      </div>

      {/* LISTA */}
      <div className="bg-card dark:bg-slate-800/60 border border-border/60 dark:border-slate-700/60 rounded-3xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/60 dark:border-slate-700/50">
          <div className="p-1.5 bg-muted dark:bg-slate-700 rounded-xl">
            <Palette size={14} className="text-muted-foreground dark:text-slate-400" />
          </div>
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400">
            Personalización
          </h2>
        </div>

        <div className="divide-y divide-border/40 dark:divide-slate-700/50">
          <MobileRow
            icon={Sun}
            label={t("settings.appearance.theme.title")}
            value={currentThemeLabel}
            onClick={() => setOpenTheme(true)}
          />
          <MobileRow
            icon={Palette}
            label="Color de acento"
            value={currentColorLabel}
            valueLeft={
              currentColorHex ? (
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0"
                  style={{ background: currentColorHex }}
                />
              ) : null
            }
            onClick={() => setOpenColor(true)}
          />
          <MobileRow
            icon={Type}
            label="Tipografía"
            value={currentFontLabel}
            onClick={() => setOpenFont(true)}
          />
        </div>
      </div>

      {/* MODAL: TEMA */}
      <IOSModal
        open={openTheme}
        onClose={() => setOpenTheme(false)}
        title={t("settings.appearance.theme.title")}>
        {themeOptions.map((item) => (
          <IOSOption
            key={item.value}
            label={item.label}
            desc={item.desc}
            active={mode === item.value}
            onClick={() => {
              handleModeChange(item.value);
              setOpenTheme(false);
            }}
          />
        ))}
      </IOSModal>

      {/* MODAL: COLOR */}
      <IOSModal
        open={openColor}
        onClose={() => setOpenColor(false)}
        title="Color de acento">
        {brandColors.map((c) => (
          <IOSOption
            key={c.value}
            label={c.label}
            active={brand === c.value}
            left={
              <div
                className="w-4 h-4 rounded-full shrink-0"
                style={{ background: c.hex }}
              />
            }
            onClick={() => {
              handleBrandChange(c.value);
              setOpenColor(false);
            }}
          />
        ))}
      </IOSModal>

      {/* MODAL: FUENTE */}
      <IOSModal
        open={openFont}
        onClose={() => setOpenFont(false)}
        title="Tipografía">
        {fonts.map((f) => (
          <IOSOption
            key={f.value}
            label={f.label}
            active={selectedFont === f.value}
            style={{ fontFamily: f.value }}
            onClick={() => {
              setSelectedFont(f.value);
              setOpenFont(false);
            }}
          />
        ))}
      </IOSModal>
    </div>
  );
}

/* ─── Fila de opción móvil ─── */
function MobileRow({ icon: Icon, label, value, valueLeft, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-muted/30 dark:hover:bg-slate-700/30 active:scale-[0.99] transition-all duration-150 group">
      <div className="p-1.5 bg-muted/60 dark:bg-slate-700/60 rounded-xl shrink-0">
        <Icon size={13} className="text-muted-foreground dark:text-slate-400" />
      </div>
      <span className="flex-1 text-sm font-semibold text-foreground dark:text-slate-100">
        {label}
      </span>
      <div className="flex items-center gap-1.5 shrink-0">
        {valueLeft}
        <span className="text-xs text-muted-foreground dark:text-slate-400 font-medium">
          {value}
        </span>
      </div>
      <ChevronRight
        size={14}
        className="text-muted-foreground/40 dark:text-slate-600 group-hover:text-muted-foreground dark:group-hover:text-slate-400 transition-colors shrink-0"
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
function IOSOption({ label, desc, active, onClick, left, style }) {
  return (
    <button
      onClick={onClick}
      style={style}
      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 dark:hover:bg-slate-700/30 transition-colors text-left">
      {left && <div className="shrink-0">{left}</div>}
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
