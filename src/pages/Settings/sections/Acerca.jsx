import React, { useEffect, useState } from "react";
import useIsMobile from "@/hooks/useIsMobile";
import { ChevronRight, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { listServices } from "@/services/help.api.js";

/* ---------------- MAIN ---------------- */

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
    }, 15000); // cada 15s

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

/* ---------------- STATUS BADGE ---------------- */

// function StatusBadge({ status }) {
//   const getColor = () => {
//     if (/down|error|fail/i.test(status)) return "bg-red-500";
//     if (/warn|maintenance/i.test(status)) return "bg-yellow-500";
//     return "bg-green-500";
//   };

//   return (
//     <div className="flex items-center gap-2 text-xs">
//       <span className={`w-2 h-2 rounded-full ${getColor()}`} />
//       {status}
//     </div>
//   );
// }

/* ---------------- DESKTOP ---------------- */

function DesktopAbout({ t, grouped, loadingStatus }) {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="rounded-2xl border dark:bg-[var(--popover)] p-6 text-center text-[var(--foreground)]">
        <div className="w-16 h-16 mx-auto rounded-xl bg-[hsl(var(--primary))] text-white flex items-center justify-center text-xl font-bold mb-3">
          APP
        </div>

        <h2 className="text-lg font-semibold">
          {import.meta.env.VITE_APP_TITLE}
        </h2>

        <p className="text-sm text-[var(--muted-foreground)]">
          v{import.meta.env.PACKAGE_VERSION}
        </p>
      </div>

      {/* STATUS */}
      <div className="rounded-2xl border dark:bg-[var(--popover)] p-5 space-y-4">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">
              Estado del sistema
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Monitoreo en tiempo real
            </p>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="
              p-2 rounded-lg
              hover:bg-[var(--muted)]
              transition
              text-[var(--foreground)]
            ">
            <RefreshCw size={16} />
          </button>
        </div>

        {/* GLOBAL STATUS */}
        {!loadingStatus && <GlobalStatus services={grouped} />}

        {/* LIST */}
        {loadingStatus ? (
          <StatusSkeleton />
        ) : (
          <div className="space-y-2">
            {Object.entries(grouped).map(([group, items]) => {
              const hasError = items.some((i) =>
                /down|error|fail/i.test(i.status),
              );

              return (
                <div
                  key={group}
                  className="
                    flex justify-between items-center
                    px-3 py-2 rounded-lg
                    hover:bg-[var(--muted)]
                    transition
                  ">
                  <span className="text-sm text-[var(--foreground)]">
                    {group}
                  </span>

                  <StatusBadge
                    status={hasError ? "Error" : "Operativo"}
                    animated
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* INFO */}
      <div className="rounded-2xl border dark:bg-[var(--popover)] divide-y">
        {[
          ["Versión", `v${import.meta.env.PACKAGE_VERSION}`],
          ["Build", import.meta.env.MODE],
          ["Plataforma", navigator.platform],
          ["Idioma", navigator.language],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between px-4 py-3 text-sm">
            <span className="text-[var(--foreground)]">{label}</span>
            <span className="font-mono text-[var(--muted-foreground)]">
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* ACTIONS */}
      <div className="flex gap-3 justify-center">
        <button className="px-4 py-2 rounded-lg dark:bg-[var(--muted)] text-sm text-[var(--foreground)]">
          GitHub
        </button>

        <button className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm text-[var(--foreground)]">
          Reportar bug
        </button>
      </div>
    </div>
  );
}

function GlobalStatus({ services }) {
  const all = Object.values(services).flat();

  const hasError = all.some((s) => /down|error|fail/i.test(s.status));

  const hasWarn = all.some((s) => /warn|maintenance/i.test(s.status));

  const state = hasError ? "Error" : hasWarn ? "Advertencia" : "Operativo";

  const color = hasError
    ? "text-red-500"
    : hasWarn
      ? "text-yellow-500"
      : "text-green-500";

  return (
    <div
      className="
        flex items-center justify-between
        p-3 rounded-xl
        bg-[var(--muted)]
      ">
      <div>
        <p className="text-sm font-medium text-[var(--foreground)]">
          Estado general
        </p>
        <p className={`text-xs ${color}`}>{state}</p>
      </div>

      <div
        className={`
          w-3 h-3 rounded-full
          ${hasError ? "bg-red-500" : hasWarn ? "bg-yellow-500" : "bg-green-500"}
          animate-pulse
        `}
      />
    </div>
  );
}

function StatusSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="
            h-8 rounded-lg
            dark:bg-[var(--popover)]
            animate-pulse
          "
        />
      ))}
    </div>
  );
}

function StatusBadge({ status, animated = false }) {
  const isError = /down|error|fail/i.test(status);
  const isWarn = /warn|maintenance/i.test(status);

  const color = isError
    ? "bg-red-500"
    : isWarn
      ? "bg-yellow-500"
      : "bg-green-500";

  const text = isError ? "Error" : isWarn ? "Advertencia" : "Operativo";

  return (
    <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
      <span
        className={`
          w-2 h-2 rounded-full
          ${color}
          ${animated ? "animate-pulse" : ""}
        `}
      />
      {text}
    </div>
  );
}

/* ---------------- MOBILE ---------------- */

function MobileAbout({ t, grouped, loadingStatus }) {
  const [openInfo, setOpenInfo] = useState(false);
  const [openStatus, setOpenStatus] = useState(false);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="text-center bg-[var(--secondary)] rounded-xl p-4 mb-3">
        <div className="w-16 h-16 mx-auto rounded-xl bg-[hsl(var(--primary))] text-white flex items-center justify-center text-xl font-bold mb-3">
          APP
        </div>

        <p className="font-semibold">{import.meta.env.VITE_APP_TITLE}</p>
        <p className="text-sm text-[var(--muted-foreground)]">
          v{import.meta.env.PACKAGE_VERSION}
        </p>
      </div>

      {/* LISTA iOS */}
      <div className="rounded-2xl border dark:bg-[var(--popover)] divide-y">
        <IOSRow label="Información técnica" onClick={() => setOpenInfo(true)} />
        <IOSRow
          label="Estado del sistema"
          onClick={() => setOpenStatus(true)}
        />
      </div>

      {/* MODAL INFO */}
      <IOSModal
        open={openInfo}
        onClose={() => setOpenInfo(false)}
        title="Información técnica">
        {[
          ["Versión", `v${import.meta.env.PACKAGE_VERSION}`],
          ["Build", import.meta.env.MODE],
          ["Plataforma", navigator.platform],
          ["Idioma", navigator.language],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between px-4 py-3 text-sm">
            <span>{label}</span>
            <span className="font-mono">{value}</span>
          </div>
        ))}
      </IOSModal>

      {/* MODAL STATUS */}
      <IOSModal
        open={openStatus}
        onClose={() => setOpenStatus(false)}
        title="Estado del sistema">
        {loadingStatus ? (
          <StatusSkeleton />
        ) : (
          <>
            <div className="p-3">
              <GlobalStatus services={grouped} />
            </div>

            {Object.entries(grouped).map(([group, items]) => {
              const hasError = items.some((i) =>
                /down|error|fail/i.test(i.status),
              );

              return (
                <div
                  key={group}
                  className="flex justify-between px-4 py-3 text-sm">
                  <span>{group}</span>
                  <StatusBadge
                    status={hasError ? "Error" : "Operativo"}
                    animated
                  />
                </div>
              );
            })}
          </>
        )}
      </IOSModal>
    </div>
  );
}

/* ---------------- IOS ROW ---------------- */

function IOSRow({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex justify-between px-4 py-4 text-[15px] active:bg-[var(--muted)]">
      {label}
      <ChevronRight size={18} className="text-[var(--muted-foreground)]" />
    </button>
  );
}

/* ---------------- IOS MODAL ---------------- */

function IOSModal({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* SHEET */}
      <div
        className="
          absolute bottom-0 left-0 right-0
          rounded-t-3xl
          dark:bg-[var(--popover)]
          p-4
          animate-ios-forward
        ">
        <div className="text-center mb-4 font-medium">{title}</div>

        <div className="overflow-hidden">{children}</div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-3 text-[hsl(var(--primary))]">
          Cancelar
        </button>
      </div>
    </div>
  );
}
