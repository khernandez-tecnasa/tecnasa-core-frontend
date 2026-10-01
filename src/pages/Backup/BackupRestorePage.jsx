import { useState, useEffect, useCallback } from "react";
import {
  Database,
  Download,
  Upload,
  RotateCcw,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  HardDrive,
  Clock,
  FileArchive,
  X,
  ShieldAlert,
  Trash2,
  ShieldCheck,
  CircleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { startAuthentication } from "@simplewebauthn/browser";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import {
  generarBackupManual,
  descargarBackup,
  obtenerListaBackups,
  eliminarBackup,
  verificarBackup,
  cancelarBackup,
  iniciarRestauracion,
  iniciarAutorizacionRestauracion,
  verificarAutorizacionRestauracion,
  obtenerEstadoRestauracion,
  iniciarRestore,
  ejecutarRestore,
} from "@/services/BackupServices";

/* ── Helpers ──────────────────────────────────────────────────────── */
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("es-GT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const statusInfo = {
  queued: {
    label: "En cola",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  },
  running: {
    label: "Generando",
    className: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  },
  cancelling: {
    label: "Cancelando",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  },
  cancelled: {
    label: "Cancelado",
    className:
      "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
  },
  completed: {
    label: "Disponible",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  failed: {
    label: "Falló",
    className:
      "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  },
  missing: {
    label: "No encontrado",
    className:
      "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
  },
};

const sourceLabels = {
  manual: "Manual",
  scheduled: "Programado",
  emergency: "Emergencia",
  legacy: "Anterior",
};

const backupTypeLabels = {
  database: "Solo DB",
  images: "Solo imágenes",
  full: "Completo",
};

/* ── Componente principal ─────────────────────────────────────────── */
export default function BackupRestorePage() {
  const { showToast } = useToast();
  const { isAdmin, hasPermiso, logout } = useAuth();

  const canManage = isAdmin || hasPermiso("gestionar_backup");

  const [backups, setBackups] = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [activeDownloadId, setActiveDownloadId] = useState(null);
  const [activeVerifyId, setActiveVerifyId] = useState(null);
  const [backupToDelete, setBackupToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [backupToRestore, setBackupToRestore] = useState(null);
  const [restoreConfirmation, setRestoreConfirmation] = useState("");
  const [restoreAuthAttempt, setRestoreAuthAttempt] = useState(null);
  const [restoreAuthorizationToken, setRestoreAuthorizationToken] = useState("");
  const [restoreAuthPassword, setRestoreAuthPassword] = useState("");
  const [restoreAuthCode, setRestoreAuthCode] = useState("");
  const [verifyingRestoreAuth, setVerifyingRestoreAuth] = useState(false);
  const [restoreJob, setRestoreJob] = useState(null);
  const [startingRestore, setStartingRestore] = useState(false);
  const [confirmBackupOpen, setConfirmBackupOpen] = useState(false);
  const [backupType, setBackupType] = useState("full");

  // Restore state
  const [restoreFile, setRestoreFile] = useState(null);
  const [confirmationToken, setConfirmationToken] = useState(null);
  const [confirmText, setConfirmText] = useState("");
  const [restoreStep, setRestoreStep] = useState(0); // 0 idle | 1 confirm | 2 success
  const [restoring, setRestoring] = useState(false);

  /* ── Carga ──────────────────────────────────────────────────────── */
  const loadBackups = useCallback(async () => {
    setLoadingBackups(true);
    try {
      const list = await obtenerListaBackups();
      setBackups(list || []);
    } catch {
      showToast("Error al cargar la lista de backups", "danger");
    } finally {
      setLoadingBackups(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadBackups();
  }, [loadBackups]);

  const hasBackgroundWork = backups.some(
    (backup) =>
      ["queued", "running", "cancelling"].includes(backup.status) ||
      backup.integrityStatus === "verifying",
  );

  useEffect(() => {
    if (!hasBackgroundWork) return undefined;
    const intervalId = window.setInterval(loadBackups, 5000);
    return () => window.clearInterval(intervalId);
  }, [hasBackgroundWork, loadBackups]);

  /* ── Acciones ────────────────────────────────────────────────────── */
  const handleGenerar = async () => {
    setGenerando(true);
    try {
      const result = await generarBackupManual({ backupType });
      showToast(
        result.message || "El backup se está generando en segundo plano",
        "success",
      );
      await loadBackups();
    } catch (err) {
      showToast(err.message || "Error al generar backup", "danger");
    } finally {
      setGenerando(false);
    }
  };

  const handleDescargar = async (backup) => {
    setActiveDownloadId(backup.id);
    try {
      const blob = await descargarBackup(backup.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = backup.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showToast(err.message || "Error al descargar backup", "danger");
    } finally {
      setActiveDownloadId(null);
    }
  };

  const handleVerificar = async (backup) => {
    setActiveVerifyId(backup.id);
    try {
      const result = await verificarBackup(backup.id);
      showToast(result.message || "Verificación iniciada", "success");
      await loadBackups();
    } catch (err) {
      showToast(err.message || "Error al verificar backup", "danger");
    } finally {
      setActiveVerifyId(null);
    }
  };

  const handleEliminar = async () => {
    if (!backupToDelete) return;
    setDeleting(true);
    try {
      const result = await eliminarBackup(backupToDelete.id);
      showToast(result.message || "Backup eliminado", "success");
      setBackupToDelete(null);
      await loadBackups();
    } catch (err) {
      showToast(err.message || "Error al eliminar backup", "danger");
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelar = async (backup) => {
    setCancellingId(backup.id);
    try {
      const result = await cancelarBackup(backup.id);
      showToast(result.message || "Cancelación solicitada", "warning");
      await loadBackups();
    } catch (err) {
      showToast(err.message || "Error al cancelar backup", "danger");
    } finally {
      setCancellingId(null);
    }
  };

  const handleOpenRestore = async (backup) => {
    setStartingRestore(true);
    try {
      const attempt = await iniciarAutorizacionRestauracion(backup.id);
      setBackupToRestore(backup);
      setRestoreAuthAttempt(attempt);
      setRestoreAuthorizationToken("");
      setRestoreConfirmation("");
      setRestoreAuthPassword("");
      setRestoreAuthCode("");
    } catch (err) {
      showToast(err.message || "No se pudo iniciar la verificación", "danger");
    } finally {
      setStartingRestore(false);
    }
  };

  const handleVerifyRestoreIdentity = async () => {
    if (!backupToRestore || !restoreAuthAttempt) return;
    setVerifyingRestoreAuth(true);
    try {
      let proof = { attemptId: restoreAuthAttempt.attemptId };
      if (restoreAuthAttempt.method === "passkey") {
        const credential = await startAuthentication({ optionsJSON: restoreAuthAttempt.options });
        proof.credential = credential;
      } else {
        proof.password = restoreAuthPassword;
        if (restoreAuthAttempt.method === "totp") proof.code = restoreAuthCode;
      }
      const result = await verificarAutorizacionRestauracion(backupToRestore.id, proof);
      setRestoreAuthorizationToken(result.authorizationToken);
      showToast("Identidad verificada. Confirma la restauración.", "success");
    } catch (err) {
      showToast(err.message || "No se pudo verificar tu identidad", "danger");
    } finally {
      setVerifyingRestoreAuth(false);
    }
  };

  const handleStartRestore = async () => {
    if (!backupToRestore || !restoreAuthorizationToken || restoreConfirmation !== "RESTAURAR") return;
    setStartingRestore(true);
    try {
      const result = await iniciarRestauracion(
        backupToRestore.id,
        restoreConfirmation,
        restoreAuthorizationToken,
      );
      setRestoreJob(result.restore);
      setBackupToRestore(null);
      setRestoreConfirmation("");
      setRestoreAuthorizationToken("");
      setRestoreAuthAttempt(null);
      showToast(result.message || "Restauración iniciada", "warning");
    } catch (err) {
      showToast(err.message || "No se pudo iniciar la restauración", "danger");
    } finally {
      setStartingRestore(false);
    }
  };

  useEffect(() => {
    if (!restoreJob || ["completed", "failed", "rolled_back"].includes(restoreJob.status)) return undefined;
    const intervalId = window.setInterval(async () => {
      try {
        setRestoreJob(await obtenerEstadoRestauracion(restoreJob.id));
      } catch (err) {
        showToast(err.message || "No se pudo consultar la restauración", "danger");
      }
    }, 3000);
    return () => window.clearInterval(intervalId);
  }, [restoreJob, showToast]);

  useEffect(() => {
    if (restoreJob?.status === "completed") {
      if (restoreJob.backupType === "images") {
        showToast("Imágenes restauradas correctamente.", "success");
      } else {
        showToast("Restauración completada. Se cerrará la sesión por seguridad.", "success");
        const timeoutId = window.setTimeout(() => logout(), 1800);
        return () => window.clearTimeout(timeoutId);
      }
    }
    if (restoreJob?.status === "failed" || restoreJob?.status === "rolled_back") {
      showToast(restoreJob.errorMessage || "La restauración falló y fue revertida.", "danger");
    }
    return undefined;
  }, [restoreJob?.status, restoreJob?.backupType, restoreJob?.errorMessage, logout, showToast]);

  const latestReadyBackup = backups.find(
    (backup) => backup.status === "completed",
  );

  const handleInitRestore = async () => {
    if (!restoreFile) return;
    setRestoring(true);
    try {
      const result = await iniciarRestore(restoreFile);
      setConfirmationToken(result.confirmationToken);
      setRestoreStep(1);
    } catch (err) {
      showToast(err.message || "Error al iniciar restauración", "danger");
    } finally {
      setRestoring(false);
    }
  };

  const handleExecuteRestore = async () => {
    if (!confirmationToken || confirmText !== "CONFIRMAR") {
      showToast("Debes escribir exactamente CONFIRMAR", "warning");
      return;
    }
    setRestoring(true);
    try {
      const result = await ejecutarRestore(confirmationToken, confirmText);
      setRestoreStep(2);
      setConfirmationToken(null);
      setConfirmText("");
      setRestoreFile(null);
      showToast(result.message || "Restauración completada", "success");
      await loadBackups();
    } catch (err) {
      showToast(err.message || "Error al restaurar", "danger");
    } finally {
      setRestoring(false);
    }
  };

  const handleCancelRestore = () => {
    setRestoreStep(0);
    setConfirmationToken(null);
    setConfirmText("");
    setRestoreFile(null);
  };

  /* ── Sin permisos ─────────────────────────────────────────────────── */
  if (!canManage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-muted-foreground">
        <div className="w-16 h-16 rounded-3xl bg-muted/50 dark:bg-slate-800/50 flex items-center justify-center">
          <Database size={28} className="opacity-30" />
        </div>
        <p className="text-sm font-medium">
          No tienes permisos para gestionar backups.
        </p>
      </div>
    );
  }

  /* ── Render ───────────────────────────────────────────────────────── */
  return (
    <>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6 animate-in fade-in duration-500">
        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-2xl bg-primary/10 dark:bg-primary/15 ring-1 ring-primary/20 dark:ring-primary/30 shadow-sm shadow-primary/10 shrink-0">
              <Database size={22} className="text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">
                Backup y Restauración
              </h1>
              <p className="text-muted-foreground text-xs md:text-sm font-medium mt-0.5">
                Genera, descarga y restaura copias de seguridad de la base de
                datos
              </p>
            </div>
          </div>

          <button
            onClick={() => setConfirmBackupOpen(true)}
            disabled={generando}
            className="inline-flex items-center gap-2 rounded-2xl px-5 h-10 font-bold text-sm bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-primary/35 transition-all duration-200 shrink-0 disabled:opacity-60 disabled:pointer-events-none">
            {generando ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <HardDrive size={16} />
            )}
            {generando ? "Generando..." : "Generar backup ahora"}
          </button>
        </div>

        {restoreJob && (
          <div className={`rounded-2xl border p-4 flex items-start gap-3 ${
            restoreJob.status === "completed" ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-emerald-950/20" :
            ["failed", "rolled_back"].includes(restoreJob.status) ? "border-rose-200 bg-rose-50/70 dark:border-rose-900/50 dark:bg-rose-950/20" :
            "border-amber-200 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/20"
          }`}>
            {!["completed", "failed", "rolled_back"].includes(restoreJob.status) ? <Loader2 size={18} className="animate-spin text-amber-600 shrink-0 mt-0.5" /> : <ShieldAlert size={18} className="shrink-0 mt-0.5" />}
            <div>
              <p className="font-bold text-sm">Restauración: {restoreJob.phase}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {restoreJob.errorMessage || (restoreJob.status === "completed" ? "Finalizada; la sesión se cerrará por seguridad." : "El sistema bloquea escrituras mientras termina el proceso.")}
              </p>
            </div>
          </div>
        )}

        {/* ── ACCIONES RÁPIDAS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card: Descargar último */}
          <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm p-5 flex items-center gap-4">
            <div className="w-11 h-11 shrink-0 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center ring-1 ring-emerald-500/20">
              <Download
                size={20}
                className="text-emerald-600 dark:text-emerald-400"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">Descargar último backup</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {latestReadyBackup
                  ? `Último: ${formatDate(latestReadyBackup.createdAt)}`
                  : "No hay backups disponibles aún"}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDescargar(latestReadyBackup)}
              disabled={activeDownloadId !== null || !latestReadyBackup}
              className="rounded-xl gap-1.5 font-bold shrink-0">
              {activeDownloadId === latestReadyBackup?.id ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              {activeDownloadId === latestReadyBackup?.id ? "..." : "Descargar"}
            </Button>
          </div>

          {/* Card: Estadística */}
          <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm p-5 flex items-center gap-4">
            <div className="w-11 h-11 shrink-0 rounded-2xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center ring-1 ring-primary/20">
              <FileArchive size={20} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">Backups almacenados</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Retención automática de 7 días
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-black text-foreground leading-none">
                {loadingBackups
                  ? "—"
                  : backups.filter((backup) => backup.status === "completed")
                      .length}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mt-0.5">
                archivos
              </p>
            </div>
          </div>
        </div>

        {/* ── HISTORIAL DE BACKUPS ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-muted-foreground/60" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
              Historial de backups locales
            </span>
          </div>

          <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm overflow-hidden">
            {loadingBackups ? (
              <div className="flex flex-col items-center justify-center gap-4 py-16">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Loader2 className="animate-spin text-primary" size={22} />
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  Cargando historial...
                </p>
              </div>
            ) : backups.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <div className="w-16 h-16 rounded-3xl bg-muted/50 dark:bg-slate-800/50 flex items-center justify-center">
                  <FileArchive size={28} className="text-muted-foreground/30" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-sm">Sin backups registrados</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Genera el primer backup usando el botón de arriba
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/20 dark:bg-slate-800/30">
                      {[
                        "Archivo",
                        "Origen",
                        "Estado",
                        "Tamaño",
                        "Fecha de creación",
                        "Acciones",
                      ].map((h, i) => (
                        <th
                          key={i}
                          className={`px-6 py-3.5 ${i === 0 ? "text-left" : "text-center"}`}>
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                            {h}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {backups.map((b) => (
                      <tr
                        key={b.id}
                        className="border-b border-border/30 last:border-0 hover:bg-muted/20 dark:hover:bg-slate-800/20 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 shrink-0 rounded-xl bg-primary/5 dark:bg-slate-800 group-hover:bg-primary/10 group-hover:ring-1 ring-primary/20 flex items-center justify-center transition-all duration-200">
                              <FileArchive
                                size={16}
                                className="text-primary/60 group-hover:text-primary transition-colors"
                              />
                            </div>
                            <div>
                              <p className="font-bold text-sm font-mono truncate max-w-[240px]">
                                {b.fileName || "Preparando backup…"}
                              </p>
                              {b.id === latestReadyBackup?.id && (
                                <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle2 size={9} /> más reciente
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs font-bold text-muted-foreground">
                            {sourceLabels[b.source] || b.source}
                          </span>
                          <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                            {backupTypeLabels[b.backupType] || "Completo"}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="space-y-1">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${statusInfo[b.status]?.className || statusInfo.failed.className}`}>
                              {["running", "cancelling"].includes(b.status) && (
                                <Loader2 size={11} className="animate-spin" />
                              )}
                              {statusInfo[b.status]?.label || b.status}
                            </span>
                            {b.status === "completed" && (
                              <p
                                className={`text-[10px] font-bold ${b.integrityStatus === "invalid" ? "text-rose-500" : "text-muted-foreground/70"}`}>
                                {b.integrityStatus === "verifying"
                                  ? "Verificando…"
                                  : b.integrityStatus === "valid"
                                    ? "Integridad válida"
                                    : "Sin verificar"}
                              </p>
                            )}
                            {b.errorMessage && b.status !== "completed" && (
                              <p
                                title={b.errorMessage}
                                className="max-w-[150px] truncate text-[10px] text-rose-500">
                                {b.errorMessage}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1.5 bg-muted/50 dark:bg-slate-800/50 px-3 py-1.5 rounded-full text-[11px] font-bold font-mono">
                            {formatBytes(b.size)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm text-muted-foreground font-medium">
                            {formatDate(b.createdAt)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              title="Descargar backup"
                              onClick={() => handleDescargar(b)}
                              disabled={
                                b.status !== "completed" ||
                                activeDownloadId !== null
                              }
                              className="rounded-xl h-8 w-8 p-0">
                              {activeDownloadId === b.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Download size={14} />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              title="Verificar integridad"
                              onClick={() => handleVerificar(b)}
                              disabled={
                                b.status !== "completed" ||
                                !b.checksum ||
                                b.integrityStatus === "verifying" ||
                                activeVerifyId !== null
                              }
                              className="rounded-xl h-8 w-8 p-0">
                              {b.integrityStatus === "verifying" ||
                              activeVerifyId === b.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <ShieldCheck size={14} />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              title="Restaurar este backup"
                              onClick={() => handleOpenRestore(b)}
                              disabled={b.status !== "completed" || !b.checksum || restoreJob?.status === "running"}
                              className="rounded-xl h-8 w-8 p-0 text-amber-700 hover:text-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/40">
                              <RotateCcw size={14} />
                            </Button>
                            {["queued", "running"].includes(b.status) && (
                              <Button
                                variant="outline"
                                size="sm"
                                title="Cancelar backup"
                                onClick={() => handleCancelar(b)}
                                disabled={cancellingId !== null}
                                className="rounded-xl h-8 px-2 text-amber-700 hover:text-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/40">
                                {cancellingId === b.id ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  "Cancelar"
                                )}
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              title="Eliminar backup"
                              onClick={() => setBackupToDelete(b)}
                              disabled={["queued", "running", "cancelling"].includes(
                                b.status,
                              )}
                              className="rounded-xl h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40">
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* La restauración segura se inicia desde el botón de cada backup registrado. */}
        <div className="hidden" aria-hidden="true">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert size={14} className="text-rose-500/70" />
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-500/70">
              Zona peligrosa — Restaurar base de datos
            </span>
          </div>

          <div className="bg-card dark:bg-slate-900/40 border border-rose-200/50 dark:border-rose-800/30 rounded-3xl shadow-sm overflow-hidden">
            {/* ── Paso 0: seleccionar archivo ── */}
            {restoreStep === 0 && (
              <div className="p-6 space-y-5">
                <div className="flex items-start gap-4 p-4 bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-700/40 rounded-2xl">
                  <AlertTriangle
                    size={18}
                    className="text-amber-500 shrink-0 mt-0.5"
                  />
                  <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
                    <span className="font-black">Atención:</span> Esta acción
                    sobreescribirá la base de datos actual con el archivo SQL
                    que selecciones. Se generará un backup de emergencia antes
                    de ejecutar el restore.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  {/* File picker */}
                  <label className="flex-1 cursor-pointer">
                    <div
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-dashed transition-all duration-200 ${
                        restoreFile
                          ? "border-primary/40 bg-primary/5 dark:bg-primary/10"
                          : "border-border/60 hover:border-primary/30 hover:bg-muted/30"
                      }`}>
                      <div
                        className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${
                          restoreFile
                            ? "bg-primary/10"
                            : "bg-muted/60 dark:bg-slate-800"
                        }`}>
                        <Upload
                          size={16}
                          className={
                            restoreFile
                              ? "text-primary"
                              : "text-muted-foreground"
                          }
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        {restoreFile ? (
                          <>
                            <p className="font-bold text-sm truncate text-foreground">
                              {restoreFile.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {formatBytes(restoreFile.size)}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="font-bold text-sm text-muted-foreground">
                              Seleccionar archivo .sql
                            </p>
                            <p className="text-[11px] text-muted-foreground/60">
                              Haz clic para explorar archivos
                            </p>
                          </>
                        )}
                      </div>
                      {restoreFile && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setRestoreFile(null);
                          }}
                          className="shrink-0 p-1 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <input
                      type="file"
                      accept=".sql"
                      className="hidden"
                      onChange={(e) =>
                        setRestoreFile(e.target.files?.[0] || null)
                      }
                    />
                  </label>

                  <Button
                    variant="destructive"
                    onClick={handleInitRestore}
                    disabled={!restoreFile || restoring}
                    className="rounded-2xl px-5 h-10 font-bold gap-2 shrink-0 bg-rose-500 hover:bg-rose-600 shadow-md shadow-rose-500/20">
                    {restoring ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <RotateCcw size={15} />
                    )}
                    {restoring ? "Procesando..." : "Iniciar restauración"}
                  </Button>
                </div>
              </div>
            )}

            {/* ── Paso 1: confirmar ── */}
            {restoreStep === 1 && (
              <div className="p-6 space-y-5">
                <div className="flex items-start gap-4 p-4 bg-rose-50/80 dark:bg-rose-900/20 border border-rose-200/60 dark:border-rose-800/40 rounded-2xl">
                  <AlertTriangle
                    size={18}
                    className="text-rose-500 shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-black text-rose-700 dark:text-rose-300">
                      Última advertencia
                    </p>
                    <p className="text-sm text-rose-600 dark:text-rose-400 mt-1 leading-relaxed">
                      Estás a punto de reemplazar todos los datos actuales con
                      el archivo{" "}
                      <span className="font-bold">{restoreFile?.name}</span>.
                      Esta operación no se puede deshacer manualmente.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                    Escribe{" "}
                    <span className="text-rose-500 font-mono">CONFIRMAR</span>{" "}
                    para continuar
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      autoFocus
                      type="text"
                      placeholder="CONFIRMAR"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      disabled={restoring}
                      className={[
                        "flex-1 rounded-xl border px-4 py-2.5 text-sm transition-all outline-none font-mono",
                        "bg-background dark:bg-slate-900/60 placeholder:text-muted-foreground/40",
                        confirmText === "CONFIRMAR"
                          ? "border-rose-400/70 ring-2 ring-rose-400/20"
                          : "border-border focus:border-rose-400/50 focus:ring-2 focus:ring-rose-400/15",
                        "disabled:opacity-60",
                      ].join(" ")}
                    />
                    <div className="flex gap-2 shrink-0">
                      <Button
                        onClick={handleExecuteRestore}
                        disabled={restoring || confirmText !== "CONFIRMAR"}
                        className="rounded-2xl h-10 px-4 font-bold gap-2 bg-rose-500 hover:bg-rose-600 text-white shadow-md disabled:opacity-50">
                        {restoring ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <RotateCcw size={14} />
                        )}
                        {restoring ? "Restaurando..." : "Confirmar"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancelRestore}
                        disabled={restoring}
                        className="rounded-2xl h-10 px-4 font-bold">
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Paso 2: éxito ── */}
            {restoreStep === 2 && (
              <div className="p-6">
                <div className="flex items-start gap-4 p-4 bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-700/40 rounded-2xl">
                  <CheckCircle2
                    size={20}
                    className="text-emerald-500 shrink-0 mt-0.5"
                  />
                  <div className="flex-1">
                    <p className="font-black text-sm text-emerald-700 dark:text-emerald-300">
                      Base de datos restaurada exitosamente
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                      Se generó un backup de emergencia antes de ejecutar la
                      restauración. Puedes verlo en el historial.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelRestore}
                    className="rounded-xl shrink-0 font-bold text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900/40">
                    Aceptar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL CONFIRMAR BACKUP ── */}
      {confirmBackupOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200"
          onClick={() => !generando && setConfirmBackupOpen(false)}>
          <div
            className="w-full max-w-md bg-card dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl dark:shadow-black/50 border border-border/40 p-6 space-y-5 animate-in slide-in-from-bottom md:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}>
            {/* Icono + texto */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 dark:bg-primary/15 rounded-2xl ring-1 ring-primary/20 shrink-0">
                <HardDrive size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight">
                  Generar backup ahora
                </h2>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  El proceso continuará en el servidor aunque cierres esta
                  ventana. El historial mostrará su estado al finalizar.
                </p>
                <p className="text-xs text-muted-foreground/70 mt-2">
                  Los backups anteriores se conservan durante{" "}
                  <span className="font-bold text-foreground">7 días</span>.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => setBackupType("full")}
                className={`text-left p-3 rounded-2xl border transition-colors ${backupType === "full" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"}`}>
                <p className="text-sm font-bold">Backup completo</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Base de datos, imágenes de clientes y operaciones.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setBackupType("images")}
                className={`text-left p-3 rounded-2xl border transition-colors ${backupType === "images" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"}`}>
                <p className="text-sm font-bold">Solo imágenes</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Incluye únicamente clientes y operaciones; no incluye la base de datos.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setBackupType("database")}
                className={`text-left p-3 rounded-2xl border transition-colors ${backupType === "database" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"}`}>
                <p className="text-sm font-bold">Solo base de datos</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Más rápido y ligero; no incluye imágenes ni otros adjuntos.
                </p>
              </button>
            </div>

            <div className="h-px bg-border/50" />

            {/* Botones */}
            <div className="flex gap-2.5">
              <button
                onClick={async () => {
                  setConfirmBackupOpen(false);
                  await handleGenerar();
                }}
                disabled={generando}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl h-10 font-bold text-sm bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-60 disabled:pointer-events-none">
                {generando ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <HardDrive size={15} />
                )}
                {generando ? "Generando..." : "Sí, generar backup"}
              </button>
              <Button
                variant="outline"
                onClick={() => setConfirmBackupOpen(false)}
                disabled={generando}
                className="flex-1 rounded-2xl h-10 font-bold">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {backupToDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200"
          onClick={() => !deleting && setBackupToDelete(null)}>
          <div
            className="w-full max-w-md bg-card dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl border border-border/40 p-6 space-y-5 animate-in slide-in-from-bottom md:zoom-in-95 duration-200"
            onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-500/10 rounded-2xl ring-1 ring-rose-500/20 shrink-0">
                <CircleAlert size={20} className="text-rose-500" />
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight">
                  Eliminar backup
                </h2>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  El archivo{" "}
                  <span className="font-mono font-bold text-foreground break-all">
                    {backupToDelete.fileName}
                  </span>{" "}
                  se eliminará permanentemente del servidor.
                </p>
              </div>
            </div>
            <div className="flex gap-2.5">
              <Button
                variant="destructive"
                onClick={handleEliminar}
                disabled={deleting}
                className="flex-1 rounded-2xl h-10 font-bold gap-2 bg-rose-500 hover:bg-rose-600">
                {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                {deleting ? "Eliminando…" : "Eliminar"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setBackupToDelete(null)}
                disabled={deleting}
                className="flex-1 rounded-2xl h-10 font-bold">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {backupToRestore && (
        <div
          className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200"
          onClick={() => {
            if (!startingRestore && !verifyingRestoreAuth) {
              setBackupToRestore(null);
              setRestoreAuthAttempt(null);
              setRestoreAuthorizationToken("");
            }
          }}>
          <div
            className="w-full max-w-md bg-card dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl border border-amber-200/50 dark:border-amber-800/40 p-6 space-y-5 animate-in slide-in-from-bottom md:zoom-in-95 duration-200"
            onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/10 rounded-2xl ring-1 ring-amber-500/20 shrink-0">
                <ShieldAlert size={20} className="text-amber-600" />
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight">Restaurar backup</h2>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  Se validará el archivo, se creará un backup de emergencia y luego se restaurará <span className="font-mono font-bold text-foreground break-all">{backupToRestore.fileName}</span>.
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/50 p-3 text-xs text-amber-800 dark:text-amber-200">
              Las escrituras se bloquearán durante el proceso. Si contiene base de datos, todas las sesiones se cerrarán al finalizar.
            </div>
            {!restoreAuthorizationToken ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">
                  {restoreAuthAttempt?.method === "passkey"
                    ? "Confirma tu identidad con tu passkey registrada."
                    : restoreAuthAttempt?.method === "totp"
                      ? "Confirma con tu contraseña y el código de tu aplicación 2FA."
                      : "Confirma tu identidad con tu contraseña actual."}
                </p>
                {restoreAuthAttempt?.method !== "passkey" && restoreAuthAttempt && (
                  <div className="space-y-2">
                    <input
                      type="password"
                      autoComplete="current-password"
                      value={restoreAuthPassword}
                      onChange={(event) => setRestoreAuthPassword(event.target.value)}
                      disabled={verifyingRestoreAuth}
                      placeholder="Contraseña actual"
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/15 disabled:opacity-60"
                    />
                    {restoreAuthAttempt.method === "totp" && (
                      <input
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={restoreAuthCode}
                        onChange={(event) => setRestoreAuthCode(event.target.value)}
                        disabled={verifyingRestoreAuth}
                        placeholder="Código de 2FA"
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-mono outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/15 disabled:opacity-60"
                      />
                    )}
                  </div>
                )}
                <Button
                  type="button"
                  onClick={handleVerifyRestoreIdentity}
                  disabled={
                    !restoreAuthAttempt || verifyingRestoreAuth ||
                    (restoreAuthAttempt.method !== "passkey" && !restoreAuthPassword) ||
                    (restoreAuthAttempt.method === "totp" && restoreAuthCode.length < 6)
                  }
                  className="w-full rounded-2xl h-10 font-bold gap-2 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700">
                  {verifyingRestoreAuth ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
                  {restoreAuthAttempt?.method === "passkey" ? "Verificar con passkey" : "Verificar identidad"}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 size={16} /> Identidad verificada
                </p>
                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                  Escribe <span className="font-mono text-rose-600">RESTAURAR</span> para continuar
                </label>
                <input
                  autoFocus
                  value={restoreConfirmation}
                  onChange={(event) => setRestoreConfirmation(event.target.value)}
                  disabled={startingRestore}
                  placeholder="RESTAURAR"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-mono outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/15 disabled:opacity-60"
                />
              </div>
            )}
            <div className="flex gap-2.5">
              <Button
                variant="destructive"
                onClick={handleStartRestore}
                disabled={startingRestore || !restoreAuthorizationToken || restoreConfirmation !== "RESTAURAR"}
                className="flex-1 rounded-2xl h-10 font-bold gap-2 bg-amber-600 hover:bg-amber-700 text-white">
                {startingRestore ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />}
                {startingRestore ? "Iniciando…" : "Restaurar"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setBackupToRestore(null)}
                disabled={startingRestore}
                className="flex-1 rounded-2xl h-10 font-bold">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
