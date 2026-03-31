import React, { useState } from "react";
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
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import FingerprintRoundedIcon from "@mui/icons-material/FingerprintRounded"; // Icono de Material UI
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
          backgroundColor: "background.level1",
          position: "relative",
          borderRadius: { xs: 0, md: "lg" },
          m: { xs: 0, md: 2 },
          boxShadow: "xl",
        }}>
        <Box
          component="img"
          src={loginBg}
          alt="Login illustration"
          sx={{
            width: "80%",
            height: "auto",
            mb: 4,
            animation: "float 3s ease-in-out infinite",
            "@keyframes float": {
              "0%, 100%": { transform: "translateY(0px)" },
              "50%": { transform: "translateY(-10px)" },
            },
            maxWidth: "400px",
          }}
        />
        <Typography level="h3" textAlign="center" sx={{ fontWeight: "lg" }}>
          {t("login.title_bienvenida")}
        </Typography>
        <Typography
          level="body-lg"
          textAlign="center"
          mt={1}
          sx={{ color: "text.secondary", maxWidth: "400px" }}>
          {t("login.description_bienvenida")}
        </Typography>
      </Box>

      {/* SECCIÓN DERECHA: FORMULARIO */}
      <Sheet
        variant="outlined"
        sx={{
          p: { xs: 3, md: 6 },
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 2,
          borderRadius: "xl",
          boxShadow: "lg",
          m: 2,
          maxWidth: { xs: "90%", md: "500px" },
          mx: "auto",
        }}>
        <Typography
          level="h2"
          sx={{ mb: 1, fontWeight: "xl", color: "primary.plainColor" }}>
          {t("login.title")}
        </Typography>

        <Stack spacing={2.5} width="100%">
          {/* INPUT DE USUARIO CON DETECCIÓN DE PASSKEY */}
          <Input
            name="username"
            placeholder={t("login.usuario")}
            value={credentials.username}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            size="lg"
            startDecorator={<EmailRoundedIcon />}
            endDecorator={
              hasPasskey && (
                <IconButton
                  variant="soft"
                  color="success"
                  onClick={onPasskeyClick}
                  loading={loadingPasskey}
                  sx={{ borderRadius: "md" }}>
                  <FingerprintRoundedIcon />
                </IconButton>
              )
            }
            sx={{ borderRadius: "md" }}
          />

          {/* INPUT DE CONTRASEÑA */}
          <Input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder={t("login.contraseña")}
            value={credentials.password}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            size="lg"
            startDecorator={<LockRoundedIcon />}
            endDecorator={
              <IconButton
                onClick={togglePasswordVisibility}
                variant="plain"
                color="neutral">
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            }
            sx={{ borderRadius: "md" }}
          />

          <Link
            component="button"
            onClick={onForgotPassword}
            level="body-sm"
            sx={{ alignSelf: "flex-end", mt: -1, color: "text.secondary" }}>
            {t("login.olvidaste_contraseña")}
          </Link>

          {/* BOTÓN ENTRAR TRADICIONAL */}
          <Button
            size="lg"
            variant="solid"
            color="primary"
            onClick={onSubmit}
            loading={loading && !loadingPasskey} // Evita doble loading
            sx={{
              mt: 1,
              borderRadius: "xl",
              fontWeight: "lg",
            }}>
            {t("login.entrar")}
          </Button>

          <Button
            variant="plain"
            color="primary"
            onClick={onPasswordlessClick} // Nueva prop
            startDecorator={<FingerprintRoundedIcon sx={{ fontSize: 32 }} />}
            sx={{
              flexDirection: "column",
              gap: 1,
              py: 2,
              "&:hover": { bgcolor: "transparent", transform: "scale(1.05)" },
              transition: "0.2s",
            }}>
            <Typography
              level="body-sm"
              sx={{ fontWeight: "lg", color: "primary.500" }}>
              Iniciar con biometria
            </Typography>
          </Button>

          <Divider sx={{ my: 1 }}>O</Divider>

          <Typography
            level="body-sm"
            textAlign="center"
            sx={{ color: "text.secondary" }}>
            {t("login.no_cuentas")}{" "}
            <Link href="mailto:support@herndevs.com" sx={{ fontWeight: "md" }}>
              {t("login.registrarte")}
            </Link>
          </Typography>
        </Stack>
      </Sheet>
    </Box>
  );
}
