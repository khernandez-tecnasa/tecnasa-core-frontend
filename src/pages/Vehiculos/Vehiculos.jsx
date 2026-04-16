import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import StyledQR from "@/components/QRCode/StyledQR";
import { getRegistroLinkForVehiculo } from "@/services/VehiculosService";
import logoTecnasa from "@/assets/newLogoTecnasaBlack.png";

import {
  obtenerVehiculos,
  deleteVehiculo,
  addVehiculos,
  actualizarVehiculo,
  restoreVehiculo,
} from "../../services/VehiculosService";

import { sendNotificacionSalida } from "../../services/MailServices";

import { obtenerRegistroPendientePorVehiculo } from "../../services/RegistrosService";
import { useNavigate } from "react-router-dom";

import VehiculosTable from "../../components/VehiculosForm/VehiculosTable";
import VehiculoModal from "../../components/VehiculosForm/VehiculosModal";
import VehiculosToolBar from "../../components/VehiculosForm/VehiculosToolBar";
import {
  Box,
  Button,
  Card,
  Divider,
  Modal,
  ModalDialog,
  Sheet,
  Stack,
  Typography,
} from "@mui/joy";
import Swal from "sweetalert2";
import { useAuth } from "../../context/AuthContext";

import ResourceState from "../../components/common/ResourceState";
import usePermissions from "../../hooks/usePermissions";
import { getViewState } from "../../utils/viewState";

import { useToast } from "../../context/ToastContext";
import useRowFocusHighlight from "../../hooks/useRowFocusHighlight";

import { useTranslation } from "react-i18next";

export default function Vehiculos() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [vehiculos, setVehiculos] = useState([]);
  const [openQR, setOpenQR] = useState(false);
  const [vehiculoQR, setVehiculoQR] = useState(null);
  const [registroLink, setRegistroLink] = useState("");
  const qrRef = useRef(null);
  const { hasPermiso, checkingSession, userData } = useAuth();
  const isAdmin = (userData?.rol || "").toLowerCase() === "admin";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [editVehiculo, setEditVehiculo] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
  const [searchText, setSearchText] = useState("");

  const { canAny } = usePermissions();
  const { showToast } = useToast();

  // permisos normalizados
  const canView = canAny("ver_vehiculos");
  const canCreate = canAny("crear_vehiculo");
  const canEdit = canAny("editar_vehiculo");
  const canDelete = canAny("eliminar_vehiculo");
  const canRestore = canAny("gestionar_vehiculos");

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
      if (Array.isArray(data)) {
        setVehiculos(data);
      } else {
        setError(
          t("vehiculos.load_error") ||
            "No se pudieron cargar los vehículos. Intenta más tarde.",
        );
      }
    } catch (err) {
      const msg = (err?.message || "").toLowerCase();
      const isNetwork =
        msg.includes("failed to fetch") || msg.includes("networkerror");
      setError(
        isNetwork
          ? t("vehiculos.no_connection") || "No hay conexión con el servidor."
          : err?.message || t("vehiculos.unknown_error"),
      );
    } finally {
      setLoading(false);
    }
  }, [checkingSession, canView, t]);

  useEffect(() => {
    loadVehiculos();
  }, [loadVehiculos]);

  // ---- handlers CRUD con showToast ----
  const handleAddVehiculo = () => {
    if (!canCreate) {
      showToast(
        t("vehiculos.no_permission_create") ||
          "No tienes permiso para crear vehículos.",
        "warning",
      );
      return;
    }
    setEditVehiculo(null);
    setOpenModal(true);
  };

  const handleEdit = (vehiculo) => {
    if (!canEdit) {
      showToast(
        t("vehiculos.no_permission_edit") ||
          "No tienes permiso para editar vehículos.",
        "warning",
      );
      return;
    }
    const vehiculoTransformado = {
      ...vehiculo,
      id_ubicacion_actual: vehiculo.LocationID,
    };
    setEditVehiculo(vehiculoTransformado);
    setOpenModal(true);
  };

  const handleDelete = async (id) => {
    if (!canDelete) {
      showToast(
        t("vehiculos.no_permission_delete") ||
          "No tienes permiso para inhabilitar vehículos.",
        "warning",
      );
      return;
    }
    const result = await Swal.fire({
      title: t("vehiculos.confirm_disable_title"),
      text: t("vehiculos.confirm_disable_text"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: t("vehiculos.yes_disable"),
      cancelButtonText: t("vehiculos.cancel"),
    });
    if (result.isConfirmed) {
      try {
        const resp = await deleteVehiculo(id);
        if (resp && !resp.error) {
          setVehiculos((prev) =>
            prev.map((v) => (v.id === id ? { ...v, estado: "Inactivo" } : v)),
          );
          showToast(
            t("vehiculos.disabled_success") ||
              "Vehículo inactivado correctamente",
            "success",
          );
        } else {
          showToast(
            t("vehiculos.disabled_error") || "Error al inactivar el vehículo.",
            "danger",
          );
        }
      } catch (err) {
        showToast(
          t("vehiculos.disabled_network_error") ||
            "Error de conexión al intentar inactivar el vehículo.",
          "danger",
        );
      }
    }
  };

  const handleRestore = async (id) => {
    if (!canRestore) {
      showToast(
        t("vehiculos.no_permission_restore") ||
          "No tienes permiso para restaurar vehículos.",
        "warning",
      );
      return;
    }
    const result = await Swal.fire({
      title: t("vehiculos.confirm_restore_title"),
      text: t("vehiculos.confirm_restore_text"),
      icon: "info",
      showCancelButton: true,
      confirmButtonColor: "#03624C",
      cancelButtonColor: "#d33",
      confirmButtonText: t("vehiculos.yes_restore"),
      cancelButtonText: t("vehiculos.cancel"),
    });
    if (result.isConfirmed) {
      try {
        const resp = await restoreVehiculo(id);
        if (resp && !resp.error) {
          setVehiculos((prev) =>
            prev.map((v) => (v.id === id ? { ...v, estado: "Disponible" } : v)),
          );
          showToast(
            t("vehiculos.restored_success") ||
              "Vehículo restaurado correctamente",
            "success",
          );
        } else {
          showToast(
            t("vehiculos.restored_error") || "Error al restaurar el vehículo.",
            "danger",
          );
        }
      } catch (err) {
        showToast(
          t("vehiculos.restored_network_error") ||
            "Error de conexión al intentar restaurar el vehículo.",
          "danger",
        );
      }
    }
  };

  const handleSubmitVehiculo = async (vehiculo) => {
    if (!canAny("crear_vehiculo", "editar_vehiculo")) {
      showToast(
        t("vehiculos.no_permission_save") ||
          "No tienes permisos para guardar vehículos.",
        "warning",
      );
      return;
    }
    try {
      if (vehiculo.id) {
        const resp = await actualizarVehiculo(vehiculo.id, vehiculo);
        if (resp && !resp.error)
          showToast(
            t("vehiculos.updated_success") ||
              "Vehículo actualizado correctamente",
            "success",
          );
        else
          showToast(
            t("vehiculos.updated_error") || "Error al actualizar el vehículo.",
            "danger",
          );
      } else {
        const resp = await addVehiculos(vehiculo);
        if (resp && !resp.error)
          showToast(
            t("vehiculos.added_success") || "Vehículo agregado correctamente",
            "success",
          );
        else
          showToast(
            t("vehiculos.added_error") || "Error al agregar el vehículo.",
            "danger",
          );
      }
    } catch (err) {
      showToast(
        t("vehiculos.save_network_error") ||
          "Error de conexión al guardar el vehículo.",
        "danger",
      );
    } finally {
      setOpenModal(false);
      setEditVehiculo(null);
      loadVehiculos();
    }
  };

  const can = useCallback(
    (p) => isAdmin || hasPermiso(p),
    [isAdmin, hasPermiso],
  );

  const canQR = can("crear_QR");

  async function handleShowQR(vehiculo) {
    if (!canQR) {
      showToast(
        t("vehiculos.no_permission_qr") ||
          "No tienes permisos para ver el QR de registro.",
        "warning",
      );
      return;
    }

    setVehiculoQR(vehiculo);
    setRegistroLink("");
    try {
      const { url } = await getRegistroLinkForVehiculo(vehiculo.id);
      setRegistroLink(url);
    } catch (err) {
      showToast(err?.message || t("vehiculos.qr_link_error_qr"), "danger");
    } finally {
      setOpenQR(true);
    }
  }

  async function handleTestLinkClick(e) {
    e.preventDefault();

    if (!vehiculoQR) return;

    // Llamamos al endpoint que devuelve registro pendiente por VEHÍCULO
    const registro = await obtenerRegistroPendientePorVehiculo(vehiculoQR.id);

    // Si no hay registro pendiente -> abrir link normalmente
    if (!registro) {
      if (registroLink) {
        window.open(registroLink, "_blank", "noopener,noreferrer");
      }
      return;
    }

    // CERRAMOS modal del QR (el usuario ya vio el QR; prevenimos confusión)
    try {
      setOpenQR(false);
      setVehiculoQR(null);
      setRegistroLink("");
    } catch (err) {
      // noop
    }

    // Extraemos datos del registro
    const nombre = registro.nombre_empleado || registro.employeeName || null;
    const email = registro.email_empleado || registro.email || null;
    const fechaISO = registro.fecha_salida || registro.fecha || null;
    const fechaText = fechaISO ? new Date(fechaISO).toLocaleString() : null;

    // Determinar si el current user es el responsable:
    //  - si userData.email existe y coincide (case-insensitive)
    //  - o si userData.id_empleado existe y registro incluye id_empleado (si tu endpoint lo devuelve)
    let isOwner = false;
    try {
      if (userData) {
        if (userData.email && email) {
          isOwner =
            String(userData.email).toLowerCase() ===
            String(email).toLowerCase();
        }
        // si tu backend regresa id_empleado en `registro`:
        if (!isOwner && userData.id_empleado && registro.id_empleado) {
          isOwner =
            Number(userData.id_empleado) === Number(registro.id_empleado);
        }
        // fallback por nombre (menor fiabilidad)
        if (!isOwner && userData.nombre && nombre) {
          isOwner =
            String(userData.nombre).trim().toLowerCase() ===
            String(nombre).trim().toLowerCase();
        }
      }
    } catch (err) {
      isOwner = false;
    }

    // Si es el propietario -> redirigir directo al formulario de regreso con id_registro
    if (isOwner && registro.id_registro) {
      // navegar al formulario de regreso indicando el registro exacto
      navigate(
        `/admin/panel-vehiculos?mode=regreso&id_registro=${registro.id_registro}`,
      );
      return;
    }

    // Si NO es el propietario -> mostrar Swal informativo con opciones:
    const infoText = `${t(
      "vehiculos.qr_in_use_detected",
      "Este vehículo está en uso por",
    )} ${nombre ?? t("vehiculos.unknown_user", "un usuario")}${
      email ? ` (${email})` : ""
    }${fechaText ? ` — ${t("vehiculos.since", "Salida:")} ${fechaText}` : ""}.`;

    const resp = await Swal.fire({
      title: t("vehiculos.qr_in_use_title", "Vehículo en uso"),
      text:
        infoText +
        "\n\n" +
        t(
          "vehiculos.qr_in_use_next_steps",
          "Pide al usuario que registre el regreso o utiliza una de las acciones abajo.",
        ),
      icon: "info",
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: t("vehiculos.qr_ok", "OK"),
      denyButtonText: t("vehiculos.qr_in_use_notify_user", "Notificar usuario"),
      cancelButtonText: t("vehiculos.cancel", "Cerrar"),
      allowOutsideClick: false,
    });

    if (resp.isDenied) {
      // Intentar notificar al usuario responsable (si tenemos email)
      if (!email) {
        await Swal.fire({
          title: t(
            "vehiculos.qr_in_use_no_email_title",
            "No se encontró email",
          ),
          text: t(
            "vehiculos.qr_in_use_no_email_text",
            "No se encontró el correo del usuario responsable. No se puede enviar notificación automática.",
          ),
          icon: "warning",
        });
        return;
      }

      try {
        // sendNotificacionSalida espera un objeto — ajusta según tu implementación
        await sendNotificacionSalida({
          to: [email],
          employeeName: nombre,
          vehicleName: vehiculoQR?.placa,
          supervisorName: userData?.nombre || null,
        });

        await Swal.fire({
          title: t("vehiculos.qr_notify_sent_title", "Notificación enviada"),
          text: t(
            "vehiculos.qr_notify_sent_text",
            "Se ha enviado un correo al usuario responsable.",
          ),
          icon: "success",
        });
      } catch (err) {
        console.error("Error enviando notificación:", err);
        await Swal.fire({
          title: t("vehiculos.qr_notify_error_title", "Error"),
          text: t(
            "vehiculos.qr_notify_error_text",
            "No se pudo enviar la notificación. Intenta más tarde.",
          ),
          icon: "error",
        });
      }
    }

    // resp.isConfirmed (OK) o cancel -> simplemente cerramos la alerta (ya cerramos el modal arriba)
    return;
  }

  function descargarQR() {
    if (!qrRef.current || !vehiculoQR) return;
    qrRef.current.download("png", `QR_REGISTRO_${vehiculoQR.placa}`);
  }

  // ---- filtros/búsqueda ----
  const filteredVehiculos = useMemo(() => {
    const search = searchText.toLowerCase();
    return (vehiculos || []).filter((u) => {
      // ahora: si showInactive = true -> mostrar todo; si false -> excluir Inactivo
      const matchesStatus = showInactive
        ? true
        : (u.estado || "").toLowerCase() !== "inactivo";
      const matchesSearch = `${u.placa} ${u.marca} ${u.modelo} ${
        u.nombre_ubicacion || ""
      }`
        .toLowerCase()
        .includes(search);
      return matchesStatus && matchesSearch;
    });
  }, [vehiculos, showInactive, searchText]);

  // ⭐ Hook de foco/resaltado basado en ?focus= (id del vehículo)
  const { highlightId, focusedRef, highlightStyle } = useRowFocusHighlight({
    items: filteredVehiculos,
    getId: (v) => v.id,
    paramName: "focus",
  });

  // estado de vista reutilizable
  const viewState = getViewState({
    checkingSession,
    canView,
    error,
    loading,
    hasData: Array.isArray(vehiculos) && vehiculos.length > 0,
  });

  return (
    <Sheet
      variant="plain"
      sx={{
        flex: 1,
        width: "100%",
        pt: { xs: "calc(12px + var(--Header-height))", md: 4 },
        pb: { xs: 2, sm: 2, md: 4 },
        px: { xs: 2, md: 4 },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        overflow: "auto",
        minHeight: "100dvh",
        bgcolor: "background.body",
      }}>
      <Box sx={{ width: "100%" }}>
        {/* Header de la página */}
        <Box sx={{ mb: 1.5 }}>
          <Typography level="h4">
            {t("vehiculos.title", "Vehículos")}
          </Typography>
          <Typography level="body-sm" color="neutral">
            {t(
              "vehiculos.subtitle",
              "Gestión del catálogo de vehículos de la flota.",
            )}
          </Typography>
          <Typography level="body-xs" sx={{ opacity: 0.7, mt: 0.5 }}>
            {t("vehiculos.total_registered", "Total registrados: {{count}}", {
              count: vehiculos.length,
            })}
          </Typography>
        </Box>

        {/* Barra de búsqueda / filtros / agregar */}
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

        {/* Contenedor principal (solo tabla / estados) */}
        <Card
          variant="outlined"
          sx={{
            mt: 1,
            p: 2,
            backgroundColor: "background.surface",
            overflowX: "auto",
          }}>
          {viewState !== "data" ? (
            <ResourceState
              state={viewState}
              error={error}
              onRetry={loadVehiculos}
              emptyTitle={t("vehiculos.empty_title", "Sin vehículos")}
              emptyDescription={t(
                "vehiculos.empty_description",
                "Aún no hay vehículos registrados.",
              )}
            />
          ) : filteredVehiculos.length === 0 ? (
            <Box sx={{ p: 2 }}>
              <ResourceState
                state="empty"
                emptyTitle={
                  vehiculos.length
                    ? t("vehiculos.no_matches", "Sin coincidencias")
                    : t("vehiculos.empty_title", "Sin vehículos")
                }
                emptyDescription={
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
            </Box>
          ) : (
            <VehiculosTable
              t={t}
              vehiculos={filteredVehiculos}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRestore={handleRestore}
              onShowQR={handleShowQR}
              canEdit={canEdit}
              canDelete={canDelete}
              canRestore={canRestore}
              canQR={canQR}
              highlightId={highlightId}
              focusedRef={focusedRef}
              highlightStyle={highlightStyle}
            />
          )}
        </Card>
      </Box>

      {/* Modal crear/editar */}
      <VehiculoModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setEditVehiculo(null);
        }}
        initialValues={editVehiculo || undefined}
        onSubmit={handleSubmitVehiculo}
      />

      {/* Modal QR de Registro */}
      <Modal
        open={openQR}
        onClose={() => {
          setOpenQR(false);
          setRegistroLink("");
          setVehiculoQR(null);
        }}>
        <ModalDialog
          sx={{ width: { xs: "100%", sm: 420 }, textAlign: "center" }}>
          <Typography level="title-lg">
            {t("vehiculos.qr_title", "QR de registro del vehículo")}
          </Typography>
          <Divider sx={{ my: 1 }} />

          {vehiculoQR && (
            <Stack alignItems="center" spacing={1}>
              <Typography level="body-md">
                {vehiculoQR.placa} · {vehiculoQR.marca} {vehiculoQR.modelo}
              </Typography>

              <StyledQR
                ref={qrRef}
                text={registroLink || "about:blank"}
                logoUrl={logoTecnasa}
                size={220}
              />

              {registroLink && (
                <Typography level="body-sm" sx={{ mt: 1 }}>
                  <a
                    href={registroLink}
                    target="_blank"
                    rel="noreferrer"
                    onClick={handleTestLinkClick}>
                    {t("vehiculos.qr_test_link", "Probar enlace de registro")}
                  </a>
                </Typography>
              )}
            </Stack>
          )}

          <Stack direction="row" justifyContent="center" spacing={2} mt={2}>
            <Button
              variant="plain"
              onClick={() => {
                setOpenQR(false);
                setRegistroLink("");
                setVehiculoQR(null);
              }}>
              {t("vehiculos.close", "Cerrar")}
            </Button>
            <Button
              onClick={descargarQR}
              disabled={!vehiculoQR || !registroLink}>
              {t("vehiculos.download_png", "Descargar PNG")}
            </Button>
          </Stack>
        </ModalDialog>
      </Modal>
    </Sheet>
  );
}
