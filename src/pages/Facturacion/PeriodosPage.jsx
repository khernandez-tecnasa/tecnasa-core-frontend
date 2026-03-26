import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  Select,
  Option,
  Card,
  CardContent,
  Divider,
  Table,
  Sheet,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  Grid,
  IconButton,
  Stepper,
  Step,
  StepIndicator,
  stepClasses,
  Modal,
  ModalDialog,
  DialogTitle,
  DialogContent,
} from "@mui/joy";

// --- ICONOS ---
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import PrintIcon from "@mui/icons-material/Print";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ConstructionIcon from "@mui/icons-material/Construction";
import SettingsIcon from "@mui/icons-material/Settings";
import PieChartIcon from "@mui/icons-material/PieChart";
import EditIcon from "@mui/icons-material/Edit";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import RefreshIcon from "@mui/icons-material/Refresh";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SendIcon from "@mui/icons-material/Send";
import LockIcon from "@mui/icons-material/Lock";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import AddIcon from "@mui/icons-material/Add";
import FiberNewIcon from "@mui/icons-material/FiberNew"; // Icono para estado 'Nuevo'

// --- SERVICIOS Y HELPERS ---
import { getClientes } from "../../services/ClientesServices";
import { FacturacionService } from "../../services/FacturacionServices";
import { generarProformaPDF } from "../../utils/ReportePDFHelper";

// --- MODALES ---
import ReemplazosModal from "../../components/Facturacion/ReemplazosModal";
import GrupoModal from "../../components/Facturacion/GrupoModal";
import PeriodoModal from "../../components/Facturacion/PeriodoModal";

export default function FacturacionManagerPage() {
  // =================================================
  // 1. ESTADOS GLOBALES
  // =================================================
  const [periodos, setPeriodos] = useState([]);
  const [clientes, setClientes] = useState([]);

  const [selectedPeriodo, setSelectedPeriodo] = useState(null);
  const [selectedCliente, setSelectedCliente] = useState(null);

  // 🟢 INICIO EN TAB 2 (CICLO DE FACTURACIÓN)
  const [activeTab, setActiveTab] = useState(2);

  // =================================================
  // 2. ESTADOS POR PESTAÑA
  // =================================================

  // Tab 0: Reporte
  const [reporte, setReporte] = useState(null);
  const [loadingReporte, setLoadingReporte] = useState(false);
  const [errorReporte, setErrorReporte] = useState(null);

  // Tab 1: Configuración (Estructura)
  const [contratosConfig, setContratosConfig] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(false);

  // Tab 2: Ciclo (Periodos)
  const [loadingPeriodos, setLoadingPeriodos] = useState(false);
  const [openPeriodoModal, setOpenPeriodoModal] = useState(false);

  // Upload Logic
  const fileInputRef = useRef(null);
  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [clienteParaSubir, setClienteParaSubir] = useState(null);
  const [periodoParaSubir, setPeriodoParaSubir] = useState(null);

  // Modales Extra
  const [openReemplazos, setOpenReemplazos] = useState(false);
  const [itemsModal, setItemsModal] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const [openGrupoModal, setOpenGrupoModal] = useState(false);
  const [grupoToEdit, setGrupoToEdit] = useState(null);
  const [selectedContratoIdForGroup, setSelectedContratoIdForGroup] =
    useState(null);

  // =================================================
  // 3. EFECTOS DE CARGA
  // =================================================

  useEffect(() => {
    loadGlobalFilters();
  }, []);

  // Inteligencia del Modal Upload: Si hay un cliente global seleccionado, úsalo.
  useEffect(() => {
    if (openUploadModal && selectedCliente) {
      setClienteParaSubir(selectedCliente);
    } else if (openUploadModal && !selectedCliente) {
      setClienteParaSubir(null);
    }
  }, [openUploadModal, selectedCliente]);

  // Carga de Configuración automática al cambiar de cliente (si estamos en Tab 1)
  useEffect(() => {
    if (selectedCliente && activeTab === 1) {
      cargarConfiguracionCliente();
    }
    // Limpiar reporte visual al cambiar filtros para evitar datos cruzados
    if (activeTab === 0) {
      setReporte(null);
    }
  }, [selectedCliente, selectedPeriodo, activeTab]);

  const loadGlobalFilters = async () => {
    try {
      const [periodosData, clientesData] = await Promise.all([
        FacturacionService.getPeriodos(),
        getClientes(),
      ]);
      setPeriodos(periodosData || []);
      setClientes(clientesData || []);

      // Auto-seleccionar el periodo activo más reciente si no hay selección
      if (periodosData && periodosData.length > 0 && !selectedPeriodo) {
        const activo = periodosData.find(
          (p) => p.estado === "Abierto" || p.estado === "Nuevo",
        );
        if (activo) setSelectedPeriodo(activo.id);
      }
    } catch (err) {
      console.error("Error cargando filtros:", err);
    }
  };

  // =================================================
  // 4. LÓGICA DE NEGOCIO
  // =================================================

  // --- TAB REPORTE ---
  const handleConsultarReporte = async () => {
    if (!selectedPeriodo || !selectedCliente) return;
    setLoadingReporte(true);
    setErrorReporte(null);
    try {
      const data = await FacturacionService.getReporteMensual(
        selectedPeriodo,
        selectedCliente,
      );
      setReporte(data);
    } catch (err) {
      console.error(err);
      setErrorReporte(
        "No hay datos procesados. Sube lecturas en la pestaña 'Ciclo' primero.",
      );
      setReporte(null);
    } finally {
      setLoadingReporte(false);
    }
  };

  const handleAbrirReemplazos = async () => {
    if (!selectedCliente) return;
    setLoadingItems(true);
    try {
      const contratos =
        await FacturacionService.getContratosByCliente(selectedCliente);
      let allItems = [];
      for (const c of contratos) {
        const items = await FacturacionService.getItemsByContrato(c.id);
        const itemsConNombre = items.map((i) => ({
          ...i,
          nombre_contrato: c.nombre,
        }));
        allItems = [...allItems, ...itemsConNombre];
      }
      setItemsModal(allItems);
      setOpenReemplazos(true);
    } catch (error) {
      alert("Error cargando equipos.");
    } finally {
      setLoadingItems(false);
    }
  };

  // --- TAB CONFIGURACIÓN ---
  const cargarConfiguracionCliente = async () => {
    if (!selectedCliente) return;
    setLoadingConfig(true);
    try {
      const contratos =
        await FacturacionService.getContratosByCliente(selectedCliente);
      const contratosFull = await Promise.all(
        contratos.map(async (c) => {
          const grupos = await FacturacionService.getGruposByContrato(c.id);
          return { ...c, grupos: grupos || [] };
        }),
      );
      setContratosConfig(contratosFull);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleEditGrupo = (grupo, contratoId) => {
    setGrupoToEdit(grupo);
    setSelectedContratoIdForGroup(contratoId);
    setOpenGrupoModal(true);
  };

  const handleNewGrupo = (contratoId) => {
    setGrupoToEdit(null);
    setSelectedContratoIdForGroup(contratoId);
    setOpenGrupoModal(true);
  };

  // --- TAB CICLO / PERIODOS ---
  const handleChangeEstadoPeriodo = async (periodoId, nuevoEstado) => {
    if (!window.confirm(`¿Confirmas cambiar el estado a: ${nuevoEstado}?`))
      return;
    setLoadingPeriodos(true);
    try {
      await FacturacionService.changeEstadoPeriodo(periodoId, nuevoEstado);
      await loadGlobalFilters();
    } catch (error) {
      alert("Error actualizando estado.");
    } finally {
      setLoadingPeriodos(false);
    }
  };

  const handleStartUpload = (periodoId) => {
    setPeriodoParaSubir(periodoId);
    setOpenUploadModal(true);
  };

  const handleConfirmUpload = () => {
    if (!clienteParaSubir) return;
    setOpenUploadModal(false);

    // Sincronizar selección global si es diferente
    if (clienteParaSubir !== selectedCliente) {
      setSelectedCliente(clienteParaSubir);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset input
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Lógica Real (Descomentar):
      // await FacturacionService.uploadLecturas(file, periodoParaSubir, clienteParaSubir);

      alert(`Simulación: Archivo ${file.name} subido correctamente.`);

      // Refrescar periodo (para ver si cambió de Nuevo a Abierto)
      await loadGlobalFilters();

      // 🟢 UX: Llevar al usuario a ver el resultado inmediatamente
      setActiveTab(0);
      // Y generamos el reporte automáticamente
      if (clienteParaSubir && periodoParaSubir) {
        // Pequeño timeout para asegurar que el estado se actualizó
        setTimeout(() => handleConsultarReporte(), 500);
      }
    } catch (error) {
      console.error(error);
      alert("Error subiendo archivo.");
    }
  };

  // Helpers
  const formatMoney = (amount) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  const nombreClientePDF =
    clientes.find((c) => c.id === selectedCliente)?.nombre || "Cliente";

  const periodoTexto =
    periodos.find((p) => p.id === selectedPeriodo)?.nombre || "Periodo Actual";

  const getStepStatus = (estadoActual) => {
    const pasos = ["Nuevo", "Abierto", "En Revision", "Aprobado", "Cerrado"];
    const idxActual = pasos.indexOf(estadoActual);
    return { pasos, idxActual };
  };

  const isUploadBlocked = (estado) =>
    ["En Revision", "Aprobado", "Cerrado"].includes(estado);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1600, mx: "auto" }}>
      {/* INPUT OCULTO */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
        accept=".xlsx, .xls"
      />

      {/* HEADER */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          gap: 2,
        }}>
        <Box>
          <Typography level="h2">Centro de Facturación</Typography>
          <Typography level="body-md" color="neutral">
            Plataforma de gestión de ciclos y cobros.
          </Typography>
        </Box>
        <Sheet
          variant="outlined"
          sx={{
            p: 1,
            borderRadius: "lg",
            display: "flex",
            gap: 2,
            bgcolor: "background.surface",
          }}>
          <Select
            placeholder="Cliente..."
            value={selectedCliente}
            onChange={(e, v) => setSelectedCliente(v)}
            sx={{ minWidth: 220 }}>
            {clientes.map((c) => (
              <Option key={c.id} value={c.id}>
                {c.nombre || c.nombre_cliente}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="Periodo..."
            value={selectedPeriodo}
            onChange={(e, v) => setSelectedPeriodo(v)}
            sx={{ minWidth: 160 }}>
            {periodos.map((p) => (
              <Option key={p.id} value={p.id}>
                {p.nombre}
              </Option>
            ))}
          </Select>
        </Sheet>
      </Box>

      {/* TABS */}
      <Tabs
        value={activeTab}
        onChange={(e, v) => setActiveTab(v)}
        sx={{ bgcolor: "transparent" }}>
        <TabList
          tabFlex={1}
          sx={{
            maxWidth: 600,
            mb: 3,
            borderRadius: "md",
            bgcolor: "background.level1",
            p: 0.5,
          }}>
          <Tab value={0} disabled={!selectedCliente || !selectedPeriodo}>
            <ReceiptLongIcon sx={{ mr: 1 }} /> Reporte
          </Tab>
          <Tab value={1} disabled={!selectedCliente}>
            <SettingsIcon sx={{ mr: 1 }} /> Estructura
          </Tab>
          <Tab value={2}>
            <CalendarMonthIcon sx={{ mr: 1 }} /> Ciclo (Inicio)
          </Tab>
        </TabList>

        {/* --- TAB 0: REPORTE --- */}
        <TabPanel value={0} sx={{ p: 0 }}>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <Button
              startDecorator={<RequestQuoteIcon />}
              onClick={handleConsultarReporte}
              loading={loadingReporte}>
              Generar Reporte
            </Button>
          </Box>

          {errorReporte && (
            <Alert color="danger" sx={{ mb: 2 }}>
              {errorReporte}
            </Alert>
          )}

          {!reporte && !loadingReporte && (
            <Box
              sx={{
                textAlign: "center",
                py: 8,
                border: "2px dashed",
                borderColor: "neutral.outlinedBorder",
                borderRadius: "lg",
                opacity: 0.6,
              }}>
              <PieChartIcon sx={{ fontSize: 60, mb: 2 }} />
              <Typography level="h4">Sin Reporte Generado</Typography>
              <Typography>
                Sube lecturas en la pestaña "Ciclo" o pulsa Generar si ya
                existen.
              </Typography>
            </Box>
          )}

          {loadingReporte && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
              <CircularProgress size="lg" />
            </Box>
          )}

          {reporte && (
            <Grid
              container
              spacing={3}
              sx={{ animation: "fadeIn 0.3s ease-out" }}>
              {/* Resumen */}
              <Grid xs={12} lg={4}>
                <Card
                  variant="solid"
                  color="primary"
                  invertedColors
                  sx={{ mb: 2, boxShadow: "lg" }}>
                  <CardContent>
                    <Typography level="body-md">Total a Facturar</Typography>
                    <Typography level="h1" sx={{ fontSize: "3rem" }}>
                      {formatMoney(reporte.gran_total)}
                    </Typography>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      sx={{ mt: 2, opacity: 0.9 }}>
                      <Typography level="body-sm">Subtotal:</Typography>
                      <Typography level="body-sm" fontWeight="lg">
                        {formatMoney(reporte.subtotal_general)}
                      </Typography>
                    </Stack>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      sx={{ opacity: 0.9 }}>
                      <Typography level="body-sm">ISV:</Typography>
                      <Typography level="body-sm" fontWeight="lg">
                        {formatMoney(reporte.isv_total)}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
                <Stack spacing={2}>
                  <Button
                    variant="soft"
                    color="warning"
                    size="lg"
                    startDecorator={<ConstructionIcon />}
                    onClick={handleAbrirReemplazos}
                    sx={{ width: "100%" }}>
                    Gestionar Reemplazos / Bajas
                  </Button>
                  <Button
                    variant="outlined"
                    color="neutral"
                    size="lg"
                    startDecorator={<PrintIcon />}
                    onClick={() =>
                      generarProformaPDF(reporte, nombreClientePDF)
                    }
                    sx={{ width: "100%" }}>
                    Descargar PDF
                  </Button>
                </Stack>
              </Grid>

              {/* Detalles */}
              <Grid xs={12} lg={8}>
                {reporte.detalles.map((contratoData, idx) => (
                  <Sheet
                    key={idx}
                    variant="outlined"
                    sx={{ mb: 3, borderRadius: "md", overflow: "hidden" }}>
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: "background.level1",
                        borderBottom: "1px solid",
                        borderColor: "divider",
                      }}>
                      <Typography
                        level="title-lg"
                        startDecorator={<ReceiptLongIcon color="primary" />}>
                        {contratoData.contrato}
                      </Typography>
                    </Box>
                    <Box sx={{ p: 2 }}>
                      {/* Items Individuales */}
                      {contratoData.items_individuales.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                          <Typography
                            level="title-sm"
                            color="neutral"
                            sx={{
                              mb: 1,
                              fontSize: "0.75rem",
                              letterSpacing: "1px",
                            }}>
                            COBRO INDIVIDUAL
                          </Typography>
                          <Table size="sm" hoverRow>
                            <thead>
                              <tr>
                                <th>Equipo</th>
                                <th>Lectura</th>
                                <th style={{ textAlign: "right" }}>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {contratoData.items_individuales.map(
                                (item, i) => (
                                  <tr key={i}>
                                    <td>
                                      <Typography fontWeight="md">
                                        {item.modelo}
                                      </Typography>
                                      <Typography level="body-xs">
                                        {item.serial}
                                      </Typography>
                                    </td>
                                    <td>
                                      <Typography level="body-xs">
                                        M: {item.uso_mono} | C: {item.uso_color}
                                      </Typography>
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                      {formatMoney(item.total_pagar)}
                                    </td>
                                  </tr>
                                ),
                              )}
                            </tbody>
                          </Table>
                        </Box>
                      )}
                      {/* Grupos */}
                      {contratoData.grupos_bolsones.length > 0 && (
                        <Box>
                          <Typography
                            level="title-sm"
                            color="neutral"
                            sx={{
                              mb: 1,
                              fontSize: "0.75rem",
                              letterSpacing: "1px",
                            }}>
                            GRUPOS Y BOLSONES
                          </Typography>
                          <Stack spacing={1}>
                            {contratoData.grupos_bolsones.map((grupo, g) => (
                              <Card
                                key={g}
                                variant="soft"
                                orientation="horizontal"
                                sx={{ alignItems: "center", p: 1.5 }}>
                                <Box sx={{ flex: 1 }}>
                                  <Typography level="title-sm">
                                    {grupo.nombre_grupo}
                                  </Typography>
                                  <Typography level="body-xs">
                                    {grupo.frecuencia === "ANUAL"
                                      ? "Cierre Anual"
                                      : "Mensual"}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: "flex", gap: 3, mr: 2 }}>
                                  <Box>
                                    <Typography level="body-xs">
                                      Bolsa M
                                    </Typography>
                                    <Typography
                                      level="body-sm"
                                      fontWeight="bold">
                                      {grupo.bolsa_mono}
                                    </Typography>
                                  </Box>
                                  <Box>
                                    <Typography level="body-xs">
                                      Excedente
                                    </Typography>
                                    <Typography
                                      level="body-sm"
                                      color={
                                        grupo.excedente_mono > 0
                                          ? "danger"
                                          : "neutral"
                                      }>
                                      {grupo.excedente_mono}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Typography level="title-md" color="primary">
                                  {formatMoney(grupo.total_pagar)}
                                </Typography>
                              </Card>
                            ))}
                          </Stack>
                        </Box>
                      )}
                    </Box>
                    <Box
                      sx={{
                        p: 1,
                        bgcolor: "background.level1",
                        borderTop: "1px solid",
                        textAlign: "right",
                      }}>
                      <Typography level="body-sm">
                        Subtotal:{" "}
                        <b>{formatMoney(contratoData.subtotal_contrato)}</b>
                      </Typography>
                    </Box>
                  </Sheet>
                ))}
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* --- TAB 1: CONFIGURACIÓN --- */}
        <TabPanel value={1} sx={{ p: 0 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}>
            <Typography level="h4">Estructura del Cliente</Typography>
            <Button
              size="sm"
              variant="plain"
              startDecorator={<RefreshIcon />}
              onClick={cargarConfiguracionCliente}>
              Recargar
            </Button>
          </Box>

          {loadingConfig ? (
            <CircularProgress />
          ) : contratosConfig.length === 0 ? (
            <Alert color="neutral">Sin contratos activos.</Alert>
          ) : (
            <Grid container spacing={2}>
              {contratosConfig.map((contrato) => (
                <Grid xs={12} key={contrato.id}>
                  <Sheet variant="outlined" sx={{ p: 3, borderRadius: "md" }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 2,
                      }}>
                      <Typography
                        level="title-lg"
                        startDecorator={<ReceiptLongIcon color="primary" />}>
                        {contrato.nombre}
                      </Typography>
                      <Button
                        size="sm"
                        startDecorator={<SettingsIcon />}
                        onClick={() => handleNewGrupo(contrato.id)}>
                        Nuevo Grupo
                      </Button>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    {contrato.grupos.length === 0 ? (
                      <Typography
                        level="body-sm"
                        fontStyle="italic"
                        color="neutral">
                        Sin grupos (Individual)
                      </Typography>
                    ) : (
                      <Grid container spacing={2}>
                        {contrato.grupos.map((grupo) => (
                          <Grid xs={12} sm={6} md={4} key={grupo.id}>
                            <Card variant="soft" size="sm">
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "flex-start",
                                }}>
                                <Box>
                                  <Typography
                                    level="title-sm"
                                    startDecorator={<FolderOpenIcon />}>
                                    {grupo.nombre}
                                  </Typography>
                                  <Typography level="body-xs">
                                    {grupo.es_bolson
                                      ? `Bolsón (${grupo.frecuencia_excedentes})`
                                      : "Lógico"}
                                  </Typography>
                                </Box>
                                <IconButton
                                  size="sm"
                                  onClick={() =>
                                    handleEditGrupo(grupo, contrato.id)
                                  }>
                                  <EditIcon />
                                </IconButton>
                              </Box>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </Sheet>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* --- TAB 2: CICLO (PERIODOS) --- */}
        <TabPanel value={2} sx={{ p: 0 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}>
            <Box>
              <Typography level="h4">Gestión de Periodos</Typography>
              <Typography level="body-sm">
                Carga lecturas y cambia estados.
              </Typography>
            </Box>
            <Button
              startDecorator={<AddIcon />}
              onClick={() => setOpenPeriodoModal(true)}>
              Nuevo Mes
            </Button>
          </Box>

          <Grid container spacing={3}>
            {periodos.map((periodo) => {
              const { pasos, idxActual } = getStepStatus(periodo.estado);
              const isActive = periodo.id === selectedPeriodo;
              const uploadBlocked = isUploadBlocked(periodo.estado);
              const canSendRevision = periodo.estado === "Abierto"; // Requiere datos subidos

              return (
                <Grid xs={12} key={periodo.id}>
                  <Card
                    variant={isActive ? "solid" : "outlined"}
                    color={isActive ? "primary" : "neutral"}
                    invertedColors={isActive}
                    sx={{
                      boxShadow: isActive ? "lg" : "sm",
                      transition: "0.2s",
                    }}>
                    <CardContent>
                      <Stack
                        direction={{ xs: "column", lg: "row" }}
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={3}>
                        <Box
                          sx={{
                            minWidth: 200,
                            textAlign: { xs: "center", lg: "left" },
                          }}>
                          <Typography level="h3">{periodo.nombre}</Typography>
                          <Typography level="body-sm">
                            Mes: {periodo.mes} / {periodo.anio}
                          </Typography>
                          {isActive && (
                            <Chip size="sm" variant="soft" sx={{ mt: 1 }}>
                              Seleccionado
                            </Chip>
                          )}
                        </Box>

                        <Box sx={{ flex: 1, width: "100%", px: 2 }}>
                          <Stepper sx={{ "--StepIndicator-size": "32px" }}>
                            {pasos.map((paso, index) => {
                              const completed = index <= idxActual;
                              const current = index === idxActual;
                              return (
                                <Step
                                  key={paso}
                                  completed={completed}
                                  active={current}
                                  indicator={
                                    <StepIndicator
                                      variant={completed ? "solid" : "outlined"}
                                      color={completed ? "success" : "neutral"}>
                                      {completed ? (
                                        <CheckCircleIcon />
                                      ) : paso === "Nuevo" ? (
                                        <FiberNewIcon />
                                      ) : (
                                        index + 1
                                      )}
                                    </StepIndicator>
                                  }>
                                  <Typography
                                    level="body-xs"
                                    fontWeight={current ? "bold" : "normal"}>
                                    {paso}
                                  </Typography>
                                </Step>
                              );
                            })}
                          </Stepper>
                        </Box>

                        <Stack
                          direction="column"
                          spacing={1}
                          sx={{ minWidth: 180 }}>
                          {!uploadBlocked ? (
                            <Button
                              size="sm"
                              variant="soft"
                              startDecorator={<UploadFileIcon />}
                              onClick={() => handleStartUpload(periodo.id)}>
                              {periodo.estado === "Nuevo"
                                ? "Subir Inicial"
                                : "Subir Corrección"}
                            </Button>
                          ) : (
                            <Chip
                              variant="soft"
                              color="neutral"
                              startDecorator={<LockIcon />}>
                              Carga Bloqueada
                            </Chip>
                          )}

                          {periodo.estado === "Nuevo" && (
                            <Typography
                              level="body-xs"
                              textAlign="center"
                              sx={{ opacity: 0.7 }}>
                              Sube archivo para activar
                            </Typography>
                          )}

                          {canSendRevision && (
                            <Button
                              size="sm"
                              endDecorator={<SendIcon />}
                              onClick={() =>
                                handleChangeEstadoPeriodo(
                                  periodo.id,
                                  "En Revision",
                                )
                              }>
                              Enviar a Revisión
                            </Button>
                          )}

                          {periodo.estado === "En Revision" && (
                            <Stack direction="row" spacing={1}>
                              <IconButton
                                size="sm"
                                color="danger"
                                variant="solid"
                                onClick={() =>
                                  handleChangeEstadoPeriodo(
                                    periodo.id,
                                    "Abierto",
                                  )
                                }>
                                <RestartAltIcon />
                              </IconButton>
                              <Button
                                size="sm"
                                color="success"
                                variant="solid"
                                startDecorator={<CheckCircleIcon />}
                                onClick={() =>
                                  handleChangeEstadoPeriodo(
                                    periodo.id,
                                    "Aprobado",
                                  )
                                }>
                                Aprobar
                              </Button>
                            </Stack>
                          )}

                          {periodo.estado === "Aprobado" && (
                            <Button
                              size="sm"
                              color="danger"
                              variant="solid"
                              startDecorator={<LockIcon />}
                              onClick={() =>
                                handleChangeEstadoPeriodo(periodo.id, "Cerrado")
                              }>
                              Cerrar Mes
                            </Button>
                          )}
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </TabPanel>
      </Tabs>

      {/* --- MODALES --- */}
      <Modal open={openUploadModal} onClose={() => setOpenUploadModal(false)}>
        <ModalDialog>
          <DialogTitle>Cargar Lecturas</DialogTitle>
          <DialogContent>
            Confirma el cliente para asignar el archivo.
          </DialogContent>
          <Stack spacing={2}>
            <Select
              placeholder="Selecciona Cliente..."
              value={clienteParaSubir}
              onChange={(e, v) => setClienteParaSubir(v)}>
              {clientes.map((c) => (
                <Option key={c.id} value={c.id}>
                  {c.nombre || c.nombre_cliente}
                </Option>
              ))}
            </Select>
            <Button onClick={handleConfirmUpload} disabled={!clienteParaSubir}>
              Seleccionar Archivo
            </Button>
          </Stack>
        </ModalDialog>
      </Modal>

      <ReemplazosModal
        open={openReemplazos}
        onClose={() => {
          setOpenReemplazos(false);
          if (reporte) handleConsultarReporte();
        }}
        periodoId={selectedPeriodo}
        periodoTexto={periodoTexto}
        itemsContrato={itemsModal}
      />

      <GrupoModal
        open={openGrupoModal}
        onClose={() => setOpenGrupoModal(false)}
        onSuccess={() => {
          cargarConfiguracionCliente();
          if (selectedPeriodo && activeTab === 0) handleConsultarReporte();
        }}
        contratoId={selectedContratoIdForGroup}
        grupoToEdit={grupoToEdit}
      />

      <PeriodoModal
        open={openPeriodoModal}
        onClose={() => setOpenPeriodoModal(false)}
        onSuccess={loadGlobalFilters}
      />
    </Box>
  );
}
