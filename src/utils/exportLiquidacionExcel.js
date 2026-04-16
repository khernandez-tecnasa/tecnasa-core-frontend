/**
 * exportLiquidacionExcel.js
 *
 * Carga la plantilla pública /templates/Liquidacion.xlsx e inserta
 * los datos de la liquidación en las celdas exactas del template.
 *
 * Estructura del template (hoja "Formato Liquidacion"):
 *
 *  ENCABEZADO
 *    B11      → Nombre del empleado
 *    K11      → Fecha de cierre (fecha_regreso)
 *    D12–J12  → Fechas de los 7 días de la semana (lunes → domingo)
 *
 *  GASTOS — filas × columnas(día)
 *    Columnas D–J = lunes(0) a domingo(6) de la semana de fecha_salida
 *    Columna  K   = total de la fila (calculado en JS)
 *
 *    Fila 14 ← COMBUSTIBLE  ("Factura de combustible")
 *    Fila 16 ← PEAJE
 *    Fila 24 ← HOSPEDAJE
 *    Fila 25 ← IMPREVISTO   ("Otros")
 *    Fila 26 ← DESAYUNO
 *    Fila 27 ← ALMUERZO
 *    Fila 28 ← CENA
 *
 *  TOTALES INTERMEDIOS (fila, celdas D–K)
 *    Fila 22 → Total transporte    (suma filas 14–21)
 *    Fila 29 → Subtotal comidas    (suma filas 26–28)
 *    Fila 30 → Total hosp+comidas  (filas 24+25+29)
 *    Fila 37 → Total otros         (filas 32–36, no usadas → 0)
 *    Fila 38 → Total por día       (22+30+37)
 *
 *  SUMARIO (columna K)
 *    K41 → Total gastos
 *    K42 → Asignación de viáticos   (total_asignado)
 *    K43 → Valor pendiente empresa  (gastado > asignado)
 *    K44 → Valor pendiente empleado (asignado > gastado)
 *
 *  PROPÓSITO
 *    A41 → motivo_viaje / observaciones   (merge A41:G42)
 *    E46 → Fecha de presentación
 *
 * @param {object} liquidacion  { empleado_nombre, fecha_salida, fecha_regreso,
 *                                motivo_viaje, total_asignado, observaciones }
 * @param {Array}  detalles     [ { tipo, cantidad, precio_unitario, fecha } ]
 */

import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// ─── Mapeo tipo-backend → fila del template ───────────────────────────────────
const TIPO_A_FILA = {
  COMBUSTIBLE: 14,
  PEAJE: 16,
  HOSPEDAJE: 24,
  IMPREVISTO: 25,
  DESAYUNO: 26,
  ALMUERZO: 27,
  CENA: 28,
};

// Columnas D–J = índices de día 0 (lun) … 6 (dom)
const DIA_COLS = ["D", "E", "F", "G", "H", "I", "J"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Devuelve el Date del lunes de la semana que contiene dateStr */
function getLunes(dateStr) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay(); // 0=dom
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return d;
}

/** Índice de columna (0=lun … 6=dom) para una fecha dada */
function diaIndex(dateStr, lunes) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const idx = Math.round((d - lunes) / 86400000);
  return idx >= 0 && idx <= 6 ? idx : null;
}

function fechaStr(d) {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

// ─── Función principal ────────────────────────────────────────────────────────

export async function exportLiquidacionExcel(liquidacion, detalles) {
  // 1. Cargar plantilla
  const res = await fetch("/Public/templates/Liquidacion.xlsx");
  if (!res.ok) throw new Error("No se pudo cargar /templates/Liquidacion.xlsx");
  const buffer = await res.arrayBuffer();

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];

  // 2. Semana de referencia
  const lunes = getLunes(liquidacion.fecha_salida || new Date().toISOString());

  // 3. Grilla de acumulación: grid[fila][diaIdx] = monto
  const filas = [...new Set(Object.values(TIPO_A_FILA))];
  const grid = {};
  filas.forEach((f) => {
    grid[f] = [0, 0, 0, 0, 0, 0, 0];
  });

  for (const d of detalles) {
    const fila = TIPO_A_FILA[(d.tipo || "").toUpperCase()];
    if (!fila) continue; // tipo sin fila → ignorar
    const idx = diaIndex(d.fecha, lunes);
    if (idx === null) continue; // fecha fuera de la semana
    grid[fila][idx] +=
      (Number(d.cantidad) || 0) * (Number(d.precio_unitario) || 0);
  }

  // 4. Totales por tipo (columna K de cada fila)
  const kTotal = {};
  filas.forEach((f) => {
    kTotal[f] = grid[f].reduce((a, b) => a + b, 0);
  });

  // 5. Totales intermedios por día
  const transporteDia = DIA_COLS.map((_, i) => grid[14][i] + grid[16][i]);
  const comidasDia = DIA_COLS.map(
    (_, i) => grid[26][i] + grid[27][i] + grid[28][i],
  );
  const hospDia = DIA_COLS.map((_, i) => grid[24][i] + grid[25][i]);
  const grandDia = DIA_COLS.map(
    (_, i) => transporteDia[i] + hospDia[i] + comidasDia[i],
  );

  const totalGastado = grandDia.reduce((a, b) => a + b, 0);
  const totalAsignado = Number(liquidacion.total_asignado || 0);
  const pendEmpresa =
    totalGastado > totalAsignado
      ? +(totalGastado - totalAsignado).toFixed(2)
      : 0;
  const pendEmpleado =
    totalAsignado > totalGastado
      ? +(totalAsignado - totalGastado).toFixed(2)
      : 0;

  // ── Escribir en el template ───────────────────────────────────────────────

  // Encabezado
  ws.getCell("B11").value = liquidacion?.empleado_nombre || "";
  ws.getCell("K11").value = fechaStr(
    new Date(liquidacion.fecha_regreso || lunes),
  );

  // Fechas fila 12 (el template usa formato d-mmm, respetamos el valor Date)
  DIA_COLS.forEach((col, i) => {
    const d = new Date(lunes);
    d.setDate(d.getDate() + i);
    ws.getCell(`${col}12`).value = d;
  });

  // Gastos por celda (D–J por fila de tipo)
  filas.forEach((fila) => {
    grid[fila].forEach((monto, i) => {
      if (monto > 0) ws.getCell(`${DIA_COLS[i]}${fila}`).value = monto;
    });
    if (kTotal[fila] > 0) ws.getCell(`K${fila}`).value = kTotal[fila];
  });

  // Fila 22 — Total transporte
  DIA_COLS.forEach((col, i) => {
    if (transporteDia[i] > 0) ws.getCell(`${col}22`).value = transporteDia[i];
  });
  const kTransporte = transporteDia.reduce((a, b) => a + b, 0);
  if (kTransporte > 0) ws.getCell("K22").value = kTransporte;

  // Fila 29 — Subtotal comidas
  DIA_COLS.forEach((col, i) => {
    if (comidasDia[i] > 0) ws.getCell(`${col}29`).value = comidasDia[i];
  });
  const kComidas = comidasDia.reduce((a, b) => a + b, 0);
  if (kComidas > 0) ws.getCell("K29").value = kComidas;

  // Fila 30 — Total hosp + comidas
  DIA_COLS.forEach((col, i) => {
    const v = hospDia[i] + comidasDia[i];
    if (v > 0) ws.getCell(`${col}30`).value = v;
  });
  const kHospComidas = hospDia.reduce((a, b) => a + b, 0) + kComidas;
  if (kHospComidas > 0) ws.getCell("K30").value = kHospComidas;

  // Fila 37 — Total otros (filas 32–36 no mapeadas → todos 0, dejamos el template intacto)

  // Fila 38 — Total por día
  DIA_COLS.forEach((col, i) => {
    if (grandDia[i] > 0) ws.getCell(`${col}38`).value = grandDia[i];
  });
  if (totalGastado > 0) ws.getCell("K38").value = totalGastado;

  // Sumario
  ws.getCell("K41").value = totalGastado;
  ws.getCell("K42").value = totalAsignado;
  ws.getCell("K43").value = pendEmpresa > 0 ? pendEmpresa : "0.00";
  ws.getCell("K44").value = pendEmpleado > 0 ? pendEmpleado : "0.00";

  // Propósito (A41, merge A41:G42)
  ws.getCell("A41").value =
    liquidacion.observaciones || liquidacion.motivo_viaje || "";

  // Fecha de presentación
  ws.getCell("E46").value = new Date();

  // ── Descargar ─────────────────────────────────────────────────────────────
  const outBuffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([outBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const getTimestamp = () => {
    const now = new Date();

    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");

    const hh = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");

    return `${yyyy}${mm}${dd}${hh}${min}${ss}`;
  };

  const clean = (text) =>
    (text || "").replace(/\s+/g, "_").replace(/[^\w]/g, "");

  const nombre = (liquidacion.empleado_nombre || "empleado").replace(
    /\s+/g,
    "_",
  );

  const timestamp = getTimestamp();

  const fileName = `Liquidacion_${clean(nombre)}_${timestamp}`;
  const fechaSal = String(liquidacion.fecha_salida || "").split("T")[0];
  saveAs(blob, `${fileName}.xlsx`);
}
