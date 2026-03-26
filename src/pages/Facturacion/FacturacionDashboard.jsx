import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  Select,
  Option,
  Card,
  Divider,
  Table,
  Sheet,
  Chip,
  Stack,
  Grid,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  IconButton,
  Stepper,
  Step,
  StepIndicator,
  Alert,
  CircularProgress,
  Tooltip,
  Badge,
} from "@mui/joy";
// Iconos
import {
  Business,
  CalendarMonth,
  UploadFile,
  SettingsSuggest,
  CheckCircle,
  Warning,
  Edit,
  Print,
  Lock,
  History,
  ErrorOutline,
  Add,
  Visibility,
  Save,
  ReceiptLong,
} from "@mui/icons-material";

// Servicios (Asegúrate que las rutas sean correctas)
import { getClientes } from "../../services/ClientesServices";
import { FacturacionService } from "../../services/FacturacionServices";
import { generarProformaPDF } from "../../utils/ReportePDFHelper";

// Tus componentes de Modal (Ajusta rutas)
import PeriodoModal from "../../components/Facturacion/PeriodoModal";
import GrupoModal from "../../components/Facturacion/GrupoModal";
import ReemplazosModal from "../../components/Facturacion/ReemplazosModal";
import { LinearProgress } from "@mui/material";

export default function FacturacionPipeline() {
  // --- ESTADOS DE CONTEXTO ---
  const [clientes, setClientes] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [selectedClienteId, setSelectedClienteId] = useState(null);
  const [selectedPeriodo, setSelectedPeriodo] = useState(null);

  // --- ESTADOS DE OPERACIÓN ---
  const [loading, setLoading] = useState(false);
  const [contratos, setContratos] = useState([]);
  const [reporte, setReporte] = useState(null);
  const [activeTab, setActiveTab] = useState(0); // 0: Carga, 1: Config, 2: Revisión

  // --- ESTADOS DE VALIDACIÓN (Ingeniería) ---
  const [excelErrors, setExcelErrors] = useState([]); // Ejemplo: [{fila: 5, serie: 'XYZ', error: 'No existe en contrato'}]
  const fileInputRef = useRef(null);

  // --- MODALES ---
  const [openPeriodo, setOpenPeriodo] = useState(false);
  const [openGrupo, setOpenGrupo] = useState(false);
  const [targetContratoId, setTargetContratoId] = useState(null);

  // 1. CARGA INICIAL
  useEffect(() => {
    const init = async () => {
      const [cData, pData] = await Promise.all([
        getClientes(),
        FacturacionService.getPeriodos(),
      ]);
      setClientes(cData || []);
      setPeriodos(pData || []);
      if (pData?.length > 0) setSelectedPeriodo(pData[0]);
    };
    init();
  }, []);

  // 2. CARGA DE DATOS POR CLIENTE/PERIODO
  useEffect(() => {
    if (selectedClienteId && selectedPeriodo) {
      fetchData();
    }
  }, [selectedClienteId, selectedPeriodo]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const contratosData =
        await FacturacionService.getContratosByCliente(selectedClienteId);
      setContratos(contratosData);

      const rData = await FacturacionService.getReporteMensual(
        selectedPeriodo.id,
        selectedClienteId,
      );
      setReporte(rData);

      // Ajustar tab automáticamente según estado
      if (selectedPeriodo.estado === "Nuevo") setActiveTab(0);
      else if (selectedPeriodo.estado === "Abierto") setActiveTab(1);
      else setActiveTab(2);
    } catch (err) {
      setReporte(null);
      setActiveTab(0);
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DE CARGA (INGENIERÍA) ---
  const handleFileProcess = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Simulación de validación (Aquí llamarías a tu API de validación)
    setLoading(true);
    setTimeout(() => {
      setExcelErrors([
        { fila: 12, serie: "MXQ123", msg: "Serie no asignada a este cliente" },
        { fila: 45, serie: "MXQ999", msg: "Lectura menor a la anterior" },
      ]);
      setLoading(false);
    }, 1000);
  };

  const formatMoney = (v) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(v || 0);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1650, mx: "auto" }}>
      <input
        type="file"
        ref={fileInputRef}
        hidden
        onChange={handleFileProcess}
      />

      {/* --- SECCIÓN 1: SELECTOR DE CLIENTE Y ESTADO GLOBAL --- */}
      <Card variant="outlined" sx={{ mb: 3, p: 2, boxShadow: "sm" }}>
        <Grid container spacing={2} alignItems="center">
          <Grid xs={12} md={4}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  p: 1,
                  bgcolor: "primary.100",
                  borderRadius: "md",
                  display: "flex",
                }}>
                <Business color="primary" />
              </Box>
              <Select
                placeholder="Seleccione Cliente..."
                value={selectedClienteId}
                onChange={(e, v) => setSelectedClienteId(v)}
                sx={{ flex: 1 }}>
                {clientes.map((c) => (
                  <Option key={c.id} value={c.id}>
                    {c.nombre || c.nombre_cliente}
                  </Option>
                ))}
              </Select>
            </Stack>
          </Grid>

          <Grid xs={12} md={8}>
            <Stepper sx={{ width: "100%" }}>
              <Step
                completed={selectedPeriodo?.estado !== "Nuevo"}
                indicator={
                  <StepIndicator variant="solid">
                    <UploadFile />
                  </StepIndicator>
                }>
                <Typography level="title-sm">Carga</Typography>
              </Step>
              <Step
                active={selectedPeriodo?.estado === "Abierto"}
                indicator={
                  <StepIndicator variant="solid">
                    <SettingsSuggest />
                  </StepIndicator>
                }>
                <Typography level="title-sm">Tarifas</Typography>
              </Step>
              <Step
                indicator={
                  <StepIndicator variant="solid">
                    <CheckCircle />
                  </StepIndicator>
                }>
                <Typography level="title-sm">Cierre</Typography>
              </Step>
            </Stepper>
          </Grid>
        </Grid>
      </Card>

      {!selectedClienteId ? (
        <Box sx={{ textAlign: "center", py: 10, opacity: 0.5 }}>
          <Visibility sx={{ fontSize: 100, mb: 2 }} />
          <Typography level="h3">
            Seleccione un cliente para visualizar el historial
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {/* --- COLUMNA IZQUIERDA: PERIODOS --- */}
          <Grid xs={12} md={2.5}>
            <Typography level="title-md" sx={{ mb: 1, px: 1 }}>
              Ciclos de Facturación
            </Typography>
            <Sheet
              variant="outlined"
              sx={{ borderRadius: "md", p: 1, bgcolor: "background.level1" }}>
              <Stack spacing={1}>
                {periodos.map((p) => (
                  <Button
                    key={p.id}
                    variant={selectedPeriodo?.id === p.id ? "solid" : "plain"}
                    color={selectedPeriodo?.id === p.id ? "primary" : "neutral"}
                    onClick={() => setSelectedPeriodo(p)}
                    sx={{ justifyContent: "space-between", textAlign: "left" }}>
                    <Box>
                      <Typography level="title-sm" color="inherit">
                        {p.nombre}
                      </Typography>
                      <Typography level="body-xs" sx={{ opacity: 0.7 }}>
                        {p.anio}
                      </Typography>
                    </Box>
                    <Chip
                      size="sm"
                      color={p.estado === "Cerrado" ? "neutral" : "warning"}>
                      {p.estado}
                    </Chip>
                  </Button>
                ))}
                <Divider />
                <Button
                  startDecorator={<Add />}
                  variant="soft"
                  onClick={() => setOpenPeriodo(true)}>
                  Nuevo Mes
                </Button>
              </Stack>
            </Sheet>
          </Grid>

          {/* --- COLUMNA DERECHA: ESPACIO DE TRABAJO --- */}
          <Grid xs={12} md={9.5}>
            <Sheet
              variant="outlined"
              sx={{
                borderRadius: "md",
                minHeight: "70vh",
                display: "flex",
                flexDirection: "column",
              }}>
              <Tabs
                value={activeTab}
                onChange={(e, v) => setActiveTab(v)}
                sx={{ bgcolor: "transparent" }}>
                <TabList
                  variant="plain"
                  sx={{
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    px: 2,
                  }}>
                  <Tab value={0} startDecorator={<UploadFile />}>
                    Ingeniería (Lecturas)
                  </Tab>
                  <Tab value={1} startDecorator={<SettingsSuggest />}>
                    Finanzas (Estructura)
                  </Tab>
                  <Tab value={2} startDecorator={<ReceiptLong />}>
                    Gerencia (Proforma)
                  </Tab>
                </TabList>

                {loading ? (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      py: 10,
                      gap: 2,
                    }}>
                    <CircularProgress size="lg" />
                    <Typography level="body-sm">
                      Cargando datos del ciclo...
                    </Typography>
                  </Box>
                ) : (
                  <>
                    {/* TAB 1: INGENIERÍA - CARGA Y VALIDACIÓN */}
                    <TabPanel value={0} sx={{ p: 3 }}>
                      <Grid container spacing={3}>
                        <Grid xs={12} md={excelErrors.length > 0 ? 8 : 12}>
                          <Box
                            onClick={() => fileInputRef.current.click()}
                            sx={{
                              border: "2px dashed",
                              borderColor: "primary.outlinedBorder",
                              p: 6,
                              borderRadius: "lg",
                              textAlign: "center",
                              cursor: "pointer",
                              "&:hover": { bgcolor: "primary.50" },
                              transition: "0.2s",
                            }}>
                            <UploadFile
                              sx={{ fontSize: 60, color: "primary.400", mb: 2 }}
                            />
                            <Typography level="h4">
                              Actualizar Lecturas del Mes
                            </Typography>
                            <Typography level="body-sm">
                              Haz clic o arrastra el archivo Excel proporcionado
                              por los ingenieros.
                            </Typography>
                          </Box>
                        </Grid>

                        {excelErrors.length > 0 && (
                          <Grid xs={12} md={4}>
                            <Alert
                              color="danger"
                              variant="soft"
                              startDecorator={<ErrorOutline />}
                              sx={{ alignItems: "flex-start" }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography level="title-sm">
                                  Errores Detectados
                                </Typography>
                                <Typography level="body-xs" sx={{ mb: 2 }}>
                                  El archivo tiene inconsistencias que deben
                                  corregirse:
                                </Typography>
                                <Stack spacing={1}>
                                  {excelErrors.map((err, i) => (
                                    <Box
                                      key={i}
                                      sx={{
                                        p: 1,
                                        bgcolor: "background.surface",
                                        borderRadius: "xs",
                                        border: "1px solid",
                                        borderColor: "danger.200",
                                      }}>
                                      <Typography level="body-xs">
                                        <b>Fila {err.fila}:</b> {err.msg} (
                                        {err.serie})
                                      </Typography>
                                    </Box>
                                  ))}
                                </Stack>
                              </Box>
                            </Alert>
                          </Grid>
                        )}
                      </Grid>
                    </TabPanel>

                    {/* TAB 2: FINANZAS - GESTIÓN DE TARIFAS Y CONTRATOS */}
                    <TabPanel value={1} sx={{ p: 3 }}>
                      <Stack spacing={3}>
                        {contratos.map((c) => (
                          <Card key={c.id} variant="outlined" sx={{ p: 0 }}>
                            <Box
                              sx={{
                                p: 2,
                                bgcolor: "background.level1",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}>
                              <Box>
                                <Typography
                                  level="title-md"
                                  startDecorator={
                                    <ReceiptLong color="primary" />
                                  }>
                                  {c.nombre}
                                </Typography>
                                <Typography level="body-xs">
                                  ID Contrato: {c.id} | Equipos:{" "}
                                  {c.total_impresoras}
                                </Typography>
                              </Box>
                              <Stack direction="row" spacing={1}>
                                <Button
                                  size="sm"
                                  variant="soft"
                                  startDecorator={<Add />}
                                  onClick={() => {
                                    setTargetContratoId(c.id);
                                    setOpenGrupo(true);
                                  }}>
                                  Nuevo Grupo
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outlined"
                                  onClick={() =>
                                    window.open(
                                      `/admin/facturacion/contratos/${c.id}`,
                                    )
                                  }>
                                  Configuración Técnica
                                </Button>
                              </Stack>
                            </Box>

                            <Table
                              size="sm"
                              hoverRow
                              sx={{ "--TableCell-paddingX": "16px" }}>
                              <thead>
                                <tr>
                                  <th>Serie / Modelo</th>
                                  <th>Asignación / Grupo</th>
                                  <th>Renta Unit.</th>
                                  <th>Clic Mono</th>
                                  <th style={{ textAlign: "right" }}>Acción</th>
                                </tr>
                              </thead>
                              <tbody>
                                {/* Aquí podrías listar equipos críticos o un resumen de grupos */}
                                {c.grupos?.map((g) => (
                                  <tr key={g.id}>
                                    <td>
                                      <Typography
                                        level="body-sm"
                                        fontWeight="bold">
                                        GRUPO: {g.nombre}
                                      </Typography>
                                    </td>
                                    <td>
                                      <Chip
                                        size="sm"
                                        variant="soft"
                                        color={
                                          g.es_bolson ? "primary" : "neutral"
                                        }>
                                        {g.es_bolson ? "BOLSA" : "LÓGICO"}
                                      </Chip>
                                    </td>
                                    <td>-</td>
                                    <td>
                                      {g.es_bolson ? g.bolsa_mono : "N/A"}
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                      <IconButton
                                        size="sm"
                                        onClick={() => {
                                          setTargetContratoId(c.id);
                                          setOpenGrupo(true);
                                        }}>
                                        <Edit fontSize="small" />
                                      </IconButton>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </Card>
                        ))}
                      </Stack>
                    </TabPanel>

                    {/* TAB 3: GERENCIA - REVISIÓN FINAL Y CIERRE */}
                    <TabPanel value={2} sx={{ p: 3 }}>
                      {!reporte ? (
                        <Alert color="warning">
                          Debe cargar lecturas en la pestaña de Ingeniería antes
                          de ver el reporte.
                        </Alert>
                      ) : (
                        <Grid container spacing={3}>
                          <Grid xs={12} md={8}>
                            <Typography level="title-lg" sx={{ mb: 2 }}>
                              Previsualización de Proforma
                            </Typography>
                            <Sheet
                              variant="outlined"
                              sx={{
                                p: 4,
                                bgcolor: "#fdfdfd",
                                minHeight: "600px",
                                boxShadow: "sm",
                              }}>
                              <Typography
                                textAlign="center"
                                level="h3"
                                sx={{ textTransform: "uppercase", mb: 4 }}>
                                Reporte de Servicios de Impresión
                              </Typography>
                              {reporte.detalles.map((det, i) => (
                                <Box key={i} sx={{ mb: 4 }}>
                                  <Typography
                                    level="title-md"
                                    color="primary"
                                    sx={{
                                      mb: 1,
                                      borderBottom: "2px solid",
                                      borderColor: "primary.100",
                                    }}>
                                    {det.contrato}
                                  </Typography>
                                  <Table size="sm" plain sx={{ mb: 2 }}>
                                    <thead>
                                      <tr>
                                        <th>Descripción</th>
                                        <th style={{ textAlign: "right" }}>
                                          Subtotal
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {det.items_individuales.length > 0 && (
                                        <tr>
                                          <td>Equipos Individuales</td>
                                          <td style={{ textAlign: "right" }}>
                                            {formatMoney(
                                              det.subtotal_items || 0,
                                            )}
                                          </td>
                                        </tr>
                                      )}
                                      {det.grupos_bolsones.map((gb, j) => (
                                        <tr key={j}>
                                          <td>
                                            Grupo: {gb.nombre_grupo}{" "}
                                            (Excedentes)
                                          </td>
                                          <td style={{ textAlign: "right" }}>
                                            {formatMoney(gb.total_pagar)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </Table>
                                </Box>
                              ))}
                            </Sheet>
                          </Grid>

                          <Grid xs={12} md={4}>
                            <Stack spacing={2}>
                              <Card
                                variant="solid"
                                color="primary"
                                invertedColors>
                                <Typography level="title-md">
                                  Resumen del Periodo
                                </Typography>
                                <Typography level="h2">
                                  {formatMoney(reporte.gran_total)}
                                </Typography>
                                <Divider sx={{ my: 2 }} />
                                <Stack spacing={1}>
                                  <Button
                                    variant="solid"
                                    color="success"
                                    size="lg"
                                    startDecorator={<Lock />}>
                                    Aprobar y Cerrar Mes
                                  </Button>
                                  <Button
                                    variant="soft"
                                    startDecorator={<Print />}
                                    onClick={() =>
                                      generarProformaPDF(reporte, "Cliente")
                                    }>
                                    Exportar PDF
                                  </Button>
                                  <Button
                                    variant="plain"
                                    startDecorator={<History />}>
                                    Regresar a Revisión
                                  </Button>
                                </Stack>
                              </Card>

                              <Card variant="outlined">
                                <Typography
                                  level="title-sm"
                                  startDecorator={<Warning color="warning" />}>
                                  Pendientes
                                </Typography>
                                <Typography level="body-xs">
                                  No se pueden cerrar meses si existen lecturas
                                  negativas o seriales duplicados en la base de
                                  datos.
                                </Typography>
                              </Card>
                            </Stack>
                          </Grid>
                        </Grid>
                      )}
                    </TabPanel>
                  </>
                )}
              </Tabs>
            </Sheet>
          </Grid>
        </Grid>
      )}

      {/* --- MODALES --- */}
      <PeriodoModal open={openPeriodo} onClose={() => setOpenPeriodo(false)} />
      <GrupoModal
        open={openGrupo}
        onClose={() => setOpenGrupo(false)}
        contratoId={targetContratoId}
        onSuccess={fetchData}
      />
    </Box>
  );
}
