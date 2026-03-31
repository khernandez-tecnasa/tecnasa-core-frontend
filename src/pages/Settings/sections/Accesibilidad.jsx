import React, { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import useIsMobile from "@/hooks/useIsMobile";

import { SectionHeader } from "./_shared/SectionHeader.jsx";
import { Type, Contrast, Sparkles, ChevronRight } from "lucide-react";

export default function Accesibilidad({ initialData, onSave, saving }) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const [baseState, setBaseState] = useState({
    fontSize: "medium",
    reducedMotion: false,
    highContrast: false,
  });

  const [form, setForm] = useState(baseState);

  const [openFont, setOpenFont] = useState(false);

  /* ============================
      INIT
  ============================ */
  useEffect(() => {
    if (initialData) {
      const data = {
        fontSize: initialData.fontSize || "medium",
        reducedMotion: initialData.reducedMotion || false,
        highContrast: initialData.highContrast || false,
      };
      setBaseState(data);
      setForm(data);
    }
  }, [initialData]);

  /* ============================
      LIVE PREVIEW 🔥
  ============================ */
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    html.style.fontSize =
      form.fontSize === "small"
        ? "90%"
        : form.fontSize === "large"
          ? "110%"
          : "100%";

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

  /* =========================================================
      📱 MOBILE (iOS STYLE)
  ========================================================= */
  if (isMobile) {
    return (
      <div className="space-y-4 px-4 py-4">
        <SectionHeader
          title={t("settings.accessibility.title")}
          subtitle={t("settings.accessibility.subtitle")}
        />

        {/* LISTA iOS */}
        <div
          className="
          rounded-2xl overflow-hidden
          border border-[var(--border)]
          dark:bg-[var(--popover)]
          mt-8
        ">
          {/* FONT SIZE */}
          <IOSRow
            label="Tamaño de texto"
            value={
              form.fontSize === "small"
                ? "Pequeño"
                : form.fontSize === "large"
                  ? "Grande"
                  : "Normal"
            }
            onClick={() => setOpenFont(true)}
          />

          {/* MOTION */}
          <IOSRowToggle
            label="Reducir animaciones"
            checked={form.reducedMotion}
            onChange={() => handleChange("reducedMotion", !form.reducedMotion)}
          />

          {/* CONTRAST */}
          <IOSRowToggle
            label="Alto contraste"
            checked={form.highContrast}
            onChange={() => handleChange("highContrast", !form.highContrast)}
          />
        </div>

        {/* SAVE */}
        {hasChanges && (
          <button
            onClick={handleSaveClick}
            className="
              w-full py-3 rounded-xl
              bg-[hsl(var(--primary))]
              text-white
            ">
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        )}

        {/* MODAL FONT SIZE */}
        <IOSModal
          open={openFont}
          onClose={() => setOpenFont(false)}
          title="Tamaño de texto">
          {["small", "medium", "large"].map((size) => (
            <IOSOption
              key={size}
              label={
                size === "small"
                  ? "Pequeño"
                  : size === "large"
                    ? "Grande"
                    : "Normal"
              }
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

  /* =========================================================
      🖥 DESKTOP
  ========================================================= */
  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <SectionHeader
        title={t("settings.accessibility.title")}
        subtitle={t("settings.accessibility.subtitle")}
      />

      {/* FONT SIZE */}
      <SettingCard
        icon={Type}
        title="Tamaño de texto"
        desc="Ajusta la legibilidad del contenido">
        <div className="flex gap-2">
          {["small", "medium", "large"].map((size) => {
            const isActive = form.fontSize === size;

            return (
              <button
                key={size}
                onClick={() => handleChange("fontSize", size)}
                className={`
                  px-3 py-2 rounded-lg text-sm
                  transition
                  ${
                    isActive
                      ? "bg-[hsl(var(--primary))] text-white"
                      : "bg-[var(--muted)]"
                  }
                `}>
                {size === "small" && "A"}
                {size === "medium" && "Aa"}
                {size === "large" && "Aaa"}
              </button>
            );
          })}
        </div>
      </SettingCard>

      {/* MOTION */}
      <SettingCard
        icon={Sparkles}
        title="Reducir animaciones"
        desc="Menos movimiento en la interfaz">
        <Toggle
          checked={form.reducedMotion}
          onChange={() => handleChange("reducedMotion", !form.reducedMotion)}
        />
      </SettingCard>

      {/* CONTRAST */}
      <SettingCard
        icon={Contrast}
        title="Alto contraste"
        desc="Mejora la visibilidad del contenido">
        <Toggle
          checked={form.highContrast}
          onChange={() => handleChange("highContrast", !form.highContrast)}
        />
      </SettingCard>

      {/* SAVE */}
      {hasChanges && (
        <div className="flex justify-end">
          <button
            onClick={handleSaveClick}
            className="
              px-5 py-2 rounded-xl
              bg-[hsl(var(--primary))]
              text-white
            ">
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      )}
    </div>
  );
}

/* =========================================================
    COMPONENTES
========================================================= */

function SettingCard({ icon: Icon, title, desc, children }) {
  return (
    <div
      className="
        rounded-xl border border-[var(--border)]
        dark:bg-[var(--popover)]
        px-4 py-4
        flex items-center justify-between gap-4
      ">
      <div className="flex items-center gap-3">
        <Icon size={20} />
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-[var(--muted-foreground)]">{desc}</p>
        </div>
      </div>

      {children}
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`
        w-11 h-6 rounded-full relative transition
        ${checked ? "bg-[hsl(var(--primary))]" : "bg-[var(--muted)]"}
      `}>
      <span
        className={`
          absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition
          ${checked ? "translate-x-5" : ""}
        `}
      />
    </button>
  );
}

/* ================= IOS ================= */

function IOSRow({ label, value, onClick }) {
  return (
    <button
      onClick={onClick}
      className="
        w-full flex items-center justify-between
        px-4 py-4
        border-b last:border-none border-[var(--border)]
      ">
      <span>{label}</span>

      <div className="flex items-center gap-2">
        <span className="text-[var(--muted-foreground)] text-sm">{value}</span>
        <ChevronRight size={16} />
      </div>
    </button>
  );
}

function IOSRowToggle({ label, checked, onChange }) {
  return (
    <div
      className="
        flex items-center justify-between
        px-4 py-4
        border-b last:border-none border-[var(--border)]
      ">
      <span>{label}</span>

      <Toggle checked={checked} onChange={onChange} />
    </div>
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
//         {/* HANDLE */}
//         <div className="w-10 h-1.5 bg-[var(--muted)] rounded-full mx-auto mb-4" />

//         <p className="text-center font-medium mb-4">{title}</p>

//         {children}
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

function IOSOption({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="
        w-full flex justify-between
        px-4 py-3 rounded-lg
        hover:bg-[var(--muted)]
      ">
      <span>{label}</span>
      {active && <span className="text-[hsl(var(--primary))]">✓</span>}
    </button>
  );
}
