// src/pages/Auth/ForgotPasswordRequest.jsx
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  Input,
  Button,
  Sheet,
  Stack,
  Alert,
  IconButton,
} from "@mui/joy";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { forgotPassword } from "@/services/AuthServices";
import { useNavigate } from "react-router-dom";

export default function ForgotPasswordRequest() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [serverErrorKey, setServerErrorKey] = useState(null); // clave i18n del error
  const [localError, setLocalError] = useState(null); // error de validación en tiempo real
  const navigate = useNavigate();
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Validación simple de email (puedes hacerlo más estricta si quieres)
  const validateEmail = (value) => {
    return /\S+@\S+\.\S+/.test(value);
  };

  // Handler de cambio con validación en tiempo real
  const handleEmailChange = (e) => {
    const v = e.target.value;
    setEmail(v);
    setMessage(null);
    setServerErrorKey(null);

    // validación en tiempo real (mostrar mensaje si inválido y no vacío)
    if (v === "") {
      setLocalError(null);
    } else if (!validateEmail(v)) {
      setLocalError(t("forgot.invalid_email") || "Ingresa un correo válido.");
    } else {
      setLocalError(null);
    }
  };

  // Mapear códigos de error a claves i18n
  const mapErrorToKey = (err) => {
    // Intentamos obtener status de varias formas
    const status = err?.response?.status || err?.status || err?.code || null;

    if (status === 404) return "forgot.error_user_not_found";
    if (status === 429) return "forgot.error_too_many_requests";
    if (status >= 500 && status < 600) return "forgot.error_server";
    return "forgot.error_generic";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setServerErrorKey(null);

    if (!validateEmail(email)) {
      setLocalError(t("forgot.invalid_email") || "Ingresa un correo válido.");
      return;
    }

    setLoading(true);
    try {
      const response = await forgotPassword(email);

      const successText =
        response?.message ||
        t(
          "forgot.success_message",
          "Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña.",
        );

      setMessage(successText);

      // redirigir al login en 2s (permitir ver mensaje)
      timeoutRef.current = setTimeout(() => {
        navigate("/auth/login");
      }, 2000);
    } catch (err) {
      console.error("Error al solicitar restablecimiento:", err);
      const key = mapErrorToKey(err);
      setServerErrorKey(key);
    } finally {
      setLoading(false);
    }
  };

  // Obtener el texto del error mapeado para mostrarlo
  const serverErrorMessage = serverErrorKey ? t(serverErrorKey) : null;

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "background.body",
        p: 2,
        position: "relative",
      }}>
      {/* Botón de regresar */}
      <IconButton
        aria-label={t("forgot.back_to_login", "Volver al inicio de sesión")}
        onClick={() => navigate("/auth/login")}
        variant="outlined"
        color="neutral"
        size="lg"
        sx={{
          position: "absolute",
          top: { xs: 12, sm: 20 },
          left: { xs: 12, sm: 20 },
          borderRadius: "lg",
          zIndex: 10,
        }}>
        <ArrowBackRoundedIcon />
      </IconButton>

      <Sheet
        variant="outlined"
        sx={{
          width: "100%",
          maxWidth: 480,
          borderRadius: "xl",
          boxShadow: "xl",
          p: { xs: 3, sm: 4 },
        }}>
        {/* Header */}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 12,
              display: "grid",
              placeItems: "center",
              bgcolor: "primary.softBg",
            }}>
            <EmailRoundedIcon sx={{ color: "primary.600" }} />
          </Box>
          <Box>
            <Typography level="h2" sx={{ fontSize: 20 }}>
              {t("forgot.title", "¿Olvidaste tu contraseña?")}
            </Typography>
            <Typography level="body-sm" textColor="neutral.500">
              {t(
                "forgot.subtitle",
                "Introduce tu correo y te enviaremos un enlace para restablecer tu contraseña.",
              )}
            </Typography>
          </Box>
        </Stack>

        {/* Form */}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <Stack spacing={2}>
            <Input
              name="email"
              type="email"
              placeholder={t(
                "forgot.placeholder_email",
                "Tu correo electrónico",
              )}
              value={email}
              onChange={handleEmailChange}
              required
              size="lg"
              startDecorator={<EmailRoundedIcon />}
              aria-label={t("forgot.input_email_aria", "Correo electrónico")}
              sx={{ borderRadius: "md" }}
              disabled={loading}
              // mostrar borde rojo si hay error de validación local
              error={!!localError}
            />

            {/* Mensaje de validación en tiempo real */}
            {localError && (
              <Typography
                level="body-xs"
                color="danger"
                role="status"
                aria-live="polite">
                {localError}
              </Typography>
            )}

            <Button
              type="submit"
              size="lg"
              variant="solid"
              color="primary"
              loading={loading}
              sx={{ borderRadius: "xl", fontWeight: "lg" }}
              aria-disabled={loading}>
              {loading
                ? t("forgot.sending", "Enviando...")
                : t("forgot.send_button", "Enviar enlace")}
            </Button>
          </Stack>
        </Box>

        {/* Feedback */}
        <Box sx={{ mt: 2 }}>
          {message && (
            <Alert
              color="success"
              variant="soft"
              sx={{ display: "flex", gap: 1, alignItems: "center" }}
              role="status"
              aria-live="polite">
              <CheckRoundedIcon />
              <Typography level="body-md">{message}</Typography>
            </Alert>
          )}

          {serverErrorMessage && (
            <Alert
              color="danger"
              variant="soft"
              sx={{ display: "flex", gap: 1, alignItems: "center" }}
              role="alert"
              aria-live="assertive">
              <Typography level="body-md">{serverErrorMessage}</Typography>
            </Alert>
          )}
        </Box>
      </Sheet>
    </Box>
  );
}
