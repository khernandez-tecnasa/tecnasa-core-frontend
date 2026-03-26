import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  Box,
  Card,
  Typography,
  Stack,
  Button,
  Table,
  Sheet,
  Input,
  Divider,
  IconButton,
  Chip,
  Tooltip,
  CircularProgress,
  Stepper,
  Step,
  StepIndicator,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  Alert,
  Select,
  Option,
  Grid,
} from "@mui/joy";

// Iconos
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import SettingsSuggestRoundedIcon from "@mui/icons-material/SettingsSuggestRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import ComputerRoundedIcon from "@mui/icons-material/ComputerRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";

// Context & Services
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getClientes } from "../../services/ClientesServices";
import { FacturacionService } from "../../services/FacturacionServices";
import { generarProformaPDF } from "../../utils/ReportePDFHelper";
import { generarProformaExcel } from "../../utils/ReporteExcelHelper";

// Modales
import PeriodoModal from "../../components/Facturacion/PeriodoModal";
import ReemplazosModal from "../../components/Facturacion/ReemplazosModal";
import { SheetIcon } from "lucide-react";

export default function FacturacionPipeline() {
  const { userData, hasPermiso } = useAuth();
  const { showToast } = useToast();

  // --- LÓGICA DE PERMISOS ---
  const isAdmin = userData?.rol?.toLowerCase() === "admin";
  const can = useCallback(
    (p) => isAdmin || hasPermiso(p),
    [isAdmin, hasPermiso],
  );

  const canUpload = can("gestion_ingenieria");
  const canFinance = can("gestion_finanzas");
  const canApprove = can("gestion_operaciones");

  // --- ESTADOS GLOBALES ---
  const [clientes, setClientes] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [selectedClienteId, setSelectedClienteId] = useState(null);
  const [selectedPeriodoBase, setSelectedPeriodoBase] = useState(null); // El objeto periodo del calendario

  // Estado Específico del Cliente (El semáforo real)
  const [estadoCliente, setEstadoCliente] = useState("Nuevo");

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // --- DATOS OPERATIVOS ---
  const [contratos, setContratos] = useState([]);
  const [reporte, setReporte] = useState(null);
  const [previsualizacion, setPrevisualizacion] = useState([]);
  const [reemplazos, setReemplazos] = useState([]);

  // --- MODALES ---
  const [openPeriodo, setOpenPeriodo] = useState(false);
  const [openReemplazos, setOpenReemplazos] = useState(false);
  const fileInputRef = useRef(null);

  // 1. CARGA INICIAL
  const init = useCallback(async () => {
    try {
      const [cData, pData] = await Promise.all([
        getClientes(),
        FacturacionService.getPeriodos(),
      ]);
      setClientes(Array.isArray(cData) ? cData : []);
      setPeriodos(Array.isArray(pData) ? pData : []);
    } catch (err) {
      showToast("Error al cargar filtros iniciales", "danger");
    }
  }, [showToast]);

  useEffect(() => {
    init();
  }, [init]);

  // 2. CARGA DE FLUJO (Contexto de Cliente + Periodo)
  const cargarFlujo = useCallback(async () => {
    if (!selectedClienteId || !selectedPeriodoBase) return;

    setLoading(true);
    setPrevisualizacion([]); // Limpiar carga previa

    try {
      // A. Obtener el Estado Específico del Cliente para este mes
      // IMPORTANTE: Aquí consumimos el nuevo endpoint del backend
      const statusData = await FacturacionService.getEstadoPeriodoCliente(
        selectedPeriodoBase.id,
        selectedClienteId,
      );
      const estadoActual = statusData.estado || "Nuevo";
      setEstadoCliente(estadoActual);

      // B. Cargar Datos Operativos
      const [cData, rData] = await Promise.all([
        FacturacionService.getContratosByCliente(selectedClienteId),
        FacturacionService.getReemplazosByPeriodo(selectedPeriodoBase.id),
      ]);

      setContratos(cData);
      setReemplazos(rData);

      // C. Cargar Reporte solo si ya hay datos procesados
      if (estadoActual !== "Nuevo") {
        const repData = await FacturacionService.getReporteMensual(
          selectedPeriodoBase.id,
          selectedClienteId,
        );
        setReporte(repData);
      } else {
        setReporte(null);
      }

      // D. Posicionamiento Automático de Tab
      if (estadoActual === "Nuevo") setActiveTab(0);
      else if (estadoActual === "Abierto") setActiveTab(1);
      else setActiveTab(2); // En Revision, Aprobado, Cerrado
    } catch (err) {
      console.error(err);
      // Si falla algo crítico (ej: reporte 404), reseteamos reporte pero mantenemos contratos
      setReporte(null);
    } finally {
      setLoading(false);
    }
  }, [selectedClienteId, selectedPeriodoBase, showToast]);

  useEffect(() => {
    cargarFlujo();
  }, [cargarFlujo]);

  const agruparItemsPorModelo = (items) => {
    const grupos = {};
    items.forEach((item) => {
      // 1. Obtener precio asegurando que sea número
      // Intentamos 'precio_renta', si no existe probamos 'renta', si no 0.
      const rawPrecio = item.precio_renta ?? item.renta ?? 0;
      const precioUnitario = parseFloat(rawPrecio);

      // Si el parseo falla (da NaN), forzamos a 0.00
      const precioFinal = isNaN(precioUnitario) ? 0 : precioUnitario;

      // 2. Clave única: Modelo + Precio (Para separar Adendas con precios distintos)
      const key = `${item.modelo}-${precioFinal.toFixed(2)}`;

      if (!grupos[key]) {
        grupos[key] = {
          modelo: item.modelo || "Sin Modelo", // Fallback estético
          precio_unitario: precioFinal,
          cantidad: 0,
          total_grupo: 0,
        };
      }

      // 3. Acumuladores
      grupos[key].cantidad += 1;

      // Validar total_pagar también
      const totalItem = parseFloat(item.total_pagar || item.subtotal || 0);
      grupos[key].total_grupo += isNaN(totalItem) ? 0 : totalItem;
    });

    return Object.values(grupos);
  };

  // --- ACCIONES: INGENIERÍA ---
  const handlePrevisualizar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validación vital: ¿Existe contrato?
    if (contratos.length === 0) {
      showToast(
        "El cliente no tiene contratos activos. Créalo primero en Inventario/Contratos.",
        "warning",
      );
      e.target.value = ""; // Reset input
      return;
    }

    setLoading(true);
    try {
      const data = await FacturacionService.previsualizarLecturas(
        file,
        selectedClienteId,
      );
      setPrevisualizacion(data);
      showToast(
        "Archivo analizado. Revise los datos antes de guardar.",
        "success",
      );
    } catch (err) {
      showToast(
        "Error al procesar el archivo Excel. Verifique el formato.",
        "danger",
      );
    } finally {
      setLoading(false);
      e.target.value = ""; // Reset input
    }
  };

  const handleUpdatePreview = (index, field, value) => {
    const newData = [...previsualizacion];
    newData[index][field] = value;
    setPrevisualizacion(newData);
  };

  const handleConfirmarCarga = async () => {
    setLoading(true);
    try {
      await FacturacionService.guardarLecturasDefinitivas(
        selectedPeriodoBase.id,
        previsualizacion,
      );

      // Si estaba en Nuevo, lo movemos a Abierto automáticamente
      if (estadoCliente === "Nuevo") {
        await FacturacionService.changeEstadoPeriodo(
          selectedPeriodoBase.id,
          "Abierto",
          selectedClienteId,
        );
      }

      showToast("Lecturas guardadas correctamente.", "success");
      cargarFlujo(); // Recargar todo
    } catch (err) {
      showToast(err.message || "Error al guardar lecturas", "danger");
    } finally {
      setLoading(false);
    }
  };

  // --- ACCIONES: ESTADOS ---
  const handleCambiarEstado = async (nuevoEstado) => {
    if (estadoCliente === "Cerrado" && !isAdmin) {
      showToast(
        "Solo un administrador puede reabrir periodos cerrados",
        "danger",
      );
      return;
    }
    try {
      // Pasamos selectedClienteId porque el estado es POR CLIENTE
      await FacturacionService.changeEstadoPeriodo(
        selectedPeriodoBase.id,
        nuevoEstado,
        selectedClienteId,
      );
      showToast(`Estado actualizado a: ${nuevoEstado}`, "success");
      cargarFlujo();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Error al actualizar estado",
        "danger",
      );
    }
  };

  // Aplanar items para el modal de reemplazos
  const allItemsContrato = useMemo(() => {
    return contratos.flatMap((c) =>
      (c.items || []).map((i) => ({ ...i, nombre_contrato: c.nombre })),
    );
  }, [contratos]);

  return (
    <Box>
      <input
        type="file"
        ref={fileInputRef}
        hidden
        onChange={handlePrevisualizar}
        accept=".xlsx,.xls"
      />

      {/* HEADER: SELECTORES Y PROGRESO */}
      <Card variant="outlined" sx={{ mb: 3, bgcolor: "background.surface" }}>
        <Grid container spacing={2} alignItems="center">
          <Grid xs={12} md={4}>
            <Select
              placeholder="Seleccione Cliente..."
              value={selectedClienteId}
              onChange={(_, v) => setSelectedClienteId(v)}
              startDecorator={<BusinessRoundedIcon color="primary" />}
              size="lg">
              {clientes.map((c) => (
                <Option key={c.id} value={c.id}>
                  {c.nombre || c.nombre_cliente}
                </Option>
              ))}
            </Select>
          </Grid>
          <Grid xs={12} md={8}>
            <Stepper sx={{ width: "100%", "--StepIndicator-size": "32px" }}>
              {["Nuevo", "Abierto", "En Revision", "Aprobado", "Cerrado"].map(
                (est) => {
                  const isActive = estadoCliente === est;
                  // Lógica visual simple para completados
                  const estados = [
                    "Nuevo",
                    "Abierto",
                    "En Revision",
                    "Aprobado",
                    "Cerrado",
                  ];
                  const isCompleted =
                    estados.indexOf(estadoCliente) > estados.indexOf(est);

                  return (
                    <Step
                      key={est}
                      active={isActive}
                      completed={isCompleted}
                      indicator={
                        <StepIndicator
                          variant={
                            isActive
                              ? "solid"
                              : isCompleted
                                ? "soft"
                                : "outlined"
                          }
                          color="primary">
                          {isCompleted ? <CheckCircleRoundedIcon /> : null}
                        </StepIndicator>
                      }>
                      <Typography
                        level="body-xs"
                        fontWeight={isActive ? "lg" : "md"}>
                        {est}
                      </Typography>
                    </Step>
                  );
                },
              )}
            </Stepper>
          </Grid>
        </Grid>
      </Card>

      <Grid container spacing={2}>
        {/* SIDEBAR: HISTORIAL DE MESES */}
        <Grid xs={12} md={2.5}>
          <Sheet
            variant="outlined"
            sx={{
              borderRadius: "md",
              p: 1,
              bgcolor: "background.level1",
              height: "calc(100vh - 200px)",
              overflowY: "auto",
            }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              p={1}>
              <Typography level="title-sm">Periodos</Typography>
              {isAdmin && (
                <IconButton size="sm" onClick={() => setOpenPeriodo(true)}>
                  <AddRoundedIcon />
                </IconButton>
              )}
            </Stack>
            <Divider sx={{ mb: 1 }} />
            <Stack spacing={1}>
              {periodos.map((p) => {
                const isSelected = selectedPeriodoBase?.id === p.id;
                return (
                  <Button
                    key={p.id}
                    variant={isSelected ? "solid" : "plain"}
                    color={isSelected ? "primary" : "neutral"}
                    onClick={() => setSelectedPeriodoBase(p)}
                    sx={{
                      justifyContent: "flex-start",
                      textAlign: "left",
                      py: 1.5,
                    }}>
                    <Box sx={{ width: "100%" }}>
                      <Typography level="title-sm" color="inherit">
                        {p.nombre}
                      </Typography>
                      <Typography
                        level="body-xs"
                        sx={{ opacity: 0.7, color: "inherit" }}>
                        {p.mes}/{p.anio}
                      </Typography>
                    </Box>
                  </Button>
                );
              })}
            </Stack>
          </Sheet>
        </Grid>

        {/* WORKSPACE DINÁMICO */}
        <Grid xs={12} md={9.5}>
          <Sheet
            variant="outlined"
            sx={{
              borderRadius: "md",
              minHeight: "calc(100vh - 200px)",
              bgcolor: "background.surface",
              display: "flex",
              flexDirection: "column",
            }}>
            {/* TABS DE TRABAJO */}
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              sx={{ bgcolor: "transparent", flex: 1 }}>
              <TabList
                variant="plain"
                sx={{
                  px: 2,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  pt: 1,
                }}>
                <Tab value={0} disabled={!canUpload}>
                  1. INGENIERÍA
                </Tab>
                <Tab value={1} disabled={!canFinance}>
                  2. FINANZAS
                </Tab>
                <Tab value={2} disabled={!canApprove}>
                  3. REVISIÓN
                </Tab>
              </TabList>

              {loading && !previsualizacion.length ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                  }}>
                  <CircularProgress size="lg" />
                </Box>
              ) : (
                <>
                  {/* TAB 1: INGENIERÍA (CARGA Y VALIDACIÓN) */}
                  <TabPanel value={0} sx={{ p: 3, overflow: "auto" }}>
                    {!selectedClienteId ? (
                      <Box sx={{ textAlign: "center", py: 10, opacity: 0.6 }}>
                        <BusinessRoundedIcon sx={{ fontSize: 60, mb: 2 }} />
                        <Typography level="h4">
                          Seleccione un Cliente
                        </Typography>
                      </Box>
                    ) : previsualizacion.length === 0 ? (
                      <Box
                        sx={{
                          border: "2px dashed",
                          p: 8,
                          textAlign: "center",
                          borderRadius: "md",
                          borderColor: "neutral.300",
                          mt: 4,
                        }}>
                        <UploadFileRoundedIcon
                          sx={{ fontSize: 60, color: "neutral.400", mb: 2 }}
                        />
                        <Typography level="h4">
                          Cargar Lecturas Mensuales
                        </Typography>
                        <Typography level="body-sm" sx={{ mb: 3 }}>
                          El sistema verificará seriales y lecturas
                          cronológicas.
                        </Typography>
                        <Button
                          variant="solid"
                          startDecorator={<UploadFileRoundedIcon />}
                          onClick={() => fileInputRef.current.click()}
                          disabled={estadoCliente === "Cerrado"}>
                          Seleccionar Archivo Excel
                        </Button>
                      </Box>
                    ) : (
                      <Stack spacing={2}>
                        <Card
                          variant="soft"
                          color="warning"
                          sx={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}>
                          <Box
                            sx={{
                              display: "flex",
                              gap: 2,
                              alignItems: "center",
                            }}>
                            <WarningRoundedIcon />
                            <Box>
                              <Typography level="title-sm">
                                Modo de Previsualización
                              </Typography>
                              <Typography level="body-xs">
                                Edite los valores en rojo si es necesario antes
                                de confirmar.
                              </Typography>
                            </Box>
                          </Box>
                          <Stack direction="row" spacing={1}>
                            <Button
                              variant="plain"
                              color="danger"
                              startDecorator={<CloseRoundedIcon />}
                              onClick={() => setPrevisualizacion([])}>
                              Cancelar
                            </Button>
                            <Button
                              variant="solid"
                              color="primary"
                              startDecorator={<SaveRoundedIcon />}
                              onClick={handleConfirmarCarga}>
                              Confirmar y Guardar
                            </Button>
                          </Stack>
                        </Card>

                        <Sheet
                          variant="outlined"
                          sx={{
                            borderRadius: "md",
                            overflow: "auto",
                            maxHeight: "600px",
                          }}>
                          <Table stickyHeader hoverRow>
                            <thead>
                              <tr>
                                <th style={{ width: 120 }}>Serial</th>
                                <th>Modelo</th>
                                <th style={{ width: 150 }}>Lectura Mono</th>
                                <th style={{ width: 150 }}>Lectura Color</th>
                                <th style={{ width: 120 }}>Estado</th>
                              </tr>
                            </thead>
                            <tbody>
                              {previsualizacion.map((r, i) => (
                                <tr key={i}>
                                  <td>
                                    <Typography fontFamily="monospace">
                                      {r.serial}
                                    </Typography>
                                  </td>
                                  <td>{r.modelo}</td>
                                  <td>
                                    <Input
                                      size="sm"
                                      type="number"
                                      value={r.lectura_mono}
                                      onChange={(e) =>
                                        handleUpdatePreview(
                                          i,
                                          "lectura_mono",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </td>
                                  <td>
                                    <Input
                                      size="sm"
                                      type="number"
                                      value={r.lectura_color}
                                      onChange={(e) =>
                                        handleUpdatePreview(
                                          i,
                                          "lectura_color",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </td>
                                  <td>
                                    <Chip
                                      size="sm"
                                      color={
                                        r.estado === "OK" ? "success" : "danger"
                                      }
                                      variant="soft">
                                      {r.estado}
                                    </Chip>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </Sheet>
                      </Stack>
                    )}
                  </TabPanel>

                  {/* TAB 2: FINANZAS (REEMPLAZOS Y TARIFAS) */}
                  <TabPanel value={1} sx={{ p: 3, overflow: "auto" }}>
                    <Grid container spacing={2}>
                      <Grid xs={12} md={7}>
                        <Typography level="title-md" sx={{ mb: 2 }}>
                          Contratos Activos
                        </Typography>
                        <Stack spacing={1}>
                          {contratos.map((c) => (
                            <Card
                              key={c.id}
                              variant="soft"
                              orientation="horizontal"
                              sx={{
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}>
                              <Box>
                                <Typography level="title-sm">
                                  {c.nombre}
                                </Typography>
                                <Typography level="body-xs">
                                  ID: {c.id} | Equipos:{" "}
                                  {c.total_impresoras || 0}
                                </Typography>
                              </Box>
                              <Button
                                size="sm"
                                variant="plain"
                                startDecorator={<ReceiptLongRoundedIcon />}
                                onClick={() =>
                                  window.open(
                                    `/admin/facturacion/contratos/${c.id}`,
                                  )
                                }>
                                Configurar Tarifas
                              </Button>
                            </Card>
                          ))}
                          {contratos.length === 0 && (
                            <Alert color="neutral">
                              No hay contratos configurados para este cliente.
                            </Alert>
                          )}
                        </Stack>
                      </Grid>

                      <Grid xs={12} md={5}>
                        <Card
                          variant="outlined"
                          sx={{ bgcolor: "background.level1" }}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              mb: 2,
                              alignItems: "center",
                            }}>
                            <Typography
                              level="title-md"
                              startDecorator={<ComputerRoundedIcon />}>
                              Impresoras de Respaldo
                            </Typography>
                            <Button
                              size="sm"
                              variant="soft"
                              startDecorator={<AddRoundedIcon />}
                              onClick={() => setOpenReemplazos(true)}>
                              Gestionar
                            </Button>
                          </Box>
                          <Divider />
                          <Table
                            size="sm"
                            sx={{ "& thead th": { bgcolor: "transparent" } }}>
                            <thead>
                              <tr>
                                <th>Titular</th>
                                <th>Backup</th>
                                <th>Uso</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reemplazos.map((rem) => (
                                <tr key={rem.id}>
                                  <td>
                                    <Typography fontSize="xs">
                                      {rem.serial_titular}
                                    </Typography>
                                  </td>
                                  <td>
                                    <Typography fontSize="xs">
                                      {rem.serial_backup}
                                    </Typography>
                                  </td>
                                  <td>
                                    <b>{rem.uso_calculado}</b>
                                  </td>
                                </tr>
                              ))}
                              {reemplazos.length === 0 && (
                                <tr>
                                  <td
                                    colSpan={3}
                                    style={{
                                      textAlign: "center",
                                      opacity: 0.5,
                                      padding: 20,
                                    }}>
                                    Sin reemplazos activos
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </Table>
                          <Divider sx={{ my: 2 }} />
                          <Button
                            fullWidth
                            color="warning"
                            startDecorator={<SendRoundedIcon />}
                            onClick={() => handleCambiarEstado("En Revision")}
                            disabled={estadoCliente !== "Abierto"}>
                            Enviar a Revisión
                          </Button>
                        </Card>
                      </Grid>
                    </Grid>
                  </TabPanel>

                  {/* TAB 3: REVISIÓN */}
                  <TabPanel value={2} sx={{ p: 3, overflow: "auto" }}>
                    {reporte ? (
                      <Grid container spacing={3}>
                        <Grid xs={12} md={8}>
                          <Sheet
                            variant="outlined"
                            sx={{
                              p: 4,
                              bgcolor: "white",
                              minHeight: "600px",
                              boxShadow: "sm",
                            }}>
                            <Box sx={{ textAlign: "center", mb: 4 }}>
                              <Typography level="h3">
                                RESUMEN DE SERVICIOS
                              </Typography>
                              <Typography level="body-sm" color="neutral">
                                {selectedPeriodoBase?.nombre}
                              </Typography>
                            </Box>
                            <Divider sx={{ mb: 3 }} />

                            {reporte.detalles.map((contratoData, i) => {
                              const itemsAgrupados = agruparItemsPorModelo(
                                contratoData.items_individuales || [],
                              );
                              return (
                                <Box key={i} sx={{ mb: 5 }}>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      borderBottom: "2px solid",
                                      borderColor: "primary.100",
                                      pb: 1,
                                      mb: 2,
                                    }}>
                                    <Typography
                                      level="title-lg"
                                      color="primary">
                                      {contratoData.contrato}
                                    </Typography>
                                    <Typography
                                      level="title-sm"
                                      color="neutral">
                                      Subtotal:{" "}
                                      {new Intl.NumberFormat("en-US", {
                                        style: "currency",
                                        currency: "USD",
                                      }).format(contratoData.subtotal_contrato)}
                                    </Typography>
                                  </Box>

                                  {itemsAgrupados.length > 0 && (
                                    <Table size="sm" hoverRow sx={{ mb: 2 }}>
                                      <thead>
                                        <tr>
                                          <th style={{ width: 60 }}>Cant.</th>
                                          <th>Modelo</th>
                                          <th style={{ textAlign: "right" }}>
                                            Precio Unit.
                                          </th>
                                          <th style={{ textAlign: "right" }}>
                                            Total
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {itemsAgrupados.map((grupo, idx) => (
                                          <tr key={idx}>
                                            <td>
                                              <Chip
                                                size="sm"
                                                variant="soft"
                                                color="primary">
                                                {grupo.cantidad}
                                              </Chip>
                                            </td>
                                            <td>
                                              <Typography fontWeight="md">
                                                Impresora {grupo.modelo}
                                              </Typography>
                                            </td>
                                            <td style={{ textAlign: "right" }}>
                                              {new Intl.NumberFormat("en-US", {
                                                style: "currency",
                                                currency: "USD",
                                              }).format(grupo.precio_unitario)}
                                            </td>
                                            <td
                                              style={{
                                                textAlign: "right",
                                                fontWeight: "bold",
                                              }}>
                                              {new Intl.NumberFormat("en-US", {
                                                style: "currency",
                                                currency: "USD",
                                              }).format(
                                                grupo.cantidad *
                                                  grupo.precio_unitario,
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </Table>
                                  )}

                                  {contratoData.grupos_bolsones &&
                                    contratoData.grupos_bolsones.length > 0 && (
                                      <Box
                                        sx={{
                                          mt: 2,
                                          bgcolor: "background.level1",
                                          p: 1,
                                          borderRadius: "sm",
                                        }}>
                                        <Typography
                                          level="title-xs"
                                          sx={{ mb: 1, opacity: 0.7 }}>
                                          BOLSAS Y EXCEDENTES
                                        </Typography>
                                        <Table
                                          size="sm"
                                          sx={{
                                            "& tr": { bgcolor: "transparent" },
                                          }}>
                                          <tbody>
                                            {contratoData.grupos_bolsones.map(
                                              (gb, j) => (
                                                <tr key={j}>
                                                  <td style={{ width: 60 }}>
                                                    1
                                                  </td>
                                                  <td>
                                                    {gb.nombre_grupo} (
                                                    {gb.frecuencia})
                                                  </td>
                                                  <td
                                                    style={{
                                                      textAlign: "right",
                                                    }}>
                                                    -
                                                  </td>
                                                  <td
                                                    style={{
                                                      textAlign: "right",
                                                      fontWeight: "bold",
                                                    }}>
                                                    {new Intl.NumberFormat(
                                                      "en-US",
                                                      {
                                                        style: "currency",
                                                        currency: "USD",
                                                      },
                                                    ).format(gb.total_pagar)}
                                                  </td>
                                                </tr>
                                              ),
                                            )}
                                          </tbody>
                                        </Table>
                                      </Box>
                                    )}
                                </Box>
                              );
                            })}
                          </Sheet>
                        </Grid>

                        <Grid xs={12} md={4}>
                          <Stack spacing={2}>
                            <Card
                              variant="solid"
                              color="primary"
                              invertedColors
                              size="lg">
                              <Typography level="title-lg" mb={2}>
                                Resumen Financiero
                              </Typography>
                              <Stack spacing={1}>
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                  }}>
                                  <Typography level="body-md">
                                    Subtotal:
                                  </Typography>
                                  <Typography level="body-md" fontWeight="lg">
                                    {new Intl.NumberFormat("en-US", {
                                      style: "currency",
                                      currency: "USD",
                                    }).format(reporte.subtotal_general)}
                                  </Typography>
                                </Box>
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                  }}>
                                  <Typography level="body-md">ISV:</Typography>
                                  <Typography level="body-md" fontWeight="lg">
                                    {new Intl.NumberFormat("en-US", {
                                      style: "currency",
                                      currency: "USD",
                                    }).format(reporte.isv_total)}
                                  </Typography>
                                </Box>
                                <Divider
                                  sx={{
                                    bgcolor: "rgba(255,255,255,0.3)",
                                    my: 1,
                                  }}
                                />
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}>
                                  <Typography level="title-lg">
                                    TOTAL:
                                  </Typography>
                                  <Typography level="h2">
                                    {new Intl.NumberFormat("en-US", {
                                      style: "currency",
                                      currency: "USD",
                                    }).format(reporte.gran_total)}
                                  </Typography>
                                </Box>
                              </Stack>
                              <Stack spacing={1} sx={{ mt: 3 }}>
                                {estadoCliente === "En Revision" && (
                                  <Button
                                    fullWidth
                                    color="success"
                                    startDecorator={<CheckCircleRoundedIcon />}
                                    onClick={() =>
                                      handleCambiarEstado("Aprobado")
                                    }>
                                    Aprobar
                                  </Button>
                                )}
                                {["En Revision", "Aprobado"].includes(
                                  estadoCliente,
                                ) && (
                                  <Button
                                    fullWidth
                                    variant="soft"
                                    color="neutral"
                                    startDecorator={<HistoryRoundedIcon />}
                                    onClick={() =>
                                      handleCambiarEstado("Abierto")
                                    }>
                                    Rechazar
                                  </Button>
                                )}
                                <Button
                                  fullWidth
                                  variant="outlined"
                                  color="success" // Verde excel
                                  startDecorator={<SheetIcon />} // O usa un icono de archivo
                                  onClick={() => {
                                    // Buscamos el nombre del cliente seleccionado para el nombre del archivo
                                    const clienteObj = clientes.find(
                                      (c) => c.id === selectedClienteId,
                                    );
                                    const nombreCliente = clienteObj
                                      ? clienteObj.nombre ||
                                        clienteObj.nombre_cliente
                                      : "Cliente";

                                    generarProformaExcel(
                                      reporte,
                                      nombreCliente,
                                    );
                                  }}>
                                  Descargar Excel
                                </Button>
                              </Stack>
                            </Card>
                            {estadoCliente === "Aprobado" && (
                              <Button
                                fullWidth
                                size="lg"
                                color="danger"
                                variant="solid"
                                startDecorator={<LockRoundedIcon />}
                                onClick={() => handleCambiarEstado("Cerrado")}>
                                Cerrar Mes
                              </Button>
                            )}
                            {isAdmin && estadoCliente === "Cerrado" && (
                              <Button
                                fullWidth
                                variant="plain"
                                color="danger"
                                onClick={() => handleCambiarEstado("Aprobado")}>
                                Reabrir (Admin)
                              </Button>
                            )}
                          </Stack>
                        </Grid>
                      </Grid>
                    ) : (
                      <Box sx={{ textAlign: "center", py: 10 }}>
                        <ReceiptLongRoundedIcon
                          sx={{ fontSize: 60, color: "neutral.300", mb: 2 }}
                        />
                        <Typography level="body-lg" color="neutral">
                          No hay datos procesados.
                        </Typography>
                      </Box>
                    )}
                  </TabPanel>
                </>
              )}
            </Tabs>
          </Sheet>
        </Grid>
      </Grid>

      {/* COMPONENTES MODALES */}
      <PeriodoModal
        open={openPeriodo}
        onClose={() => setOpenPeriodo(false)}
        onSuccess={init}
      />

      <ReemplazosModal
        open={openReemplazos}
        onClose={() => setOpenReemplazos(false)}
        periodoId={selectedPeriodoBase?.id}
        periodoTexto={selectedPeriodoBase?.nombre}
        itemsContrato={allItemsContrato}
      />
    </Box>
  );
}
