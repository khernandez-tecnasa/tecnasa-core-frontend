import React, { useState, useMemo } from "react";
import {
  Box,
  Select,
  Option,
  List,
  ListItem,
  ListItemButton,
  ListItemContent,
  Typography,
  Input,
  Divider,
} from "@mui/joy";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";

export default function BillingSidebar({
  periodos,
  selectedPeriodoId,
  onPeriodoChange,
  clientes,
  selectedCliente,
  onSelectCliente,
}) {
  const [filtro, setFiltro] = useState("");

  const clientesFiltrados = useMemo(() => {
    return clientes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
        c.codigo?.toLowerCase().includes(filtro.toLowerCase()),
    );
  }, [clientes, filtro]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header Fijo */}
      <Box sx={{ p: 2, pb: 1 }}>
        <Typography
          level="title-xs"
          fontWeight="bold"
          color="neutral"
          sx={{ mb: 1, letterSpacing: "1px" }}>
          PERIODO ACTIVO
        </Typography>
        <Select
          value={selectedPeriodoId}
          onChange={(e, v) => onPeriodoChange(v)}
          size="sm"
          sx={{ mb: 2 }}>
          {periodos.map((p) => (
            <Option key={p.id} value={p.id}>
              {p.nombre} — <Typography level="body-xs">{p.estado}</Typography>
            </Option>
          ))}
        </Select>
        <Divider />
        <Input
          startDecorator={<SearchIcon />}
          placeholder="Buscar cliente..."
          size="sm"
          variant="soft"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          sx={{ mt: 2 }}
        />
      </Box>

      {/* Lista Scrollable */}
      <List sx={{ overflowY: "auto", flex: 1, px: 1 }}>
        {clientesFiltrados.map((cliente) => {
          const isSelected = selectedCliente?.id === cliente.id;
          return (
            <ListItem key={cliente.id}>
              <ListItemButton
                selected={isSelected}
                onClick={() => onSelectCliente(cliente)}
                variant={isSelected ? "soft" : "plain"}
                color={isSelected ? "primary" : "neutral"}
                sx={{ borderRadius: "md", mb: 0.5 }}>
                <ListItemContent>
                  <Typography
                    level="title-sm"
                    fontWeight={isSelected ? "lg" : "md"}>
                    {cliente.nombre}
                  </Typography>
                  <Typography level="body-xs" noWrap>
                    {cliente.codigo || "Sin Código"}
                  </Typography>
                </ListItemContent>
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Footer del Sidebar */}
      <Box
        sx={{
          p: 2,
          borderTop: "1px solid",
          borderColor: "divider",
          bgcolor: "background.surface",
        }}>
        <Typography level="body-xs" textAlign="center">
          {clientesFiltrados.length} Clientes listados
        </Typography>
      </Box>
    </Box>
  );
}
