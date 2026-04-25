import { useTranslation } from "react-i18next";
import { User, Mail, AtSign, Globe, MapPin, CreditCard } from "lucide-react";

function ReadField({ icon: Icon, label, value }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </label>
      <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
        <span className="text-sm text-gray-800 dark:text-gray-200 truncate">
          {value || "—"}
        </span>
      </div>
    </div>
  );
}

export default function MyAccountForm({ user }) {
  const { t } = useTranslation();

  if (!user) return null;

  return (
    <div className="w-full space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ReadField
          icon={User}
          label={t("account.fields.name")}
          value={user.nombre}
        />
        <ReadField
          icon={Mail}
          label={t("account.fields.email")}
          value={user.email}
        />
        <ReadField
          icon={AtSign}
          label={t("account.fields.username")}
          value={user.username}
        />
        <ReadField
          icon={Globe}
          label={t("account.fields.country")}
          value={user.nombre_pais}
        />
        <ReadField
          icon={MapPin}
          label={t("account.fields.city")}
          value={user.nombre_ciudad}
        />
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 pt-1">
        * {t("account.info_readonly")}
      </p>
    </div>
  );
}
