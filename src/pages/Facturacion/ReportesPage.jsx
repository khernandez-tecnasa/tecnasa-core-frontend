import React, { useState, useEffect } from "react";
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
  Tooltip,
} from "@mui/joy";

// Iconos
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import PrintIcon from "@mui/icons-material/Print";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ConstructionIcon from "@mui/icons-material/Construction";
import SettingsIcon from "@mui/icons-material/Settings";
import PieChartIcon from "@mui/icons-material/PieChart";
import EditIcon from "@mui/icons-material/Edit";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import RefreshIcon from "@mui/icons-material/Refresh";

// Servicios y Helpers
import { getClientes } from "../../services/ClientesServices";
import { FacturacionService } from "../../services/FacturacionServices";
import { generarProformaPDF } from "../../utils/ReportePDFHelper";

// Modales (Asumimos que están en sus archivos correspondientes)
import ReemplazosModal from "../../components/Facturacion/ReemplazosModal";
import GrupoModal from "../../components/Facturacion/GrupoModal"; // Tu modal anterior

export default function ReportesPage() {
  // --- ESTADOS GLOBALES ---
  const [periodos, setPeriodos] = useState([]);
  const [clientes, setClientes] = useState([]);

  const [selectedPeriodo, setSelectedPeriodo] = useState(null);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // --- ESTADOS DE REPORTE ---
  const [reporte, setReporte] = useState(null);
  const [loadingReporte, setLoadingReporte] = useState(false);
  const [error, setError] = useState(null);

  // --- ESTADOS DE CONFIGURACIÓN (Contratos/Grupos) ---
  const [contratosConfig, setContratosConfig] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(false);

  // --- ESTADOS DE MODALES ---
  const [openReemplazos, setOpenReemplazos] = useState(false);
  const [itemsModal, setItemsModal] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const [openGrupoModal, setOpenGrupoModal] = useState(false);
  const [grupoToEdit, setGrupoToEdit] = useState(null);
  const [selectedContratoIdForGroup, setSelectedContratoIdForGroup] =
    useState(null);

  // 1. CARGA INICIAL
  useEffect(() => {
    async function loadData() {
      try {
        const [periodosData, clientesData] = await Promise.all([
          FacturacionService.getPeriodos(),
          getClientes(),
        ]);
        setPeriodos(periodosData || []);
        setClientes(clientesData || []);
      } catch (err) {
        console.error("Error cargando filtros:", err);
      }
    }
    loadData();
  }, []);

  // 2. EFECTO: Si cambio de cliente, limpiar o recargar config
  useEffect(() => {
    if (selectedCliente) {
      cargarConfiguracionCliente();
      setReporte(null); // Limpiar reporte anterior para evitar confusiones
    }
  }, [selectedCliente]);

  // --- LOGICA DE NEGOCIO ---

  const handleConsultarReporte = async () => {
    if (!selectedPeriodo || !selectedCliente) return;
    setLoadingReporte(true);
    setError(null);
    try {
      const data = await FacturacionService.getReporteMensual(
        selectedPeriodo,
        selectedCliente,
      );
      setReporte(data);
      setActiveTab(0); // Forzar vista de reporte
    } catch (err) {
      console.error(err);
      setError("No hay datos de lectura suficientes para generar el reporte.");
      setReporte(null);
    } finally {
      setLoadingReporte(false);
    }
  };

  const cargarConfiguracionCliente = async () => {
    if (!selectedCliente) return;
    setLoadingConfig(true);
    try {
      // Obtenemos contratos y sus grupos para la pestaña de configuración
      const contratos =
        await FacturacionService.getContratosByCliente(selectedCliente);

      // Enriquecer con grupos (esto podría optimizarse en el backend)
      const contratosFull = await Promise.all(
        contratos.map(async (c) => {
          const grupos = await FacturacionService.getGruposByContrato(c.id);
          return { ...c, grupos: grupos || [] };
        }),
      );

      setContratosConfig(contratosFull);
    } catch (error) {
      console.error("Error cargando config:", error);
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleAbrirReemplazos = async () => {
    if (!selectedCliente) return;
    setLoadingItems(true);
    try {
      // Reutilizamos lógica de carga de items
      let allItems = [];
      for (const c of contratosConfig) {
        // Usamos la config ya cargada
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
      alert("Error cargando equipos");
    } finally {
      setLoadingItems(false);
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

  // Helpers UI
  const formatMoney = (amount) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  const nombreClientePDF =
    clientes.find((c) => c.id === selectedCliente)?.nombre || "Cliente";
  const periodoTexto =
    periodos.find((p) => p.id === selectedPeriodo)?.nombre || "Periodo";

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1600, mx: "auto" }}>
      {/* 1. HEADER & CONTROLES GLOBALES */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 2,
        }}>
        <Box>
          <Typography level="h2">Centro de Facturación</Typography>
          <Typography level="body-md" color="neutral">
            Generación de proformas y configuración de contratos.
          </Typography>
        </Box>

        {/* BARRA DE ACCIÓN FLOTANTE O ESTATICA */}
        <Sheet
          variant="outlined"
          sx={{
            p: 1.5,
            borderRadius: "lg",
            display: "flex",
            gap: 2,
            bgcolor: "background.surface",
            boxShadow: "sm",
          }}>
          <Select
            placeholder="Seleccionar Cliente..."
            value={selectedCliente}
            onChange={(e, v) => setSelectedCliente(v)}
            sx={{ minWidth: 250 }}>
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
            sx={{ minWidth: 180 }}>
            {periodos.map((p) => (
              <Option key={p.id} value={p.id}>
                {p.nombre}
              </Option>
            ))}
          </Select>
          <Button
            startDecorator={<RequestQuoteIcon />}
            onClick={handleConsultarReporte}
            loading={loadingReporte}
            disabled={!selectedCliente || !selectedPeriodo}
            color="primary">
            Generar
          </Button>
        </Sheet>
      </Box>

      {/* 2. AREA DE TRABAJO CON PESTAÑAS */}
      <Tabs
        value={activeTab}
        onChange={(e, v) => setActiveTab(v)}
        sx={{ bgcolor: "transparent" }}>
        <TabList
          tabFlex={1}
          sx={{
            maxWidth: 400,
            mb: 2,
            borderRadius: "md",
            bgcolor: "background.level1",
            p: 0.5,
          }}>
          <Tab value={0} sx={{ borderRadius: "sm" }}>
            <ReceiptLongIcon sx={{ mr: 1 }} /> Reporte Mensual
          </Tab>
          <Tab
            value={1}
            disabled={!selectedCliente}
            sx={{ borderRadius: "sm" }}>
            <SettingsIcon sx={{ mr: 1 }} /> Configuración
          </Tab>
        </TabList>

        {/* --- PESTAÑA 0: EL REPORTE (La vista diaria) --- */}
        <TabPanel value={0} sx={{ p: 0 }}>
          {error && (
            <Alert color="danger" sx={{ mb: 2 }}>
              {error}
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
              }}>
              <PieChartIcon
                sx={{ fontSize: 60, color: "neutral.300", mb: 2 }}
              />
              <Typography level="h4" color="neutral">
                Listo para generar
              </Typography>
              <Typography level="body-sm">
                Selecciona cliente y periodo para ver el desglose.
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
              {/* COLUMNA IZQUIERDA: RESUMEN Y ACCIONES */}
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

              {/* COLUMNA DERECHA: DETALLES */}
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
                      {/* 1. Items Individuales */}
                      {contratoData.items_individuales.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                          <Typography
                            level="title-sm"
                            color="neutral"
                            sx={{
                              mb: 1,
                              textTransform: "uppercase",
                              fontSize: "0.75rem",
                              letterSpacing: "1px",
                            }}>
                            Cobro Individual
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

                      {/* 2. Grupos */}
                      {contratoData.grupos_bolsones.length > 0 && (
                        <Box>
                          <Typography
                            level="title-sm"
                            color="neutral"
                            sx={{
                              mb: 1,
                              textTransform: "uppercase",
                              fontSize: "0.75rem",
                              letterSpacing: "1px",
                            }}>
                            Grupos y Bolsones
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

                                {/* Mini Dashboard del Grupo */}
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
                        borderColor: "divider",
                        textAlign: "right",
                      }}>
                      <Typography level="body-sm">
                        Subtotal Contrato:{" "}
                        <b>{formatMoney(contratoData.subtotal_contrato)}</b>
                      </Typography>
                    </Box>
                  </Sheet>
                ))}
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* --- PESTAÑA 1: CONFIGURACIÓN (El Edit mode) --- */}
        <TabPanel value={1} sx={{ p: 0 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}>
            <Typography level="h4">Estructura de Contratos</Typography>
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
            <Alert>No hay contratos activos para este cliente.</Alert>
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

                    <Typography level="title-sm" sx={{ mb: 1 }}>
                      Grupos Configurados:
                    </Typography>

                    {contrato.grupos.length === 0 ? (
                      <Typography
                        level="body-sm"
                        fontStyle="italic"
                        color="neutral">
                        Sin grupos (Todos los equipos son individuales)
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
                                      : "Agrupación Lógica"}
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
                              {grupo.es_bolson && (
                                <Box sx={{ mt: 1 }}>
                                  <Chip
                                    size="sm"
                                    variant="outlined"
                                    sx={{ mr: 1 }}>
                                    M: {grupo.bolsa_mono}
                                  </Chip>
                                  <Chip size="sm" variant="outlined">
                                    C: {grupo.bolsa_color}
                                  </Chip>
                                </Box>
                              )}
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
      </Tabs>

      {/* --- MODALES --- */}
      <ReemplazosModal
        open={openReemplazos}
        onClose={() => {
          setOpenReemplazos(false);
          if (reporte) handleConsultarReporte(); // Refrescar reporte al cerrar
        }}
        periodoId={selectedPeriodo}
        periodoTexto={periodoTexto}
        itemsContrato={itemsModal}
      />

      <GrupoModal
        open={openGrupoModal}
        onClose={() => setOpenGrupoModal(false)}
        onSuccess={() => {
          cargarConfiguracionCliente(); // Recargar la pestaña de config
          // Opcional: Si el usuario quiere, recargar reporte automáticamente
          if (selectedPeriodo) handleConsultarReporte();
        }}
        contratoId={selectedContratoIdForGroup}
        grupoToEdit={grupoToEdit}
      />
    </Box>
  );
}
