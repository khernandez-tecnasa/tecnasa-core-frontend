import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalDialog,
  DialogTitle,
  DialogContent,
  Table,
  Button,
  Input,
  Select,
  Option,
  FormControl,
  FormLabel,
  IconButton,
  Stack,
  Divider,
  Typography,
} from "@mui/joy";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import { FacturacionService } from "../../services/FacturacionServices";

export default function ReemplazosModal({
  open,
  onClose,
  periodoId,
  periodoTexto,
  itemsContrato,
}) {
  const [reemplazos, setReemplazos] = useState([]);

  const [selectedItem, setSelectedItem] = useState(null);
  const [backupId, setBackupId] = useState("");

  // Contadores B/N
  const [lecturaInicial, setLecturaInicial] = useState(0);
  const [lecturaFinal, setLecturaFinal] = useState(0);

  // Contadores Color
  const [lecturaInicialColor, setLecturaInicialColor] = useState(0);
  const [lecturaFinalColor, setLecturaFinalColor] = useState(0);

  useEffect(() => {
    if (open && periodoId) cargarReemplazos();
  }, [open, periodoId]);

  const cargarReemplazos = async () => {
    const data = await FacturacionService.getReemplazosByPeriodo(periodoId);
    setReemplazos(data);
  };

  const handleGuardar = async () => {
    if (!selectedItem || !backupId)
      return alert("Selecciona la impresora titular y la ID del backup");
    try {
      await FacturacionService.createReemplazo({
        contrato_item_id: selectedItem,
        activo_temporal_id: backupId,
        periodo_id: periodoId,
        lectura_inicial: lecturaInicial,
        lectura_final: lecturaFinal,
        lectura_inicial_color: lecturaInicialColor, // Envio color
        lectura_final_color: lecturaFinalColor, // Envio color
      });
      // Reset
      setSelectedItem(null);
      setLecturaInicial(0);
      setLecturaFinal(0);
      setLecturaInicialColor(0);
      setLecturaFinalColor(0);
      setBackupId("");
      cargarReemplazos();
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const handleBorrar = async (id) => {
    if (!confirm("¿Borrar reemplazo?")) return;
    await FacturacionService.deleteReemplazo(id);
    cargarReemplazos();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog sx={{ maxWidth: 900, width: "100%", overflow: "auto" }}>
        <DialogTitle>Impresoras de Respaldo (Backup)</DialogTitle>
        <DialogContent>Periodo: {periodoTexto}</DialogContent>

        {/* FORMULARIO */}
        <Stack
          spacing={2}
          sx={{
            mb: 3,
            p: 2,
            bgcolor: "background.level1",
            borderRadius: "md",
          }}>
          <Stack direction="row" spacing={2}>
            <FormControl sx={{ flex: 2 }}>
              <FormLabel>Puesto Titular (Averiada)</FormLabel>
              <Select
                placeholder="Selecciona..."
                value={selectedItem}
                onChange={(e, v) => setSelectedItem(v)}>
                {itemsContrato.map((i) => (
                  <Option key={i.id} value={i.id}>
                    {i.serial_number} - {i.modelo}
                  </Option>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ flex: 1 }}>
              <FormLabel>ID Activo Backup</FormLabel>
              <Input
                placeholder="Ej: 45"
                value={backupId}
                onChange={(e) => setBackupId(e.target.value)}
              />
            </FormControl>
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center">
            <Divider orientation="vertical" />
            <Typography level="body-sm" fontWeight="bold">
              B/N:
            </Typography>
            <FormControl sx={{ width: 100 }}>
              <FormLabel>L. Inicial</FormLabel>
              <Input
                type="number"
                value={lecturaInicial}
                onChange={(e) => setLecturaInicial(e.target.value)}
              />
            </FormControl>
            <FormControl sx={{ width: 100 }}>
              <FormLabel>L. Final</FormLabel>
              <Input
                type="number"
                value={lecturaFinal}
                onChange={(e) => setLecturaFinal(e.target.value)}
              />
            </FormControl>

            <Divider orientation="vertical" />
            <Typography
              level="body-sm"
              fontWeight="bold"
              textColor="danger.500">
              Color:
            </Typography>
            <FormControl sx={{ width: 100 }}>
              <FormLabel>L. Inicial</FormLabel>
              <Input
                type="number"
                value={lecturaInicialColor}
                onChange={(e) => setLecturaInicialColor(e.target.value)}
              />
            </FormControl>
            <FormControl sx={{ width: 100 }}>
              <FormLabel>L. Final</FormLabel>
              <Input
                type="number"
                value={lecturaFinalColor}
                onChange={(e) => setLecturaFinalColor(e.target.value)}
              />
            </FormControl>

            <Button
              startDecorator={<SaveIcon />}
              onClick={handleGuardar}
              sx={{ ml: "auto" }}>
              Agregar
            </Button>
          </Stack>
        </Stack>

        {/* TABLA */}
        <Table>
          <thead>
            <tr>
              <th>Titular</th>
              <th>Backup (Temporal)</th>
              <th>Uso B/N</th>
              <th>Uso Color</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {reemplazos.map((r) => (
              <tr key={r.id}>
                <td>{r.serial_titular}</td>
                <td>
                  {r.serial_backup} (ID: {r.activo_temporal_id})
                </td>
                <td>
                  <b>{r.uso_calculado}</b> ({r.lectura_inicial} -{" "}
                  {r.lectura_final})
                </td>
                <td>
                  <b>{r.uso_calculado_color}</b> ({r.lectura_inicial_color} -{" "}
                  {r.lectura_final_color})
                </td>
                <td>
                  <IconButton
                    size="sm"
                    color="danger"
                    onClick={() => handleBorrar(r.id)}>
                    <DeleteIcon />
                  </IconButton>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </ModalDialog>
    </Modal>
  );
}
