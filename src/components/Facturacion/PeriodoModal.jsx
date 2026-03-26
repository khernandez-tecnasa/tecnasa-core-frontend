import React, { useState } from "react";
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
  Select,
  Option,
} from "@mui/joy";
import { FacturacionService } from "../../services/FacturacionServices";

export default function PeriodoModal({ open, onClose, onSuccess }) {
  const [mes, setMes] = useState(new Date().getMonth() + 1); // Mes actual
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  const meses = [
    { id: 1, nombre: "Enero" },
    { id: 2, nombre: "Febrero" },
    { id: 3, nombre: "Marzo" },
    { id: 4, nombre: "Abril" },
    { id: 5, nombre: "Mayo" },
    { id: 6, nombre: "Junio" },
    { id: 7, nombre: "Julio" },
    { id: 8, nombre: "Agosto" },
    { id: 9, nombre: "Septiembre" },
    { id: 10, nombre: "Octubre" },
    { id: 11, nombre: "Noviembre" },
    { id: 12, nombre: "Diciembre" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const nombrePeriodo = `${meses.find((m) => m.id === mes).nombre} ${anio}`;

      await FacturacionService.createPeriodo({
        nombre: nombrePeriodo,
        mes,
        anio,
      });

      onSuccess();
      onClose();
    } catch (error) {
      alert(error.message || "Error creando periodo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog>
        <DialogTitle>Abrir Nuevo Periodo</DialogTitle>
        <DialogContent>Define el mes a facturar.</DialogContent>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Stack direction="row" spacing={2}>
              <FormControl required sx={{ flex: 1 }}>
                <FormLabel>Mes</FormLabel>
                <Select value={mes} onChange={(e, v) => setMes(v)}>
                  {meses.map((m) => (
                    <Option key={m.id} value={m.id}>
                      {m.nombre}
                    </Option>
                  ))}
                </Select>
              </FormControl>
              <FormControl required sx={{ flex: 1 }}>
                <FormLabel>Año</FormLabel>
                <Input
                  type="number"
                  value={anio}
                  onChange={(e) => setAnio(Number(e.target.value))}
                />
              </FormControl>
            </Stack>
            <Button type="submit" loading={loading}>
              Crear Periodo
            </Button>
          </Stack>
        </form>
      </ModalDialog>
    </Modal>
  );
}
