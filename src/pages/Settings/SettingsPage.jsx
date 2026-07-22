// SettingsPage.jsx
import React from "react";
import SettingsInner from "./SettingsInner";

export default function SettingsPage() {
  return (
    <div className="h-screen flex bg-[var(--primary)] text-gray-900">
      <SettingsInner />
    </div>
  );
}
