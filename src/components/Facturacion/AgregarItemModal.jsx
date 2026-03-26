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
  Autocomplete,
  CircularProgress,
  ModalClose,
  Divider,
  Grid,
} from "@mui/joy";

// Iconos
import PrintIcon from "@mui/icons-material/Print";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import SearchIcon from "@mui/icons-material/Search";

import { FacturacionService } from "../../services/FacturacionServices";
import { searchActivos } from "../../services/ActivosServices";

export default function AgregarItemModal({
  open,
  onClose,
  onSuccess,
  contratoId,
  itemToEdit = null,
}) {
  // Estados de Búsqueda
  const [openPicker, setOpenPicker] = useState(false);
  const [options, setOptions] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Formulario
  const [selectedActivo, setSelectedActivo] = useState(null);
  const [precioRenta, setPrecioRenta] = useState(0);
  const [precioMono, setPrecioMono] = useState(0.005);
  const [precioColor, setPrecioColor] = useState(0.045);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // EFECTO: Rellenar datos
  useEffect(() => {
    if (open) {
      if (itemToEdit) {
        setSelectedActivo({
          id: itemToEdit.activo_id,
          nombre: itemToEdit.modelo,
          serial_number: itemToEdit.serial_number,
        });
        setPrecioRenta(itemToEdit.precio_renta);
        setPrecioMono(itemToEdit.precio_clic_mono);
        setPrecioColor(itemToEdit.precio_clic_color);
      } else {
        setSelectedActivo(null);
        setPrecioRenta(0);
        setPrecioMono(0.005);
        setPrecioColor(0.045);
        setOptions([]);
      }
    }
  }, [itemToEdit, open]);

  const handleSearch = async (event) => {
    const query = event.target.value;
    if (query.length < 2) return;
    setLoadingSearch(true);
    try {
      const resultados = await searchActivos(query);
      setOptions(resultados);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedActivo) return;

    setLoadingSubmit(true);
    try {
      const data = {
        contrato_id: contratoId,
        activo_id: selectedActivo.id,
        precio_renta: parseFloat(precioRenta),
        precio_clic_mono: parseFloat(precioMono),
        precio_clic_color: parseFloat(precioColor),
      };

      if (itemToEdit) {
        await FacturacionService.updatePreciosItem(itemToEdit.id, {
          precio_renta: data.precio_renta,
          precio_clic_mono: data.precio_clic_mono,
          precio_clic_color: data.precio_clic_color,
        });
      } else {
        await FacturacionService.addItemToContrato(data);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      // Aquí usas tu toast si quieres
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog variant="outlined" sx={{ minWidth: 600, p: 3 }}>
        <ModalClose />
        <DialogTitle>
          <PrintIcon color="primary" />
          {itemToEdit ? "Editar Tarifas de Equipo" : "Agregar Impresora"}
        </DialogTitle>
        <DialogContent>
          {itemToEdit
            ? "Modifica los costos unitarios pactados para este equipo."
            : "Busca un activo del inventario y define sus costos."}
        </DialogContent>
        <Divider sx={{ my: 1 }} />

        <form onSubmit={handleSubmit}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* 1. BUSCADOR DE ACTIVO */}
            <FormControl required>
              <FormLabel>Buscar Equipo</FormLabel>
              <Autocomplete
                placeholder="Escribe serie o modelo..."
                startDecorator={<SearchIcon color="neutral" />}
                open={openPicker}
                onOpen={() => setOpenPicker(true)}
                onClose={() => setOpenPicker(false)}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                getOptionLabel={(option) =>
                  `${option.serial_number} - ${option.nombre || option.modelo}`
                }
                options={options}
                loading={loadingSearch}
                value={selectedActivo}
                onChange={(e, val) => setSelectedActivo(val)}
                onInputChange={handleSearch}
                endDecorator={
                  loadingSearch ? <CircularProgress size="sm" /> : null
                }
                disabled={!!itemToEdit}
                size="lg"
                sx={{ width: "100%" }}
              />
            </FormControl>

            {/* 2. GRID DE PRECIOS */}
            <Grid container spacing={2}>
              <Grid xs={12} sm={4}>
                <FormControl required>
                  <FormLabel>Renta Mensual</FormLabel>
                  <Input
                    type="number"
                    step="0.01"
                    startDecorator={<AttachMoneyIcon fontSize="small" />}
                    value={precioRenta}
                    onChange={(e) => setPrecioRenta(e.target.value)}
                  />
                </FormControl>
              </Grid>
              <Grid xs={12} sm={4}>
                <FormControl required>
                  <FormLabel>Clic B/N</FormLabel>
                  <Input
                    type="number"
                    step="0.0001"
                    startDecorator={<AttachMoneyIcon fontSize="small" />}
                    value={precioMono}
                    onChange={(e) => setPrecioMono(e.target.value)}
                    sx={{ bgcolor: "neutral.50" }} // Sutil diferencia visual
                  />
                </FormControl>
              </Grid>
              <Grid xs={12} sm={4}>
                <FormControl required>
                  <FormLabel>Clic Color</FormLabel>
                  <Input
                    type="number"
                    step="0.0001"
                    startDecorator={<AttachMoneyIcon fontSize="small" />}
                    value={precioColor}
                    onChange={(e) => setPrecioColor(e.target.value)}
                    sx={{ bgcolor: "primary.50" }} // Sutil diferencia visual
                  />
                </FormControl>
              </Grid>
            </Grid>

            {/* 3. BOTONES */}
            <Stack
              direction="row"
              spacing={1}
              justifyContent="flex-end"
              sx={{ mt: 2 }}>
              <Button variant="plain" color="neutral" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" loading={loadingSubmit}>
                {itemToEdit ? "Guardar Cambios" : "Agregar Equipo"}
              </Button>
            </Stack>
          </Stack>
        </form>
      </ModalDialog>
    </Modal>
  );
}
