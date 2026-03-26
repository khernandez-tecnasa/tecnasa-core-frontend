import React, { useState, useEffect } from "react";
import { Grid, CircularProgress, Box } from "@mui/joy";

// Servicios
import { FacturacionService } from "../../../services/FacturacionServices";
import { getClientes } from "../../../services/ClientesServices";

// Componentes Hijos
import BillingSidebar from "../components/BillingSidebar";
import BillingWorkspace from "../components/BillingWorkspace";
import PeriodoOverview from "../components/PeriodoOverview";

export default function FacturacionHub() {
  const [periodos, setPeriodos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [selectedPeriodoId, setSelectedPeriodoId] = useState(null);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [loading, setLoading] = useState(true);

  // Carga Inicial
  const loadGlobalData = async () => {
    try {
      const [pData, cData] = await Promise.all([
        FacturacionService.getPeriodos(),
        getClientes(),
      ]);
      setPeriodos(pData || []);
      setClientes(cData || []);

      // Si no hay periodo seleccionado, elegir el 'Abierto' o el primero
      if (!selectedPeriodoId && pData?.length > 0) {
        const activo = pData.find((p) => p.estado === "Abierto") || pData[0];
        setSelectedPeriodoId(activo.id);
      }
    } catch (error) {
      console.error("Error cargando dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGlobalData();
  }, []);

  if (loading)
    return (
      <Box
        sx={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
        }}>
        <CircularProgress size="lg" />
      </Box>
    );

  return (
    <Grid container sx={{ height: "calc(100vh - 60px)", overflow: "hidden" }}>
      {/* 1. SIDEBAR: Navegación y Filtros */}
      <Grid
        xs={12}
        md={3}
        lg={2.5}
        sx={{
          borderRight: "1px solid #ddd",
          height: "100%",
          bgcolor: "background.surface",
        }}>
        <BillingSidebar
          periodos={periodos}
          clientes={clientes}
          selectedPeriodoId={selectedPeriodoId}
          onPeriodoChange={setSelectedPeriodoId}
          selectedCliente={selectedCliente}
          onSelectCliente={setSelectedCliente}
        />
      </Grid>

      {/* 2. WORKSPACE: Área de Trabajo */}
      <Grid
        xs={12}
        md={9}
        lg={9.5}
        sx={{
          height: "100%",
          overflowY: "auto",
          bgcolor: "background.level1",
          p: { xs: 2, md: 3 },
        }}>
        {selectedCliente ? (
          <BillingWorkspace
            periodoId={selectedPeriodoId}
            cliente={selectedCliente}
            onBack={() => setSelectedCliente(null)}
          />
        ) : (
          <PeriodoOverview
            periodos={periodos}
            selectedPeriodoId={selectedPeriodoId}
            onReload={loadGlobalData}
          />
        )}
      </Grid>
    </Grid>
  );
}
