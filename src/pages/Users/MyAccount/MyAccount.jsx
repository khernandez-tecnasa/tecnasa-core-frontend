import { useEffect, useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { User, Shield, History } from "lucide-react";

import MyAccountForm from "../../../components/Users/MyAccount/MyAccountForm";
import SecuritySettingsForm from "../../../components/Users/MyAccount/SecuritySettingsForm";

import { getUsersById } from "../../../services/AuthServices";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";

/* ── Skeleton ── */
function PageSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 animate-pulse">
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="h-5 w-32 rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div className="h-3.5 w-24 rounded-lg bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="space-y-2 pt-2">
          <div className="h-9 rounded-xl bg-gray-200 dark:bg-gray-700" />
          <div className="h-9 rounded-xl bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <div className="h-6 w-40 rounded-lg bg-gray-200 dark:bg-gray-700" />
        <div className="h-48 rounded-xl bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );
}

/* ── Initials helper ── */
function getInitials(name = "") {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

/* ── Nav button ── */
function NavBtn({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
        ${
          active
            ? "bg-primary/10 text-primary"
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        }
      `}>
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </button>
  );
}

/* ── Main ── */
export default function MyAccount() {
  const { t, i18n } = useTranslation();
  const { userData } = useAuth();
  const { showToast } = useToast();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState("profile");

  const loadUserData = useCallback(async () => {
    setLoading(true);
    try {
      const id = userData?.id_usuario || userData?.id;
      if (!id) {
        showToast(t("account.errors.no_id"), "danger");
        return;
      }
      const data = await getUsersById(id);

      if (!data) {
        setUser(null);
        return;
      }

      if (Array.isArray(data)) {
        setUser(data[0] || null);
      } else {
        setUser(data);
      }
    } catch {
      showToast(t("account.errors.load_failed"), "danger");
    } finally {
      setLoading(false);
    }
  }, [userData, t, showToast]);

  useEffect(() => {
    if (userData) {
      loadUserData();
    }
  }, [userData, loadUserData]);

  const formattedLastReset = useMemo(() => {
    if (!user?.last_password_change) return null;
    try {
      return new Date(user.last_password_change).toLocaleString(i18n.language, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
        hour12: true,
      });
    } catch {
      return null;
    }
  }, [user?.last_password_change, i18n.language]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-4 md:p-6">
        <PageSkeleton />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center p-8">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-sm">
          {t("account.errors.load_failed")}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {t("account.page_title")}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 items-start">
        {/* ── Left panel ── */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 space-y-5 md:sticky md:top-6">
          {/* Avatar */}
          <div className="flex flex-col items-center text-center gap-2">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-md"
              style={{
                background:
                  "linear-gradient(135deg, hsl(var(--primary)/0.7), hsl(var(--primary)))",
              }}>
              {getInitials(user?.nombre)}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {user?.nombre}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.puesto || t("account.no_position")}
              </p>
            </div>
          </div>

          <div className="h-px bg-gray-100 dark:bg-gray-800" />

          {/* Nav */}
          <nav className="space-y-1">
            <NavBtn
              icon={User}
              label={t("account.menu.profile")}
              active={section === "profile"}
              onClick={() => setSection("profile")}
            />
            <NavBtn
              icon={Shield}
              label={t("account.menu.security")}
              active={section === "security"}
              onClick={() => setSection("security")}
            />
          </nav>
        </div>

        {/* ── Right panel ── */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 md:p-7 min-h-[400px]">
          {section === "profile" && (
            <>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
                {t("account.profile.title")}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                {t("account.profile.subtitle")}
              </p>
              <div className="h-px bg-gray-100 dark:bg-gray-800 mb-5" />
              <MyAccountForm user={user} />
            </>
          )}

          {section === "security" && (
            <>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
                {t("account.security.title")}
              </h2>
              <div className="mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("account.security.subtitle")}
                </p>
                {formattedLastReset && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <History className="w-3.5 h-3.5" />
                    {t("account.security.last_reset")}: {formattedLastReset}
                  </p>
                )}
              </div>
              <div className="h-px bg-gray-100 dark:bg-gray-800 mb-5" />
              <SecuritySettingsForm user={user} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
