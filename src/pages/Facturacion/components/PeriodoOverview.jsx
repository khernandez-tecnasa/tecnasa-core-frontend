import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Stepper,
  Step,
  StepIndicator,
} from "@mui/joy";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LockIcon from "@mui/icons-material/Lock";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

// Reutilizas tus modales existentes
import PeriodoModal from "../../../components/Facturacion/PeriodoModal";
import { FacturacionService } from "../../../services/FacturacionServices";

export default function PeriodoOverview({
  periodos,
  selectedPeriodoId,
  onReload,
}) {
  const [openModal, setOpenModal] = useState(false);

  const periodoActivo = periodos.find((p) => p.id === selectedPeriodoId);

  const steps = ["Nuevo", "Abierto", "En Revision", "Aprobado", "Cerrado"];
  const activeStepIndex = periodoActivo
    ? steps.indexOf(periodoActivo.estado)
    : -1;

  const handleChangeEstado = async (nuevoEstado) => {
    if (!window.confirm(`¿Cambiar estado a ${nuevoEstado}?`)) return;
    try {
      await FacturacionService.changeEstadoPeriodo(
        selectedPeriodoId,
        nuevoEstado,
      );
      onReload();
    } catch (e) {
      alert("Error cambiando estado");
    }
  };

  if (!periodoActivo) return <Box p={4}>Selecciona un periodo.</Box>;

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 4,
          alignItems: "center",
        }}>
        <Box>
          <Typography level="h2">Resumen del Periodo</Typography>
          <Typography color="neutral">
            Gestión macro del ciclo de facturación.
          </Typography>
        </Box>
        <Button startDecorator={<AddIcon />} onClick={() => setOpenModal(true)}>
          Crear Nuevo Mes
        </Button>
      </Box>

      <Card variant="outlined" sx={{ mb: 4, boxShadow: "sm" }}>
        <CardContent>
          <Typography
            level="h4"
            startDecorator={<CalendarMonthIcon color="primary" />}>
            {periodoActivo.nombre}
          </Typography>
          <Typography level="body-sm" sx={{ mb: 3 }}>
            Estado actual del ciclo:
          </Typography>

          <Stepper sx={{ width: "100%", mb: 3 }}>
            {steps.map((step, index) => (
              <Step
                key={step}
                completed={index <= activeStepIndex}
                indicator={
                  <StepIndicator
                    variant={index <= activeStepIndex ? "solid" : "outlined"}
                    color="primary">
                    {index <= activeStepIndex ? <CheckCircleIcon /> : index + 1}
                  </StepIndicator>
                }>
                <Typography
                  fontWeight={index === activeStepIndex ? "bold" : "normal"}>
                  {step}
                </Typography>
              </Step>
            ))}
          </Stepper>

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            {periodoActivo.estado === "Abierto" && (
              <Button
                color="warning"
                onClick={() => handleChangeEstado("En Revision")}>
                Cerrar Carga (Revisión)
              </Button>
            )}
            {periodoActivo.estado === "En Revision" && (
              <Button
                color="success"
                onClick={() => handleChangeEstado("Aprobado")}>
                Aprobar Todo
              </Button>
            )}
            {periodoActivo.estado === "Aprobado" && (
              <Button
                color="danger"
                startDecorator={<LockIcon />}
                onClick={() => handleChangeEstado("Cerrado")}>
                Finalizar Mes
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      <PeriodoModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={onReload}
      />
    </Box>
  );
}
