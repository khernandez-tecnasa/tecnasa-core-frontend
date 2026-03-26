import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalDialog,
  DialogTitle,
  DialogContent,
  Stack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Select,
  Option,
  Checkbox,
  Typography,
  Sheet,
  ModalClose,
  Divider,
  FormHelperText,
} from "@mui/joy";

// Iconos
import DescriptionIcon from "@mui/icons-material/Description";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import LinkIcon from "@mui/icons-material/Link";
import ArticleIcon from "@mui/icons-material/Article";

import { FacturacionService } from "../../services/FacturacionServices";

export default function ContratoModal({
  open,
  onClose,
  onSuccess,
  clienteId,
  contratosExistentes,
  contractToEdit = null,
}) {
  const [nombre, setNombre] = useState("");
  const [fechaInicio, setFechaInicio] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [fechaFin, setFechaFin] = useState("");
  const [esAdenda, setEsAdenda] = useState(false);
  const [contratoPadre, setContratoPadre] = useState(null);
  const [loading, setLoading] = useState(false);

  // Efecto para rellenar datos
  useEffect(() => {
    if (contractToEdit) {
      setNombre(contractToEdit.nombre);
      const fecha = contractToEdit.fecha_inicio
        ? new Date(contractToEdit.fecha_inicio).toISOString().split("T")[0]
        : "";
      const fin = contractToEdit.fecha_fin
        ? new Date(contractToEdit.fecha_fin).toISOString().split("T")[0]
        : "";
      setFechaFin(fin);
      setFechaInicio(fecha);
      setEsAdenda(!!contractToEdit.contrato_padre_id);
      setContratoPadre(contractToEdit.contrato_padre_id);
    } else {
      setNombre("");
      setFechaInicio(new Date().toISOString().split("T")[0]);
      setFechaFin("");
      setEsAdenda(false);
      setContratoPadre(null);
    }
  }, [contractToEdit, open]);

  const contratosMaestros = contratosExistentes.filter(
    (c) => !c.contrato_padre_id,
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        cliente_id: clienteId,
        nombre: nombre,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin || null,
        contrato_padre_id: esAdenda ? contratoPadre : null,
      };

      if (contractToEdit) {
        await FacturacionService.updateContrato(contractToEdit.id, payload);
      } else {
        await FacturacionService.createContrato(payload);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      // Aquí podrías usar tu showToast si lo pasas como prop o hook
      alert("Error guardando contrato");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog
        variant="outlined"
        role="alertdialog"
        sx={{
          minWidth: 500, // Un poco más ancho para respirar
          maxWidth: "90%",
          p: 3,
          borderRadius: "lg",
          boxShadow: "lg",
        }}>
        <ModalClose variant="plain" sx={{ m: 1 }} />

        <DialogTitle>
          <DescriptionIcon color="primary" />
          {contractToEdit ? "Editar Contrato" : "Nuevo Contrato"}
        </DialogTitle>

        <Divider sx={{ my: 1 }} />

        <DialogContent sx={{ mb: 2 }}>
          {contractToEdit
            ? "Actualiza la vigencia o detalles del contrato existente."
            : "Define la vigencia y si este contrato depende de uno maestro."}
        </DialogContent>

        <form onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            {/* 1. Nombre */}
            <FormControl required>
              <FormLabel>Nombre o Referencia</FormLabel>
              <Input
                autoFocus
                placeholder="Ej. Contrato de Renta 2024"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                startDecorator={<ArticleIcon />}
                size="lg"
              />
            </FormControl>

            {/* 2. Fechas */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <FormControl required sx={{ flex: 1 }}>
                <FormLabel>Fecha Inicio</FormLabel>
                <Input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  startDecorator={<CalendarTodayIcon />}
                />
              </FormControl>

              <FormControl sx={{ flex: 1 }}>
                <FormLabel>Fecha Vencimiento</FormLabel>
                <Input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  // Indicador visual si está vacío
                  sx={{
                    borderColor: !fechaFin
                      ? "neutral.outlinedBorder"
                      : "primary.outlinedBorder",
                  }}
                />
                <FormHelperText>
                  {fechaFin
                    ? "El contrato vencerá este día."
                    : "Indefinido (Renovación automática)"}
                </FormHelperText>
              </FormControl>
            </Stack>

            {/* 3. Lógica de Tipo de Contrato (Visualmente separado) */}
            <Sheet
              variant={esAdenda ? "soft" : "outlined"}
              color={esAdenda ? "primary" : "neutral"}
              sx={{
                p: 2,
                borderRadius: "md",
                border: "1px solid",
                borderColor: esAdenda
                  ? "primary.200"
                  : "neutral.outlinedBorder",
                display: "flex",
                flexDirection: "column",
                gap: 2,
                transition: "0.2s",
              }}>
              <Checkbox
                label={
                  <Typography
                    fontWeight="md"
                    color={esAdenda ? "primary" : "neutral"}>
                    Es una Adenda (Anexo)
                  </Typography>
                }
                checked={esAdenda}
                onChange={(e) => setEsAdenda(e.target.checked)}
                disabled={!!contractToEdit}
                sx={{ width: "100%" }}
              />

              {esAdenda && (
                <FormControl
                  required
                  sx={{ animation: "fadeIn 0.3s ease-in-out" }}>
                  <FormLabel>Seleccionar Contrato Maestro</FormLabel>
                  <Select
                    placeholder="Selecciona el contrato padre..."
                    value={contratoPadre}
                    onChange={(e, val) => setContratoPadre(val)}
                    disabled={!!contractToEdit}
                    startDecorator={<LinkIcon />}>
                    {contratosMaestros.map((c) => (
                      <Option key={c.id} value={c.id}>
                        {c.nombre}
                      </Option>
                    ))}
                  </Select>
                  <FormHelperText>
                    Este contrato heredará condiciones del maestro seleccionado.
                  </FormHelperText>
                </FormControl>
              )}
            </Sheet>

            {/* 4. Botones */}
            <Stack
              direction="row"
              spacing={1}
              justifyContent="flex-end"
              sx={{ mt: 2 }}>
              <Button variant="plain" color="neutral" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" loading={loading} size="lg">
                {contractToEdit ? "Guardar Cambios" : "Crear Contrato"}
              </Button>
            </Stack>
          </Stack>
        </form>
      </ModalDialog>
    </Modal>
  );
}
