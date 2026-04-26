import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import useIsMobile from "@/hooks/useIsMobile";

import { startRegistration } from "@simplewebauthn/browser";
import {
  getRegisterOptions,
  verifyRegisterPasskey,
  getPasskeysStatus,
  getPasskeysList,
  deletePasskey,
  updatePasskeyName,
} from "@/services/webAuthn.service.js";

import {
  Shield,
  Smartphone,
  AlertTriangle,
  Fingerprint,
  ChevronDown,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Monitor,
  LogOut,
  Lock,
  History,
} from "lucide-react";

import TwoFactorSetupModal from "./modals/TwoFactorSetupModal.jsx";
import usePermissions from "../../../hooks/usePermissions.js";
import { useSettings } from "../../../context/SettingsContext.jsx";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/button";

import {
  getSecurityData,
  revokeOtherSessions,
  revokeSession,
} from "@/services/SettingsServices";

const formatDate = (isoString, locale = "es-HN") => {
  if (!isoString) return "-";
  try {
    return new Date(isoString).toLocaleString(locale, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
      hour12: true,
    });
  } catch (e) {
    return isoString;
  }
};

export default function Seguridad({ initialData = {}, onSave }) {
  const { t, i18n } = useTranslation();
  const perms = usePermissions();
  const { reload } = useSettings();
  const canEdit = perms.has("editar_configuraciones") || perms.isAdmin;
  const isMobile = useIsMobile();

  const { showToast } = useToast();

  const [tfaEnabled, setTfaEnabled] = useState(false);
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [setupData, setSetupData] = useState(null);
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const [loadingPasskey, setLoadingPasskey] = useState(false);
  const [hasPasskey, setHasPasskey] = useState(false);
  const [passkeysList, setPasskeysList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPasskey, setSelectedPasskey] = useState(null);
  const [openPasskeys, setOpenPasskeys] = useState(false);

  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [editingPasskey, setEditingPasskey] = useState(null);
  const [deviceNameInput, setDeviceNameInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [expandedSessionId, setExpandedSessionId] = useState(null);

  const [confirmSessionsOpen, setConfirmSessionsOpen] = useState(false);
  const [loading2FA, setLoading2FA] = useState(false);

  const handleAskDelete = (pk) => {
    setSelectedPasskey(pk);
    setDeleteModalOpen(true);
  };

  useEffect(() => {
    setTfaEnabled(Boolean(initialData?.tfa_enabled));
  }, [initialData]);

  const loadSecurityInfo = useCallback(async () => {
    setLoadingData(true);
    try {
      const data = await getSecurityData();
      setSessions(data.sessions || []);
      setLogs(data.logs || []);
    } catch (error) {
      console.error("Error cargando datos de seguridad:", error);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadSecurityInfo();
  }, [loadSecurityInfo]);

  const loadPasskeys = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await getPasskeysList();
      if (res.ok) setPasskeysList(res.data || []);
    } catch (error) {
      console.error("Error cargando passkeys:", error);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadPasskeys();
  }, [loadPasskeys]);

  useEffect(() => {
    const loadPasskeyStatus = async () => {
      try {
        const res = await getPasskeysStatus();
        setHasPasskey(res.hasPasskeys);
      } catch (e) {
        console.error("Error passkey status:", e);
      }
    };
    loadPasskeyStatus();
  }, []);

  const handleRegisterPasskey = async () => {
    try {
      setLoadingPasskey(true);
      const res = await getRegisterOptions();
      const options = res.data || res;
      const attestation = await startRegistration(options);
      setEditingPasskey({ attestation });
      setDeviceNameInput("");
      setIsEditing(false);
      setNameModalOpen(true);
    } catch (error) {
      console.error("Error registrando passkey:", error);
    } finally {
      setLoadingPasskey(false);
    }
  };

  const handleSaveDeviceName = async () => {
    try {
      setLoadingAction(true);
      if (isEditing) {
        await updatePasskeyName(editingPasskey.id, deviceNameInput);
        showToast("Nombre actualizado correctamente", "success");
      } else {
        await verifyRegisterPasskey({
          ...editingPasskey.attestation,
          deviceName: deviceNameInput,
        });
        showToast("Dispositivo guardado correctamente", "success");
      }
      setNameModalOpen(false);
      setEditingPasskey(null);
      setDeviceNameInput("");
      await loadPasskeys();
    } catch (error) {
      console.error("Error guardando nombre:", error);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleEditPasskey = (pk) => {
    setEditingPasskey(pk);
    setDeviceNameInput(pk.device_name || "");
    setIsEditing(true);
    setNameModalOpen(true);
  };

  const handleToggleTfa = async (event) => {
    const isChecking = event.target.checked;
    if (isChecking) {
      try {
        setLoading2FA(true);
        const res = await onSave({ tfa_enroll_init: true });
        const setupPayload = res?.qr_image
          ? res
          : res?.data?.qr_image
            ? res.data
            : res;
        if (setupPayload?.qr_image) {
          setSetupData(setupPayload);
          setSetupModalOpen(true);
        } else {
          showToast("No se pudo obtener el código QR.", "warning");
        }
      } catch (error) {
        console.error("Error iniciando 2FA", error);
      } finally {
        setLoading2FA(false);
      }
    } else {
      setConfirmDisableOpen(true);
    }
  };

  const handleVerifyCode = async (code) => {
    try {
      const res = await onSave({
        tfa_enroll_verify: true,
        token: code,
        secret: setupData?.secret,
      });
      setSetupModalOpen(false);
      setSetupData(null);
      return res;
    } catch (error) {
      throw error;
    }
  };

  const handleConfirmDisable = async () => {
    try {
      setLoadingAction(true);
      await onSave({ tfa_enabled: false });
      setConfirmDisableOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCloseModal = () => {
    setSetupModalOpen(false);
    setSetupData(null);
  };

  const handleRevokeAll = async () => {
    try {
      setLoadingAction(true);
      await revokeOtherSessions();
      await loadSecurityInfo();
    } catch (error) {
      console.error("Error cerrando sesiones:", error);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      if (!window.confirm("¿Cerrar esta sesión?")) return;
      setLoadingAction(true);
      await revokeSession(sessionId);
      await loadSecurityInfo();
    } catch (error) {
      console.error("Error cerrando sesión:", error);
    } finally {
      setLoadingAction(false);
    }
  };

  const toggleSessionDetails = (sessionId) => {
    setExpandedSessionId((current) =>
      current === sessionId ? null : sessionId,
    );
  };

  const handleDeletePasskey = async (id) => {
    try {
      const confirm = window.confirm("¿Eliminar esta passkey?");
      if (!confirm) return;
      await deletePasskey(id);
      await loadPasskeys();
    } catch (error) {
      console.error("Error eliminando passkey:", error);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setLoadingAction(true);
      await deletePasskey(selectedPasskey.id);
      setDeleteModalOpen(false);
      setSelectedPasskey(null);
      await loadPasskeys();
    } catch (error) {
      console.error("Error eliminando:", error);
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-primary/10 dark:bg-primary/20 ring-1 ring-primary/20 dark:ring-primary/40 shrink-0">
          <Shield size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight leading-none dark:text-slate-100">
            {t("settings.security.title")}
          </h1>
          <p className="text-xs text-muted-foreground dark:text-slate-400 mt-0.5 font-medium">
            {t("settings.security.subtitle")}
          </p>
        </div>
      </div>

      {/* PASSKEYS */}
      <div className="bg-card dark:bg-slate-800/60 border border-border/60 dark:border-slate-700/60 rounded-3xl shadow-sm overflow-hidden">
        <button
          onClick={() => setOpenPasskeys(!openPasskeys)}
          className="w-full flex items-center gap-2.5 px-5 py-3.5 text-left hover:bg-muted/30 dark:hover:bg-slate-700/30 transition-colors">
          <div className="p-1.5 bg-muted dark:bg-slate-700 rounded-xl shrink-0">
            <Fingerprint size={14} className="text-muted-foreground dark:text-slate-400" />
          </div>
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400 flex-1">
            Passkeys
          </h2>
          {!loadingList && (
            <span className="text-xs text-muted-foreground/60 dark:text-slate-500 font-medium">
              {passkeysList.length} dispositivo{passkeysList.length !== 1 ? "s" : ""}
            </span>
          )}
          <ChevronDown
            size={15}
            className={`text-muted-foreground/50 dark:text-slate-500 transition-transform duration-300 ml-1 ${openPasskeys ? "rotate-180" : ""}`}
          />
        </button>

        <div
          className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            openPasskeys ? "max-h-[600px]" : "max-h-0"
          }`}>
          <div className="border-t border-border/60 dark:border-slate-700/50 divide-y divide-border/40 dark:divide-slate-700/50">
            {loadingList ? (
              <div className="px-5 py-4 space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-muted/60 dark:bg-slate-700/60 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-1/3 rounded bg-muted/60 dark:bg-slate-700/60 animate-pulse" />
                      <div className="h-2.5 w-1/4 rounded bg-muted/40 dark:bg-slate-700/40 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : passkeysList.length === 0 ? (
              <div className="px-5 py-6 text-center">
                <p className="text-xs text-muted-foreground dark:text-slate-500">
                  No hay dispositivos registrados
                </p>
              </div>
            ) : (
              passkeysList.map((pk) => (
                <div
                  key={pk.id}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/20 dark:hover:bg-slate-700/20 transition-colors">
                  <div className="p-1.5 bg-muted/60 dark:bg-slate-700/60 rounded-lg shrink-0">
                    <Monitor size={13} className="text-muted-foreground dark:text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground dark:text-slate-100 truncate">
                      {pk.device_name || "Dispositivo"}
                    </p>
                    <p className="text-xs text-muted-foreground dark:text-slate-500 mt-0.5">
                      {formatDate(pk.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleEditPasskey(pk)}
                      className="p-1.5 rounded-lg hover:bg-muted/80 dark:hover:bg-slate-700 text-muted-foreground hover:text-foreground transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleAskDelete(pk)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-muted-foreground hover:text-rose-500 dark:hover:text-rose-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}

            <div className="p-4">
              <Button
                onClick={handleRegisterPasskey}
                disabled={loadingPasskey}
                className="w-full rounded-2xl h-10 font-bold gap-2 shadow-sm shadow-primary/15 hover:shadow-primary/25 transition-all disabled:opacity-60">
                {loadingPasskey ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Plus size={14} />
                )}
                Añadir dispositivo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* AUTENTICACIÓN: 2FA + ALERTAS */}
      <div className="bg-card dark:bg-slate-800/60 border border-border/60 dark:border-slate-700/60 rounded-3xl shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2.5 pb-1">
          <div className="p-1.5 bg-muted dark:bg-slate-700 rounded-xl">
            <Lock size={14} className="text-muted-foreground dark:text-slate-400" />
          </div>
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400">
            Autenticación
          </h2>
        </div>

        <ToggleRow
          icon={Shield}
          title={t("settings.security.2fa.title")}
          desc={t("settings.security.2fa.desc")}
          checked={tfaEnabled}
          onChange={handleToggleTfa}
          loading={loading2FA}
        />
        <div className="h-px bg-border/40 dark:bg-slate-700/50" />
        <ToggleRow
          icon={Smartphone}
          title={t("settings.security.alerts.title")}
          desc={t("settings.security.alerts.desc")}
          checked={!!initialData?.login_alerts}
          onChange={(e) => onSave({ login_alerts: e.target.checked })}
        />
      </div>

      {/* SESIONES */}
      <div className="bg-card dark:bg-slate-800/60 border border-border/60 dark:border-slate-700/60 rounded-3xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/60 dark:border-slate-700/50">
          <div className="p-1.5 bg-muted dark:bg-slate-700 rounded-xl shrink-0">
            <Monitor size={14} className="text-muted-foreground dark:text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400 leading-none">
              {t("settings.security.sessions.title")}
            </h2>
            {!isMobile && (
              <p className="text-[11px] text-muted-foreground/60 dark:text-slate-500 mt-0.5">
                {t("settings.security.sessions.desc")}
              </p>
            )}
          </div>
          {!loadingData && sessions.length > 1 && (
            <button
              onClick={() => setConfirmSessionsOpen(true)}
              className="shrink-0 text-xs font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 transition-colors">
              {t("settings.security.sessions.revoke_all")}
            </button>
          )}
        </div>

        <div className="divide-y divide-border/40 dark:divide-slate-700/50">
          {loadingData ? (
            <div className="px-5 py-5 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-muted/60 dark:bg-slate-700/60 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-1/2 rounded bg-muted/60 dark:bg-slate-700/60 animate-pulse" />
                    <div className="h-2.5 w-1/3 rounded bg-muted/40 dark:bg-slate-700/40 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            sessions.map((session) => {
              const isSessionMobile =
                session.type === "mobile" ||
                /android|iphone|ipad|mobile/i.test(session.device || "");
              const isSuspicious =
                !session.current &&
                (!session.device || session.location === "Unknown");
              const normalizedDevice = (session.device || "")
                .replace(/\s+/g, " ")
                .trim();
              const shortDevice =
                normalizedDevice.length > 40
                  ? `${normalizedDevice.slice(0, 40)}...`
                  : normalizedDevice;
              const isExpanded = expandedSessionId === session.id;

              return (
                <div key={session.id} className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-base ${
                        isSessionMobile
                          ? "bg-blue-50 dark:bg-blue-500/10"
                          : "bg-muted/50 dark:bg-slate-700/50"
                      }`}>
                      {isSessionMobile ? "📱" : "💻"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-semibold text-foreground dark:text-slate-100 truncate">
                          {isMobile
                            ? shortDevice ||
                              t(
                                "settings.security.sessions.unknown_device",
                                "Sesión",
                              )
                            : session.device ||
                              t(
                                "settings.security.sessions.unknown_device",
                                "Sesión",
                              )}
                        </p>
                        {session.current && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                            Actual
                          </span>
                        )}
                        {isSuspicious && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold shrink-0">
                            ⚠ Riesgo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground dark:text-slate-500 mt-0.5">
                        {session.ip} ·{" "}
                        {session.current
                          ? t("common.status.now")
                          : formatDate(session.last_active, i18n.language)}
                      </p>
                    </div>

                    {isMobile && (
                      <button
                        type="button"
                        onClick={() => toggleSessionDetails(session.id)}
                        className="shrink-0 p-1.5 rounded-lg hover:bg-muted/60 dark:hover:bg-slate-700/60 text-muted-foreground transition-colors">
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </button>
                    )}
                  </div>

                  {isMobile && (
                    <div
                      className={`overflow-hidden transition-all duration-200 ${
                        isExpanded
                          ? "max-h-44 mt-3 opacity-100"
                          : "max-h-0 opacity-0"
                      }`}>
                      <div className="pl-12 space-y-1 text-xs text-muted-foreground dark:text-slate-400">
                        {normalizedDevice && normalizedDevice !== shortDevice && (
                          <p className="break-words">{normalizedDevice}</p>
                        )}
                        {session.location && (
                          <p>
                            <span className="font-semibold text-foreground dark:text-slate-300">
                              Ubicación:
                            </span>{" "}
                            {session.location}
                          </p>
                        )}
                        <p>
                          <span className="font-semibold text-foreground dark:text-slate-300">
                            IP:
                          </span>{" "}
                          {session.ip}
                        </p>
                        <p>
                          <span className="font-semibold text-foreground dark:text-slate-300">
                            Última actividad:
                          </span>{" "}
                          {session.current
                            ? t("common.status.now")
                            : formatDate(session.last_active, i18n.language)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* LOGS */}
      <div className="bg-card dark:bg-slate-800/60 border border-border/60 dark:border-slate-700/60 rounded-3xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/60 dark:border-slate-700/50">
          <div className="p-1.5 bg-muted dark:bg-slate-700 rounded-xl shrink-0">
            <History size={14} className="text-muted-foreground dark:text-slate-400" />
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400 leading-none">
              {t("settings.security.logs.title")}
            </h2>
            {!isMobile && (
              <p className="text-[11px] text-muted-foreground/60 dark:text-slate-500 mt-0.5">
                {t("settings.security.logs.desc")}
              </p>
            )}
          </div>
        </div>

        <div className="divide-y divide-border/40 dark:divide-slate-700/50">
          {logs.length === 0 && !loadingData ? (
            <div className="px-5 py-8 text-center">
              <p className="text-xs text-muted-foreground dark:text-slate-500">
                No hay actividad registrada
              </p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/20 dark:hover:bg-slate-700/20 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground dark:text-slate-100 truncate">
                    {log.action}
                  </p>
                  <p className="text-xs text-muted-foreground dark:text-slate-500 mt-0.5 truncate">
                    {log.device || log.ip}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground/70 dark:text-slate-500 shrink-0 whitespace-nowrap">
                  {formatDate(log.created_at || log.date, i18n.language)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── MODALES ── */}

      <TwoFactorSetupModal
        open={setupModalOpen}
        onClose={handleCloseModal}
        setupData={setupData}
        onVerify={handleVerifyCode}
      />

      {/* Desactivar 2FA */}
      {confirmDisableOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200"
          onClick={() => !loadingAction && setConfirmDisableOpen(false)}>
          <div
            className="w-full max-w-md bg-card dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl dark:shadow-black/50 border border-border/40 p-6 space-y-5 animate-in slide-in-from-bottom md:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/10 dark:bg-amber-500/15 rounded-2xl ring-1 ring-amber-500/20 shrink-0">
                <AlertTriangle size={20} className="text-amber-500" />
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight dark:text-slate-100">
                  {t("settings.security.disable_modal.title")}
                </h2>
                <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1.5 leading-relaxed">
                  {t("settings.security.disable_modal.desc")}
                </p>
              </div>
            </div>
            <div className="h-px bg-border/50" />
            <div className="flex gap-2.5">
              <Button
                onClick={handleConfirmDisable}
                disabled={loadingAction}
                className="flex-1 rounded-2xl h-10 bg-rose-500 hover:bg-rose-600 text-white font-bold shadow-md gap-2 disabled:opacity-60">
                {loadingAction && <Loader2 size={15} className="animate-spin" />}
                {t("settings.security.disable_modal.confirm")}
              </Button>
              <Button
                variant="outline"
                onClick={() => setConfirmDisableOpen(false)}
                disabled={loadingAction}
                className="flex-1 rounded-2xl h-10 font-bold">
                {t("common.actions.cancel")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Eliminar Passkey */}
      {deleteModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200"
          onClick={() => !loadingAction && setDeleteModalOpen(false)}>
          <div
            className="w-full max-w-md bg-card dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl dark:shadow-black/50 border border-border/40 p-6 space-y-5 animate-in slide-in-from-bottom md:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-500/10 dark:bg-rose-500/15 rounded-2xl ring-1 ring-rose-500/20 shrink-0">
                <AlertTriangle size={20} className="text-rose-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-black tracking-tight dark:text-slate-100">
                  Eliminar Passkey
                </h2>
                <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1.5 leading-relaxed">
                  ¿Seguro que quieres eliminar esta passkey? Esta acción no se
                  puede deshacer.
                </p>
                {selectedPasskey && (
                  <div className="mt-3 px-3 py-2.5 bg-muted/50 dark:bg-slate-800 rounded-xl">
                    <p className="text-sm font-bold text-foreground dark:text-slate-200">
                      {selectedPasskey.device_name || "Dispositivo"}
                    </p>
                    <p className="text-xs text-muted-foreground dark:text-slate-500 mt-0.5">
                      Último uso:{" "}
                      {selectedPasskey.last_used
                        ? formatDate(selectedPasskey.last_used)
                        : "Nunca"}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="h-px bg-border/50" />
            <div className="flex gap-2.5">
              <Button
                onClick={handleConfirmDelete}
                disabled={loadingAction}
                className="flex-1 rounded-2xl h-10 bg-rose-500 hover:bg-rose-600 text-white font-bold shadow-md gap-2 disabled:opacity-60">
                {loadingAction ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Trash2 size={15} />
                )}
                {loadingAction ? "Eliminando..." : "Eliminar"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setDeleteModalOpen(false)}
                disabled={loadingAction}
                className="flex-1 rounded-2xl h-10 font-bold">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Nombrar / Editar Passkey */}
      {nameModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200"
          onClick={() => !loadingAction && setNameModalOpen(false)}>
          <div
            className="w-full max-w-md bg-card dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl dark:shadow-black/50 border border-border/40 p-6 space-y-5 animate-in slide-in-from-bottom md:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 dark:bg-primary/15 rounded-2xl ring-1 ring-primary/20 shrink-0">
                <Fingerprint size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight dark:text-slate-100">
                  {isEditing ? "Editar dispositivo" : "Nombrar dispositivo"}
                </h2>
                <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1.5">
                  {isEditing
                    ? "Puedes cambiar el nombre de este dispositivo."
                    : "Asigna un nombre para identificar esta passkey."}
                </p>
              </div>
            </div>
            <div className="h-px bg-border/50" />
            <input
              autoFocus
              placeholder="Ej: iPhone de Kevin"
              value={deviceNameInput}
              onChange={(e) => setDeviceNameInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                deviceNameInput.trim() &&
                handleSaveDeviceName()
              }
              className="w-full rounded-xl border border-border dark:border-slate-700 px-4 py-2.5 text-sm bg-background dark:bg-slate-900/60 dark:text-slate-100 placeholder:text-muted-foreground/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <div className="flex gap-2.5">
              <Button
                onClick={handleSaveDeviceName}
                disabled={loadingAction || !deviceNameInput.trim()}
                className="flex-1 rounded-2xl h-10 font-bold shadow-md shadow-primary/15 gap-2 disabled:opacity-60">
                {loadingAction && <Loader2 size={15} className="animate-spin" />}
                Guardar
              </Button>
              <Button
                variant="outline"
                onClick={() => setNameModalOpen(false)}
                disabled={loadingAction}
                className="flex-1 rounded-2xl h-10 font-bold">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cerrar todas las sesiones */}
      {confirmSessionsOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200"
          onClick={() => !loadingAction && setConfirmSessionsOpen(false)}>
          <div
            className="w-full max-w-md bg-card dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl dark:shadow-black/50 border border-border/40 p-6 space-y-5 animate-in slide-in-from-bottom md:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/10 dark:bg-amber-500/15 rounded-2xl ring-1 ring-amber-500/20 shrink-0">
                <AlertTriangle size={20} className="text-amber-500" />
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight dark:text-slate-100">
                  Cerrar sesiones
                </h2>
                <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1.5 leading-relaxed">
                  Esto cerrará todas las sesiones activas excepto la actual.
                </p>
              </div>
            </div>
            <div className="h-px bg-border/50" />
            <div className="flex gap-2.5">
              <Button
                onClick={async () => {
                  await handleRevokeAll();
                  setConfirmSessionsOpen(false);
                }}
                disabled={loadingAction}
                className="flex-1 rounded-2xl h-10 bg-rose-500 hover:bg-rose-600 text-white font-bold shadow-md gap-2 disabled:opacity-60">
                {loadingAction ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <LogOut size={15} />
                )}
                {loadingAction ? "Cerrando..." : "Confirmar"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setConfirmSessionsOpen(false)}
                disabled={loadingAction}
                className="flex-1 rounded-2xl h-10 font-bold">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleRow({ icon: Icon, title, desc, checked, onChange, loading }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="p-2 bg-muted/60 dark:bg-slate-700/60 rounded-xl shrink-0">
          <Icon size={15} className="text-muted-foreground dark:text-slate-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground dark:text-slate-100 leading-none">
            {title}
          </p>
          <p className="text-xs text-muted-foreground dark:text-slate-400 mt-0.5 leading-snug">
            {desc}
          </p>
        </div>
      </div>
      {loading ? (
        <div className="shrink-0 w-10 h-6 flex items-center justify-center">
          <Loader2 size={14} className="animate-spin text-muted-foreground" />
        </div>
      ) : (
        <button
          onClick={() => onChange({ target: { checked: !checked } })}
          className={`shrink-0 w-10 h-6 rounded-full transition-colors relative ${
            checked ? "bg-primary" : "bg-muted dark:bg-slate-700"
          }`}>
          <span
            className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
              checked ? "translate-x-4" : ""
            }`}
          />
        </button>
      )}
    </div>
  );
}
