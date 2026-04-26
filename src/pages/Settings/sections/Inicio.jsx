import React from "react";
import { useTranslation } from "react-i18next";
import {
  ShieldCheck,
  ShieldAlert,
  Palette,
  Fingerprint,
  Lock,
  ChevronRight,
  Home,
} from "lucide-react";
import { getPasskeysStatus } from "@/services/webAuthn.service.js";

export default function Inicio({ allSettings, onNavigate }) {
  const { t } = useTranslation();

  const seg = allSettings?.seguridad || {};

  const has2FA = !!seg.tfa_enabled;
  const hasAlerts = !!seg.login_alerts;
  const [hasPasskey, setHasPasskey] = React.useState(
    Boolean(seg?.has_passkeys || false),
  );

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getPasskeysStatus();
        if (!mounted) return;
        const has =
          Boolean(res?.hasPasskeys) ||
          Boolean(res?.has_passkeys) ||
          Boolean(res?.count > 0);
        setHasPasskey(Boolean(has));
      } catch (e) {
        console.error("Error fetching passkey status:", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const isSecure = has2FA && hasAlerts && hasPasskey;
  const partsCount = [has2FA, hasAlerts, hasPasskey].filter(Boolean).length;
  const securityScore = Math.round((partsCount / 3) * 100);

  const missingActionText = !has2FA
    ? t("settings.home.security.action_2fa")
    : !hasAlerts
      ? t("settings.home.security.action_alerts")
      : !hasPasskey
        ? t("settings.home.security.action_passkey")
        : t("settings.home.security.action_alerts");

  const scoreColor =
    securityScore === 100
      ? "bg-emerald-500"
      : securityScore >= 66
        ? "bg-primary"
        : securityScore >= 33
          ? "bg-amber-500"
          : "bg-rose-500";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl font-black tracking-tight leading-none dark:text-slate-100">
            {t("settings.home.title", "General")}
          </h1>
          <p className="text-xs text-muted-foreground dark:text-slate-400 mt-0.5 font-medium">
            Resumen de tu cuenta y accesos rápidos
          </p>
        </div>
      </div>

      {/* ESTADO DE SEGURIDAD */}
      <div
        className={[
          "bg-card dark:bg-slate-800/60 border rounded-3xl shadow-sm p-5 flex gap-4 items-start",
          isSecure
            ? "border-emerald-500/30 dark:border-emerald-500/30"
            : "border-amber-500/30 dark:border-amber-500/30",
        ].join(" ")}>
        <div
          className={[
            "p-3 rounded-2xl ring-1 shrink-0",
            isSecure
              ? "bg-emerald-500/10 dark:bg-emerald-500/20 ring-emerald-500/20 dark:ring-emerald-500/40"
              : "bg-amber-500/10 dark:bg-amber-500/20 ring-amber-500/20 dark:ring-amber-500/40",
          ].join(" ")}>
          {isSecure ? (
            <ShieldCheck size={22} className="text-emerald-500" />
          ) : (
            <Lock size={22} className="text-amber-500" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-black tracking-tight dark:text-slate-100">
            {isSecure
              ? t("settings.home.welcome_secure")
              : t("settings.home.welcome_warning")}
          </h2>
          <p className="text-xs text-muted-foreground dark:text-slate-400 mt-1 leading-relaxed">
            {isSecure
              ? t("settings.home.welcome_desc_secure")
              : t("settings.home.welcome_desc_warning")}
          </p>
        </div>
      </div>

      {/* SECURITY SCORE */}
      <div className="bg-card dark:bg-slate-800/60 border border-border/60 dark:border-slate-700/60 rounded-3xl shadow-sm p-5 space-y-3">
        <div className="flex items-center gap-2.5 pb-1">
          <div className="p-1.5 bg-muted dark:bg-slate-700 rounded-xl">
            <ShieldCheck
              size={14}
              className="text-muted-foreground dark:text-slate-400"
            />
          </div>
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400">
            {t("settings.home.health.label", "Salud de la cuenta")}
          </h2>
          <span
            className={[
              "ml-auto text-xs font-black tabular-nums",
              securityScore === 100
                ? "text-emerald-500"
                : securityScore >= 66
                  ? "text-primary"
                  : securityScore >= 33
                    ? "text-amber-500"
                    : "text-rose-500",
            ].join(" ")}>
            {securityScore}%
          </span>
        </div>

        <div className="h-2 w-full rounded-full bg-muted dark:bg-slate-700 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${scoreColor}`}
            style={{ width: `${securityScore}%` }}
          />
        </div>

        {!isSecure && (
          <p className="text-xs text-muted-foreground dark:text-slate-400 leading-relaxed">
            {t("settings.home.health.recommendation_prefix")}{" "}
            <button
              onClick={() => onNavigate("seguridad")}
              className="font-bold text-primary dark:text-primary underline-offset-2 hover:underline transition-all">
              {t("settings.menu.security")}
            </button>{" "}
            {t("settings.home.health.recommendation_suffix")}
          </p>
        )}
      </div>

      {/* ACCESOS RÁPIDOS */}
      <div className="bg-card dark:bg-slate-800/60 border border-border/60 dark:border-slate-700/60 rounded-3xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/60 dark:border-slate-700/50">
          <div className="p-1.5 bg-muted dark:bg-slate-700 rounded-xl">
            <ChevronRight
              size={14}
              className="text-muted-foreground dark:text-slate-400"
            />
          </div>
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400">
            {t("settings.home.shortcuts", "Accesos rápidos")}
          </h2>
        </div>

        <div className="divide-y divide-border/40 dark:divide-slate-700/50">
          <Row
            icon={isSecure ? ShieldCheck : ShieldAlert}
            label={t("settings.menu.security")}
            desc={
              isSecure
                ? t("settings.home.security.secure_desc")
                : t("settings.home.security.warning_desc", {
                    action: missingActionText,
                  })
            }
            accent={isSecure ? "emerald" : "amber"}
            onClick={() => onNavigate("seguridad")}
          />
          <Row
            icon={Palette}
            label={t("settings.home.appearance.title")}
            desc={t("settings.home.appearance.desc")}
            accent="blue"
            onClick={() => onNavigate("apariencia")}
          />
          <Row
            icon={Fingerprint}
            label={t("settings.home.privacy.title")}
            desc={t("settings.home.privacy.desc")}
            accent="rose"
            onClick={() => onNavigate("privacidad")}
          />
        </div>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, desc, accent = "primary", onClick }) {
  const accentMap = {
    primary: "bg-primary/10 dark:bg-primary/20 text-primary",
    emerald: "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500",
    amber: "bg-amber-500/10 dark:bg-amber-500/20 text-amber-500",
    blue: "bg-blue-500/10 dark:bg-blue-500/20 text-blue-500",
    violet: "bg-violet-500/10 dark:bg-violet-500/20 text-violet-500",
    rose: "bg-rose-500/10 dark:bg-rose-500/20 text-rose-500",
    cyan: "bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-500",
  };

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3.5 text-left group hover:bg-muted/30 dark:hover:bg-slate-700/40 active:scale-[0.99] transition-all duration-150">
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${accentMap[accent]}`}>
          <Icon size={15} />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground dark:text-slate-100 leading-none">
            {label}
          </p>
          <p className="text-xs text-muted-foreground dark:text-slate-400 mt-0.5 leading-snug">
            {desc}
          </p>
        </div>
      </div>
      <ChevronRight
        size={15}
        className="text-muted-foreground/40 dark:text-slate-600 group-hover:text-muted-foreground dark:group-hover:text-slate-400 transition-colors shrink-0"
      />
    </button>
  );
}
