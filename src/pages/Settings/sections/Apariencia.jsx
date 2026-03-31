import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useTranslation } from "react-i18next";
import { Check, Type, Palette, ChevronRight, ChevronLeft } from "lucide-react";

import { SectionHeader } from "./_shared/SectionHeader.jsx";
import { useColorScheme } from "@mui/joy/styles";
import { useAppTheme } from "@/context/AppThemeContext";
import { useSettings } from "../../../context/SettingsContext.jsx";
import useIsMobile from "@/hooks/useIsMobile";

import SystemPreview from "./components/SystemPreview.jsx";

/* ----- Constantes ----- */
const BRAND_COLORS = [
  { value: "default", label: "Azul Tecnasa", hex: "#0B6BCB" },
  { value: "indigo", label: "Índigo", hex: "#6366f1" },
  { value: "forest", label: "Bosque", hex: "#10b981" },
  { value: "teams", label: "Teams", hex: "#6264A7" },
  { value: "orange", label: "Naranja", hex: "#f97316" },
  { value: "rose", label: "Rose", hex: "#e11d48" },
  { value: "purple", label: "Purple", hex: "#a855f7" },
  { value: "cyan", label: "Cyan", hex: "#06b6d4" },
  { value: "slate", label: "Slate", hex: "#64748b" },
  { value: "neon", label: "Neon", hex: "#d946ef" },
];

const FONTS = [
  { value: "Poppins, sans-serif", label: "Poppins" },
  { value: "Inter, ui-sans-serif, system-ui, sans-serif", label: "Inter" },
  { value: "Roboto, system-ui, sans-serif", label: "Roboto" },
  { value: "'Fira Code', monospace", label: "Fira Code" },
];

const getHex = (val) =>
  BRAND_COLORS.find((c) => c.value === val)?.hex ?? BRAND_COLORS[0].hex;

export default function Apariencia({ initialData = {}, onSave, ...props }) {
  const { t } = useTranslation();
  const { mode, setMode } = useColorScheme();
  const { brand, setBrand, font, setFont } = useAppTheme();

  const [selectedFont, setSelectedFont] = useState(font);
  const [savingFont, setSavingFont] = useState(false);
  const isMobile = useIsMobile();

  // Sincronización inicial
  useEffect(() => {
    if (initialData) {
      if (initialData.mode && initialData.mode !== mode)
        setMode(initialData.mode);
      if (initialData.brand && initialData.brand !== brand)
        setBrand(initialData.brand);
      if (initialData.font) {
        setFont(initialData.font);
        setSelectedFont(initialData.font);
      }
    }
  }, [initialData]);

  const handleModeChange = useCallback(
    async (newMode) => {
      setMode(newMode);
      try {
        await onSave({ mode: newMode });
      } catch (e) {
        console.error("Error al guardar tema:", e);
      }
    },
    [onSave, setMode],
  );

  const handleBrandChange = useCallback(
    async (newBrand) => {
      setBrand(newBrand);
      try {
        await onSave({ brand: newBrand });
      } catch (e) {
        console.error("Error al guardar color:", e);
      }
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

  // Opciones de tema traducidas
  const themeOptions = [
    {
      value: "system",
      label: t("settings.appearance.theme.system"),
      desc: t("settings.appearance.theme.system_desc"),
    },
    {
      value: "dark",
      label: t("settings.appearance.theme.dark"),
      desc: t("settings.appearance.theme.dark_desc"),
    },
    {
      value: "light",
      label: t("settings.appearance.theme.light"),
      desc: t("settings.appearance.theme.light_desc"),
    },
  ];

  // Agrupamos todo para los hijos
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

  return isMobile ? (
    <MobileAppearance {...sharedProps} />
  ) : (
    <DesktopAppearance {...sharedProps} />
  );
}

/* ----- DESKTOP VERSION ----- */
function DesktopAppearance(props) {
  const {
    t,
    mode,
    brandHex,
    brand,
    selectedFont,
    setSelectedFont,
    handleModeChange,
    handleBrandChange,
    themeOptions,
    brandColors,
    fonts,
    hasPendingFontChange,
    handleApplyFont,
    savingFont,
  } = props;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <SectionHeader
        title={t("settings.appearance.title")}
        subtitle={t("settings.appearance.subtitle")}
      />

      {/* PREVIEW GLOBAL */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] dark:bg-[var(--popover)] p-5 shadow-sm">
        <div className="space-y-2" style={{ fontFamily: selectedFont }}>
          <p className="text-lg font-semibold text-[var(--foreground)]">
            Vista previa
          </p>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl"
              style={{ background: brandHex }}
            />
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">
                Texto principal
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Texto secundario
              </p>
            </div>
          </div>
          <div className="h-2 rounded-full bg-[var(--muted)] overflow-hidden">
            <div
              className="h-full"
              style={{ width: "60%", background: brandHex }}
            />
          </div>
        </div>
      </div>

      {/* TEMA */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-[var(--foreground)]">
          {t("settings.appearance.theme.title")}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {themeOptions.map((item) => (
            <button
              key={item.value}
              onClick={() => handleModeChange(item.value)}
              className={`relative rounded-2xl overflow-hidden border border-[var(--border)] transition-all duration-200 ${
                mode === item.value
                  ? "border-[hsl(var(--primary))] ring-2 ring-[hsl(var(--primary))]/30"
                  : "border-[var(--border)] hover:scale-[1.02]"
              }`}>
              <SystemPreview
                mode={item.value === "system" ? "light" : item.value}
                brandHex={brandHex}
                font={selectedFont}
              />
              <div className="px-3 py-2 text-left bg-[var(--background)]">
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {item.label}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {item.desc}
                </p>
              </div>
              {mode === item.value && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center text-white text-xs shadow">
                  ✓
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* COLOR ACENTO */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] dark:bg-[var(--popover)] p-5 space-y-4">
        <p className="text-sm font-medium flex items-center gap-2 text-[var(--foreground)]">
          <Palette size={18} /> Color de acento
        </p>
        <div className="flex flex-wrap gap-3">
          {brandColors.map((color) => (
            <button
              key={color.value}
              onClick={() => handleBrandChange(color.value)}
              className="relative w-10 h-10 rounded-full transition hover:scale-110"
              style={{ background: color.hex }}>
              {brand === color.value && (
                <span className="absolute inset-0 rounded-full ring-2 ring-offset-2 ring-[var(--background)] border-2 border-white" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* TIPOGRAFÍA */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] dark:bg-[var(--popover)] overflow-hidden">
        <div className="px-5 py-4">
          <p className="text-sm font-medium flex items-center gap-2 text-[var(--foreground)]">
            <Type size={18} /> Tipografía
          </p>
        </div>
        <div className="p-5 space-y-4">
          <select
            value={selectedFont}
            onChange={(e) => setSelectedFont(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-[var(--border)] dark:bg-[var(--secondary)] text-sm text-[var(--muted-foreground)] focus:ring-2 focus:ring-[hsl(var(--primary))]">
            {fonts.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>

          {hasPendingFontChange && (
            <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 flex items-center justify-between">
              <p className="text-sm">Cambios pendientes</p>
              <button
                onClick={handleApplyFont}
                className="px-4 py-2 rounded-lg bg-[hsl(var(--primary))] text-white text-sm">
                {savingFont ? "Aplicando..." : "Aplicar"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ----- MOBILE VERSION ----- */
// function MobileAppearance(props) {
//   const [screen, setScreen] = useState("main");
//   const {
//     mode,
//     brand,
//     selectedFont,
//     handleModeChange,
//     handleBrandChange,
//     setSelectedFont,
//     brandColors,
//     fonts,
//   } = props;

//   const translateValue = { main: 0, theme: 25, color: 50, font: 75 }[screen];

//   return (
//     <div className="relative overflow-hidden w-full">
//       <div
//         className="flex transition-transform duration-300"
//         style={{ width: "400%", transform: `translateX(-${translateValue}%)` }}>
//         <div className="w-1/4 shrink-0 px-1">
//           <MainScreen setScreen={setScreen} />
//         </div>
//         <div className="w-1/4 shrink-0 px-1">
//           <ThemeScreen
//             value={mode}
//             onBack={() => setScreen("main")}
//             onChange={(val) => {
//               handleModeChange(val);
//               setScreen("main");
//             }}
//           />
//         </div>
//         <div className="w-1/4 shrink-0 px-1">
//           <ColorScreen
//             value={brand}
//             colors={brandColors}
//             onBack={() => setScreen("main")}
//             onChange={(val) => {
//               handleBrandChange(val);
//               setScreen("main");
//             }}
//           />
//         </div>
//         <div className="w-1/4 shrink-0 px-1">
//           <FontScreen
//             value={selectedFont}
//             fonts={fonts}
//             onBack={() => setScreen("main")}
//             onChange={(val) => {
//               setSelectedFont(val);
//               setScreen("main");
//             }}
//           />
//         </div>
//       </div>
//     </div>
//   );
// }

function MobileAppearance(props) {
  const {
    t,
    mode,
    brand,
    selectedFont,
    handleModeChange,
    handleBrandChange,
    setSelectedFont,
    brandColors,
    fonts,
  } = props;

  const [openTheme, setOpenTheme] = useState(false);
  const [openColor, setOpenColor] = useState(false);
  const [openFont, setOpenFont] = useState(false);

  return (
    <div className="space-y-4">
      <SectionHeader
        title={t("settings.appearance.title")}
        subtitle={t("settings.appearance.subtitle")}
      />

      {/* LISTA estilo iOS */}
      <div className="">
        <MobileSection title="Tema">
          <IOSRow label="Tema" onClick={() => setOpenTheme(true)} />
          <IOSRow label="Color de acento" onClick={() => setOpenColor(true)} />
          <IOSRow label="Tipografía" onClick={() => setOpenFont(true)} />
        </MobileSection>
      </div>

      {/* MODALES */}
      <IOSModal
        open={openTheme}
        onClose={() => setOpenTheme(false)}
        title="Tema">
        {["system", "light", "dark"].map((val) => (
          <IOSOption
            key={val}
            label={val}
            active={mode === val}
            onClick={() => {
              handleModeChange(val);
              setOpenTheme(false);
            }}
          />
        ))}
      </IOSModal>

      <IOSModal
        open={openColor}
        onClose={() => setOpenColor(false)}
        title="Color">
        {brandColors.map((c) => (
          <IOSOption
            key={c.value}
            label={c.label}
            active={brand === c.value}
            left={
              <div
                className="w-4 h-4 rounded-full"
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

function IOSRow({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="
        w-full flex items-center justify-between
        px-4 py-4 text-[15px]
        active:bg-gray-100 dark:active:bg-neutral-800
        transition-colors
        dark:bg-[var(--popover)]
      ">
      <span>{label}</span>
      <ChevronRight size={18} className="text-gray-400" />
    </button>
  );
}

// function IOSModal({ open, onClose, title, children }) {
//   if (!open) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-end">
//       {/* OVERLAY */}
//       <div className="absolute inset-0 bg-black/40 z-0" onClick={onClose} />

//       {/* MODAL */}
//       <div
//         className="
//           relative z-10 w-full
//           rounded-t-3xl
//           bg-[var(--popover)]
//           p-5
//           animate-ios-forward
//         ">
//         <div className="w-10 h-1.5 bg-[var(--muted)] rounded-full mx-auto mb-4" />

//         <p className="text-center font-medium mb-4">{title}</p>

//         <div className="rounded-2xl overflow-hidden">{children}</div>
//       </div>
//     </div>
//   );
// }

function IOSModal({ open, onClose, title, children }) {
  const [dragY, setDragY] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  const startY = useRef(0);
  const currentY = useRef(0);

  useEffect(() => {
    if (!open) {
      setDragY(0);
      setIsClosing(false);
    }
  }, [open]);

  if (!open) return null;

  // 🖐 START
  const handleStart = (e) => {
    startY.current = e.touches ? e.touches[0].clientY : e.clientY;
  };

  // 🖐 MOVE
  const handleMove = (e) => {
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    currentY.current = y;

    const diff = y - startY.current;

    if (diff > 0) {
      setDragY(diff);
    }
  };

  // 🖐 END
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
      {/* 🔥 BACKDROP (BLUR REAL) */}
      <div
        onClick={onClose}
        className="
          absolute inset-0
          bg-black/30
          backdrop-blur-sm
          transition-opacity
        "
      />

      {/* 🔥 MODAL */}
      <div
        style={{
          transform: `translateY(${dragY}px)`,
          transition: isClosing
            ? "transform 0.2s ease"
            : dragY === 0
              ? "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)"
              : "none",
        }}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        className="
          relative z-10 w-full
          rounded-t-3xl
          bg-[var(--background)]
          dark:bg-[var(--popover)]
          border-t border-[var(--border)]
          p-5
          shadow-2xl
        ">
        {/* HANDLE */}
        <div className="w-10 h-1.5 bg-[var(--muted)] rounded-full mx-auto mb-4" />

        {/* TITLE */}
        <p className="text-center font-semibold mb-4 text-[var(--foreground)]">
          {title}
        </p>

        {/* CONTENT */}
        <div className="rounded-2xl overflow-hidden bg-[var(--popover)]">
          {children}
        </div>
      </div>
    </div>
  );
}

function IOSOption({ label, active, onClick, left, style }) {
  return (
    <button
      onClick={onClick}
      style={style}
      className="
        w-full flex items-center justify-between
        px-4 py-4 text-sm
        bg-[var(--popover)]
        hover:bg-[var(--muted)]
        transition
      ">
      <div className="flex items-center gap-3">
        {left}
        <span>{label}</span>
      </div>

      {active && <Check size={18} className="text-[hsl(var(--primary))]" />}
    </button>
  );
}

/* ----- MINI COMPONENTES MÓVIL ----- */
function MainScreen({ setScreen }) {
  const { t } = useTranslation();
  return (
    <div>
      {/* HEADER estilo iOS */}
      <SectionHeader
        title={t("settings.appearance.title")}
        subtitle={t("settings.appearance.subtitle")}
      />

      {/* SECCIÓN */}
      <div
        className="rounded-2xl
         overflow-hidden divide-y text-[var(--muted-foreground)]">
        <MobileSection title="Tema">
          <Item label="Tema" onClick={() => setScreen("theme")} />
          <Item label="Color de acento" onClick={() => setScreen("color")} />
          <Item label="Tipografía" onClick={() => setScreen("font")} />
        </MobileSection>
      </div>
    </div>
  );
}

function Item({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="
        w-full flex items-center justify-between
        px-4 py-4 text-[15px]
        active:bg-gray-100 dark:active:bg-neutral-800
        transition-colors
      ">
      <span>{label}</span>
      <ChevronRight size={18} className="text-gray-400" />
    </button>
  );
}

function ScreenHeader({ title, onBack }) {
  return (
    <div
      onClick={onBack}
      className="sticky top-0 z-10 backdrop-blur py-3 flex items-center text-[var(--muted-foreground)] border-b-2 mb-6">
      <ChevronLeft size={26} />

      <h3
        className="absolute text-sm font-semibold
          left-1/2 -translate-x-1/2">
        {title}
      </h3>
    </div>
  );
}

function MobileSection({ title, children }) {
  return (
    <div>
      <p className="text-xs text-[var(--muted-foreground)] px-2 mb-2 pt-4 uppercase">
        {title}
      </p>
      <div
        className="
        overflow-hidden
        bg-[var(--background)]
        dark:bg-[var(--popover)]
        divide-y
        rounded-2xl
        border
        border-[var(--border)]
        mt-2">
        {children}
      </div>
    </div>
  );
}

function ThemeScreen({ value, onChange, onBack }) {
  const options = [
    { v: "system", l: "Sistema" },
    { v: "light", l: "Claro" },
    { v: "dark", l: "Oscuro" },
  ];

  return (
    <div className="rounded-2xl min-h-[300px] p-4">
      <ScreenHeader title="Tema" onBack={onBack} />

      <div className="">
        <div className="border rounded-2xl bg-[var(--background)] dark:bg-[var(--popover)] overflow-hidden divide-y text-[var(--muted-foreground)]">
          {options.map((opt) => (
            <button
              key={opt.v}
              onClick={() => onChange(opt.v)}
              className="w-full flex justify-between px-4 py-4 text-[15px] border-b last:border-0">
              <span>{opt.l}</span>

              {value === opt.v && (
                <Check size={18} className="text-[hsl(var(--primary))]" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ColorScreen({ value, onChange, onBack, colors }) {
  return (
    <div className="rounded-2xl text-[var(--muted-foreground)]">
      <ScreenHeader title="Color" onBack={onBack} />
      <div className="">
        <div className="bg-[var(--background)] dark:bg-[var(--popover)] border divide-y rounded-2xl">
          {colors.map((c) => (
            <button
              key={c.value}
              onClick={() => onChange(c.value)}
              className="flex items-center justify-between w-full px-4 py-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full"
                  style={{ background: c.hex }}
                />
                <span className="text-sm">{c.label}</span>
              </div>
              {value === c.value && (
                <Check size={18} className="text-[hsl(var(--primary))]" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FontScreen({ value, onChange, onBack, fonts }) {
  return (
    <div className="rounded-2xl">
      <ScreenHeader title="Tipografía" onBack={onBack} />
      <div className="">
        <div className="divide-y rounded-3xl bg-[var(--background)] dark:bg-[var(--popover)] text-[var(--muted-foreground)] border">
          {fonts.map((f) => (
            <button
              key={f.value}
              onClick={() => onChange(f.value)}
              className="w-full flex justify-between px-4 py-4"
              style={{ fontFamily: f.value }}>
              <span className="text-sm">{f.label}</span>
              {value === f.value && (
                <Check size={18} className="text-[hsl(var(--primary))]" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
