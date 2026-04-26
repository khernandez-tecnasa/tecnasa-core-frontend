import React, { useEffect, useState, useRef } from "react";
import useIsMobile from "@/hooks/useIsMobile";
import {
  ChevronRight,
  RefreshCw,
  Info,
  Activity,
  MonitorCheck,
  Cpu,
  ExternalLink,
  Bug,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { listServices } from "@/services/help.api.js";

/* ─── Componente principal ─── */
export default function Acerca() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const [services, setServices] = useState([]);
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await listServices();
        setServices(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Error status:", e);
      } finally {
        setLoadingStatus(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      listServices().then(setServices);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const grouped = services.reduce((acc, curr) => {
    const g = curr.group_name || "Sistema";
    if (!acc[g]) acc[g] = [];
    acc[g].push(curr);
    return acc;
  }, {});

  return isMobile ? (
    <MobileAbout t={t} grouped={grouped} loadingStatus={loadingStatus} />
  ) : (
    <DesktopAbout t={t} grouped={grouped} loadingStatus={loadingStatus} />
  );
}

/* ─── DESKTOP ─── */
function DesktopAbout({ t, grouped, loadingStatus }) {
  const appTitle   = import.meta.env.VITE_APP_TITLE  || "App";
  const appVersion = import.meta.env.PACKAGE_VERSION || "—";

  const infoRows = [
    ["Versión",    `v${appVersion}`],
    ["Build",      import.meta.env.MODE],
    ["Plataforma", navigator.platform],
    ["Idioma",     navigator.language],
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-primary/10 dark:bg-primary/20 ring-1 ring-primary/20 dark:ring-primary/40 shrink-0">
          <Info size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight leading-none dark:text-slate-100">
            {t("settings.about.title", "Acerca de")}
          </h1>
          <p className="text-xs text-muted-foreground dark:text-slate-400 mt-0.5 font-medium">
            {t("settings.about.subtitle", "Información de la aplicación")}
          </p>
        </div>
      </div>

      {/* IDENTIDAD */}
      <div className="bg-card dark:bg-slate-800/60 border border-border/60 dark:border-slate-700/60 rounded-3xl shadow-sm p-6 flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25 shrink-0">
          <span className="text-white text-2xl font-black tracking-tight">
            {appTitle.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="text-center">
          <p className="text-base font-black tracking-tight dark:text-slate-100">
            {appTitle}
          </p>
          <p className="text-xs text-muted-foreground dark:text-slate-400 mt-0.5 font-mono">
            v{appVersion}
          </p>
        </div>
      </div>

      {/* ESTADO DEL SISTEMA */}
      <div className="bg-card dark:bg-slate-800/60 border border-border/60 dark:border-slate-700/60 rounded-3xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/60 dark:border-slate-700/50">
          <div className="p-1.5 bg-muted dark:bg-slate-700 rounded-xl shrink-0">
            <Activity size={14} className="text-muted-foreground dark:text-slate-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400">
              Estado del Sistema
            </h2>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="p-1.5 rounded-lg hover:bg-muted/80 dark:hover:bg-slate-700 text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw size={13} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {!loadingStatus && <GlobalStatus services={grouped} />}

          {loadingStatus ? (
            <StatusSkeleton />
          ) : (
            <div className="space-y-1">
              {Object.entries(grouped).map(([group, items]) => {
                const hasError = items.some((i) => /down|error|fail/i.test(i.status));
                return (
                  <div
                    key={group}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-muted/40 dark:hover:bg-slate-700/40 transition-colors">
                    <span className="text-sm font-medium text-foreground dark:text-slate-200">
                      {group}
                    </span>
                    <StatusBadge status={hasError ? "Error" : "Operativo"} animated />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* INFO TÉCNICA */}
      <div className="bg-card dark:bg-slate-800/60 border border-border/60 dark:border-slate-700/60 rounded-3xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/60 dark:border-slate-700/50">
          <div className="p-1.5 bg-muted dark:bg-slate-700 rounded-xl">
            <Cpu size={14} className="text-muted-foreground dark:text-slate-400" />
          </div>
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400">
            Información Técnica
          </h2>
        </div>
        <div className="divide-y divide-border/40 dark:divide-slate-700/50">
          {infoRows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between px-5 py-3">
              <span className="text-sm font-medium text-foreground dark:text-slate-200">
                {label}
              </span>
              <span className="text-xs font-mono text-muted-foreground dark:text-slate-400">
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ACCIONES */}
      <div className="flex gap-3">
        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-border/60 dark:border-slate-700/60 text-sm font-bold text-foreground dark:text-slate-200 hover:bg-muted/40 dark:hover:bg-slate-700/40 transition-colors">
          <ExternalLink size={14} />
          GitHub
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-500/5 dark:bg-rose-500/10 text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 transition-colors">
          <Bug size={14} />
          Reportar bug
        </button>
      </div>
    </div>
  );
}

/* ─── MOBILE ─── */
function MobileAbout({ t, grouped, loadingStatus }) {
  const [openInfo,   setOpenInfo]   = useState(false);
  const [openStatus, setOpenStatus] = useState(false);

  const appTitle   = import.meta.env.VITE_APP_TITLE  || "App";
  const appVersion = import.meta.env.PACKAGE_VERSION || "—";

  const infoRows = [
    ["Versión",    `v${appVersion}`],
    ["Build",      import.meta.env.MODE],
    ["Plataforma", navigator.platform],
    ["Idioma",     navigator.language],
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-primary/10 dark:bg-primary/20 ring-1 ring-primary/20 dark:ring-primary/40 shrink-0">
          <Info size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight leading-none dark:text-slate-100">
            {t("settings.about.title", "Acerca de")}
          </h1>
          <p className="text-xs text-muted-foreground dark:text-slate-400 mt-0.5 font-medium">
            {t("settings.about.subtitle", "Información de la aplicación")}
          </p>
        </div>
      </div>

      {/* IDENTIDAD */}
      <div className="bg-card dark:bg-slate-800/60 border border-border/60 dark:border-slate-700/60 rounded-3xl shadow-sm p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25 shrink-0">
          <span className="text-white text-xl font-black">
            {appTitle.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="text-base font-black tracking-tight dark:text-slate-100">
            {appTitle}
          </p>
          <p className="text-xs text-muted-foreground dark:text-slate-400 mt-0.5 font-mono">
            v{appVersion}
          </p>
        </div>
      </div>

      {/* LISTA */}
      <div className="bg-card dark:bg-slate-800/60 border border-border/60 dark:border-slate-700/60 rounded-3xl shadow-sm overflow-hidden">
        <div className="divide-y divide-border/40 dark:divide-slate-700/50">
          <button
            onClick={() => setOpenInfo(true)}
            className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-muted/30 dark:hover:bg-slate-700/30 active:scale-[0.99] transition-all duration-150 group">
            <div className="p-1.5 bg-muted/60 dark:bg-slate-700/60 rounded-xl shrink-0">
              <Cpu size={13} className="text-muted-foreground dark:text-slate-400" />
            </div>
            <span className="flex-1 text-sm font-semibold text-foreground dark:text-slate-100">
              Información técnica
            </span>
            <ChevronRight
              size={14}
              className="text-muted-foreground/40 dark:text-slate-600 group-hover:text-muted-foreground transition-colors shrink-0"
            />
          </button>

          <button
            onClick={() => setOpenStatus(true)}
            className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-muted/30 dark:hover:bg-slate-700/30 active:scale-[0.99] transition-all duration-150 group">
            <div className="p-1.5 bg-muted/60 dark:bg-slate-700/60 rounded-xl shrink-0">
              <MonitorCheck size={13} className="text-muted-foreground dark:text-slate-400" />
            </div>
            <span className="flex-1 text-sm font-semibold text-foreground dark:text-slate-100">
              Estado del sistema
            </span>
            {!loadingStatus && (
              <StatusBadge
                status={
                  Object.values(grouped).flat().some((s) => /down|error|fail/i.test(s.status))
                    ? "Error"
                    : "Operativo"
                }
              />
            )}
            <ChevronRight
              size={14}
              className="text-muted-foreground/40 dark:text-slate-600 group-hover:text-muted-foreground transition-colors shrink-0"
            />
          </button>
        </div>
      </div>

      {/* ACCIONES */}
      <div className="flex gap-3">
        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-border/60 dark:border-slate-700/60 text-sm font-bold text-foreground dark:text-slate-200 hover:bg-muted/40 dark:hover:bg-slate-700/40 transition-colors">
          <ExternalLink size={14} />
          GitHub
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-500/5 dark:bg-rose-500/10 text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 transition-colors">
          <Bug size={14} />
          Reportar bug
        </button>
      </div>

      {/* MODAL: INFO TÉCNICA */}
      <IOSModal
        open={openInfo}
        onClose={() => setOpenInfo(false)}
        title="Información técnica">
        {infoRows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between px-4 py-3.5">
            <span className="text-sm font-semibold text-foreground dark:text-slate-100">
              {label}
            </span>
            <span className="text-xs font-mono text-muted-foreground dark:text-slate-400">
              {value}
            </span>
          </div>
        ))}
      </IOSModal>

      {/* MODAL: ESTADO */}
      <IOSModal
        open={openStatus}
        onClose={() => setOpenStatus(false)}
        title="Estado del sistema">
        {loadingStatus ? (
          <div className="p-4">
            <StatusSkeleton />
          </div>
        ) : (
          <>
            <div className="p-3 border-b border-border/40 dark:border-slate-700/40">
              <GlobalStatus services={grouped} />
            </div>
            {Object.entries(grouped).map(([group, items]) => {
              const hasError = items.some((i) => /down|error|fail/i.test(i.status));
              return (
                <div
                  key={group}
                  className="flex items-center justify-between px-4 py-3.5">
                  <span className="text-sm font-semibold text-foreground dark:text-slate-100">
                    {group}
                  </span>
                  <StatusBadge status={hasError ? "Error" : "Operativo"} animated />
                </div>
              );
            })}
          </>
        )}
      </IOSModal>
    </div>
  );
}

/* ─── Estado global ─── */
function GlobalStatus({ services }) {
  const all      = Object.values(services).flat();
  const hasError = all.some((s) => /down|error|fail/i.test(s.status));
  const hasWarn  = all.some((s) => /warn|maintenance/i.test(s.status));
  const state    = hasError ? "Error" : hasWarn ? "Advertencia" : "Todos los sistemas operativos";
  const dotColor = hasError ? "bg-rose-500" : hasWarn ? "bg-amber-500" : "bg-emerald-500";
  const textColor = hasError ? "text-rose-500" : hasWarn ? "text-amber-500" : "text-emerald-500";

  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-muted/50 dark:bg-slate-700/40">
      <div>
        <p className="text-sm font-bold text-foreground dark:text-slate-100 leading-none">
          Estado general
        </p>
        <p className={`text-xs mt-0.5 font-medium ${textColor}`}>{state}</p>
      </div>
      <span className={`w-2.5 h-2.5 rounded-full shrink-0 animate-pulse ${dotColor}`} />
    </div>
  );
}

/* ─── Skeleton ─── */
function StatusSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-9 rounded-xl bg-muted/60 dark:bg-slate-700/60 animate-pulse"
        />
      ))}
    </div>
  );
}

/* ─── Badge de estado ─── */
function StatusBadge({ status, animated = false }) {
  const isError = /down|error|fail/i.test(status);
  const isWarn  = /warn|maintenance/i.test(status);
  const dotColor  = isError ? "bg-rose-500"  : isWarn ? "bg-amber-500"  : "bg-emerald-500";
  const textColor = isError ? "text-rose-500" : isWarn ? "text-amber-500" : "text-emerald-500";
  const text      = isError ? "Error"         : isWarn ? "Advertencia"    : "Operativo";

  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor} ${animated ? "animate-pulse" : ""}`} />
      <span className={`text-xs font-bold ${textColor}`}>{text}</span>
    </div>
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
