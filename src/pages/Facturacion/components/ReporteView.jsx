import React from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Stack,
  Button,
  Sheet,
  Table,
} from "@mui/joy";

// Iconos
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ConstructionIcon from "@mui/icons-material/Construction";
import PrintIcon from "@mui/icons-material/Print";

// Utilidades
import { generarProformaPDF } from "../../../utils/ReportePDFHelper"; // Ajusta la ruta si es necesario

export default function ReporteView({
  reporte,
  cliente,
  onGestionarReemplazos,
}) {
  // Helper de Formato de Moneda
  const formatMoney = (amount) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);

  // Manejo de PDF interno (usa el prop 'cliente' para el nombre del archivo)
  const handleDescargarPDF = () => {
    const nombreCliente =
      cliente?.nombre || cliente?.nombre_cliente || "Cliente";
    generarProformaPDF(reporte, nombreCliente);
  };

  if (!reporte) return null;

  return (
    <Grid container spacing={3} sx={{ animation: "fadeIn 0.3s ease-out" }}>
      {/* 1. RESUMEN Y ACCIONES (Columna Izquierda en PC) */}
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
          {onGestionarReemplazos && (
            <Button
              variant="soft"
              color="warning"
              size="lg"
              startDecorator={<ConstructionIcon />}
              onClick={onGestionarReemplazos}
              sx={{ width: "100%" }}>
              Gestionar Reemplazos / Bajas
            </Button>
          )}

          <Button
            variant="outlined"
            color="neutral"
            size="lg"
            startDecorator={<PrintIcon />}
            onClick={handleDescargarPDF}
            sx={{ width: "100%" }}>
            Descargar PDF
          </Button>
        </Stack>
      </Grid>

      {/* 2. DETALLE POR CONTRATO (Columna Derecha) */}
      <Grid xs={12} lg={8}>
        {reporte.detalles.map((contratoData, idx) => (
          <Sheet
            key={idx}
            variant="outlined"
            sx={{ mb: 3, borderRadius: "md", overflow: "hidden" }}>
            {/* Encabezado del Contrato */}
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

            {/* Cuerpo del Detalle */}
            <Box sx={{ p: 2 }}>
              {/* A. Items Individuales */}
              {contratoData.items_individuales.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography
                    level="title-sm"
                    color="neutral"
                    sx={{ mb: 1, fontSize: "0.75rem", letterSpacing: "1px" }}>
                    COBRO INDIVIDUAL
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
                      {contratoData.items_individuales.map((item, i) => (
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
                      ))}
                    </tbody>
                  </Table>
                </Box>
              )}

              {/* B. Grupos y Bolsones */}
              {contratoData.grupos_bolsones.length > 0 && (
                <Box>
                  <Typography
                    level="title-sm"
                    color="neutral"
                    sx={{ mb: 1, fontSize: "0.75rem", letterSpacing: "1px" }}>
                    GRUPOS Y BOLSONES
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
                        <Box sx={{ display: "flex", gap: 3, mr: 2 }}>
                          <Box>
                            <Typography level="body-xs">Bolsa M</Typography>
                            <Typography level="body-sm" fontWeight="bold">
                              {grupo.bolsa_mono}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography level="body-xs">Excedente</Typography>
                            <Typography
                              level="body-sm"
                              color={
                                grupo.excedente_mono > 0 ? "danger" : "neutral"
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

            {/* Footer con Subtotal del Contrato */}
            <Box
              sx={{
                p: 1,
                bgcolor: "background.level1",
                borderTop: "1px solid",
                textAlign: "right",
              }}>
              <Typography level="body-sm">
                Subtotal: <b>{formatMoney(contratoData.subtotal_contrato)}</b>
              </Typography>
            </Box>
          </Sheet>
        ))}
      </Grid>
    </Grid>
  );
}
