// src/pages/Settings/sections/Seguridad.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  Stack,
  Typography,
  Switch,
  Button,
  Divider,
  List,
  ListItem,
  ListItemContent,
  ListItemDecorator,
  Chip,
  Modal,
  ModalDialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Table,
  Sheet,
  Avatar,
  Skeleton,
  Tooltip,
  Input,
  IconButton,
} from "@mui/joy";
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

// Iconos
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import SmartphoneRoundedIcon from "@mui/icons-material/SmartphoneRounded";
import LaptopRoundedIcon from "@mui/icons-material/LaptopRounded";
import DevicesRoundedIcon from "@mui/icons-material/DevicesRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import CircleIcon from "@mui/icons-material/Circle";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

// Componentes y Hooks compartidos
import { SectionHeader } from "./_shared/SectionHeader.jsx";
import TwoFactorSetupModal from "./modals/TwoFactorSetupModal.jsx";
import usePermissions from "../../../hooks/usePermissions.js";
import { useSettings } from "../../../context/SettingsContext.jsx";
import { useToast } from "@/context/ToastContext";

// Servicios
import {
  getSecurityData,
  revokeOtherSessions,
  revokeSession,
} from "@/services/SettingsServices";
import { FingerprintIcon, Pencil, ChevronDown } from "lucide-react";

// --- Helper para formatear fechas ---
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
  const isSmallScreen = useIsMobile();

  const { showToast } = useToast();

  // --- Estados de Configuración (2FA / Alertas) ---
  const [tfaEnabled, setTfaEnabled] = useState(false);
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [setupData, setSetupData] = useState(null);
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false); // Para spinners de botones

  // --- Estados de Datos Dinámicos (Sesiones / Logs) ---
  const [sessions, setSessions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loadingData, setLoadingData] = useState(true); // Para esqueletos de carga

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

  // 1. Sincronizar datos iniciales de props
  useEffect(() => {
    setTfaEnabled(Boolean(initialData?.tfa_enabled));
  }, [initialData]);

  // 2. Cargar datos reales de seguridad (Sesiones y Logs)
  const loadSecurityInfo = useCallback(async () => {
    setLoadingData(true);
    try {
      const data = await getSecurityData();
      setSessions(data.sessions || []);
      setLogs(data.logs || []);
    } catch (error) {
      console.error("Error cargando datos de seguridad:", error);
      // Aquí podrías mostrar un toast/snackbar si lo deseas
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
      const res = await getPasskeysList(); // Tu servicio que llama al endpoint
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

  // --- MANEJADORES: 2FA ---

  // const handleRegisterPasskey = async () => {
  //   try {
  //     setLoadingPasskey(true);

  //     const res = await getRegisterOptions();
  //     const options = res.data || res;

  //     console.log("options", options);
  //     console.log("res", res);

  //     const attestation = await startRegistration(options);

  //     await verifyRegisterPasskey(attestation);

  //     const status = await getPasskeysStatus();
  //     setHasPasskey(status.hasPasskeys);

  //     showToast("Registro exitoso", "success");
  //   } catch (error) {
  //     console.error("Error registrando passkey:", error);
  //     showToast("Error al registrar passkey", "error");
  //   } finally {
  //     setLoadingPasskey(false);
  //   }
  // };

  const handleRegisterPasskey = async () => {
    try {
      setLoadingPasskey(true);

      const res = await getRegisterOptions();
      const options = res.data || res;

      const attestation = await startRegistration(options);

      // 🔥 guardamos temporalmente el attestation
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
        // 🔥 EDITAR
        await updatePasskeyName(editingPasskey.id, deviceNameInput);
        showToast("Nombre actualizado correctamente", "success");
      } else {
        // 🔥 REGISTRAR
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
      // Enviamos el código OTP para confirmar activación
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

  // --- MANEJADORES: SESIONES ---

  const handleRevokeAll = async () => {
    try {
      setLoadingAction(true);
      await revokeOtherSessions();
      // Recargamos la lista para mostrar que solo queda la actual
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

      // 🔥 refresca lista
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
    <div className="space-y-6">
      {/* HEADER */}
      <SectionHeader
        title={t("settings.security.title")}
        subtitle={t("settings.security.subtitle")}
      />

      {/* 🔐 PASSKEYS */}
      <div className="rounded-xl border border-[var(--border)] dark:bg-[var(--popover)] text-[var(--muted-foreground)] overflow-hidden">
        <button
          onClick={() => setOpenPasskeys(!openPasskeys)}
          className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-[var(--joy-palette-primary-softHoverBg)] transition">
          <div className="flex items-center gap-3">
            <FingerprintIcon size={18} />

            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">
                Passkeys
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {passkeysList.length} dispositivo
                {passkeysList.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <span
            className={`transition-transform duration-300 ${
              openPasskeys ? "rotate-180" : ""
            }`}>
            +
          </span>
        </button>

        {/* 🔥 ANIMACIÓN */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
        ${openPasskeys ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
          <div className="border-t border-[var(--border)] divide-y">
            {passkeysList.map((pk) => (
              <div
                key={pk.id}
                className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">
                    {pk.device_name || "Dispositivo"}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {formatDate(pk.created_at)}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditPasskey(pk)}
                    className="text-xs px-2 py-1 rounded-md hover:bg-[var(--muted)]">
                    Editar
                  </button>

                  <button
                    onClick={() => handleAskDelete(pk)}
                    className="text-xs px-2 py-1 rounded-md text-red-500 hover:bg-[var(--muted)]">
                    Eliminar
                  </button>
                </div>
              </div>
            ))}

            <div className="p-4">
              <button
                onClick={handleRegisterPasskey}
                className="w-full text-sm px-4 py-2 rounded-lg bg-[hsl(var(--primary))] text-white hover:opacity-90 transition">
                Añadir dispositivo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 🔒 2FA */}
      <ToggleRow
        icon={ShieldRoundedIcon}
        title={t("settings.security.2fa.title")}
        desc={t("settings.security.2fa.desc")}
        checked={tfaEnabled}
        onChange={handleToggleTfa}
        loading={loading2FA}
      />

      {/* 📲 ALERTAS */}
      <ToggleRow
        icon={SmartphoneRoundedIcon}
        title={t("settings.security.alerts.title")}
        desc={t("settings.security.alerts.desc")}
        checked={!!initialData?.login_alerts}
        onChange={(e) => onSave({ login_alerts: e.target.checked })}
      />

      {/* 📊 SESSIONS */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-medium text-[var(--foreground)]">
            {t("settings.security.sessions.title")}
          </h3>
          <p className="text-xs text-[var(--muted-foreground)]">
            {t("settings.security.sessions.desc")}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--border)] dark:bg-[var(--popover)] divide-y overflow-hidden">
          {loadingData ? (
            <div className="p-4 space-y-2">
              <div className="h-4 w-1/2 bg-[var(--popover)] rounded animate-pulse" />
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
                <div
                  key={session.id}
                  className="relative overflow-hidden group">
                  {/* <button
                    type="button"
                    onClick={() => handleRevokeSession(session.id)}
                    className="absolute inset-y-0 right-0 flex items-center justify-center w-24 bg-red-500 text-white text-xs font-semibold transition-colors duration-200 hover:bg-red-600">
                    Cerrar
                  </button> */}

                  <div className="relative z-10 dark:bg-[var(--popover)]">
                    <div className="flex items-center justify-between px-4 py-3 transition-transform duration-200">
                      <div className="flex items-center gap-3">
                        {/* ICON */}
                        <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-[var(--muted)]">
                          {isSessionMobile ? "📱" : "💻"}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium break-words text-[var(--foreground)]">
                              {isSmallScreen
                                ? shortDevice ||
                                  t(
                                    "settings.security.sessions.unknown_device",
                                    "Sesión",
                                  )
                                : session.device}
                            </p>

                            {session.current && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-600">
                                Actual
                              </span>
                            )}

                            {isSuspicious && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600">
                                ⚠ Riesgo
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-[var(--muted-foreground)]">
                            {session.ip} ·{" "}
                            {session.current
                              ? t("common.status.now")
                              : formatDate(session.last_active, i18n.language)}
                          </p>
                        </div>
                      </div>

                      {isSmallScreen ? (
                        <button
                          type="button"
                          onClick={() => toggleSessionDetails(session.id)}
                          className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition">
                          <span>
                            {isExpanded ? "Mostrar menos" : "Mostrar más"}
                          </span>
                          <ChevronDown
                            className={`h-3 w-3 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      ) : null}
                    </div>

                    {isSmallScreen ? (
                      <div
                        className={`overflow-hidden transition-all duration-200 px-4 ${
                          isExpanded
                            ? "max-h-44 py-3 opacity-100"
                            : "max-h-0 py-0 opacity-0"
                        }`}>
                        <div className="space-y-1 text-xs text-[var(--muted-foreground)]">
                          {normalizedDevice &&
                          normalizedDevice !== shortDevice ? (
                            <p className="break-words">{normalizedDevice}</p>
                          ) : null}
                          {session.location && (
                            <p>
                              <span className="font-medium">Ubicación:</span>{" "}
                              {session.location}
                            </p>
                          )}
                          <p>
                            <span className="font-medium">IP:</span>{" "}
                            {session.ip}
                          </p>
                          <p>
                            <span className="font-medium">
                              Última actividad:
                            </span>{" "}
                            {session.current
                              ? t("common.status.now")
                              : formatDate(session.last_active, i18n.language)}
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* BOTÓN */}
        {!loadingData && sessions.length > 1 && (
          <div className="flex justify-end">
            <Button
              variant="soft"
              color="danger"
              onClick={() => setConfirmSessionsOpen(true)}
              size="sm">
              {t("settings.security.sessions.revoke_all")}
            </Button>
          </div>
        )}
      </div>

      {/* 📊 LOGS */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-medium text-[var(--foreground)]">
            {t("settings.security.logs.title")}
          </h3>
          <p className="text-xs text-[var(--muted-foreground)]">
            {t("settings.security.logs.desc")}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--border)] dark:bg-[var(--popover)] overflow-hidden">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between px-4 py-3 hover:bg-[var(--joy-palette-primary-softHoverBg)] transition">
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {log.action}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {log.device || log.ip}
                </p>
              </div>

              <div className="text-xs text-[var(--muted-foreground)]">
                {formatDate(log.created_at || log.date, i18n.language)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- MODALES --- */}

      {/* Modal QR para 2FA */}
      <TwoFactorSetupModal
        open={setupModalOpen}
        onClose={handleCloseModal}
        setupData={setupData}
        onVerify={handleVerifyCode}
      />

      {/* Modal Confirmación Desactivar 2FA */}
      <Modal
        open={confirmDisableOpen}
        onClose={() => setConfirmDisableOpen(false)}>
        <ModalDialog variant="outlined" role="alertdialog">
          <DialogTitle>
            <WarningRoundedIcon /> {t("settings.security.disable_modal.title")}
          </DialogTitle>
          <Divider />
          <DialogContent>
            {t("settings.security.disable_modal.desc")}
          </DialogContent>
          <DialogActions>
            <Button
              variant="solid"
              color="danger"
              onClick={handleConfirmDisable}
              loading={loadingAction}>
              {t("settings.security.disable_modal.confirm")}
            </Button>
            <Button
              variant="plain"
              color="neutral"
              onClick={() => setConfirmDisableOpen(false)}>
              {t("common.actions.cancel")}
            </Button>
          </DialogActions>
        </ModalDialog>
      </Modal>

      {/* Modal Eliminar Passkey */}
      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <ModalDialog variant="outlined" role="alertdialog">
          <DialogTitle>
            <WarningRoundedIcon /> Eliminar Passkey
          </DialogTitle>

          <Divider />

          <DialogContent>
            ¿Seguro que quieres eliminar esta passkey?
            <Box mt={1}>
              <Typography level="body-sm" fontWeight="md">
                {selectedPasskey?.device_name || "Dispositivo"}
              </Typography>

              <Typography level="body-xs" color="neutral">
                Último uso:{" "}
                {selectedPasskey?.last_used
                  ? formatDate(selectedPasskey.last_used)
                  : "Nunca"}
              </Typography>
            </Box>
          </DialogContent>

          <DialogActions>
            <Button
              variant="solid"
              color="danger"
              onClick={handleConfirmDelete}
              loading={loadingAction}>
              Eliminar
            </Button>

            <Button
              variant="plain"
              color="neutral"
              onClick={() => setDeleteModalOpen(false)}>
              Cancelar
            </Button>
          </DialogActions>
        </ModalDialog>
      </Modal>

      {/* Modal Nombre Passkey */}
      <Modal open={nameModalOpen} onClose={() => setNameModalOpen(false)}>
        <ModalDialog variant="outlined" role="dialog" sx={{ minWidth: 350 }}>
          <DialogTitle>
            <FingerprintIcon size={20} style={{ marginRight: 8 }} />
            {isEditing ? "Editar dispositivo" : "Nombrar dispositivo"}
          </DialogTitle>

          <Divider />

          <DialogContent>
            <Typography level="body-sm" mb={1}>
              {isEditing
                ? "Puedes cambiar el nombre de este dispositivo."
                : "Asigna un nombre para identificar esta passkey."}
            </Typography>

            <Input
              autoFocus
              placeholder="Ej: iPhone de Kevin"
              value={deviceNameInput}
              onChange={(e) => setDeviceNameInput(e.target.value)}
            />
          </DialogContent>

          <DialogActions>
            <Button
              variant="solid"
              onClick={handleSaveDeviceName}
              loading={loadingAction}
              disabled={!deviceNameInput.trim()}>
              Guardar
            </Button>

            <Button
              variant="plain"
              color="neutral"
              onClick={() => setNameModalOpen(false)}>
              Cancelar
            </Button>
          </DialogActions>
        </ModalDialog>
      </Modal>

      <Modal
        open={confirmSessionsOpen}
        onClose={() => setConfirmSessionsOpen(false)}>
        <ModalDialog variant="outlined" role="alertdialog">
          <DialogTitle>⚠ Cerrar sesiones</DialogTitle>

          <Divider />

          <DialogContent>
            Esto cerrará todas las sesiones excepto la actual.
          </DialogContent>

          <DialogActions>
            <Button
              color="danger"
              onClick={async () => {
                await handleRevokeAll();
                setConfirmSessionsOpen(false);
              }}>
              Confirmar
            </Button>

            <Button onClick={() => setConfirmSessionsOpen(false)}>
              Cancelar
            </Button>
          </DialogActions>
        </ModalDialog>
      </Modal>
    </div>
  );
}

function ToggleRow({ icon: Icon, title, desc, checked, onChange, loading }) {
  return (
    <div className="flex items-center justify-between px-4 py-4 rounded-xl border border-[var(--border)] dark:bg-[var(--popover)]">
      <div className="flex items-start gap-3">
        <Icon size={18} />

        <div>
          <p className="text-sm font-medium text-[var(--foreground)]">
            {title}
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">{desc}</p>
        </div>
      </div>

      {/* SWITCH SIMPLE */}
      {loading ? (
        <div className="w-10 h-6 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-[var(--muted-foreground)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <button
          onClick={() => onChange({ target: { checked: !checked } })}
          className={`w-10 h-6 rounded-full transition relative
      ${checked ? "bg-[hsl(var(--primary))]" : "bg-[var(--muted)]"}`}>
          <span
            className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition
        ${checked ? "translate-x-4" : ""}`}
          />
        </button>
      )}
    </div>
  );
}
