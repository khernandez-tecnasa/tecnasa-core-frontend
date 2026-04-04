// src/components/Users/MyAccount/SecuritySettingsForm.jsx
import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Stack,
  Typography,
  Input,
  FormLabel,
  FormControl,
  LinearProgress,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemDecorator,
  FormHelperText,
} from "@mui/joy";

// Iconos
import KeyRoundedIcon from "@mui/icons-material/KeyRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";

import { useFormik } from "formik";
import * as Yup from "yup";
import Swal from "sweetalert2";
import { updateUser } from "../../../services/AuthServices";

export default function SecuritySettingsForm({ user, showSnackbar }) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);

  // Esquema de validación con reglas estrictas
  const validationSchema = useMemo(() => {
    return Yup.object({
      password: Yup.string()
        .required(t("account.security.validation.required"))
        .min(8, t("account.security.validation.min_length"))
        .matches(/[a-z]/, t("account.security.validation.lowercase"))
        .matches(/[A-Z]/, t("account.security.validation.uppercase"))
        .matches(/\d/, t("account.security.validation.number"))
        .matches(/[@$!%*?&._-]/, t("account.security.validation.special")),
    });
  }, [t]);

  const formik = useFormik({
    initialValues: {
      password: "",
      email: user.email || "",
    },
    validationSchema,
    onSubmit: async ({ password, email }, { resetForm }) => {
      const confirm = await Swal.fire({
        title: t("account.security.confirm_title"),
        text: t("account.security.confirm_text"),
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#0B6BCB",
        cancelButtonColor: "#d33",
        confirmButtonText: t("common.actions.confirm"),
        cancelButtonText: t("common.actions.cancel"),
      });

      if (confirm.isConfirmed) {
        try {
          const data = await updateUser({
            id_usuario: user.id_usuario || user.id,
            email,
            password,
          });

          console.log("Update user response:", data);

          if (data && data.error) {
            showSnackbar(data.error, "danger");
          } else {
            // Éxito visual con SweetAlert o Snackbar (usamos Snackbar por consistencia con el padre)
            showSnackbar(t("account.security.success_update"), "success");
            resetForm();
          }
        } catch (error) {
          showSnackbar(t("common.network_error"), "danger");
        }
      }
    },
  });

  // --- Lógica de cálculo de fuerza visual ---
  const getStrength = (pass) => {
    let score = 0;
    if (!pass) return 0;
    if (pass.length >= 8) score += 20;
    if (/[a-z]/.test(pass)) score += 20;
    if (/[A-Z]/.test(pass)) score += 20;
    if (/\d/.test(pass)) score += 20;
    if (/[@$!%*?&._-]/.test(pass)) score += 20;
    return score;
  };

  const strength = getStrength(formik.values.password);

  const getColor = (s) => {
    if (s < 40) return "danger";
    if (s < 80) return "warning";
    return "success";
  };

  const getStrengthLabel = (s) => {
    if (s === 0) return "";
    if (s < 40) return t("account.security.strength.weak");
    if (s < 80) return t("account.security.strength.medium");
    return t("account.security.strength.strong");
  };

  // Helper para renderizar items de requisitos
  const RequirementItem = ({ fulfilled, label }) => (
    <ListItem sx={{ minHeight: 24, p: 0 }}>
      <ListItemDecorator sx={{ minWidth: 24 }}>
        {fulfilled ? (
          <CheckCircleRoundedIcon sx={{ fontSize: 16, color: "success.500" }} />
        ) : (
          <CancelRoundedIcon sx={{ fontSize: 16, color: "neutral.300" }} />
        )}
      </ListItemDecorator>
      <Typography
        level="body-xs"
        textColor={fulfilled ? "text.primary" : "neutral.400"}
        sx={{ textDecoration: fulfilled ? "none" : "none" }}>
        {label}
      </Typography>
    </ListItem>
  );

  return (
    <form onSubmit={formik.handleSubmit}>
      <Stack spacing={3} sx={{ maxWidth: 400 }}>
        <FormControl
          error={formik.touched.password && Boolean(formik.errors.password)}>
          <FormLabel>{t("account.security.new_password_label")}</FormLabel>
          <Input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder={t("account.security.placeholder")}
            startDecorator={<KeyRoundedIcon />}
            endDecorator={
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                variant="plain"
                color="neutral"
                size="sm">
                {showPassword ? (
                  <VisibilityOffRoundedIcon />
                ) : (
                  <VisibilityRoundedIcon />
                )}
              </IconButton>
            }
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            size="lg"
          />
          {/* Solo mostramos el error de Formik si es un error "general" o si queremos ser redundantes. 
              En este diseño, la lista de abajo ya actúa como validador visual. */}
        </FormControl>

        {/* Indicador de Fuerza */}
        <Box>
          <Stack direction="row" justifyContent="space-between" mb={1}>
            <Typography level="body-xs" fontWeight="lg">
              {t("account.security.password_strength")}
            </Typography>
            <Typography
              level="body-xs"
              color={getColor(strength)}
              fontWeight="lg">
              {getStrengthLabel(strength)}
            </Typography>
          </Stack>
          <LinearProgress
            determinate
            value={strength}
            color={getColor(strength)}
            thickness={6}
            sx={{ bgcolor: "background.level3", borderRadius: "sm" }}
          />
        </Box>

        {/* Lista de Requisitos Visuales */}
        <List size="sm" sx={{ "--ListItem-paddingY": "0px", gap: 0.5 }}>
          <RequirementItem
            fulfilled={formik.values.password.length >= 8}
            label={t("account.security.req.min_chars")}
          />
          <RequirementItem
            fulfilled={/[A-Z]/.test(formik.values.password)}
            label={t("account.security.req.uppercase")}
          />
          <RequirementItem
            fulfilled={/[a-z]/.test(formik.values.password)}
            label={t("account.security.req.lowercase")}
          />
          <RequirementItem
            fulfilled={/\d/.test(formik.values.password)}
            label={t("account.security.req.number")}
          />
          <RequirementItem
            fulfilled={/[@$!%*?&._-]/.test(formik.values.password)}
            label={t("account.security.req.special")}
          />
        </List>

        <Button
          type="submit"
          size="lg"
          variant="solid"
          startDecorator={<SaveRoundedIcon />}
          disabled={!formik.isValid || !formik.dirty} // Deshabilitado si no cumple requisitos o está vacío
        >
          {t("account.security.btn_save")}
        </Button>
      </Stack>
    </form>
  );
}
