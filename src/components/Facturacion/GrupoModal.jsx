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
  Typography,
  Select,
  Option,
  ModalClose,
  Divider,
  Switch,
  Card,
  Grid,
  Alert,
} from "@mui/joy";

// Iconos
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import FolderZipIcon from "@mui/icons-material/FolderZip";
import SettingsIcon from "@mui/icons-material/Settings";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

import { FacturacionService } from "../../services/FacturacionServices";

export default function GrupoModal({
  open,
  onClose,
  onSuccess,
  contratoId,
  grupoToEdit = null,
}) {
  const [nombre, setNombre] = useState("");
  const [esBolson, setEsBolson] = useState(true);

  // Configuración Financiera
  const [precioFijo, setPrecioFijo] = useState(0);
  const [bolsaMono, setBolsaMono] = useState(0);
  const [bolsaColor, setBolsaColor] = useState(0);
  const [excedenteMono, setExcedenteMono] = useState(0.008);
  const [excedenteColor, setExcedenteColor] = useState(0.06);

  const [frecuencia, setFrecuencia] = useState("MENSUAL");
  const [mesCierre, setMesCierre] = useState(12);

  const [loading, setLoading] = useState(false);

  const meses = [
    { id: 1, label: "Enero" },
    { id: 2, label: "Febrero" },
    { id: 3, label: "Marzo" },
    { id: 4, label: "Abril" },
    { id: 5, label: "Mayo" },
    { id: 6, label: "Junio" },
    { id: 7, label: "Julio" },
    { id: 8, label: "Agosto" },
    { id: 9, label: "Septiembre" },
    { id: 10, label: "Octubre" },
    { id: 11, label: "Noviembre" },
    { id: 12, label: "Diciembre" },
  ];

  useEffect(() => {
    if (open) {
      if (grupoToEdit) {
        setNombre(grupoToEdit.nombre);
        setEsBolson(!!grupoToEdit.es_bolson);
        setPrecioFijo(grupoToEdit.precio_fijo_mensual);
        setBolsaMono(grupoToEdit.bolsa_mono);
        setBolsaColor(grupoToEdit.bolsa_color);
        setExcedenteMono(grupoToEdit.precio_excedente_mono);
        setExcedenteColor(grupoToEdit.precio_excedente_color);
        setFrecuencia(grupoToEdit.frecuencia_excedentes || "MENSUAL");
        setMesCierre(grupoToEdit.mes_cierre_anual || 12);
      } else {
        setNombre("");
        setEsBolson(true);
        setPrecioFijo(0);
        setBolsaMono(0);
        setBolsaColor(0);
        setExcedenteMono(0.008);
        setExcedenteColor(0.06);
        setFrecuencia("MENSUAL");
        setMesCierre(12);
      }
    }
  }, [open, grupoToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        contrato_id: contratoId,
        nombre,
        es_bolson: esBolson,
        // Si no es bolsón, enviamos valores en cero o null para limpiar
        precio_fijo_mensual: esBolson ? parseFloat(precioFijo) : 0,
        bolsa_mono: esBolson ? parseFloat(bolsaMono) : 0,
        bolsa_color: esBolson ? parseFloat(bolsaColor) : 0,
        precio_excedente_mono: esBolson ? parseFloat(excedenteMono) : 0,
        precio_excedente_color: esBolson ? parseFloat(excedenteColor) : 0,
        frecuencia_excedentes: esBolson ? frecuencia : "MENSUAL",
        mes_cierre_anual: esBolson ? parseInt(mesCierre) : 12,
      };

      if (grupoToEdit) {
        await FacturacionService.updateGrupo(grupoToEdit.id, payload);
      } else {
        await FacturacionService.createGrupo(payload);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog sx={{ minWidth: 600, maxHeight: "90vh", overflow: "auto" }}>
        <ModalClose />
        <DialogTitle>
          <FolderOpenIcon color="primary" />
          {grupoToEdit ? "Configurar Grupo" : "Nuevo Grupo / Bolsón"}
        </DialogTitle>
        <Divider sx={{ my: 1 }} />

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {/* 1. CONFIG BÁSICA */}
            <Stack direction="row" spacing={2} alignItems="flex-end">
              <FormControl required sx={{ flex: 1 }}>
                <FormLabel>Nombre Identificativo</FormLabel>
                <Input
                  autoFocus
                  placeholder="Ej: Sede Central - Piso 1"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Tipo de Grupo</FormLabel>
                <Switch
                  size="lg"
                  checked={esBolson}
                  onChange={(e) => setEsBolson(e.target.checked)}
                  startDecorator={
                    esBolson ? <FolderZipIcon /> : <FolderOpenIcon />
                  }
                  slotProps={{
                    track: { children: esBolson ? "Bolsón" : "Lógico" },
                  }}
                  sx={{
                    "--Switch-thumbSize": "24px",
                  }}
                />
              </FormControl>
            </Stack>

            {/* 2. PANEL DE CONFIGURACIÓN FINANCIERA (SOLO SI ES BOLSÓN) */}
            {esBolson ? (
              <Card
                variant="soft"
                color="neutral"
                sx={{ borderRadius: "md", p: 2 }}>
                <Stack direction="row" alignItems="center" gap={1} mb={2}>
                  <SettingsIcon color="primary" />
                  <Typography level="title-md">
                    Parámetros de Facturación
                  </Typography>
                </Stack>

                <Grid container spacing={2}>
                  {/* A. Renta y Frecuencia */}
                  <Grid xs={12} sm={6}>
                    <FormControl required>
                      <FormLabel>Renta Fija del Grupo ($)</FormLabel>
                      <Input
                        type="number"
                        step="0.01"
                        value={precioFijo}
                        onChange={(e) => setPrecioFijo(e.target.value)}
                      />
                    </FormControl>
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <FormControl required>
                      <FormLabel>Cierre de Excedentes</FormLabel>
                      <Select
                        value={frecuencia}
                        onChange={(e, v) => setFrecuencia(v)}
                        startDecorator={<CalendarMonthIcon />}>
                        <Option value="MENSUAL">Mensual</Option>
                        <Option value="ANUAL">Anual</Option>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* B. Aviso Cierre Anual */}
                  {frecuencia === "ANUAL" && (
                    <Grid xs={12}>
                      <Alert
                        color="warning"
                        variant="soft"
                        sx={{ alignItems: "flex-start" }}>
                        <FormControl required size="sm" sx={{ width: "100%" }}>
                          <FormLabel>
                            Selecciona el Mes de Cierre Fiscal
                          </FormLabel>
                          <Select
                            size="sm"
                            value={mesCierre}
                            onChange={(e, v) => setMesCierre(v)}>
                            {meses.map((m) => (
                              <Option key={m.id} value={m.id}>
                                {m.label}
                              </Option>
                            ))}
                          </Select>
                        </FormControl>
                      </Alert>
                    </Grid>
                  )}

                  <Grid xs={12}>
                    <Divider>Bolsas y Excedentes</Divider>
                  </Grid>

                  {/* C. Bolsas Incluidas */}
                  <Grid xs={6}>
                    <FormControl>
                      <FormLabel>Bolsa B/N</FormLabel>
                      <Input
                        type="number"
                        value={bolsaMono}
                        onChange={(e) => setBolsaMono(e.target.value)}
                        endDecorator={
                          <Typography level="body-xs">pág</Typography>
                        }
                      />
                    </FormControl>
                  </Grid>
                  <Grid xs={6}>
                    <FormControl>
                      <FormLabel>Bolsa Color</FormLabel>
                      <Input
                        type="number"
                        value={bolsaColor}
                        onChange={(e) => setBolsaColor(e.target.value)}
                        endDecorator={
                          <Typography level="body-xs">pág</Typography>
                        }
                      />
                    </FormControl>
                  </Grid>

                  {/* D. Costos Excedentes */}
                  <Grid xs={6}>
                    <FormControl>
                      <FormLabel>Excedente B/N</FormLabel>
                      <Input
                        type="number"
                        step="0.0001"
                        value={excedenteMono}
                        onChange={(e) => setExcedenteMono(e.target.value)}
                        startDecorator="$"
                      />
                    </FormControl>
                  </Grid>
                  <Grid xs={6}>
                    <FormControl>
                      <FormLabel>Excedente Color</FormLabel>
                      <Input
                        type="number"
                        step="0.0001"
                        value={excedenteColor}
                        onChange={(e) => setExcedenteColor(e.target.value)}
                        startDecorator="$"
                      />
                    </FormControl>
                  </Grid>
                </Grid>
              </Card>
            ) : (
              <Alert color="neutral" variant="outlined">
                Este grupo servirá solo para organizar equipos por ubicación.
                <b> No tendrá facturación propia</b> (se cobrará por equipo
                individualmente).
              </Alert>
            )}

            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button variant="plain" color="neutral" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" loading={loading}>
                {grupoToEdit ? "Actualizar Grupo" : "Crear Grupo"}
              </Button>
            </Stack>
          </Stack>
        </form>
      </ModalDialog>
    </Modal>
  );
}
