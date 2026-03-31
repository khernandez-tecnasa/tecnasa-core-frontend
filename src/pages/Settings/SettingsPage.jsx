// SettingsPage.jsx
import React from "react";
import { useTranslation } from "react-i18next";
import { SettingsProvider } from "../../context/SettingsContext";
import SettingsInner from "./SettingsInner";

export default function SettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="h-screen flex bg-[var(--primary)] text-gray-900">
      <SettingsProvider>
        <SettingsInner />
      </SettingsProvider>
    </div>
  );
}
