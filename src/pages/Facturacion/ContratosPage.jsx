import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Input,
  Card,
  CardContent,
  Divider,
  Table,
  Sheet,
  Chip,
  IconButton,
  CircularProgress,
  Breadcrumbs,
  Link,
  Stack,
  Tooltip,
} from "@mui/joy";

// Iconos
import AddIcon from "@mui/icons-material/Add";
import ArticleIcon from "@mui/icons-material/Article";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HomeIcon from "@mui/icons-material/Home";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import PrintIcon from "@mui/icons-material/Print"; // Ejemplo extra

// Servicios y Componentes tuyos
import { searchClientes } from "../../services/ClientesServices";
import { FacturacionService } from "../../services/FacturacionServices";
import ContratoModal from "@/components/Facturacion/ContratoModal";

// TUS COMPONENTES DE CONTEXTO Y UI
import { useToast } from "../../context/ToastContext"; // 👈 Importamos tu Toast
import PermissionGate from "../../components/common/PermissionGate"; // 👈 Tu Gate
import PaginationLite from "../../components/common/PaginationLite"; // 👈 Tu Paginación

export default function ContratosPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast(); // 👈 Usamos el hook de notificaciones

  // Datos URL
  const initialQuery = searchParams.get("q") || "";
  const clienteIdUrl = searchParams.get("clienteId");

  // Estados
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [clientResults, setClientResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const [selectedCliente, setSelectedCliente] = useState(null);
  const [contratos, setContratos] = useState([]);
  const [loadingContratos, setLoadingContratos] = useState(false);

  // Estados Modal
  const [openModal, setOpenModal] = useState(false);
  const [editingContract, setEditingContract] = useState(null);

  // Estados de Paginación (Cliente-side para este ejemplo)
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  // --- EFECTOS ---

  useEffect(() => {
    if (initialQuery) {
      ejecutarBusqueda(initialQuery);
    }
  }, []);

  // --- LÓGICA ---

  const ejecutarBusqueda = async (texto) => {
    if (!texto.trim()) return;
    setLoadingSearch(true);
    try {
      const data = await searchClientes(texto);
      setClientResults(data || []);

      // Recuperar cliente si viene en URL
      if (clienteIdUrl && data) {
        const clienteEncontrado = data.find((c) => c.id == clienteIdUrl);
        if (clienteEncontrado) {
          handleSelectCliente(clienteEncontrado, false);
        }
      }
    } catch (error) {
      console.error("Error buscando:", error);
      showToast("Error al buscar clientes", "danger"); // 👈 Feedback visual
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams({ q: searchQuery });
    ejecutarBusqueda(searchQuery);
    // Resetear vistas
    setSelectedCliente(null);
    setContratos([]);
    setPage(1);
  };

  const handleSelectCliente = (cliente, updateUrl = true) => {
    setSelectedCliente(cliente);
    cargarContratos(cliente.id);
    if (updateUrl) {
      setSearchParams({ q: searchQuery, clienteId: cliente.id });
    }
  };

  const handleBackToSearch = () => {
    setSelectedCliente(null);
    setContratos([]);
    setSearchParams({ q: searchQuery }); // Mantiene la búsqueda pero quita el ID
  };

  const cargarContratos = async (clienteId) => {
    setLoadingContratos(true);
    try {
      const data = await FacturacionService.getContratosByCliente(clienteId);
      setContratos(data);
    } catch (error) {
      console.error(error);
      showToast("No se pudieron cargar los contratos", "danger");
    } finally {
      setLoadingContratos(false);
    }
  };

  // --- LÓGICA DE PAGINACIÓN (CLIENT SIDE) ---
  // Nota: Si tu API paginara, esto sería diferente. Aquí lo hago con el array.
  const paginatedContratos = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return contratos.slice(start, start + rowsPerPage);
  }, [contratos, page]);

  const totalPages = Math.ceil(contratos.length / rowsPerPage);

  // --- UTILS ---
  const getContractStatus = (fechaFin) => {
    if (!fechaFin)
      return { label: "Indefinido", color: "primary", variant: "soft" };
    const hoy = new Date();
    const fin = new Date(fechaFin);
    const diferenciaDias = Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24));

    if (diferenciaDias < 0)
      return { label: "Vencido", color: "danger", variant: "solid" };
    if (diferenciaDias <= 30)
      return { label: "Por Vencer", color: "warning", variant: "soft" };
    return { label: "Activo", color: "success", variant: "soft" };
  };

  const handleSuccessSave = () => {
    cargarContratos(selectedCliente.id);
    showToast("Contrato guardado correctamente", "success");
  };

  // --- RENDER ---

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: "auto" }}>
      {/* 1. Header & Breadcrumbs */}
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs
          separator={<KeyboardArrowRight />}
          size="sm"
          sx={{ pl: 0 }}>
          <Link color="neutral" href="/admin/dashboard">
            <HomeIcon />
          </Link>
          <Typography color="neutral">Facturación</Typography>
          <Typography color="primary" fontWeight="lg">
            Contratos
          </Typography>
        </Breadcrumbs>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            mt: 1,
          }}>
          <Box>
            <Typography level="h2" component="h1">
              Gestión de Contratos
            </Typography>
            <Typography level="body-md" color="neutral">
              Administra tarifas, equipos y vigencias por cliente.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* 2. AREA DE CONTENIDO */}

      {/* VISTA A: BUSCADOR (Si no hay cliente seleccionado) */}
      {!selectedCliente ? (
        <Box sx={{ animation: "fadeIn 0.4s ease-out" }}>
          <Card variant="soft" sx={{ mb: 4, p: 3, borderRadius: "lg" }}>
            <form onSubmit={handleSearchSubmit}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <Input
                  placeholder="Buscar por nombre, código o RTN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  startDecorator={<SearchIcon />}
                  size="lg"
                  sx={{ flex: 1 }}
                />
                <Button
                  type="submit"
                  loading={loadingSearch}
                  size="lg"
                  variant="solid"
                  color="primary">
                  Buscar Cliente
                </Button>
              </Stack>
            </form>
          </Card>

          {clientResults.length > 0 && (
            <Sheet
              variant="outlined"
              sx={{ borderRadius: "lg", overflow: "hidden", boxShadow: "sm" }}>
              <Table hoverRow size="lg">
                <thead>
                  <tr>
                    <th style={{ width: "40%" }}>Cliente</th>
                    <th>Código</th>
                    <th>Identificación</th>
                    <th style={{ textAlign: "right" }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {clientResults.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                          }}>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: "50%",
                              bgcolor: "primary.100",
                              color: "primary.600",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}>
                            <Typography level="title-lg">
                              {c.nombre?.charAt(0)}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography fontWeight="lg">
                              {c.nombre || c.nombre_cliente}
                            </Typography>
                            <Typography level="body-xs">Empresa</Typography>
                          </Box>
                        </Box>
                      </td>
                      <td>
                        <Chip size="sm" variant="outlined">
                          {c.codigo}
                        </Chip>
                      </td>
                      <td>{c.rtn || "N/A"}</td>
                      <td style={{ textAlign: "right" }}>
                        <Button
                          size="sm"
                          variant="soft"
                          endDecorator={<KeyboardArrowRight />}
                          onClick={() => handleSelectCliente(c)}>
                          Ver Contratos
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Sheet>
          )}

          {!loadingSearch && searchQuery && clientResults.length === 0 && (
            <Box sx={{ textAlign: "center", py: 8, opacity: 0.6 }}>
              <FolderOpenIcon sx={{ fontSize: 60, mb: 2 }} />
              <Typography level="title-md">
                No se encontraron clientes
              </Typography>
              <Typography level="body-sm">
                Intenta con otro término de búsqueda
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        /* VISTA B: DETALLE CLIENTE Y CONTRATOS */
        <Box sx={{ animation: "slideInRight 0.3s ease-out" }}>
          <Button
            variant="plain"
            color="neutral"
            startDecorator={<ArrowBackIcon />}
            onClick={handleBackToSearch}
            sx={{ mb: 2 }}>
            Volver a la búsqueda
          </Button>

          {/* Header del Cliente */}
          <Sheet
            variant="outlined"
            sx={{
              p: 3,
              borderRadius: "lg",
              mb: 3,
              bgcolor: "background.surface",
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              justifyContent: "space-between",
              alignItems: { md: "center" },
              gap: 2,
              boxShadow: "sm",
            }}>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: "md",
                  bgcolor: "primary.solidBg",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                }}>
                {selectedCliente.nombre?.charAt(0) || "C"}
              </Box>
              <Box>
                <Typography level="h3">
                  {selectedCliente.nombre || selectedCliente.nombre_cliente}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography
                    level="body-sm"
                    startDecorator={
                      <Chip size="sm">ID: {selectedCliente.id}</Chip>
                    }>
                    Código: <b>{selectedCliente.codigo}</b>
                  </Typography>
                </Stack>
              </Box>
            </Box>

            {/* Protegemos el botón de crear con tu PermissionGate */}
            <PermissionGate anyOf={["facturacion.crear_contrato", "admin"]}>
              <Button
                startDecorator={<AddIcon />}
                onClick={() => {
                  setEditingContract(null);
                  setOpenModal(true);
                }}
                size="md">
                Nuevo Contrato
              </Button>
            </PermissionGate>
          </Sheet>

          {/* Tabla de Contratos */}
          <Sheet
            variant="outlined"
            sx={{
              borderRadius: "lg",
              overflow: "hidden",
              minHeight: "auto",
              display: "flex",
              flexDirection: "column",
            }}>
            {loadingContratos ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  flex: 1,
                  p: 4,
                }}>
                <CircularProgress size="lg" />
              </Box>
            ) : contratos.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 8, px: 2 }}>
                <ArticleIcon
                  sx={{ fontSize: 48, color: "neutral.300", mb: 2 }}
                />
                <Typography level="title-md" color="neutral">
                  Este cliente no tiene contratos activos
                </Typography>
                <PermissionGate anyOf={["facturacion.crear_contrato"]}>
                  <Button
                    variant="outlined"
                    sx={{ mt: 2 }}
                    onClick={() => setOpenModal(true)}>
                    Crear el primero
                  </Button>
                </PermissionGate>
              </Box>
            ) : (
              <>
                <Table hoverRow stickyHeader>
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}>ID</th>
                      <th>Nombre Contrato</th>
                      <th>Tipo</th>
                      <th>Vigencia</th>
                      <th style={{ textAlign: "center" }}>Equipos</th>
                      <th>Estado</th>
                      <th style={{ textAlign: "right", width: 140 }}>
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedContratos.map((contrato) => {
                      const status = getContractStatus(contrato.fecha_fin);
                      return (
                        <tr key={contrato.id}>
                          <td>
                            <Typography level="body-xs">
                              #{contrato.id}
                            </Typography>
                          </td>
                          <td>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}>
                              <ArticleIcon color="primary" fontSize="small" />
                              <Typography fontWeight="md">
                                {contrato.nombre}
                              </Typography>
                            </Box>
                          </td>
                          <td>
                            <Chip
                              size="sm"
                              variant="outlined"
                              color={
                                contrato.contrato_padre_id
                                  ? "neutral"
                                  : "primary"
                              }>
                              {contrato.contrato_padre_id
                                ? "Adenda"
                                : "Maestro"}
                            </Chip>
                          </td>
                          <td>
                            <Stack>
                              <Typography level="body-xs">
                                Inicio:{" "}
                                {new Date(
                                  contrato.fecha_inicio,
                                ).toLocaleDateString()}
                              </Typography>
                              {contrato.fecha_fin && (
                                <Typography level="body-xs" color="neutral">
                                  Fin:{" "}
                                  {new Date(
                                    contrato.fecha_fin,
                                  ).toLocaleDateString()}
                                </Typography>
                              )}
                            </Stack>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <Chip variant="soft" size="sm" color="neutral">
                              {contrato.total_impresoras || 0}
                            </Chip>
                          </td>
                          <td>
                            <Chip
                              color={status.color}
                              variant={status.variant}
                              size="sm">
                              {status.label}
                            </Chip>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <Stack
                              direction="row"
                              spacing={1}
                              justifyContent="flex-end">
                              <PermissionGate
                                anyOf={["facturacion.editar_contrato"]}>
                                <Tooltip title="Editar detalles" variant="soft">
                                  <IconButton
                                    size="sm"
                                    variant="plain"
                                    color="neutral"
                                    onClick={() => {
                                      setEditingContract(contrato);
                                      setOpenModal(true);
                                    }}>
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>
                              </PermissionGate>

                              <Tooltip
                                title="Configurar Impresoras"
                                variant="soft">
                                <Button
                                  size="sm"
                                  variant="soft"
                                  color="primary"
                                  onClick={() =>
                                    navigate(
                                      `/admin/facturacion/contratos/${contrato.id}?q=${encodeURIComponent(searchQuery)}`,
                                    )
                                  }>
                                  Configurar
                                </Button>
                              </Tooltip>
                            </Stack>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>

                {/* 3. Footer de Tabla con tu Paginación */}
                <Box
                  sx={{
                    p: 2,
                    display: "flex",
                    justifyContent: "flex-end",
                    borderTop: "1px solid",
                    borderColor: "divider",
                  }}>
                  <PaginationLite
                    page={page}
                    count={totalPages}
                    onChange={(newPage) => setPage(newPage)}
                    size="sm"
                  />
                </Box>
              </>
            )}
          </Sheet>
        </Box>
      )}

      {/* MODAL */}
      <ContratoModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        clienteId={selectedCliente?.id}
        contratosExistentes={contratos}
        contractToEdit={editingContract}
        onSuccess={handleSuccessSave} // 👈 Ahora dispara el toast
      />
    </Box>
  );
}
