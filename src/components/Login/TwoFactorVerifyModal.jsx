// src/components/Login/TwoFactorVerifyModal.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  ModalDialog,
  Typography,
  Stack,
  Box,
  Button,
  Alert,
  IconButton,
  Link,
} from "@mui/joy";
import { ShieldCheck, AlertCircle, ClockArrowUp } from "lucide-react";

/**
 * TwoFactorVerifyModal
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - onVerify: (code: string) => void
 * - onResend?: () => Promise<void> | void
 * - loading?: boolean
 * - error?: string | null
 *
 * Comportamiento OTP:
 * - 6 inputs (numéricos)
 * - navegación por teclado (left/right/backspace)
 * - pegado: si pegás 6 dígitos los distribuye en las celdas
 */
export default function TwoFactorVerifyModal({
  open,
  onClose,
  onVerify,
  onResend,
  loading = false,
  error = null,
}) {
  const { t } = useTranslation();
  const length = 6;
  const [values, setValues] = useState(Array(length).fill(""));
  const inputsRef = useRef([]);
  const [resendDisabledUntil, setResendDisabledUntil] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    setLocalError(error || null);
  }, [error]);

  useEffect(() => {
    if (open) {
      setValues(Array(length).fill(""));
      setLocalError(null);
      // focus primer input
      setTimeout(() => inputsRef.current[0]?.focus(), 50);
    }
  }, [open]);

  // contador simple para reenvío (30s)
  useEffect(() => {
    if (!resendDisabledUntil) return;
    const id = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((resendDisabledUntil - Date.now()) / 1000)
      );
      if (remaining <= 0) {
        setResendDisabledUntil(0);
        clearInterval(id);
      } else {
        // forzar rerender, usando state setter: setResendDisabledUntil mantiene valor (no necesario)
        // no hacemos nada aquí para mantener simple; la UI leerá Date.now() directamente
      }
    }, 1000);
    return () => clearInterval(id);
  }, [resendDisabledUntil]);

  const handleChangeAt = useCallback((index, raw) => {
    const digit = raw.replace(/\D/g, "").slice(0, 1);
    if (!digit) return;
    setValues((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    // focus siguiente
    const nextIndex = index + 1;
    setTimeout(() => inputsRef.current[nextIndex]?.focus(), 0);
  }, []);

  const handleKeyDown = useCallback((e, index) => {
    const key = e.key;
    if (key === "Backspace") {
      e.preventDefault();
      setValues((prev) => {
        const next = [...prev];
        if (next[index]) {
          next[index] = "";
          // stay on same input
          setTimeout(() => inputsRef.current[index]?.focus(), 0);
        } else {
          // move to previous and clear it
          const prevIndex = Math.max(0, index - 1);
          next[prevIndex] = "";
          setTimeout(() => inputsRef.current[prevIndex]?.focus(), 0);
        }
        return next;
      });
    } else if (key === "ArrowLeft") {
      e.preventDefault();
      const prevIndex = Math.max(0, index - 1);
      inputsRef.current[prevIndex]?.focus();
    } else if (key === "ArrowRight") {
      e.preventDefault();
      const nextIndex = Math.min(length - 1, index + 1);
      inputsRef.current[nextIndex]?.focus();
    } else if (/^\d$/.test(key)) {
      // allow normal input; alternative handled in onChange
    }
  }, []);

  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData)
      .getData("text")
      .replace(/\D/g, "");
    if (!text) return;
    const digits = text.slice(0, length).split("");
    setValues((prev) => {
      const next = [...prev];
      for (let i = 0; i < length; i++) {
        next[i] = digits[i] ?? "";
      }
      return next;
    });
    // focus after last filled
    const lastFilled = Math.min(length - 1, digits.length - 1);
    setTimeout(() => inputsRef.current[lastFilled + 1]?.focus(), 0);
  }, []);

  const code = values.join("");

  const handleSubmit = (e) => {
    e?.preventDefault();
    setLocalError(null);
    if (code.length !== length) {
      setLocalError(
        t("login.error_code_length", { count: length }) ||
          `Ingrese ${length} dígitos`
      );
      return;
    }
    onVerify(code);
  };

  const handleResend = async () => {
    if (!onResend || resendDisabledUntil) return;
    try {
      setResendLoading(true);
      await onResend();
      // bloquear reenvío 30s
      setResendDisabledUntil(Date.now() + 30 * 1000);
      setSnackTransient?.(); // eslint-disable-line no-undef
    } catch (err) {
      setLocalError(t("login.error_resend") || "Error reenviando código");
    } finally {
      setResendLoading(false);
    }
  };

  // helper para mostrar segundos restantes
  const resendSecondsLeft = () => {
    if (!resendDisabledUntil) return 0;
    return Math.max(0, Math.ceil((resendDisabledUntil - Date.now()) / 1000));
  };

  return (
    <Modal open={open} onClose={() => !loading && onClose()}>
      <ModalDialog
        aria-labelledby="twofa-title"
        aria-describedby="twofa-desc"
        sx={{
          maxWidth: 460,
          width: "100%",
          p: 3.5,
          borderRadius: "xl",
          border: "1px solid",
          borderColor: "divider",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          overflow: "hidden",
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
        <Stack direction="row" gap={2} alignItems="center" sx={{ mb: 1.5 }}>
          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: "lg",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              background: "linear-gradient(135deg, var(--joy-palette-primary-600, #0b6bcb), var(--joy-palette-primary-400, #4393e4))",
              boxShadow: "0 2px 8px rgba(11,107,203,0.35)",
            }}>
            <ShieldCheck size={20} color="#fff" />
          </Box>
          <Box>
            <Typography id="twofa-title" level="h4" sx={{ fontWeight: "xl" }}>
              {t("login.title_2fa")}
            </Typography>
            <Typography id="twofa-desc" level="body-sm" sx={{ color: "text.tertiary" }}>
              {t("login.description_2fa")}
            </Typography>
          </Box>
        </Stack>

        {/* Error */}
        {localError && (
          <Alert
            startDecorator={<AlertCircle />}
            color="danger"
            variant="soft"
            sx={{ mb: 2, borderRadius: "lg" }}>
            {localError}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            {/* OTP inputs */}
            <Box
              sx={{
                display: "flex",
                gap: 1.5,
                justifyContent: "center",
                alignItems: "center",
                mb: 0.5,
              }}
              onPaste={handlePaste}>
              {values.map((val, i) => (
                <input
                  key={i}
                  ref={(el) => (inputsRef.current[i] = el)}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={val}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 1);
                    if (!v) {
                      setValues((prev) => {
                        const next = [...prev];
                        next[i] = "";
                        return next;
                      });
                      return;
                    }
                    handleChangeAt(i, v);
                  }}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  aria-label={
                    t("login.aria_otp_digit", { index: i + 1 }) ||
                    `Digit ${i + 1}`
                  }
                  style={{
                    width: 52,
                    height: 60,
                    borderRadius: 12,
                    border: val
                      ? "2px solid var(--joy-palette-primary-400, #4393e4)"
                      : "1px solid var(--joy-palette-neutral-outlinedBorder, #CDD7E1)",
                    textAlign: "center",
                    fontSize: 22,
                    fontWeight: "bold",
                    fontFamily: "monospace",
                    outline: "none",
                    background: "transparent",
                    color: "inherit",
                    transition: "border-color 0.15s",
                    boxShadow: val ? "0 0 0 3px rgba(11,107,203,0.12)" : "none",
                  }}
                />
              ))}
            </Box>

            {/* Acciones: submit + resend */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              gap={1}
              justifyContent="center"
              alignItems="center">
              <Button
                type="submit"
                loading={loading}
                disabled={code.length !== length || loading}
                variant="solid"
                color="primary"
                sx={{
                  minWidth: 180,
                  borderRadius: "lg",
                  fontWeight: "xl",
                  py: 1.25,
                  background: "linear-gradient(135deg, var(--joy-palette-primary-600, #0b6bcb), var(--joy-palette-primary-500, #185ea5))",
                  boxShadow: "0 4px 14px rgba(11,107,203,0.4)",
                  transition: "all 0.2s",
                  "&:hover:not(:disabled)": {
                    boxShadow: "0 6px 20px rgba(11,107,203,0.5)",
                    transform: "translateY(-1px)",
                  },
                }}>
                {t("login.button_2fa")}
              </Button>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Link
                  component="button"
                  onClick={handleResend}
                  disabled={resendDisabledUntil > Date.now() || resendLoading}
                  underline="none"
                  sx={{
                    fontSize: 14,
                    cursor:
                      resendDisabledUntil > Date.now() || resendLoading
                        ? "not-allowed"
                        : "pointer",
                    color:
                      resendDisabledUntil > Date.now()
                        ? "neutral.500"
                        : "primary.600",
                  }}>
                  {/* <Stack direction="row" alignItems="center" gap={0.5}>
                    <ClockArrowUp size={16} />
                    <span>
                      {resendDisabledUntil > Date.now()
                        ? `${
                            t("login.resend_in") || "Reenviar en"
                          } ${resendSecondsLeft()}s`
                        : t("login.resend_code") || "Reenviar código"}
                    </span>
                  </Stack> */}
                </Link>
              </Box>
            </Stack>
          </Stack>
        </form>
      </ModalDialog>
    </Modal>
  );
}
