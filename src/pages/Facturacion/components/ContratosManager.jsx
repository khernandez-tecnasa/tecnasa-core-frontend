import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Sheet,
  Table,
  Chip,
  IconButton,
  Tooltip,
  Stack,
} from "@mui/joy";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import ArticleIcon from "@mui/icons-material/Article";
import { useNavigate } from "react-router-dom";

import { FacturacionService } from "../../../services/FacturacionServices";
import ContratoModal from "../../../components/Facturacion/ContratoModal";

export default function ContratosManager({ cliente }) {
  const navigate = useNavigate();
  const [contratos, setContratos] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [editingContract, setEditingContract] = useState(null);

  useEffect(() => {
    cargarContratos();
  }, [cliente.id]);

  const cargarContratos = async () => {
    const data = await FacturacionService.getContratosByCliente(cliente.id);
    setContratos(data || []);
  };

  const handleEdit = (c) => {
    setEditingContract(c);
    setOpenModal(true);
  };

  const handleNew = () => {
    setEditingContract(null);
    setOpenModal(true);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography level="title-lg">Contratos Vigentes</Typography>
        <Button size="sm" startDecorator={<AddIcon />} onClick={handleNew}>
          Nuevo Contrato
        </Button>
      </Box>

      <Sheet variant="outlined" sx={{ borderRadius: "md", overflow: "hidden" }}>
        <Table hoverRow>
          <thead>
            <tr>
              <th>Referencia</th>
              <th>Vigencia</th>
              <th>Estado</th>
              <th style={{ textAlign: "right" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {contratos.map((c) => (
              <tr key={c.id}>
                <td>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <ArticleIcon color="primary" />
                    <Typography fontWeight="md">{c.nombre}</Typography>
                  </Stack>
                </td>
                <td>
                  {c.fecha_inicio} — {c.fecha_fin || "Indefinido"}
                </td>
                <td>
                  <Chip size="sm" color="success" variant="soft">
                    Activo
                  </Chip>
                </td>
                <td style={{ textAlign: "right" }}>
                  <Tooltip title="Editar cabecera">
                    <IconButton size="sm" onClick={() => handleEdit(c)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Button
                    size="sm"
                    variant="plain"
                    onClick={() =>
                      navigate(`/admin/facturacion/contratos/${c.id}`)
                    } // Mantienes la página de detalle
                  >
                    Ver Equipos
                  </Button>
                </td>
              </tr>
            ))}
            {contratos.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: 20 }}>
                  No hay contratos configurados
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Sheet>

      <ContratoModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        clienteId={cliente.id}
        contratosExistentes={contratos}
        contractToEdit={editingContract}
        onSuccess={cargarContratos}
      />
    </Box>
  );
}
