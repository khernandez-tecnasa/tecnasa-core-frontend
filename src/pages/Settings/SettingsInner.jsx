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

export default function SettingsInner() {
  const { settings, loading, saveSection } = useSettings();
  const { t, i18n } = useTranslation();

  const [active, setActive] = useState("inicio");
  const [direction, setDirection] = useState("forward");

  const isMobile = useIsMobile();
  const [mobileView, setMobileView] = useState("list");

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

    if (isMobile) {
      setMobileView("section");
    }
  };

  const handleBack = () => {
    setMobileView("list");
  };

  if (loading) {
    return <div className="m-auto">Loading...</div>;
  }

  //   return (
  //     <>
  //       {/* Sidebar */}
  //       <aside className="w-64 border-r border-gray-200 p-3 hidden md:block">
  //         <div className="space-y-1">
  //           {NAV.map((item, i) => {
  //             const Icon = item.icon;
  //             const isActive = active === item.key;

  //             return (
  //               <button
  //                 key={item.key}
  //                 onClick={() => handleNav(item.key)}
  //                 className={`relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[var(--foreground)] text-sm transition-all duration-200 group
  //                 ${
  //                   isActive
  //                     ? "bg-[var(--joy-palette-primary-softBg)] text-[var(--foreground)] font-medium"
  //                     : "hover:bg-[var(--joy-palette-primary-softHoverBg)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
  //                 }`}>
  //                 {/* BARRA */}
  //                 {isActive && (
  //                   <span className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-[var(--joy-palette-primary-main)] rounded-full" />
  //                 )}

  //                 {/* ICONO */}
  //                 <Icon
  //                   size={16}
  //                   className="transition-colors duration-200 group-hover:text-[var(--foreground)]"
  //                 />

  //                 <span className="truncate">{item.label}</span>
  //               </button>
  //             );
  //           })}
  //         </div>
  //       </aside>

  //       {/* Content */}
  //       <main className="flex-1 overflow-hidden relative">
  //         <div
  //           key={active}
  //           className={`absolute inset-0 overflow-y-auto px-6 py-6
  //             ${
  //               direction === "forward"
  //                 ? "animate-ios-forward"
  //                 : "animate-ios-back"
  //             }`}>
  //           <Suspense fallback={<div>Loading...</div>}>
  //             <ActiveSection
  //               initialData={settings?.[active] || settings}
  //               allSettings={settings}
  //               onNavigate={handleNav}
  //               onSave={(data) => saveSection(active, data)}
  //             />
  //           </Suspense>
  //         </div>
  //       </main>
  //     </>
  //   );
  return (
    <>
      {/* 🖥 DESKTOP */}
      {!isMobile && (
        <>
          <aside className="w-64 border-r border-[var(--border)] p-3 hidden md:block">
            <div ref={containerRef} className="relative space-y-1">
              {/* 🔥 INDICADOR GLOBAL (la barrita animada) */}
              <span
                className="absolute left-0 w-1 bg-[var(--joy-palette-primary-main)] rounded-full transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
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
                    className={`relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[var(--foreground)] text-sm transition-[background-color,transform] hover:scale-[1.01] duration-200 active:scale-[0.98] group
                    ${
                      isActive
                        ? "bg-[var(--joy-palette-primary-softBg)] font-medium"
                        : "hover:bg-[var(--joy-palette-primary-softHoverBg)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    }`}>
                    <Icon
                      size={16}
                      className="transition-colors duration-200 group-hover:text-[var(--foreground)]"
                    />

                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          <main className="flex-1 overflow-hidden relative">
            <div className="h-full overflow-y-auto px-6 py-6">
              <div className="max-w-5xl mx-auto">
                {/* Antes: <SectionContent /> */}
                <div className="h-full">
                  <Suspense fallback={<div>Loading...</div>}>
                    <ActiveSection
                      initialData={settings?.[active] || settings}
                      allSettings={settings}
                      onNavigate={handleNav}
                      onSave={(data) => saveSection(active, data)}
                    />
                  </Suspense>
                </div>
              </div>
            </div>
          </main>
        </>
      )}

      {/* 📱 MOBILE */}
      {isMobile && (
        <div className="flex-1 relative overflow-hidden text-[var(--muted-foreground)]">
          {/* LISTA */}
          {mobileView === "list" && (
            <div
              key="list"
              className={`absolute inset-0 px-4 py-4 space-y-1
                ${direction === "forward" ? "animate-ios-back" : "animate-ios-forward"}`}>
              <div className="bg-[var(--primary)] dark:bg-[var(--popover)] rounded-2xl border p-4 mt-2 mb-5">
                <SectionHeader
                  title={t("settings.title")}
                  subtitle={"Administra tus preferencias y configuraciones"}
                />
              </div>
              {NAV.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.key}
                    onClick={() => handleNav(item.key)}
                    className="
                    w-full flex items-center justify-between px-4 py-3 rounded-xl
                    bg-[var(--popover)]
                    border border-[var(--border)]
                    shadow-sm
                    active:scale-[0.98] transition
                    ">
                    <div className="flex items-center gap-3">
                      <Icon size={18} />
                      {item.label}
                    </div>

                    <span className="text-[var(--muted-foreground)]">
                      <ChevronRight size={18} />
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* SECCIÓN */}
          {mobileView === "section" && (
            <div
              key={active}
              className={`absolute inset-0 flex flex-col
            ${direction === "forward" ? "animate-ios-forward" : "animate-ios-back"}`}>
              {/* HEADER tipo iOS */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1 text-[hsl(var(--primary))] text-sm font-medium">
                  <ChevronLeft size={28} />
                  <span className="font-size-lg">
                    {NAV.find((n) => n.key === active)?.label}
                  </span>
                </button>

                {/* <span className="font-medium">
                  {NAV.find((n) => n.key === active)?.label}
                </span> */}
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4">
                {/* Antes: <SectionContent /> */}
                <div className="flex-1 overflow-y-auto px-4 py-4">
                  <Suspense fallback={<div>Loading...</div>}>
                    <ActiveSection
                      initialData={settings?.[active] || settings}
                      allSettings={settings}
                      onNavigate={handleNav}
                      onSave={(data) => saveSection(active, data)}
                    />
                  </Suspense>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
