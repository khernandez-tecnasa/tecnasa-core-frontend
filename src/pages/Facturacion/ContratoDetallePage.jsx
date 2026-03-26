import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Table,
  Sheet,
  Chip,
  IconButton,
  Divider,
  Input,
  Select,
  Option,
  Card,
  CardContent,
  Breadcrumbs,
  Link,
  Stack,
  Tooltip,
  Grid,
  CircularProgress,
} from "@mui/joy";

// Iconos
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import HomeIcon from "@mui/icons-material/Home";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import PrintIcon from "@mui/icons-material/Print";
import FolderOffIcon from "@mui/icons-material/FolderOff"; // Para "Sin grupo"
import SettingsIcon from "@mui/icons-material/Settings";

// Servicios y Componentes
import { FacturacionService } from "../../services/FacturacionServices";
import AgregarItemModal from "../../components/Facturacion/AgregarItemModal";
import GrupoModal from "../../components/Facturacion/GrupoModal";

// Contextos
import { useToast } from "../../context/ToastContext";
import PermissionGate from "../../components/common/PermissionGate";

export default function ContratoDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast(); // 👈 Feedback visual
  const queryFromUrl = searchParams.get("q") || "";

  // Datos
  const [contrato, setContrato] = useState(null);
  const [items, setItems] = useState([]);
  const [grupos, setGrupos] = useState([]);

  // Filtros y Carga
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Modales
  const [openItemModal, setOpenItemModal] = useState(false);
  const [openGrupoModal, setOpenGrupoModal] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [grupoToEdit, setGrupoToEdit] = useState(null);

  // --- EFECTOS ---
  useEffect(() => {
    cargarDatos();
  }, [id]);

  // Filtro Memoizado (Más eficiente)
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const lower = searchTerm.toLowerCase();
    return items.filter(
      (i) =>
        i.serial_number.toLowerCase().includes(lower) ||
        (i.modelo && i.modelo.toLowerCase().includes(lower)),
    );
  }, [items, searchTerm]);

  // --- FUNCIONES ---

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [contratoData, itemsData, gruposData] = await Promise.all([
        FacturacionService.getContratoById(id),
        FacturacionService.getItemsByContrato(id),
        FacturacionService.getGruposByContrato(id),
      ]);

      setContrato(contratoData);
      setItems(itemsData || []);
      setGrupos(gruposData || []);
    } catch (error) {
      console.error("Error cargando detalle:", error);
      showToast("Error cargando detalles del contrato", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    let url = `/admin/facturacion/contratos`;
    // Mantenemos el contexto de búsqueda anterior si existe
    const params = new URLSearchParams();
    if (contrato?.cliente_id) params.append("clienteId", contrato.cliente_id);
    if (queryFromUrl) params.append("q", queryFromUrl);

    navigate(`${url}?${params.toString()}`);
  };

  // --- MANEJADORES DE GRUPOS ---

  const handleCreateGrupo = () => {
    setGrupoToEdit(null);
    setOpenGrupoModal(true);
  };

  const handleEditGrupo = (grupo) => {
    setGrupoToEdit(grupo);
    setOpenGrupoModal(true);
  };

  const handleAssignGrupo = async (itemId, grupoId) => {
    // Optimistic Update (opcional, aquí hacemos recarga rápida)
    try {
      await FacturacionService.assignItemToGrupo(itemId, grupoId);
      showToast("Ubicación actualizada correctamente", "success");

      // Actualizamos solo el item en el estado local para evitar recarga completa masiva
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, grupo_id: grupoId } : item,
        ),
      );
    } catch (error) {
      console.error(error);
      showToast("Error al asignar grupo", "danger");
    }
  };

  // --- MANEJADORES DE ITEMS ---

  const handleCreateItem = () => {
    setItemToEdit(null);
    setOpenItemModal(true);
  };

  const handleEditItem = (item) => {
    setItemToEdit(item);
    setOpenItemModal(true);
  };

  const handleDeleteItem = async (itemId) => {
    if (
      !window.confirm("¿Seguro que deseas retirar esta impresora del contrato?")
    )
      return;
    try {
      await FacturacionService.removeItemFromContrato(itemId);
      showToast("Impresora retirada", "neutral");
      cargarDatos();
    } catch (error) {
      showToast("Error al eliminar", "danger");
    }
  };

  // --- RENDER ---

  if (loading)
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}>
        <CircularProgress size="lg" />
      </Box>
    );

  if (!contrato) return <Box sx={{ p: 4 }}>Contrato no encontrado.</Box>;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: "auto" }}>
      {/* 1. Header & Breadcrumbs */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs
          separator={<KeyboardArrowRight />}
          size="sm"
          sx={{ pl: 0, mb: 1 }}>
          <Link color="neutral" href="/admin/dashboard">
            <HomeIcon />
          </Link>
          <Link color="neutral" href="/admin/facturacion/contratos">
            Contratos
          </Link>
          <Typography color="primary" fontWeight="lg">
            {contrato.nombre}
          </Typography>
        </Breadcrumbs>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: 2,
          }}>
          <Box>
            <Typography level="h2" sx={{ mb: 0.5 }}>
              {contrato.nombre}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography level="body-md" color="neutral">
                Cliente: <b>{contrato.cliente_nombre}</b>
              </Typography>
              <Chip variant="outlined" size="sm" startDecorator={<PrintIcon />}>
                {items.length} Equipos
              </Chip>
            </Stack>
          </Box>

          <Stack direction="row" spacing={2}>
            <Button variant="outlined" color="neutral" onClick={handleBack}>
              Cancelar / Volver
            </Button>
            <PermissionGate anyOf={["facturacion.editar_contrato"]}>
              <Button startDecorator={<AddIcon />} onClick={handleCreateItem}>
                Agregar Equipo
              </Button>
            </PermissionGate>
          </Stack>
        </Box>
      </Box>

      {/* 2. SECCIÓN DE GRUPOS (CARDS) */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}>
          <Typography
            level="title-md"
            startDecorator={<FolderOpenIcon color="primary" />}>
            Bolsas y Ubicaciones
          </Typography>
          <PermissionGate anyOf={["facturacion.crear_grupo"]}>
            <Button
              size="sm"
              variant="plain"
              onClick={handleCreateGrupo}
              startDecorator={<AddIcon />}>
              Crear Grupo
            </Button>
          </PermissionGate>
        </Box>

        {grupos.length === 0 ? (
          <Sheet
            variant="soft"
            sx={{
              p: 2,
              borderRadius: "md",
              borderStyle: "dashed",
              borderWidth: 1,
              borderColor: "neutral.outlinedBorder",
              textAlign: "center",
            }}>
            <Typography level="body-sm">
              No hay grupos ni bolsas configuradas. Los equipos se cobrarán
              individualmente.
            </Typography>
          </Sheet>
        ) : (
          <Grid container spacing={2}>
            {grupos.map((g) => (
              <Grid key={g.id} xs={12} sm={6} md={4} lg={3}>
                <Card
                  variant="outlined"
                  size="sm"
                  sx={{
                    transition: "0.2s",
                    "&:hover": {
                      borderColor: "primary.outlinedBorder",
                      boxShadow: "sm",
                    },
                  }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}>
                    <Box
                      sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: "md",
                          bgcolor: g.es_bolson ? "primary.100" : "neutral.100",
                          color: g.es_bolson ? "primary.600" : "neutral.600",
                        }}>
                        <FolderOpenIcon />
                      </Box>
                      <Box>
                        <Typography level="title-sm">{g.nombre}</Typography>
                        <Typography level="body-xs" color="neutral">
                          {g.total_impresoras_asignadas || 0} Equipos
                        </Typography>
                      </Box>
                    </Box>
                    <PermissionGate anyOf={["facturacion.editar_grupo"]}>
                      <IconButton
                        size="sm"
                        variant="plain"
                        color="neutral"
                        onClick={() => handleEditGrupo(g)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </PermissionGate>
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  {g.es_bolson ? (
                    <Stack spacing={0.5}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}>
                        <Typography level="body-xs">Bolsa Mono:</Typography>
                        <Typography level="body-xs" fontWeight="bold">
                          {g.bolsa_mono?.toLocaleString()}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}>
                        <Typography level="body-xs">Bolsa Color:</Typography>
                        <Typography level="body-xs" fontWeight="bold">
                          {g.bolsa_color?.toLocaleString()}
                        </Typography>
                      </Box>
                      {g.frecuencia_excedentes === "ANUAL" && (
                        <Chip
                          color="warning"
                          size="sm"
                          variant="soft"
                          sx={{ mt: 1, alignSelf: "flex-start" }}>
                          Cierre Anual (Mes {g.mes_cierre_anual})
                        </Chip>
                      )}
                    </Stack>
                  ) : (
                    <Typography
                      level="body-xs"
                      color="neutral"
                      fontStyle="italic">
                      Agrupación lógica (Sin bolsa compartida)
                    </Typography>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* 3. TABLA DE ITEMS */}
      <Sheet
        variant="outlined"
        sx={{ borderRadius: "lg", overflow: "visible", boxShadow: "sm" }}>
        {/* Toolbar de Tabla */}
        <Box
          sx={{
            p: 2,
            display: "flex",
            gap: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}>
          <Input
            placeholder="Buscar por serie o modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startDecorator={<SearchIcon />}
            size="sm"
            sx={{ width: { xs: "100%", md: 300 } }}
          />
        </Box>

        <Table stickyHeader hoverRow>
          <thead>
            <tr>
              <th style={{ width: "25%" }}>Equipo</th>
              <th style={{ width: "30%" }}>Asignación de Grupo</th>
              <th>Tarifas Unitarias</th>
              <th style={{ width: 100 }}>Estado</th>
              <th style={{ textAlign: "right", width: 120 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{ textAlign: "center", padding: "40px" }}>
                  <Typography color="neutral">
                    No se encontraron equipos en este contrato.
                  </Typography>
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id}>
                  {/* COL 1: Info Equipo */}
                  <td>
                    <Typography fontWeight="lg">
                      {item.serial_number}
                    </Typography>
                    <Typography level="body-sm" color="neutral">
                      {item.modelo}
                    </Typography>
                  </td>

                  {/* COL 2: Selector de Grupo */}
                  <td>
                    <PermissionGate
                      anyOf={["facturacion.editar_contrato"]}
                      fallback={
                        <Typography level="body-sm">
                          {grupos.find((g) => g.id === item.grupo_id)?.nombre ||
                            "Sin Grupo"}
                        </Typography>
                      }>
                      <Select
                        placeholder="Seleccionar..."
                        size="sm"
                        variant="outlined"
                        value={item.grupo_id}
                        onChange={(e, val) => handleAssignGrupo(item.id, val)}
                        startDecorator={
                          item.grupo_id ? (
                            <FolderOpenIcon color="primary" />
                          ) : (
                            <FolderOffIcon color="neutral" />
                          )
                        }
                        slotProps={{
                          listbox: { sx: { zIndex: 9999 } }, // Asegura que el dropdown salga sobre todo
                        }}>
                        <Option value={null}>
                          <Typography level="body-sm" color="neutral">
                            Sin Grupo (Individual)
                          </Typography>
                        </Option>
                        <Divider />
                        {grupos.map((g) => (
                          <Option key={g.id} value={g.id}>
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              width="100%">
                              <span>{g.nombre}</span>
                              {g.es_bolson && (
                                <Chip
                                  size="sm"
                                  variant="outlined"
                                  sx={{ ml: 1 }}>
                                  Bolsa
                                </Chip>
                              )}
                            </Stack>
                          </Option>
                        ))}
                      </Select>
                    </PermissionGate>
                  </td>

                  {/* COL 3: Precios */}
                  <td>
                    <Stack spacing={0.5}>
                      <Box
                        sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                        <Typography level="body-xs" sx={{ width: 40 }}>
                          Renta:
                        </Typography>
                        <Typography level="body-sm" fontWeight="md">
                          ${parseFloat(item.precio_renta || 0).toFixed(2)}
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                        <Typography level="body-xs" sx={{ width: 40 }}>
                          Clic:
                        </Typography>
                        <Typography level="body-sm" fontWeight="md">
                          ${parseFloat(item.precio_clic_mono || 0).toFixed(3)}
                        </Typography>
                      </Box>
                    </Stack>
                  </td>

                  {/* COL 4: Estado */}
                  <td>
                    <Chip size="sm" color="success" variant="soft">
                      Activo
                    </Chip>
                  </td>

                  {/* COL 5: Acciones */}
                  <td style={{ textAlign: "right" }}>
                    <Stack
                      direction="row"
                      justifyContent="flex-end"
                      spacing={1}>
                      <PermissionGate anyOf={["facturacion.editar_contrato"]}>
                        <Tooltip title="Editar tarifas" variant="soft">
                          <IconButton
                            size="sm"
                            variant="plain"
                            color="neutral"
                            onClick={() => handleEditItem(item)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>

                        <Tooltip
                          title="Retirar equipo"
                          variant="soft"
                          color="danger">
                          <IconButton
                            size="sm"
                            variant="plain"
                            color="danger"
                            onClick={() => handleDeleteItem(item.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </PermissionGate>
                    </Stack>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Sheet>

      {/* MODALES */}
      <AgregarItemModal
        open={openItemModal}
        onClose={() => setOpenItemModal(false)}
        contratoId={id}
        onSuccess={() => {
          cargarDatos();
          showToast("Equipo guardado correctamente", "success");
        }}
        itemToEdit={itemToEdit}
      />

      <GrupoModal
        open={openGrupoModal}
        onClose={() => setOpenGrupoModal(false)}
        contratoId={id}
        onSuccess={() => {
          cargarDatos();
          showToast("Grupo guardado correctamente", "success");
        }}
        grupoToEdit={grupoToEdit}
      />
    </Box>
  );
}
