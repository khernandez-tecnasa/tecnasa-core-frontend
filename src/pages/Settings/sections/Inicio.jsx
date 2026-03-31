import React from "react";
import { useTranslation } from "react-i18next";
import {
  ShieldCheck,
  ShieldAlert,
  Palette,
  Fingerprint,
  Lock,
  ChevronRight,
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

  return (
    <div className="space-y-6">
      {/* 🔒 HEADER / STATUS */}
      <div className="rounded-2xl border border-[var(--border)] dark:bg-[var(--popover)] p-5 flex gap-4 items-start">
        <div className="p-3 rounded-xl bg-[var(--joy-palette-primary-softBg)] text-[var(--foreground)]">
          {isSecure ? <ShieldCheck size={24} /> : <Lock size={24} />}
        </div>

        <div className="flex-1">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            {isSecure
              ? t("settings.home.welcome_secure")
              : t("settings.home.welcome_warning")}
          </h2>

          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            {isSecure
              ? t("settings.home.welcome_desc_secure")
              : t("settings.home.welcome_desc_warning")}
          </p>
        </div>
      </div>

      {/* ⚡ QUICK ACTIONS */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-[var(--foreground)]">
          {t("settings.home.shortcuts")}
        </h3>

        <div className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] dark:bg-[var(--popover)] overflow-hidden">
          {/* SEGURIDAD */}
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
            onClick={() => onNavigate("seguridad")}
          />

          {/* APARIENCIA */}
          <Row
            icon={Palette}
            label={t("settings.home.appearance.title")}
            desc={t("settings.home.appearance.desc")}
            onClick={() => onNavigate("apariencia")}
          />

          {/* PRIVACIDAD */}
          <Row
            icon={Fingerprint}
            label={t("settings.home.privacy.title")}
            desc={t("settings.home.privacy.desc")}
            onClick={() => onNavigate("privacidad")}
          />
        </div>
      </div>

      {/* 📊 SECURITY SCORE */}
      <div className="space-y-3 rounded-xl border border-[var(--border)] dark:bg-[var(--popover)] p-5">
        <div className="flex justify-between items-center">
          <span className="text-sm text-[var(--foreground)]">
            {t("settings.home.health.label")}
          </span>

          <span className="text-sm font-semibold text-[var(--muted-foreground)] ">
            {securityScore}%
          </span>
        </div>

        {/* PROGRESS BAR */}
        <div className="h-2 w-full rounded-full bg-[var(--muted)] overflow-hidden">
          <div
            className="h-full bg-[hsl(var(--primary))] transition-all duration-500"
            style={{ width: `${securityScore}%` }}
          />
        </div>

        {!isSecure && (
          <p className="text-xs text-[var(--muted-foreground)]">
            {t("settings.home.health.recommendation_prefix")}{" "}
            <span className="font-medium text-[var(--foreground)]">
              {t("settings.menu.security")}
            </span>{" "}
            {t("settings.home.health.recommendation_suffix")}
          </p>
        )}
      </div>
    </div>
  );
}

/* 🔥 ROW COMPONENT (tipo iOS settings) */
function Row({ icon: Icon, label, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      className="
        w-full flex items-center justify-between px-4 py-3 text-left group
        hover:bg-[var(--joy-palette-primary-softHoverBg)]
        transition
        first:rounded-t-xl last:rounded-b-xl
      ">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition">
          <Icon size={18} />
        </div>

        <div>
          <p className="text-sm font-medium text-[var(--foreground)]">
            {label}
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">{desc}</p>
        </div>
      </div>

      <ChevronRight size={18} className="text-[var(--muted-foreground)]" />
    </button>
  );
}
