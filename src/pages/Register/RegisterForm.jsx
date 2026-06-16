// src/pages/RegisterForm.jsx
import { useEffect, useState } from "react";
import { Box, Typography, CircularProgress } from "@mui/joy";
import { useSearchParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import SalidaForm from "../../components/RegisterForm/RegisterSalidaForm";
import RegresoForm from "../../components/RegisterForm/RegisterRegresoForm";

import {
  obtenerVehiculos,
  resolveVehiculoFromQrToken,
  getVehiculoPublicInfo,
} from "../../services/VehiculosService";
import { obtenerRegistroActivo } from "../../services/RegistrosService";
import { getEmailSupervisor } from "../../services/AuthServices";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";

/**
 * RegisterForm - decide si mostrar formulario de salida o regreso.
 * Normaliza shapes variados de API y aplica i18n.
 */
export default function RegisterForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userData, checkingSession } = useAuth();

  const [emailSupervisor, setEmailSupervisor] = useState(null);
  const [registroActivo, setRegistroActivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [vehiculoQR, setVehiculoQR] = useState(null);

  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const vehiculoIdParam = searchParams.get("vehiculo_id");

  // Helper para extraer id usable por la API (fallback a null)
  const getUserIdForApi = () =>
    userData?.id_empleado ?? userData?.id ?? userData?.id_usuario ?? null;

  // Normalizador: devuelve true si el objeto parece un "registro pendiente"
  const isValidRegistro = (r) => {
    if (!r) return false;
    return (
      !!r.id_registro ||
      !!r.id ||
      !!r.idRegistro ||
      !!r.id_vehiculo ||
      !!r.idVehiculo
    );
  };

  useEffect(() => {
    // esperar a que el auth termine
    if (checkingSession) return;

    const userId = getUserIdForApi();
    if (!userId) {
      console.warn(
        "[RegisterForm] Usuario no autenticado o falta id en userData"
      );
      setLoading(false);
      return;
    }

    setLoading(true);

    const loadAll = async () => {
      try {
        const maybeResolveQr = token
          ? resolveVehiculoFromQrToken(token).catch((err) => {
              console.error("[RegisterForm] QR token invalid:", err);
              Swal.fire({
                title: t("register.qr.invalid_title", "Código no válido"),
                text: t(
                  "register.qr.invalid_text",
                  "El código QR es inválido o ha expirado. Selecciona el vehículo manualmente."
                ),
                icon: "warning",
                confirmButtonText: t("register.qr.ok", "Entendido"),
              });
              return null;
            })
          : vehiculoIdParam
            ? getVehiculoPublicInfo(vehiculoIdParam)
                .then((v) => ({
                  id_vehiculo: v.id,
                  placa: v.placa,
                  marca: v.marca ?? null,
                  modelo: v.modelo ?? null,
                }))
                .catch(() => null)
            : Promise.resolve(null);

        const [registro, vehs, vehFromToken] = await Promise.all([
          obtenerRegistroActivo(userId),
          obtenerVehiculos(),
          maybeResolveQr,
        ]);

        const normalizedRegistro = isValidRegistro(registro) ? registro : null;

        if (normalizedRegistro) {
          setRegistroActivo(normalizedRegistro);
        } else {
          setRegistroActivo(null);
        }

        setVehicles(Array.isArray(vehs) ? vehs : []);
        if (vehFromToken) setVehiculoQR(vehFromToken);
      } catch (err) {
        console.error("[RegisterForm] Error al cargar datos:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkingSession, token, vehiculoIdParam, userData]);

  // Cargar email del supervisor si el usuario existe
  useEffect(() => {
    const loadEmailSupervisor = async () => {
      const userId = getUserIdForApi();
      if (!userId) return;
      try {
        const data = await getEmailSupervisor(userId);
        setEmailSupervisor(data);
      } catch (err) {
        console.error("[RegisterForm] getEmailSupervisor error:", err);
      }
    };

    if (!checkingSession && userData) loadEmailSupervisor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkingSession, userData]);

  // Spinner mientras auth o datos cargan
  if (checkingSession || loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Si no está autenticado
  if (!userData) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography level="h5">
          {t("register.not_authenticated_title", "No autenticado")}
        </Typography>
        <Typography level="body-sm">
          {t(
            "register.not_authenticated_text",
            "Inicia sesión para registrar salidas/regresos."
          )}
        </Typography>
      </Box>
    );
  }

  // Determina explícitamente si debemos mostrar el formulario de regreso
  const isRegreso = Boolean(
    registroActivo &&
      (registroActivo.id_registro ||
        registroActivo.id ||
        registroActivo.idRegistro ||
        registroActivo.id_vehiculo ||
        registroActivo.idVehiculo)
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography level="h4" mb={2}>
        {isRegreso
          ? t("register.title_regreso", "Registrar regreso de vehículo")
          : t("register.title_salida", "Registrar salida de vehículo")}
      </Typography>

      {isRegreso ? (
        <RegresoForm
          registro={registroActivo}
          usuario={userData}
          emailSupervisor={emailSupervisor}
        />
      ) : (
        <SalidaForm
          vehicles={vehicles}
          usuario={userData}
          emailSupervisor={emailSupervisor}
          vehiculoPreseleccionado={vehiculoQR}
        />
      )}
    </Box>
  );
}
