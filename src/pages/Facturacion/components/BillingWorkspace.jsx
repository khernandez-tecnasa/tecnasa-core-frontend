import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  Card,
  Alert,
  CircularProgress,
  Stack,
  Chip,
} from "@mui/joy";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import SettingsIcon from "@mui/icons-material/Settings";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

// Componentes Internos
import ContratosManager from "./ContratosManager"; // Tu antigua ContratosPage convertida en componente
import ReporteView from "./ReporteView"; // Tu antigua vista de reporte extraída

import { FacturacionService } from "../../../services/FacturacionServices";
import { useToast } from "../../../context/ToastContext";

export default function BillingWorkspace({ periodoId, cliente, onBack }) {
  const [tab, setTab] = useState(0);
  const [reporte, setReporte] = useState(null);
  const [loadingReporte, setLoadingReporte] = useState(false);
  const fileInputRef = useRef(null);
  const { showToast } = useToast();

  // Cargar reporte al cambiar de cliente o periodo
  useEffect(() => {
    if (tab === 0) cargarReporte();
  }, [periodoId, cliente.id]);

  const cargarReporte = async () => {
    setLoadingReporte(true);
    setReporte(null);
    try {
      const data = await FacturacionService.getReporteMensual(
        periodoId,
        cliente.id,
      );
      setReporte(data);
    } catch (error) {
      console.log("Sin datos de lectura aun.");
    } finally {
      setLoadingReporte(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      // AQUÍ USAS TU SERVICIO REAL DE SUBIDA
      // await FacturacionService.uploadLecturas(file, periodoId, cliente.id);
      showToast("Archivo subido con éxito", "success");
      cargarReporte(); // Recargar para ver los cambios
    } catch (error) {
      showToast("Error subiendo archivo", "danger");
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      {/* Header Contextual */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="plain"
          startDecorator={<ArrowBackIcon />}
          onClick={onBack}
          sx={{ display: { md: "none" }, mb: 1 }}>
          Volver a lista
        </Button>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}>
          <Box>
            <Typography level="h2">{cliente.nombre}</Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography level="body-md" color="neutral">
                ID: {cliente.codigo}
              </Typography>
              <Chip size="sm" variant="outlined">
                Periodo #{periodoId}
              </Chip>
            </Stack>
          </Box>
          <Box>
            <input
              type="file"
              ref={fileInputRef}
              hidden
              onChange={handleUpload}
              accept=".xlsx,.xls"
            />
            <Button
              startDecorator={<UploadFileIcon />}
              size="lg"
              onClick={() => fileInputRef.current.click()}>
              Subir Lecturas
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Tabs de Navegación */}
      <Tabs
        value={tab}
        onChange={(e, v) => setTab(v)}
        sx={{ bgcolor: "transparent" }}>
        <TabList sx={{ mb: 2 }}>
          <Tab value={0}>
            <ReceiptLongIcon sx={{ mr: 1 }} /> Ciclo de Facturación
          </Tab>
          <Tab value={1}>
            <SettingsIcon sx={{ mr: 1 }} /> Contratos & Tarifas
          </Tab>
        </TabList>

        <TabPanel value={0} sx={{ p: 0 }}>
          {loadingReporte ? (
            <Box py={5} display="flex" justifyContent="center">
              <CircularProgress />
            </Box>
          ) : reporte ? (
            // Aquí va tu componente visual de reporte (Extraído de PeriodosPage)
            <ReporteView reporte={reporte} />
          ) : (
            <Card
              variant="outlined"
              sx={{ py: 8, textAlign: "center", borderStyle: "dashed" }}>
              <Typography level="h4">No hay datos procesados</Typography>
              <Typography color="neutral">
                Sube el Excel para generar el cálculo de este mes.
              </Typography>
            </Card>
          )}
        </TabPanel>

        <TabPanel value={1} sx={{ p: 0 }}>
          {/* Aquí reutilizamos la lógica de gestión de contratos */}
          <ContratosManager cliente={cliente} />
        </TabPanel>
      </Tabs>
    </Box>
  );
}
