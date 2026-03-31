// src/components/Login/MethodSelectorModal.jsx
import { Modal, ModalDialog, Stack, Typography, Button } from "@mui/joy";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import PinIcon from "@mui/icons-material/Pin";

export default function MethodSelectorModal({
  methods,
  onSelectPasskey,
  onSelectTOTP,
  onClose,
}) {
  return (
    <Modal open onClose={onClose}>
      <ModalDialog sx={{ maxWidth: 400 }}>
        <Typography level="h4" textAlign="center">
          Verifica tu identidad
        </Typography>

        <Stack spacing={2} mt={2}>
          {methods.passkey && (
            <Button
              startDecorator={<FingerprintIcon />}
              onClick={onSelectPasskey}
              size="lg">
              Usar Biometría
            </Button>
          )}

          {methods.totp && (
            <Button
              startDecorator={<PinIcon />}
              onClick={onSelectTOTP}
              size="lg"
              variant="soft">
              Usar Código (2FA)
            </Button>
          )}
        </Stack>
      </ModalDialog>
    </Modal>
  );
}
