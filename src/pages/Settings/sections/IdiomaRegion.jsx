import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  Stack,
  Typography,
  Divider,
  Box,
  Select,
  Option,
  RadioGroup,
  Sheet,
  Radio,
  FormControl,
  FormLabel,
  Snackbar,
  Alert,
  Chip,
  Button,
} from "@mui/joy";
import {
  Clock,
  Calendar,
  Check,
  MapPin,
  Languages,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import { SectionHeader } from "./_shared/SectionHeader.jsx";
import useIsMobile from "@/hooks/useIsMobile";

/* ----- Constantes ----- */
const LANGUAGES = [
  { code: "es-HN", label: "Español (Honduras)", flag: "🇭🇳" },
  { code: "es-MX", label: "Español (Latinoamérica)", flag: "🇲🇽" },
  { code: "en-US", label: "English (United States)", flag: "🇺🇸" },
];

const TIMEZONES = [
  { value: "America/Tegucigalpa", label: "(GMT-06:00) Tegucigalpa" },
  { value: "America/Mexico_City", label: "(GMT-06:00) Ciudad de México" },
  { value: "America/Bogota", label: "(GMT-05:00) Bogotá, Lima, Quito" },
  { value: "America/New_York", label: "(GMT-05:00) Nueva York" },
  { value: "UTC", label: "(GMT+00:00) UTC" },
];

const DATE_FORMATS = [
  { value: "DD/MM/YYYY", label: "31/12/2025" },
  { value: "MM/DD/YYYY", label: "12/31/2025" },
  { value: "YYYY-MM-DD", label: "2025-12-31" },
];

/* ----- Helper: Intl Preview ----- */
const formatPreview = (dateFormat, timeFormat, locale, timezone) => {
  const now = new Date();
  const timeOptions = {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: timeFormat === "12h",
  };
  const datePartsOptions = {
    timeZone: timezone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  };

  try {
    const timeStr = new Intl.DateTimeFormat(locale, timeOptions).format(now);
    const parts = new Intl.DateTimeFormat(
      locale,
      datePartsOptions,
    ).formatToParts(now);
    const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    const { day = "31", month = "12", year = "2025" } = map;

    let dateStr = `${day}/${month}/${year}`;
    if (dateFormat === "MM/DD/YYYY") dateStr = `${month}/${day}/${year}`;
    else if (dateFormat === "YYYY-MM-DD") dateStr = `${year}-${month}-${day}`;

    return { dateStr, timeStr };
  } catch (err) {
    return { dateStr: "--/--/----", timeStr: "--:--" };
  }
};

/* ----- Subcomponente: TimeOption ----- */
function TimeOption({ value, checked, example, label, onSelect }) {
  return (
    <Sheet
      component="button"
      type="button"
      onClick={() => onSelect(value)}
      variant={checked ? "soft" : "outlined"}
      sx={{
        p: 1.5,
        borderRadius: "md",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        flex: 1,
        border: checked ? "2px solid" : "1px solid",
        borderColor: checked ? "primary.500" : "divider",
        transition: "transform .12s",
        "&:hover": { transform: "translateY(-2px)" },
        position: "relative",
        textAlign: "left",
      }}>
      <Clock size={20} />
      <Box>
        <Typography level="title-sm">{label}</Typography>
        <Typography level="body-xs">{example}</Typography>
      </Box>
      {checked && <Check size={16} style={{ marginLeft: "auto" }} />}
    </Sheet>
  );
}

/* ----- Componente Principal ----- */
export default function IdiomaRegion({ initialData = {}, onSave }) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const saveTimersRef = useRef({});

  const [form, setForm] = useState({
    language: "es-HN",
    timezone: "America/Tegucigalpa",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12h",
  });

  const [selectedLanguage, setSelectedLanguage] = useState("es-HN");
  const [savingLanguage, setSavingLanguage] = useState(false);
  const [snack, setSnack] = useState({
    open: false,
    severity: "success",
    message: "",
  });

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      const newData = {
        language: initialData.language || "es-HN",
        timezone: initialData.timezone || "America/Tegucigalpa",
        dateFormat: initialData.dateFormat || "DD/MM/YYYY",
        timeFormat: initialData.timeFormat || "12h",
      };
      setForm(newData);
      setSelectedLanguage(newData.language);
    }
  }, [initialData]);

  const handleChange = useCallback(
    (key, value) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      if (saveTimersRef.current[key]) clearTimeout(saveTimersRef.current[key]);

      saveTimersRef.current[key] = setTimeout(async () => {
        try {
          if (onSave) await onSave({ [key]: value });
        } catch (error) {
          setSnack({
            open: true,
            severity: "error",
            message: t("settings.region.error_save"),
          });
        }
      }, 450);
    },
    [onSave, t],
  );

  const handleApplyLanguage = async () => {
    setSavingLanguage(true);
    try {
      if (onSave) await onSave({ language: selectedLanguage });
      // Aquí podrías disparar i18n.changeLanguage o window.location.reload()
      window.location.reload();
    } catch (error) {
      setSnack({
        open: true,
        severity: "error",
        message: t("settings.region.language.error"),
      });
      setSavingLanguage(false);
    }
  };

  const preview = useMemo(
    () =>
      formatPreview(
        form.dateFormat,
        form.timeFormat,
        selectedLanguage,
        form.timezone,
      ),
    [form.dateFormat, form.timeFormat, form.timezone, selectedLanguage],
  );

  const propsCalculados = {
    t,
    form,
    handleChange,
    selectedLanguage,
    setSelectedLanguage,
    handleApplyLanguage,
    savingLanguage,
    preview,
    snack,
    setSnack,
    hasPendingLangChange: selectedLanguage !== form.language,
  };

  return isMobile ? (
    <MobileRegion {...propsCalculados} />
  ) : (
    <DesktopRegion {...propsCalculados} />
  );
}

/* ----- DESKTOP ----- */
function DesktopRegion({
  t,
  form,
  selectedLanguage,
  setSelectedLanguage,
  handleChange,
  handleApplyLanguage,
  savingLanguage,
  hasPendingLangChange,
  preview,
}) {
  return (
    <div className="max-w-5xl mx-auto space-y-8 text-[var(--foreground)]">
      {/* HEADER */}
      <div>
        <h2 className="text-xl font-semibold">{t("settings.region.title")}</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          {t("settings.region.subtitle")}
        </p>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          {/* 🌍 IDIOMA + ZONA */}
          <div className="rounded-2xl border bg-[var(--background)] bg-[var(--popover)] p-5 space-y-5">
            <h3 className="text-sm font-medium">Idioma y región</h3>

            {/* Idioma */}
            <div className="space-y-2">
              <label className="text-xs text-[var(--muted-foreground)]">
                Idioma
              </label>

              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border dark:bg-[var(--secondary)] text-sm focus:ring-2 focus:ring-[hsl(var(--primary))]">
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>

              {/* ALERT */}
              {hasPendingLangChange && (
                <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-between">
                  <p className="text-sm">Necesitas aplicar el idioma</p>

                  <button
                    onClick={handleApplyLanguage}
                    className="px-4 py-2 rounded-lg bg-yellow-500 text-white text-sm">
                    {savingLanguage ? "Aplicando..." : "Aplicar"}
                  </button>
                </div>
              )}
            </div>

            {/* Timezone */}
            <div className="space-y-2">
              <label className="text-xs text-[var(--muted-foreground)]">
                Zona horaria
              </label>

              <select
                value={form.timezone}
                onChange={(e) => handleChange("timezone", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border dark:bg-[var(--secondary)] text-sm">
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 📅 FORMATOS */}
          <div className="rounded-2xl border bg-[var(--background)] bg-[var(--popover)] p-5 space-y-5">
            <h3 className="text-sm font-medium">Formatos</h3>

            {/* Fecha */}
            <div className="space-y-2">
              <label className="text-xs text-[var(--muted-foreground)]">
                Formato de fecha
              </label>

              <select
                value={form.dateFormat}
                onChange={(e) => handleChange("dateFormat", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border dark:bg-[var(--secondary)] text-sm">
                {DATE_FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.value}
                  </option>
                ))}
              </select>
            </div>

            {/* Hora (botones tipo pill) */}
            <div className="space-y-2">
              <label className="text-xs text-[var(--muted-foreground)]">
                Formato de hora
              </label>

              <div className="flex gap-3">
                {["12h", "24h"].map((fmt) => {
                  const active = form.timeFormat === fmt;

                  return (
                    <button
                      key={fmt}
                      onClick={() => handleChange("timeFormat", fmt)}
                      className={`
                        px-4 py-2 rounded-xl text-sm transition
                        ${
                          active
                            ? "bg-[hsl(var(--primary))] text-white"
                            : "border hover:bg-[var(--muted)]"
                        }
                      `}>
                      {fmt === "12h" ? "12 horas" : "24 horas"}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT → PREVIEW */}
        <div className="space-y-4">
          <div className="rounded-2xl border dark:bg-[var(--popover)] p-6 text-center">
            <p className="text-xs text-[var(--foreground)] uppercase tracking-wide">
              Vista previa
            </p>

            <p className="text-3xl font-semibold mt-3">{preview.timeStr}</p>

            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              {preview.dateStr}
            </p>

            <div className="mt-4 h-2 bg-[var(--muted)] rounded-full overflow-hidden">
              <div className="h-full w-1/2 bg-[hsl(var(--primary))]" />
            </div>
          </div>

          {/* Info extra */}
          <div className="text-xs text-[var(--muted-foreground)] px-2">
            Los cambios se aplican automáticamente.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----- MOBILE ----- */
// function MobileRegion(props) {
//   const [stack, setStack] = useState(["main"]);

//   const current = stack[stack.length - 1];

//   const push = (screen) => setStack((s) => [...s, screen]);
//   const pop = () => setStack((s) => s.slice(0, -1));

//   return (
//     <div className="relative bg-[var(--background)] min-h-screen overflow-hidden">
//       {stack.map((screen, i) => {
//         const isTop = i === stack.length - 1;

//         return (
//           <div
//             key={i}
//             className={`
//               absolute inset-0
//               transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
//               ${isTop ? "translate-x-0" : "-translate-x-1/3"}
//             `}
//             style={{
//               zIndex: i,
//             }}>
//             {screen === "main" && <MainMobile {...props} push={push} />}

//             {screen === "language" && (
//               <LanguageMobile {...props} onBack={pop} />
//             )}

//             {screen === "timezone" && (
//               <TimezoneMobile {...props} onBack={pop} />
//             )}

//             {screen === "date" && <DateMobile {...props} onBack={pop} />}

//             {screen === "time" && <TimeMobile {...props} onBack={pop} />}
//           </div>
//         );
//       })}
//     </div>
//   );
// }

function MobileRegion(props) {
  const {
    t,
    form,
    preview,
    handleChange,
    selectedLanguage,
    setSelectedLanguage,
    handleApplyLanguage,
    hasPendingLangChange,
  } = props;

  const [openLang, setOpenLang] = useState(false);
  const [openTimezone, setOpenTimezone] = useState(false);
  const [openDate, setOpenDate] = useState(false);
  const [openTime, setOpenTime] = useState(false);

  return (
    <div className="space-y-6">
      <SectionHeader
        title={t("settings.region.title")}
        subtitle={t("settings.region.subtitle")}
      />

      {/* 🔥 LISTA iOS */}
      <MobileSection title="Configuración">
        <IOSRow label="Idioma" onClick={() => setOpenLang(true)} />
        <IOSRow label="Zona horaria" onClick={() => setOpenTimezone(true)} />
      </MobileSection>
      <MobileSection title="Formatos">
        <IOSRow label="Formato de fecha" onClick={() => setOpenDate(true)} />
        <IOSRow label="Formato de hora" onClick={() => setOpenTime(true)} />
      </MobileSection>

      {/* 📊 PREVIEW */}
      <div className="rounded-2xl border p-5 text-center bg-[var(--popover)]">
        <p className="text-xs uppercase text-[var(--muted-foreground)]">
          Vista previa
        </p>
        <p className="text-3xl font-semibold mt-2">{preview.timeStr}</p>
        <p className="text-sm text-[var(--muted-foreground)]">
          {preview.dateStr}
        </p>
      </div>

      {/* 🔥 MODALES */}

      {/* 🌍 IDIOMA */}
      <IOSModal
        open={openLang}
        onClose={() => setOpenLang(false)}
        title="Idioma">
        {LANGUAGES.map((l) => (
          <IOSOption
            key={l.code}
            label={`${l.flag} ${l.label}`}
            active={selectedLanguage === l.code}
            onClick={() => setSelectedLanguage(l.code)}
          />
        ))}

        {hasPendingLangChange && (
          <button
            onClick={handleApplyLanguage}
            className="w-full py-3 text-center text-white bg-[hsl(var(--primary))]">
            Aplicar cambios
          </button>
        )}
      </IOSModal>

      {/* 🕓 TIMEZONE */}
      <IOSModal
        open={openTimezone}
        onClose={() => setOpenTimezone(false)}
        title="Zona horaria">
        {TIMEZONES.map((tz) => (
          <IOSOption
            key={tz.value}
            label={tz.label}
            active={form.timezone === tz.value}
            onClick={() => {
              handleChange("timezone", tz.value);
              setOpenTimezone(false);
            }}
          />
        ))}
      </IOSModal>

      {/* 📅 DATE */}
      <IOSModal
        open={openDate}
        onClose={() => setOpenDate(false)}
        title="Formato de fecha">
        {DATE_FORMATS.map((f) => (
          <IOSOption
            key={f.value}
            label={f.value}
            active={form.dateFormat === f.value}
            onClick={() => {
              handleChange("dateFormat", f.value);
              setOpenDate(false);
            }}
          />
        ))}
      </IOSModal>

      {/* ⏰ TIME */}
      <IOSModal
        open={openTime}
        onClose={() => setOpenTime(false)}
        title="Formato de hora">
        {["12h", "24h"].map((f) => (
          <IOSOption
            key={f}
            label={f === "12h" ? "12 horas" : "24 horas"}
            active={form.timeFormat === f}
            onClick={() => {
              handleChange("timeFormat", f);
              setOpenTime(false);
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
        w-full flex justify-between px-4 py-4 text-[15px]
        active:bg-[var(--muted)]
        bg-[var(--background)]
        dark:bg-[var(--popover)]
      ">
      {label}
      <ChevronRight size={18} className="text-[var(--muted-foreground)]" />
    </button>
  );
}

function IOSOption({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="
        w-full flex justify-between px-4 py-4 text-sm
        hover:bg-[var(--muted)]
      ">
      <span>{label}</span>

      {active && <Check size={18} className="text-[hsl(var(--primary))]" />}
    </button>
  );
}

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

const Screen = ({ children }) => (
  <div className="w-1/5 shrink-0">{children}</div>
);

function MainMobile({ push, preview }) {
  const { t } = useTranslation();
  return (
    <div className="p-4 space-y-6 shrink-0 px-1">
      <div className="mb-6">
        <SectionHeader
          title={t("settings.region.title")}
          subtitle={t("settings.region.subtitle")}
        />
      </div>
      <MobileSection title="Configuración">
        <MobileItem label="Idioma" onClick={() => push("language")} />
        <MobileItem label="Zona horaria" onClick={() => push("timezone")} />
      </MobileSection>
      <MobileSection title="Formatos">
        <MobileItem label="Fecha" onClick={() => push("date")} />
        <MobileItem label="Hora" onClick={() => push("time")} />
      </MobileSection>
      <div className="bg-[var(--background)] dark:bg-[var(--popover)] rounded-2xl p-5 text-center shadow-sm border">
        <p className="text-xs mb-2 uppercase tracking-wider text-[var(--muted-foreground)]">
          Vista previa
        </p>
        <p className="text-3xl font-semibold">{preview.timeStr}</p>
        <p className="text-sm text-gray-500">{preview.dateStr}</p>
      </div>
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

function MobileItem({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex justify-between px-4 py-4 text-[15px] active:bg-gray-100">
      {label}{" "}
      <span className="text-gray-400">
        <ChevronRight size={18} />
      </span>
    </button>
  );
}

function MobileHeader({ title, onBack }) {
  return (
    <div className="sticky top-0 px-4 py-3 flex items-center border-b-2 mb-6">
      <button onClick={onBack} className="text-blue-500 text-lg">
        <ChevronLeft size={26} />
      </button>
      <h3 className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold">
        {title}
      </h3>
    </div>
  );
}

/* Sub-pantallas móviles */
function LanguageMobile({
  onBack,
  selectedLanguage,
  setSelectedLanguage,
  handleApplyLanguage,
  hasPendingLangChange,
}) {
  return (
    <div className="bg-[var(--background)] min-h-screen">
      <MobileHeader title="Idioma" onBack={onBack} />
      <div className="">
        <div className="rounded-2xl border bg-[var(--background)] dark:bg-[var(--popover)] overflow-hidden divide-y">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => setSelectedLanguage(l.code)}
              className="w-full flex justify-between px-4 py-4 text-[15px]">
              <span>
                {l.flag} {l.label}
              </span>
              {selectedLanguage === l.code && (
                <Check size={18} className="text-blue-500" />
              )}
            </button>
          ))}
        </div>
        {hasPendingLangChange && (
          <Button fullWidth color="warning" onClick={handleApplyLanguage}>
            Aplicar cambios y reiniciar
          </Button>
        )}
      </div>
    </div>
  );
}

function TimezoneMobile({ form, handleChange, onBack }) {
  return (
    <div className="bg-[var(--background)] min-h-screen">
      <MobileHeader title="Zona horaria" onBack={onBack} />
      <div className="">
        <div className="rounded-2xl bg-[var(--background)] dark:bg-[var(--popover)] overflow-hidden divide-y border">
          {TIMEZONES.map((tz) => (
            <button
              key={tz.value}
              onClick={() => {
                handleChange("timezone", tz.value);
                onBack();
              }}
              className="w-full flex justify-between px-4 py-4 text-[15px]">
              <span>{tz.label}</span>
              {form.timezone === tz.value && (
                <Check size={18} className="text-blue-500" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function DateMobile({ form, handleChange, onBack }) {
  return (
    <div className="bg-[var(--background)] min-h-screen">
      <MobileHeader title="Formato de fecha" onBack={onBack} />
      <div className="bg-[var(--background)] dark:bg[var(--popover)] rounded-2xl overflow-hidden divide-y border">
        {DATE_FORMATS.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              handleChange("dateFormat", f.value);
              onBack();
            }}
            className="w-full flex justify-between px-4 py-4 text-[15px]">
            <span>{f.value}</span>
            {form.dateFormat === f.value && (
              <Check size={18} className="text-blue-500" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function TimeMobile({ form, handleChange, onBack }) {
  return (
    <div className="bg-[var(--background)] min-h-screen">
      <MobileHeader title="Formato de hora" onBack={onBack} />
      <div className="">
        <div className="rounded-2xl bg-[var(--background)] dark:bg-[var(--popover)] overflow-hidden divide-y border">
          {["12h", "24h"].map((f) => (
            <button
              key={f}
              onClick={() => {
                handleChange("timeFormat", f);
                onBack();
              }}
              className="w-full flex justify-between px-4 py-4 text-[15px]">
              <span>{f === "12h" ? "12 horas (PM/AM)" : "24 horas"}</span>
              {form.timeFormat === f && (
                <Check size={18} className="text-blue-500" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
