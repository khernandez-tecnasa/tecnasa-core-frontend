// src/components/Login/MethodSelectorModal.jsx
import { Modal, ModalDialog, Stack, Typography, Button } from "@mui/joy";
import { Fingerprint, Hash } from "lucide-react";

export default function MethodSelectorModal({
  methods,
  onSelectPasskey,
  onSelectTOTP,
  onClose,
}) {
  return (
    <Modal open onClose={onClose}>
      <ModalDialog
        sx={{
          maxWidth: 380,
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
        <Typography level="h4" textAlign="center" sx={{ fontWeight: "xl", mb: 0.5 }}>
          Verifica tu identidad
        </Typography>
        <Typography level="body-sm" textAlign="center" sx={{ color: "text.tertiary", mb: 2 }}>
          Elige cómo quieres confirmar tu acceso
        </Typography>

        <Stack spacing={1.5} mt={1}>
          {methods.passkey && (
            <Button
              startDecorator={<Fingerprint size={20} />}
              onClick={onSelectPasskey}
              size="lg"
              variant="solid"
              color="primary"
              sx={{
                borderRadius: "lg",
                fontWeight: "xl",
                py: 1.5,
                background: "linear-gradient(135deg, var(--joy-palette-primary-600, #0b6bcb), var(--joy-palette-primary-500, #185ea5))",
                boxShadow: "0 4px 14px rgba(11,107,203,0.4)",
                transition: "all 0.2s",
                "&:hover": { boxShadow: "0 6px 20px rgba(11,107,203,0.5)", transform: "translateY(-1px)" },
              }}>
              Usar Biometría
            </Button>
          )}

          {methods.totp && (
            <Button
              startDecorator={<Hash size={20} />}
              onClick={onSelectTOTP}
              size="lg"
              variant="outlined"
              color="neutral"
              sx={{
                borderRadius: "lg",
                fontWeight: "md",
                py: 1.5,
                transition: "all 0.2s",
                "&:hover": { bgcolor: "background.level1" },
              }}>
              Usar Código (2FA)
            </Button>
          )}
        </Stack>
      </ModalDialog>
    </Modal>
  );
}
