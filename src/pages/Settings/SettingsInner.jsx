// SettingsInner.jsx
import React, {
  useState,
  useEffect,
  Suspense,
  useRef,
  useLayoutEffect,
} from "react";
import { useSettings } from "../../context/SettingsContext";
import { useTranslation } from "react-i18next";
import {
  Home,
  Shield,
  Palette,
  Globe,
  Accessibility,
  Info,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Loader2,
} from "lucide-react";
import useIsMobile from "@/hooks/useIsMobile";
import { SectionHeader } from "./sections/_shared/SectionHeader";

const Sections = {
  inicio: React.lazy(() => import("./sections/Inicio.jsx")),
  seguridad: React.lazy(() => import("./sections/Seguridad.jsx")),
  apariencia: React.lazy(() => import("./sections/Apariencia.jsx")),
  idioma: React.lazy(() => import("./sections/IdiomaRegion.jsx")),
  accesibilidad: React.lazy(() => import("./sections/Accesibilidad.jsx")),
  acerca: React.lazy(() => import("./sections/Acerca.jsx")),
};

console.log(Sections.inicio);

const SectionFallback = () => (
  <div className="flex flex-col items-center justify-center gap-4 py-24">
    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
      <Loader2 className="animate-spin text-primary" size={18} />
    </div>
  </div>
);

export default function SettingsInner() {
  const { settings, loading, saveSection } = useSettings();
  const { t, i18n } = useTranslation();

  const getInitialSection = () => {
    const section = new URLSearchParams(window.location.search).get("section");
    return section && Sections[section] ? section : "inicio";
  };

  const [active, setActive] = useState(getInitialSection);
  const [direction, setDirection] = useState("forward");

  const isMobile = useIsMobile();
  const [mobileView, setMobileView] = useState(() => {
    const section = new URLSearchParams(window.location.search).get("section");
    return section && Sections[section] ? "section" : "list";
  });

  const containerRef = useRef(null);
  const itemRefs = useRef({});
  const [indicatorStyle, setIndicatorStyle] = useState({});

  useLayoutEffect(() => {
    const el = itemRefs.current[active];
    const container = containerRef.current;

    if (el && container) {
      const elRect = el.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      setIndicatorStyle({
        top: elRect.top - containerRect.top + 9,
        height: elRect.height - 18,
      });
    }
  }, [active]);

  useEffect(() => {
    if (settings?.language && settings.language !== i18n.language) {
      i18n.changeLanguage(settings.language);
    }
  }, [settings]);

  const NAV = [
    { key: "inicio", label: "General", icon: Home },
    { key: "seguridad", label: "Seguridad", icon: Shield },
    { key: "apariencia", label: "Apariencia", icon: Palette },
    { key: "idioma", label: "Idioma y Región", icon: Globe },
    { key: "accesibilidad", label: "Accesibilidad", icon: Accessibility },
    { key: "acerca", label: "Acerca de", icon: Info },
  ];

  const ActiveSection = Sections[active];

  const handleNav = (key) => {
    const currentIndex = NAV.findIndex((n) => n.key === active);
    const nextIndex = NAV.findIndex((n) => n.key === key);

    setDirection(nextIndex > currentIndex ? "forward" : "backward");
    setActive(key);

    const params = new URLSearchParams(window.location.search);
    params.set("section", key);
    history.replaceState(null, "", `?${params}`);

    if (isMobile) {
      setMobileView("section");
    }
  };

  const handleBack = () => {
    setMobileView("list");
    const params = new URLSearchParams(window.location.search);
    params.delete("section");
    const qs = params.toString();
    history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={22} />
        </div>
        <p className="text-sm text-muted-foreground font-medium">
          Cargando configuración...
        </p>
      </div>
    );
  }

  return (
    <>
      {/* ─── DESKTOP ─────────────────────────────────────────────────────────── */}
      {!isMobile && (
        <div className="flex w-full h-[88%] rounded-3xl border border-border/60 overflow-hidden bg-card dark:bg-slate-900/40">
          <aside className="w-56 shrink-0 rounded-2xl border-r border-border/60 bg-card dark:bg-slate-900/40 p-3 hidden md:flex md:flex-col gap-1">
            {/* Sidebar header */}
            <div className="px-3 pt-2 pb-3 mb-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-primary/10 dark:bg-primary/15 ring-1 ring-primary/20">
                  <SlidersHorizontal
                    size={14}
                    className="text-[var(--muted-foreground)]"
                  />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Configuración
                </span>
              </div>
            </div>

            {/* Nav items */}
            <div ref={containerRef} className="relative space-y-0.5">
              <span
                className="absolute left-0 w-0.5 bg-primary rounded-full transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={indicatorStyle}
              />

              {NAV.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.key;

                return (
                  <button
                    ref={(el) => (itemRefs.current[item.key] = el)}
                    key={item.key}
                    onClick={() => handleNav(item.key)}
                    className={[
                      "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 active:scale-[0.98] group",
                      isActive
                        ? "bg-primary/10 dark:bg-primary/15 text-[var(--foreground)] font-semibold"
                        : "text-muted-foreground hover:bg-muted/60 dark:hover:bg-slate-800/60 hover:text-foreground",
                    ].join(" ")}>
                    <Icon
                      size={15}
                      className={
                        isActive
                          ? "text-[var(--foreground)] font-semibold"
                          : "text-muted-foreground group-hover:text-foreground transition-colors"
                      }
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          <main className="flex-1 overflow-hidden relative bg-background dark:bg-slate-950/30">
            <div className="h-full overflow-y-auto">
              <div
                key={active}
                className="max-w-3xl mx-auto px-6 py-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Suspense fallback={<SectionFallback />}>
                  <ActiveSection
                    initialData={settings?.[active] || settings}
                    allSettings={settings}
                    onNavigate={handleNav}
                    onSave={(data) => saveSection(active, data)}
                  />
                </Suspense>
              </div>
            </div>
          </main>
        </div>
      )}

      {/* ─── MOBILE ──────────────────────────────────────────────────────────── */}
      {isMobile && (
        <div className="flex-1 h-[88%] rounded-2xl relative bg-background dark:bg-slate-950/30">
          {/* LISTA */}
          {mobileView === "list" && (
            <div
              key="list"
              className={[
                "px-4 py-6 space-y-4",
                direction === "forward"
                  ? "animate-ios-back"
                  : "animate-ios-forward",
              ].join(" ")}>
              {/* Header */}
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/60 bg-card dark:bg-slate-900/90 backdrop-blur rounded-2xl">
                <div className="p-2.5 rounded-2xl bg-primary/10 dark:bg-primary/15 ring-1 ring-primary/20 shrink-0">
                  <SlidersHorizontal
                    size={20}
                    className="text-[var(--muted-foreground)]"
                  />
                </div>
                <div>
                  <h1 className="text-xl text-[var(--foreground)] font-black tracking-tight leading-none">
                    {t("settings.title")}
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                    Administra tus preferencias y configuraciones
                  </p>
                </div>
              </div>

              {/* Nav cards */}
              <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-400">
                {NAV.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleNav(item.key)}
                      className={[
                        "w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/30 dark:hover:bg-slate-800/30 active:scale-[0.99] transition-all duration-150 group",
                        idx < NAV.length - 1 ? "border-b border-border/40" : "",
                      ].join(" ")}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center group-active:bg-primary/20 transition-colors shrink-0">
                          <Icon
                            size={15}
                            className="text-[var(--foreground)]"
                          />
                        </div>
                        <span className="text-sm font-semibold text-foreground">
                          {item.label}
                        </span>
                      </div>
                      <ChevronRight
                        size={15}
                        className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECCIÓN */}
          {mobileView === "section" && (
            <div
              key={active}
              className={[
                "absolute inset-0 flex flex-col overflow-hidden rounded-2xl",
                direction === "forward"
                  ? "animate-ios-forward"
                  : "animate-ios-back",
              ].join(" ")}>
              {/* Back header */}
              <div
                className="flex items-center px-2 py-3 border-b border-border/60 bg-card dark:bg-slate-900/40 shrink-0 z-10"
                onClick={handleBack}>
                <button className="p-1.5 hover:bg-muted dark:hover:bg-slate-800 rounded-xl transition-colors text-muted-foreground hover:text-foreground shrink-0">
                  <ChevronLeft size={18} />
                </button>
                {(() => {
                  const navItem = NAV.find((n) => n.key === active);
                  const Icon = navItem?.icon;
                  return (
                    <div className="flex items-center gap-2">
                      <span className="font-black text-[var(--muted-foreground)] text-sm tracking-tight">
                        {navItem?.label}
                      </span>
                    </div>
                  );
                })()}
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 pb-[calc(var(--bottom-nav-height,64px)+env(safe-area-inset-bottom,0px)+16px)]">
                <Suspense fallback={<SectionFallback />}>
                  <ActiveSection
                    initialData={settings?.[active] || settings}
                    allSettings={settings}
                    onNavigate={handleNav}
                    onSave={(data) => saveSection(active, data)}
                  />
                </Suspense>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
