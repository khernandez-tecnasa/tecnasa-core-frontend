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
import { Mail, ArrowLeft, Check } from "lucide-react";
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
        <ArrowLeft size={20} />
      </IconButton>

      <Sheet
        variant="plain"
        sx={{
          width: "100%",
          maxWidth: 460,
          borderRadius: "xl",
          boxShadow: "0 2px 24px rgba(0,0,0,0.08)",
          border: "1px solid",
          borderColor: "divider",
          p: { xs: 3, sm: 4 },
          bgcolor: "background.surface",
          overflow: "hidden",
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: "linear-gradient(90deg, var(--joy-palette-primary-600, #0b6bcb), var(--joy-palette-primary-400, #4393e4))",
          },
        }}>
        {/* Header */}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Box
            sx={{
              width: 50,
              height: 50,
              borderRadius: "lg",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              background: "linear-gradient(135deg, var(--joy-palette-primary-600, #0b6bcb), var(--joy-palette-primary-400, #4393e4))",
              boxShadow: "0 2px 8px rgba(11,107,203,0.35)",
            }}>
            <Mail size={22} color="#fff" />
          </Box>
          <Box>
            <Typography level="h2" sx={{ fontSize: 20, fontWeight: "xl" }}>
              {t("forgot.title", "¿Olvidaste tu contraseña?")}
            </Typography>
            <Typography level="body-sm" sx={{ color: "text.tertiary" }}>
              {t(
                "forgot.subtitle",
                "Introduce tu correo y te enviaremos un enlace para restablecer tu contraseña.",
              )}
            </Typography>
          </Box>
        </Stack>

        {/* Form */}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 0.5 }}>
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
              startDecorator={<Mail size={18} />}
              aria-label={t("forgot.input_email_aria", "Correo electrónico")}
              sx={{
                borderRadius: "lg",
                "--Input-focusedThickness": "2px",
                "&:focus-within": { borderColor: "primary.400" },
              }}
              disabled={loading}
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
              sx={{
                borderRadius: "lg",
                fontWeight: "xl",
                py: 1.5,
                background: "linear-gradient(135deg, var(--joy-palette-primary-600, #0b6bcb), var(--joy-palette-primary-500, #185ea5))",
                boxShadow: "0 4px 14px rgba(11,107,203,0.4)",
                transition: "all 0.2s",
                "&:hover": { boxShadow: "0 6px 20px rgba(11,107,203,0.5)", transform: "translateY(-1px)" },
              }}
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
              <Check size={18} />
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
