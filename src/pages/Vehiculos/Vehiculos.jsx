import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Car,
  Loader2,
  WifiOff,
  Lock,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import VehiculoEnUsoModal from "@/components/ui/VehiculoEnUsoModal";

import StyledQR from "@/components/QRCode/StyledQR";
import logoTecnasa from "@/assets/newLogoTecnasaBlack.png";
import { getRegistroLinkForVehiculo } from "@/services/VehiculosService";

import {
  obtenerVehiculos,
  deleteVehiculo,
  addVehiculos,
  actualizarVehiculo,
  restoreVehiculo,
  getUbicaciones,
} from "../../services/VehiculosService";
import { sendNotificacionSalida } from "../../services/MailServices";
import { obtenerRegistroPendientePorVehiculo } from "../../services/RegistrosService";

import VehiculosTable from "../../components/VehiculosForm/VehiculosTable";
import VehiculoFormSheet from "../../components/VehiculosForm/VehiculoFormSheet";
import VehiculosToolBar from "../../components/VehiculosForm/VehiculosToolBar";
import ConfirmModal from "../../components/ui/ConfirmModal";
import useIsMobile from "../../hooks/useIsMobile";

import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import usePermissions from "../../hooks/usePermissions";
import useRowFocusHighlight from "../../hooks/useRowFocusHighlight";
import { getViewState } from "../../utils/viewState";

/* ── Inline resource states (no JoyUI) ─────────────────────────────── */

function StatePanel({
  icon: Icon,
  title,
  description,
  action,
  color = "neutral",
}) {
  const colorMap = {
    neutral: "text-gray-400 dark:text-gray-500",
    danger: "text-red-400 dark:text-red-500",
    warning: "text-amber-400 dark:text-amber-500",
  };
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center px-4">
      <div
        className={`w-14 h-14 rounded-2xl bg-muted/50 dark:bg-slate-800/50 flex items-center justify-center ${colorMap[color]}`}>
        <Icon size={26} />
      </div>
      <div>
        <p className="font-bold text-sm text-gray-800 dark:text-gray-200">
          {title}
        </p>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────── */

export default function Vehiculos() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const qrRef = useRef(null);
  const isMobile = useIsMobile(768);

  const { hasPermiso, checkingSession, userData } = useAuth();
  const { showToast } = useToast();
  const { canAny } = usePermissions();
  const isAdmin = (userData?.rol || "").toLowerCase() === "admin";
  const can = useCallback(
    (p) => isAdmin || hasPermiso(p),
    [isAdmin, hasPermiso],
  );

  const canView = canAny("ver_vehiculos");
  const canCreate = canAny("crear_vehiculo");
  const canEdit = canAny("editar_vehiculo");
  const canDelete = canAny("eliminar_vehiculo");
  const canRestore = canAny("gestionar_vehiculos");
  const canQR = can("crear_QR");

  /* ── State ── */
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openSheet, setOpenSheet] = useState(false);
  const [editVehiculo, setEditVehiculo] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
  const [searchText, setSearchText] = useState("");

  /* Ubicaciones for mobile sheet */
  const [ubicaciones, setUbicaciones] = useState([]);
  const [loadingUbics, setLoadingUbics] = useState(false);

  /* QR */
  const [openQR, setOpenQR] = useState(false);
  const [vehiculoQR, setVehiculoQR] = useState(null);
  const [registroLink, setRegistroLink] = useState("");

  /* Confirm modals */
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [restoreConfirm, setRestoreConfirm] = useState({ open: false, id: null });

  /* En-uso modal */
  const [enUsoModal, setEnUsoModal] = useState({ open: false, registro: null });

  /* ── Load ── */
  const loadVehiculos = useCallback(async () => {
    if (checkingSession) {
      setLoading(true);
      return;
    }
    if (!canView) {
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await obtenerVehiculos();
      if (Array.isArray(data)) setVehiculos(data);
      else
        setError(
          t("vehiculos.load_error", "No se pudieron cargar los vehículos."),
        );
    } catch (err) {
      const msg = (err?.message || "").toLowerCase();
      const isNetwork =
        msg.includes("failed to fetch") || msg.includes("networkerror");
      setError(
        isNetwork
          ? t("vehiculos.no_connection", "No hay conexión con el servidor.")
          : err?.message || t("vehiculos.unknown_error", "Error desconocido."),
      );
    } finally {
      setLoading(false);
    }
  }, [checkingSession, canView, t]);

  useEffect(() => {
    loadVehiculos();
  }, [loadVehiculos]);

  /* Load ubicaciones for the mobile sheet */
  useEffect(() => {
    if (!isMobile) return;
    let cancelled = false;
    setLoadingUbics(true);
    getUbicaciones()
      .then((d) => {
        if (!cancelled) setUbicaciones(Array.isArray(d) ? d : []);
      })
      .catch(() => {
        if (!cancelled) setUbicaciones([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingUbics(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isMobile]);

  const handleHistorial = (vehiculo) => {
    navigate(`/admin/vehiculos/historial/${vehiculo.id}`, { state: { vehiculo } });
  };

  /* ── CRUD handlers ── */
  const handleAddVehiculo = () => {
    if (!canCreate)
      return showToast(
        t("vehiculos.no_permission_create", "Sin permiso para crear."),
        "warning",
      );
    if (isMobile) {
      setEditVehiculo(null);
      setOpenSheet(true);
    } else {
      navigate("/admin/vehiculos/new");
    }
  };

  const handleEdit = (vehiculo) => {
    if (!canEdit)
      return showToast(
        t("vehiculos.no_permission_edit", "Sin permiso para editar."),
        "warning",
      );
    if (isMobile) {
      setEditVehiculo({
        ...vehiculo,
        id_ubicacion_actual:
          vehiculo.id_ubicacion_actual ?? vehiculo.LocationID,
      });
      setOpenSheet(true);
    } else {
      navigate(`/admin/vehiculos/edit/${vehiculo.id}`, { state: { vehiculo } });
    }
  };

  const handleDelete = (id) => {
    if (!canDelete)
      return showToast(
        t("vehiculos.no_permission_delete", "Sin permiso para inactivar."),
        "warning",
      );
    setDeleteConfirm({ open: true, id });
  };

  const confirmDelete = async () => {
    const id = deleteConfirm.id;
    setDeleteConfirm({ open: false, id: null });
    try {
      const resp = await deleteVehiculo(id);
      if (resp && !resp.error) {
        setVehiculos((prev) =>
          prev.map((v) => (v.id === id ? { ...v, estado: "Inactivo" } : v)),
        );
        showToast(
          t("vehiculos.disabled_success", "Vehículo inactivado correctamente."),
          "success",
        );
      } else {
        showToast(
          t("vehiculos.disabled_error", "Error al inactivar el vehículo."),
          "danger",
        );
      }
    } catch {
      showToast(
        t("vehiculos.disabled_network_error", "Error de conexión."),
        "danger",
      );
    }
  };

  const handleRestore = (id) => {
    if (!canRestore)
      return showToast(
        t("vehiculos.no_permission_restore", "Sin permiso para restaurar."),
        "warning",
      );
    setRestoreConfirm({ open: true, id });
  };

  const confirmRestore = async () => {
    const id = restoreConfirm.id;
    setRestoreConfirm({ open: false, id: null });
    try {
      const resp = await restoreVehiculo(id);
      if (resp && !resp.error) {
        setVehiculos((prev) =>
          prev.map((v) => (v.id === id ? { ...v, estado: "Disponible" } : v)),
        );
        showToast(
          t("vehiculos.restored_success", "Vehículo restaurado correctamente."),
          "success",
        );
      } else {
        showToast(
          t("vehiculos.restored_error", "Error al restaurar el vehículo."),
          "danger",
        );
      }
    } catch {
      showToast(
        t("vehiculos.restored_network_error", "Error de conexión."),
        "danger",
      );
    }
  };

  const handleSubmitVehiculo = async (vehiculo) => {
    if (!canAny("crear_vehiculo", "editar_vehiculo"))
      return showToast(
        t("vehiculos.no_permission_save", "Sin permisos para guardar."),
        "warning",
      );
    try {
      if (vehiculo.id) {
        const resp = await actualizarVehiculo(vehiculo.id, vehiculo);
        showToast(
          resp && !resp.error
            ? t(
                "vehiculos.updated_success",
                "Vehículo actualizado correctamente.",
              )
            : t("vehiculos.updated_error", "Error al actualizar el vehículo."),
          resp && !resp.error ? "success" : "danger",
        );
      } else {
        const resp = await addVehiculos(vehiculo);
        showToast(
          resp && !resp.error
            ? t("vehiculos.added_success", "Vehículo agregado correctamente.")
            : t("vehiculos.added_error", "Error al agregar el vehículo."),
          resp && !resp.error ? "success" : "danger",
        );
      }
    } catch {
      showToast(
        t("vehiculos.save_network_error", "Error de conexión al guardar."),
        "danger",
      );
    } finally {
      setOpenSheet(false);
      setEditVehiculo(null);
      loadVehiculos();
    }
  };

  /* ── QR ── */
  async function handleShowQR(vehiculo) {
    if (!canQR)
      return showToast(
        t("vehiculos.no_permission_qr", "Sin permiso para ver QR."),
        "warning",
      );
    setVehiculoQR(vehiculo);
    setRegistroLink("");
    try {
      const { url } = await getRegistroLinkForVehiculo(vehiculo.id);
      setRegistroLink(url);
    } catch (err) {
      showToast(
        err?.message || t("vehiculos.qr_link_error_qr", "Error al generar QR."),
        "danger",
      );
    } finally {
      setOpenQR(true);
    }
  }

  const closeQR = () => {
    setOpenQR(false);
    setRegistroLink("");
    setVehiculoQR(null);
  };

  function descargarQR() {
    if (!qrRef.current || !vehiculoQR) return;
    qrRef.current.download("png", `QR_REGISTRO_${vehiculoQR.placa}`);
  }

  async function handleTestLinkClick(e) {
    e.preventDefault();
    if (!vehiculoQR) return;
    const registro = await obtenerRegistroPendientePorVehiculo(vehiculoQR.id);
    if (!registro) {
      if (registroLink)
        window.open(registroLink, "_blank", "noopener,noreferrer");
      return;
    }

    const email = registro.email_empleado || registro.email || null;

    let isOwner = false;
    try {
      if (userData) {
        if (userData.email && email)
          isOwner = String(userData.email).toLowerCase() === String(email).toLowerCase();
        if (!isOwner && userData.id_empleado && registro.id_empleado)
          isOwner = Number(userData.id_empleado) === Number(registro.id_empleado);
        if (!isOwner && userData.nombre && registro.nombre_empleado)
          isOwner = String(userData.nombre).trim().toLowerCase() === String(registro.nombre_empleado).trim().toLowerCase();
      }
    } catch { isOwner = false; }

    if (isOwner && registro.id_registro) {
      navigate(`/admin/panel-vehiculos?mode=regreso&id_registro=${registro.id_registro}`);
      return;
    }

    try { closeQR(); } catch { /* noop */ }
    setEnUsoModal({ open: true, registro });
  }

  /* ── Filter ── */
  const filteredVehiculos = useMemo(() => {
    const search = searchText.toLowerCase();
    return (vehiculos || []).filter((u) => {
      const matchesStatus = showInactive
        ? true
        : (u.estado || "").toLowerCase() !== "inactivo";
      const matchesSearch =
        `${u.placa} ${u.marca} ${u.modelo} ${u.nombre_ubicacion || ""}`
          .toLowerCase()
          .includes(search);
      return matchesStatus && matchesSearch;
    });
  }, [vehiculos, showInactive, searchText]);

  const { highlightId, focusedRef, highlightStyle } = useRowFocusHighlight({
    items: filteredVehiculos,
    getId: (v) => v.id,
    paramName: "focus",
  });

  const viewState = getViewState({
    checkingSession,
    canView,
    error,
    loading,
    hasData: Array.isArray(vehiculos) && vehiculos.length > 0,
  });

  /* ── Inline resource state renderer ── */
  const renderState = () => {
    if (viewState === "checking")
      return (
        <StatePanel
          icon={Loader2}
          title="Verificando sesión…"
          description="Por favor, espera un momento."
        />
      );
    if (viewState === "no-permission")
      return (
        <StatePanel
          icon={Lock}
          color="danger"
          title="Sin permisos"
          description="Consulta con un administrador para obtener acceso."
        />
      );
    if (viewState === "loading")
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={22} />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            {t("vehiculos.loading", "Cargando vehículos…")}
          </p>
        </div>
      );
    if (viewState === "error") {
      const low = (error || "").toLowerCase();
      const isNetwork =
        low.includes("conexión") || low.includes("failed to fetch");
      return (
        <StatePanel
          icon={isNetwork ? WifiOff : AlertTriangle}
          color={isNetwork ? "warning" : "neutral"}
          title={isNetwork ? "Problema de conexión" : "Ocurrió un problema"}
          description={error}
          action={
            isNetwork && (
              <button
                onClick={loadVehiculos}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <RotateCcw size={14} /> Reintentar
              </button>
            )
          }
        />
      );
    }
    if (viewState === "empty")
      return (
        <StatePanel
          icon={Car}
          title={t("vehiculos.empty_title", "Sin vehículos")}
          description={t(
            "vehiculos.empty_description",
            "Aún no hay vehículos registrados.",
          )}
        />
      );
    return null;
  };

  /* ── Render ── */
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-primary/10 dark:bg-primary/15 ring-1 ring-primary/20 dark:ring-primary/30 shadow-sm shadow-primary/10 shrink-0">
            <Car size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">
              {t("vehiculos.title", "Vehículos")}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm font-medium mt-0.5">
              {t(
                "vehiculos.subtitle",
                "Gestión del catálogo de vehículos de la flota.",
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <VehiculosToolBar
        t={t}
        searchText={searchText}
        onSearch={setSearchText}
        onAdd={handleAddVehiculo}
        showInactive={showInactive}
        setShowInactive={setShowInactive}
        canAdd={canCreate}
        addDisabledReason={
          !canCreate
            ? t(
                "vehiculos.add_disabled_reason",
                "No tienes permiso para crear. Solicítalo al administrador.",
              )
            : undefined
        }
      />

      {/* Counter */}
      {viewState === "data" && (
        <p className="text-xs text-gray-400 dark:text-gray-500 -mt-2">
          <span className="font-bold text-gray-700 dark:text-gray-300">
            {filteredVehiculos.length}
          </span>
          {searchText
            ? ` de ${vehiculos.length}`
            : ` vehículo${vehiculos.length !== 1 ? "s" : ""}`}
        </p>
      )}

      {/* Main card */}
      <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm overflow-hidden">
        {viewState !== "data" ? (
          renderState()
        ) : filteredVehiculos.length === 0 ? (
          <StatePanel
            icon={Car}
            title={
              vehiculos.length
                ? t("vehiculos.no_matches", "Sin coincidencias")
                : t("vehiculos.empty_title", "Sin vehículos")
            }
            description={
              vehiculos.length
                ? t(
                    "vehiculos.no_matches_desc",
                    "No encontramos vehículos con los filtros actuales.",
                  )
                : t(
                    "vehiculos.empty_description",
                    "Aún no hay vehículos registrados.",
                  )
            }
          />
        ) : (
          <VehiculosTable
            t={t}
            vehiculos={filteredVehiculos}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onRestore={handleRestore}
            onShowQR={handleShowQR}
            onHistorial={handleHistorial}
            canEdit={canEdit}
            canDelete={canDelete}
            canRestore={canRestore}
            canQR={canQR}
            highlightId={highlightId}
            focusedRef={focusedRef}
            highlightStyle={highlightStyle}
          />
        )}
      </div>

      {/* Mobile bottom sheet (desktop uses /vehiculos/new and /vehiculos/edit/:id routes) */}
      <VehiculoFormSheet
        open={openSheet}
        onClose={() => {
          setOpenSheet(false);
          setEditVehiculo(null);
        }}
        initialValues={editVehiculo || undefined}
        onSubmit={handleSubmitVehiculo}
        ubicOptions={ubicaciones}
        isLoadingUbics={loadingUbics}
      />

      {/* Delete confirm */}
      <ConfirmModal
        open={deleteConfirm.open}
        onCancel={() => setDeleteConfirm({ open: false, id: null })}
        onConfirm={confirmDelete}
        variant="danger"
        title={t("vehiculos.confirm_disable_title", "¿Inactivar vehículo?")}
        description={t(
          "vehiculos.confirm_disable_text",
          "El vehículo quedará inactivo y no estará disponible para operaciones.",
        )}
        confirmLabel={t("vehiculos.yes_disable", "Sí, inactivar")}
        cancelLabel={t("vehiculos.cancel", "Cancelar")}
      />

      {/* Restore confirm */}
      <ConfirmModal
        open={restoreConfirm.open}
        onCancel={() => setRestoreConfirm({ open: false, id: null })}
        onConfirm={confirmRestore}
        variant="primary"
        title={t("vehiculos.confirm_restore_title", "¿Restaurar vehículo?")}
        description={t(
          "vehiculos.confirm_restore_text",
          "El vehículo volverá a estar disponible en el sistema.",
        )}
        confirmLabel={t("vehiculos.yes_restore", "Sí, restaurar")}
        cancelLabel={t("vehiculos.cancel", "Cancelar")}
      />

      <VehiculoEnUsoModal
        open={enUsoModal.open}
        onClose={() => setEnUsoModal({ open: false, registro: null })}
        registro={enUsoModal.registro}
        vehiculoPlaca={enUsoModal.registro?.placa}
        onNotificar={async () => {
          await sendNotificacionSalida({
            employeeName: enUsoModal.registro?.nombre_empleado,
            vehicleName: enUsoModal.registro?.placa,
            supervisorName: userData?.nombre || userData?.email || "Administración",
            fechaSalida: enUsoModal.registro?.fecha_salida,
            employeeEmail: enUsoModal.registro?.email_empleado,
          });
        }}
      />

      {/* QR modal */}
      {openQR && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 600 }}>
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeQR}
          />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-semibold text-center text-gray-900 dark:text-gray-100 mb-1">
              {t("vehiculos.qr_title", "QR de registro del vehículo")}
            </h3>

            <div className="h-px bg-gray-100 dark:bg-gray-800 my-3" />

            {vehiculoQR && (
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  {vehiculoQR.placa} · {vehiculoQR.marca} {vehiculoQR.modelo}
                </p>

                <StyledQR
                  ref={qrRef}
                  text={registroLink || "about:blank"}
                  logoUrl={logoTecnasa}
                  size={220}
                />

                {registroLink && (
                  <a
                    href={registroLink}
                    target="_blank"
                    rel="noreferrer"
                    onClick={handleTestLinkClick}
                    className="text-sm text-primary hover:underline">
                    {t("vehiculos.qr_test_link", "Probar enlace de registro")}
                  </a>
                )}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 mt-5">
              <button
                onClick={closeQR}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                {t("vehiculos.close", "Cerrar")}
              </button>
              <button
                onClick={descargarQR}
                disabled={!vehiculoQR || !registroLink}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity">
                {t("vehiculos.download_png", "Descargar PNG")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
