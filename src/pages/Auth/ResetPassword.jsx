// src/pages/Auth/ResetPassword.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Box,
  Typography,
  Input,
  Button,
  Sheet,
  Stack,
  Alert,
  IconButton,
  FormControl,
  FormLabel,
  LinearProgress,
  List,
  ListItem,
  ListItemDecorator,
} from "@mui/joy";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Iconos
import { KeyRound, Eye, EyeOff, ArrowLeft, CheckCircle2, AlertCircle, Key, XCircle, Check } from "lucide-react";

// Servicio
import { resetPassword } from "../../services/AuthServices";

export default function ResetPassword() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  // Estados
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [generalError, setGeneralError] = useState(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!token) {
      setGeneralError(
        t("reset.error_no_token", "Enlace inválido o incompleto."),
      );
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [token, t]);

  // --- LÓGICA DE VALIDACIÓN ---

  // Objeto con el estado de cada requisito
  const requirements = useMemo(() => {
    return {
      length: newPassword.length >= 8,
      lower: /[a-z]/.test(newPassword),
      upper: /[A-Z]/.test(newPassword),
      number: /\d/.test(newPassword),
      special: /[@$!%*?&._-]/.test(newPassword),
    };
  }, [newPassword]);

  // ¿Son válidos todos los requisitos?
  const isPasswordValid = Object.values(requirements).every(Boolean);

  // ¿Coinciden las contraseñas?
  const passwordsMatch =
    newPassword === confirmPassword && confirmPassword.length > 0;

  // Cálculo de fuerza para la barra visual (0 a 100)
  const strengthScore = Object.values(requirements).filter(Boolean).length * 20;

  // Colores de la barra
  const getStrengthColor = (s) => {
    if (s <= 40) return "danger";
    if (s <= 80) return "warning";
    return "success";
  };

  const getStrengthLabel = (s) => {
    if (s === 0) return "";
    if (s <= 40) return t("strength.weak", "Débil");
    if (s <= 80) return t("strength.medium", "Regular");
    return t("strength.strong", "Segura");
  };

  // --- HANDLER SUBMIT ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setGeneralError(null);

    // Doble verificación por seguridad
    if (!token || !isPasswordValid || !passwordsMatch) {
      setGeneralError(
        t(
          "reset.error_validation",
          "Por favor corrige los errores antes de continuar.",
        ),
      );
      setLoading(false);
      return;
    }

    try {
      await resetPassword(token, newPassword);
      setSuccess(true);

      timeoutRef.current = setTimeout(() => {
        navigate("/auth/login");
      }, 3000);
    } catch (err) {
      console.error("Error reset:", err);
      setGeneralError(
        err.response?.data?.message ||
          err.message ||
          t("reset.error_generic", "No se pudo restablecer la contraseña."),
      );
    } finally {
      setLoading(false);
    }
  };

  // Componente interno para items de la lista (solo se muestra si NO se cumple)
  const RequirementItem = ({ fulfilled, label }) => {
    // MAGIA AQUÍ: Si se cumple, retorna null (se oculta)
    if (fulfilled) return null;

    return (
      <ListItem sx={{ minHeight: 24, p: 0 }}>
        <ListItemDecorator sx={{ minWidth: 24 }}>
          <XCircle size={16} color="var(--joy-palette-neutral-300, #CDD7E1)" />
        </ListItemDecorator>
        <Typography level="body-xs" textColor="neutral.500">
          {label}
        </Typography>
      </ListItem>
    );
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "background.level1",
        p: 2,
        position: "relative",
      }}>
      <IconButton
        onClick={() => navigate("/auth/login")}
        variant="soft"
        color="neutral"
        size="md"
        sx={{
          position: "absolute",
          top: { xs: 16, md: 24 },
          left: { xs: 16, md: 24 },
          zIndex: 10,
          borderRadius: "50%",
        }}>
        <ArrowLeft size={20} />
      </IconButton>

      <Sheet
        variant="plain"
        sx={{
          width: "100%",
          maxWidth: 450,
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
        {/* Encabezado */}
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "lg",
              background: "linear-gradient(135deg, var(--joy-palette-primary-600, #0b6bcb), var(--joy-palette-primary-400, #4393e4))",
              boxShadow: "0 4px 14px rgba(11,107,203,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
            }}>
            <KeyRound size={28} color="#fff" />
          </Box>
          <Typography level="h3" sx={{ mb: 0.5, fontWeight: "xl" }}>
            {t("reset.title", "Restablecer Contraseña")}
          </Typography>
          <Typography level="body-sm" sx={{ color: "text.tertiary" }}>
            {t(
              "reset.subtitle",
              "Crea una contraseña nueva y segura para tu cuenta.",
            )}
          </Typography>
        </Box>

        {success ? (
          <Alert
            variant="soft"
            color="success"
            startDecorator={<CheckCircle2 size={20} />}
            sx={{
              borderRadius: "md",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 1,
            }}>
            <Typography level="title-md">
              {t("reset.success_title", "¡Contraseña actualizada!")}
            </Typography>
            <Typography level="body-sm">
              {t(
                "reset.success_desc",
                "Tu contraseña ha sido cambiada. Redirigiendo al login...",
              )}
            </Typography>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {generalError && (
                <Alert
                  color="danger"
                  variant="soft"
                  startDecorator={<AlertCircle size={20} />}>
                  {generalError}
                </Alert>
              )}

              {/* INPUT: NUEVA CONTRASEÑA */}
              <FormControl>
                <FormLabel>
                  {t("reset.new_password", "Nueva contraseña")}
                </FormLabel>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={t(
                    "reset.placeholder_pass",
                    "Mínimo 8 caracteres",
                  )}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  startDecorator={<Key size={18} />}
                  endDecorator={
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      variant="plain"
                      color="neutral"
                      size="sm">
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </IconButton>
                  }
                  sx={{
                    borderRadius: "lg",
                    "--Input-focusedThickness": "2px",
                    "&:focus-within": { borderColor: "primary.400" },
                  }}
                />
              </FormControl>

              {/* BARRA DE PROGRESO Y REQUISITOS (Solo si empezó a escribir) */}
              {newPassword.length > 0 && (
                <Box
                  sx={{
                    bgcolor: "background.level1",
                    p: 1.5,
                    borderRadius: "md",
                  }}>
                  {/* Barra */}
                  <Stack direction="row" justifyContent="space-between" mb={1}>
                    <Typography level="body-xs" fontWeight="lg">
                      {t("strength.title", "Seguridad:")}
                    </Typography>
                    <Typography
                      level="body-xs"
                      color={getStrengthColor(strengthScore)}
                      fontWeight="lg">
                      {getStrengthLabel(strengthScore)}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    determinate
                    value={strengthScore}
                    color={getStrengthColor(strengthScore)}
                    thickness={4}
                    sx={{ borderRadius: 4, mb: 1 }}
                  />

                  {/* Lista de Requisitos (Se ocultan al cumplirse) */}
                  <List
                    size="sm"
                    sx={{ "--ListItem-paddingY": "0px", gap: 0.5 }}>
                    <RequirementItem
                      fulfilled={requirements.length}
                      label={t("req.min_chars", "Mínimo 8 caracteres")}
                    />
                    <RequirementItem
                      fulfilled={requirements.upper}
                      label={t("req.uppercase", "Una mayúscula (A-Z)")}
                    />
                    <RequirementItem
                      fulfilled={requirements.lower}
                      label={t("req.lowercase", "Una minúscula (a-z)")}
                    />
                    <RequirementItem
                      fulfilled={requirements.number}
                      label={t("req.number", "Un número (0-9)")}
                    />
                    <RequirementItem
                      fulfilled={requirements.special}
                      label={t(
                        "req.special",
                        "Un carácter especial (@$!%*?&._-)",
                      )}
                    />
                  </List>
                </Box>
              )}

              {/* INPUT: CONFIRMAR CONTRASEÑA */}
              <FormControl
                error={confirmPassword.length > 0 && !passwordsMatch}
                color={passwordsMatch ? "success" : "neutral"}>
                <FormLabel>
                  {t("reset.confirm_password", "Confirmar contraseña")}
                </FormLabel>
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder={t(
                    "reset.placeholder_confirm",
                    "Repite la contraseña",
                  )}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  startDecorator={<Key size={18} />}
                  sx={{
                    borderRadius: "lg",
                    "--Input-focusedThickness": "2px",
                    "&:focus-within": { borderColor: "primary.400" },
                  }}
                  endDecorator={
                    // Muestra check verde si coincide y es válida, ojo si no coincide, etc.
                    passwordsMatch ? (
                      <Check size={18} color="var(--joy-palette-success-500, #1F7A4A)" />
                    ) : (
                      <IconButton
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        variant="plain"
                        color="neutral"
                        size="sm">
                        {showConfirmPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </IconButton>
                    )
                  }
                  sx={{
                    // Borde verde sutil si coinciden
                    "--Input-focusedHighlight": passwordsMatch
                      ? "var(--joy-palette-success-500)"
                      : undefined,
                  }}
                />
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <Typography level="body-xs" color="danger" sx={{ mt: 0.5 }}>
                    {t("reset.error_mismatch", "Las contraseñas no coinciden.")}
                  </Typography>
                )}
              </FormControl>

              {/* BOTÓN (Deshabilitado hasta cumplir todo) */}
              <Button
                type="submit"
                size="lg"
                loading={loading}
                variant="solid"
                color="primary"
                disabled={!token || !isPasswordValid || !passwordsMatch}
                sx={{
                  mt: 1,
                  borderRadius: "lg",
                  fontWeight: "xl",
                  py: 1.5,
                  background: "linear-gradient(135deg, var(--joy-palette-primary-600, #0b6bcb), var(--joy-palette-primary-500, #185ea5))",
                  boxShadow: "0 4px 14px rgba(11,107,203,0.4)",
                  transition: "all 0.2s",
                  "&:hover:not(:disabled)": { boxShadow: "0 6px 20px rgba(11,107,203,0.5)", transform: "translateY(-1px)" },
                }}>
                {t("reset.submit_button", "Cambiar contraseña")}
              </Button>
            </Stack>
          </form>
        )}
      </Sheet>
    </Box>
  );
}
