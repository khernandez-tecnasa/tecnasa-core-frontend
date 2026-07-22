import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  Typography,
  Input,
  Sheet,
  Stack,
  Divider,
  Link,
  IconButton,
} from "@mui/joy";
import { Eye, EyeOff, Mail, Lock, Fingerprint } from "lucide-react";
import loginBg from "../../assets/tecnasa_core.png";

export default function LoginForm({
  credentials,
  setCredentials,
  onSubmit,
  loading,
  loadingPasskey, // Estado de carga independiente para Passkey
  onForgotPassword,
  onPasskeyClick,
  hasPasskey, // Indica si el usuario actual tiene Passkey activa
  checkPasskey, // Función para verificar disponibilidad mientras se escribe
  onPasswordlessClick,
}) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState("credentials");
  const autoSwitched = useRef(false);

  useEffect(() => {
    if (hasPasskey && credentials.username && !autoSwitched.current) {
      setMode("passkey");
      autoSwitched.current = true;
    }
  }, [hasPasskey, credentials.username]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Si el usuario está escribiendo su nombre, verificamos si tiene Passkey
    if (name === "username") {
      checkPasskey(value);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      // Si tiene passkey y no ha escrito password, intentamos passkey
      if (hasPasskey && !credentials.password) {
        onPasskeyClick();
      } else {
        onSubmit();
      }
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        backgroundColor: "background.body",
      }}>
      {/* SECCIÓN IZQUIERDA: ILUSTRACIÓN */}
      <Box
        sx={{
          display: { xs: "none", sm: "flex" },
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          flex: 1,
          p: 4,
          background: "linear-gradient(145deg, var(--joy-palette-primary-900, #0a2540) 0%, var(--joy-palette-primary-700, #0b6bcb) 100%)",
          position: "relative",
          overflow: "hidden",
          borderRadius: { xs: 0, md: "xl" },
          m: { xs: 0, md: 2 },
          boxShadow: "xl",
          "&::before": {
            content: '""',
            position: "absolute",
            width: "350px",
            height: "350px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)",
            top: "-80px",
            right: "-80px",
          },
          "&::after": {
            content: '""',
            position: "absolute",
            width: "250px",
            height: "250px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)",
            bottom: "-60px",
            left: "-60px",
          },
        }}>
        <Box
          component="img"
          src={loginBg}
          alt="Login illustration"
          sx={{
            width: "75%",
            height: "auto",
            mb: 4,
            filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.3))",
            animation: "float 3s ease-in-out infinite",
            "@keyframes float": {
              "0%, 100%": { transform: "translateY(0px)" },
              "50%": { transform: "translateY(-12px)" },
            },
            maxWidth: "380px",
            position: "relative",
            zIndex: 1,
          }}
        />
        <Typography
          level="h3"
          textAlign="center"
          sx={{ fontWeight: "xl", color: "#fff", position: "relative", zIndex: 1 }}>
          {t("login.title_bienvenida")}
        </Typography>
        <Typography
          level="body-lg"
          textAlign="center"
          mt={1}
          sx={{ color: "rgba(255,255,255,0.65)", maxWidth: "380px", position: "relative", zIndex: 1 }}>
          {t("login.description_bienvenida")}
        </Typography>
      </Box>

      {/* SECCIÓN DERECHA: FORMULARIO */}
      <Sheet
        variant="plain"
        sx={{
          p: { xs: 3, md: 6 },
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 2,
          borderRadius: "xl",
          m: 2,
          maxWidth: { xs: "95%", md: "460px" },
          mx: "auto",
          bgcolor: "background.surface",
          boxShadow: "0 2px 24px rgba(0,0,0,0.08)",
          border: "1px solid",
          borderColor: "divider",
        }}>
        <Typography
          level="h2"
          sx={{
            mb: 0.5,
            fontWeight: "xl",
            background: "linear-gradient(135deg, var(--joy-palette-primary-600, #0b6bcb), var(--joy-palette-primary-400, #4393e4))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
          {t("login.title")}
        </Typography>

        {mode === "passkey" ? (
          /* ── MODO BIOMÉTRICO ─────────────────────────────────── */
          <Stack spacing={2} width="100%">
            {/* Usuario bloqueado */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 1.5,
                borderRadius: "lg",
                bgcolor: "background.level1",
                border: "1px solid",
                borderColor: "neutral.outlinedBorder",
                transition: "border-color 0.2s",
                "&:hover": { borderColor: "primary.outlinedBorder" },
              }}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--joy-palette-primary-500, #0b6bcb), var(--joy-palette-primary-300, #97c3f0))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  color: "#fff",
                  fontSize: "1rem",
                  flexShrink: 0,
                  textTransform: "uppercase",
                  boxShadow: "0 2px 8px rgba(11,107,203,0.35)",
                }}>
                {credentials.username?.[0]}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography level="body-sm" fontWeight="xl" noWrap>
                  {credentials.username}
                </Typography>
                <Typography level="body-xs" sx={{ color: "text.tertiary" }}>
                  AutoLog
                </Typography>
              </Box>
              <Link
                level="body-xs"
                component="button"
                onClick={() => setMode("credentials")}
                sx={{ flexShrink: 0, fontWeight: "md" }}>
                Cambiar
              </Link>
            </Box>

            {/* Botón principal biométrico */}
            <Button
              size="lg"
              variant="solid"
              color="primary"
              onClick={onPasskeyClick}
              loading={loading || loadingPasskey}
              startDecorator={<Fingerprint size={22} />}
              sx={{
                borderRadius: "lg",
                fontWeight: "xl",
                py: 1.5,
                background: "linear-gradient(135deg, var(--joy-palette-primary-600, #0b6bcb), var(--joy-palette-primary-500, #185ea5))",
                boxShadow: "0 4px 14px rgba(11,107,203,0.4)",
                transition: "all 0.2s",
                "&:hover": {
                  boxShadow: "0 6px 20px rgba(11,107,203,0.5)",
                  transform: "translateY(-1px)",
                },
              }}>
              Iniciar con biometría
            </Button>

            <Divider sx={{ color: "text.tertiary", fontSize: "xs" }}>o</Divider>

            {/* Fallback credenciales */}
            <Button
              size="md"
              variant="outlined"
              color="neutral"
              onClick={() => setMode("credentials")}
              sx={{
                borderRadius: "lg",
                fontWeight: "md",
                transition: "all 0.2s",
                "&:hover": { bgcolor: "background.level1" },
              }}>
              Usar credenciales
            </Button>

            <Typography
              level="body-xs"
              textAlign="center"
              sx={{ color: "text.tertiary", mt: 0.5 }}>
              {t("login.no_cuentas")}{" "}
              <Link href="mailto:micros.teh@tecnasadesk.com" sx={{ fontWeight: "md" }}>
                {t("login.registrarte")}
              </Link>
            </Typography>
          </Stack>
        ) : (
          /* ── MODO CREDENCIALES ───────────────────────────────── */
          <Stack spacing={2} width="100%">
            {hasPasskey && (
              <Link
                level="body-sm"
                component="button"
                onClick={() => setMode("passkey")}
                sx={{ alignSelf: "flex-start", mb: -0.5, fontWeight: "md" }}>
                ← Volver a biometría
              </Link>
            )}

            <Input
              name="username"
              placeholder={t("login.usuario")}
              value={credentials.username}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              size="lg"
              startDecorator={<Mail size={18} />}
              endDecorator={
                hasPasskey && (
                  <IconButton
                    variant="soft"
                    color="success"
                    onClick={onPasskeyClick}
                    loading={loadingPasskey}
                    sx={{ borderRadius: "md" }}>
                    <Fingerprint size={18} />
                  </IconButton>
                )
              }
              sx={{
                borderRadius: "lg",
                "--Input-focusedThickness": "2px",
                "&:focus-within": { borderColor: "primary.400" },
              }}
            />

            <Input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder={t("login.contraseña")}
              value={credentials.password}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              size="lg"
              startDecorator={<Lock size={18} />}
              endDecorator={
                <IconButton
                  onClick={togglePasswordVisibility}
                  variant="plain"
                  color="neutral">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </IconButton>
              }
              sx={{
                borderRadius: "lg",
                "--Input-focusedThickness": "2px",
                "&:focus-within": { borderColor: "primary.400" },
              }}
            />

            <Link
              component="button"
              onClick={onForgotPassword}
              level="body-sm"
              sx={{ alignSelf: "flex-end", mt: -0.5, color: "text.tertiary", fontWeight: "md" }}>
              {t("login.olvidaste_contraseña")}
            </Link>

            <Button
              size="lg"
              variant="solid"
              color="primary"
              onClick={onSubmit}
              loading={loading && !loadingPasskey}
              sx={{
                mt: 0.5,
                borderRadius: "lg",
                fontWeight: "xl",
                py: 1.5,
                background: "linear-gradient(135deg, var(--joy-palette-primary-600, #0b6bcb), var(--joy-palette-primary-500, #185ea5))",
                boxShadow: "0 4px 14px rgba(11,107,203,0.4)",
                transition: "all 0.2s",
                "&:hover": {
                  boxShadow: "0 6px 20px rgba(11,107,203,0.5)",
                  transform: "translateY(-1px)",
                },
              }}>
              {t("login.entrar")}
            </Button>

            <Typography
              level="body-xs"
              textAlign="center"
              sx={{ color: "text.tertiary" }}>
              {t("login.no_cuentas")}{" "}
              <Link href="mailto:micros.teh@tecnasadesk.com" sx={{ fontWeight: "md" }}>
                {t("login.registrarte")}
              </Link>
            </Typography>
          </Stack>
        )}
      </Sheet>
    </Box>
  );
}
