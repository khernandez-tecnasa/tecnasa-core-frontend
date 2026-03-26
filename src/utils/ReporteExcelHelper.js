import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// Helper Nombre Periodo
const getNombrePeriodo = (texto) => {
  if (!texto) return "";
  const parts = texto.split("/");
  if (parts.length < 2) return texto.toUpperCase();
  const mesIndex = parseInt(parts[0], 10) - 1;
  const anio = parts[1];
  const meses = [
    "ENERO",
    "FEBRERO",
    "MARZO",
    "ABRIL",
    "MAYO",
    "JUNIO",
    "JULIO",
    "AGOSTO",
    "SEPTIEMBRE",
    "OCTUBRE",
    "NOVIEMBRE",
    "DICIEMBRE",
  ];
  return `${meses[mesIndex]} ${anio}`;
};

// Agrupación para Resumen
const agruparItemsParaResumen = (items) => {
  const grupos = {};
  items.forEach((item) => {
    const rentPrice = parseFloat(item.precio_renta || 0);
    const monoPrice = parseFloat(item.precio_clic_mono || 0);
    const colorPrice = parseFloat(item.precio_clic_color || 0);
    const key = `${item.modelo}-${rentPrice.toFixed(4)}-${monoPrice.toFixed(4)}-${colorPrice.toFixed(4)}`;

    if (!grupos[key]) {
      grupos[key] = {
        modelo: item.modelo || "Equipo General",
        cantidad: 0,
        precio_renta_unit: rentPrice,
        total_renta: 0,
        volumen_mono: 0,
        precio_clic_mono: monoPrice,
        total_dinero_mono: 0,
        volumen_color: 0,
        precio_clic_color: colorPrice,
        total_dinero_color: 0,
        total_linea: 0,
      };
    }
    grupos[key].cantidad += 1;
    grupos[key].total_renta += rentPrice;
    const usoMono = Number(item.uso_mono || 0);
    const usoColor = Number(item.uso_color || 0);
    grupos[key].volumen_mono += usoMono;
    grupos[key].total_dinero_mono += usoMono * monoPrice;
    grupos[key].volumen_color += usoColor;
    grupos[key].total_dinero_color += usoColor * colorPrice;
    grupos[key].total_linea +=
      rentPrice + usoMono * monoPrice + usoColor * colorPrice;
  });
  return Object.values(grupos);
};

function renderDetalleTitulo(worksheet, row, texto) {
  worksheet.mergeCells(`B${row}:Q${row}`);
  const cell = worksheet.getCell(`B${row}`);
  cell.value = texto;
  cell.font = { name: "Arial", size: 12, bold: true };
  cell.alignment = { horizontal: "left" };
  return row + 1;
}

// ==========================================
// FUNCIÓN MEJORADA v3: CON LINEAS DE EXCEDENTES
// ==========================================
function dibujarTablaResumen(
  worksheet,
  startRow,
  titulo,
  items,
  styles,
  datosBolson = null,
) {
  let currentRow = startRow;

  // 1. Título
  worksheet.mergeCells(`C${currentRow}:M${currentRow}`);
  const titleSum = worksheet.getCell(`C${currentRow}`);
  titleSum.value = titulo.toUpperCase();
  titleSum.style = styles.title;
  worksheet.getRow(currentRow).height = 20;
  currentRow += 2;

  // 2. Cabeceras
  const headerRow = worksheet.getRow(currentRow);
  headerRow.height = 25;

  const headersSum = [
    { col: 3, val: "Modelo / Concepto", style: styles.headerGreen },
    { col: 4, val: "Cantidad", style: styles.headerGreen },
    { col: 5, val: "Precio Lease", style: styles.headerGreen },
    { col: 6, val: "Total Lease", style: styles.headerGreen },
    { col: 7, val: "Impresiones B/N", style: styles.headerBlack },
    { col: 8, val: "Precio B/N", style: styles.headerBlack },
    { col: 9, val: "Total B/N", style: styles.headerBlack },
    { col: 10, val: "Impresiones Color", style: styles.headerBlue },
    { col: 11, val: "Precio Color", style: styles.headerBlue },
    { col: 12, val: "Total Color", style: styles.headerBlue },
    { col: 13, val: "Total General", style: styles.headerWhite },
  ];

  headersSum.forEach((h) => {
    const cell = headerRow.getCell(h.col);
    cell.value = h.val;
    cell.font = h.style.font;
    cell.fill = h.style.fill;
    cell.border = h.style.border;
    cell.alignment = h.style.alignment;
  });

  const tableStartRow = currentRow;
  currentRow++;

  // 3. Procesar IMPRESORAS (Agrupadas)
  const gruposResumen = agruparItemsParaResumen(items);
  let sumaCalculada = 0;

  gruposResumen.forEach((g) => {
    const row = worksheet.getRow(currentRow);
    row.values = [
      null,
      null,
      g.modelo,
      g.cantidad,
      g.precio_renta_unit,
      g.total_renta,
      g.volumen_mono,
      g.precio_clic_mono,
      g.total_dinero_mono,
      g.volumen_color,
      g.precio_clic_color,
      g.total_dinero_color,
      g.total_linea,
    ];
    applyRowStylesResumen(row, styles);
    sumaCalculada += g.total_linea;
    currentRow++;
  });

  // 4. AGREGAR LINEAS DE EXCEDENTES (SOLO SI ES BOLSÓN)
  if (datosBolson) {
    // A. Línea de Excedentes B/N
    const excMonoQty = parseFloat(datosBolson.excedente_mono || 0);
    if (excMonoQty > 0) {
      const rowMono = worksheet.getRow(currentRow);
      const precioUnitario = parseFloat(
        datosBolson.precio_unitario_excedente_mono || 0,
      );
      const totalDinero = parseFloat(datosBolson.dinero_excedente_mono || 0);

      // Texto dinámico: Mensual o Anual
      const etiqueta =
        datosBolson.frecuencia === "ANUAL" && totalDinero === 0
          ? "EXCEDENTES B/N (ACUMULADO ANUAL)"
          : `EXCEDENTES B/N (${datosBolson.frecuencia || "MENSUAL"})`;

      rowMono.values = [
        null,
        null,
        etiqueta, // C - Concepto
        1, // D
        0,
        0, // E, F (Lease 0)
        excMonoQty, // G - Cantidad Excedente
        precioUnitario, // H - Precio Configurado
        totalDinero, // I - Total (Será 0 si es anual y no es cierre)
        0,
        0,
        0, // J, K, L (Color 0)
        totalDinero, // M - Total General Linea
      ];
      applyRowStylesResumen(rowMono, styles);
      // Poner en negrita el título
      rowMono.getCell(3).font = {
        name: "Arial",
        size: 12,
        bold: true,
        italic: true,
      };
      currentRow++;
    }

    // B. Línea de Excedentes Color
    const excColorQty = parseFloat(datosBolson.excedente_color || 0);
    if (excColorQty > 0) {
      const rowColor = worksheet.getRow(currentRow);
      const precioUnitario = parseFloat(
        datosBolson.precio_unitario_excedente_color || 0,
      );
      const totalDinero = parseFloat(datosBolson.dinero_excedente_color || 0);

      const etiqueta =
        datosBolson.frecuencia === "ANUAL" && totalDinero === 0
          ? "EXCEDENTES COLOR (ACUMULADO ANUAL)"
          : `EXCEDENTES COLOR (${datosBolson.frecuencia || "MENSUAL"})`;

      rowColor.values = [
        null,
        null,
        etiqueta, // C
        1, // D
        0,
        0, // E, F
        0,
        0,
        0, // G, H, I
        excColorQty, // J
        precioUnitario, // K
        totalDinero, // L
        totalDinero, // M
      ];
      applyRowStylesResumen(rowColor, styles);
      rowColor.getCell(3).font = {
        name: "Arial",
        size: 12,
        bold: true,
        italic: true,
      };
      currentRow++;
    }
  }

  const tableEndRow = currentRow - 1;

  // 5. Bordes Exteriores
  for (let r = tableStartRow; r <= tableEndRow; r++) {
    const cellLeft = worksheet.getCell(r, 3);
    cellLeft.border = { ...cellLeft.border, left: { style: "medium" } };
    const cellRight = worksheet.getCell(r, 13);
    cellRight.border = { ...cellRight.border, right: { style: "medium" } };
  }
  for (let c = 3; c <= 13; c++) {
    const cellBot = worksheet.getCell(tableEndRow, c);
    cellBot.border = { ...cellBot.border, bottom: { style: "medium" } };
  }
  for (let c = 3; c <= 13; c++) {
    const cellHead = worksheet.getCell(tableStartRow, c);
    cellHead.border = {
      top: { style: "medium" },
      bottom: { style: "medium" },
      left: c === 3 ? { style: "medium" } : { style: "thin" },
      right: c === 13 ? { style: "medium" } : { style: "thin" },
    };
  }

  // 6. TOTALES AL PIE
  // Si datosBolson existe, usamos SU total final (que ya incluye base + excedentes calculados por backend)
  // Si no existe (individuales), usamos la suma calculada de las filas.
  const subtotalFinal = datosBolson
    ? parseFloat(datosBolson.total_pagar)
    : sumaCalculada;
  const isvFinal = subtotalFinal * 0.15;
  const totalFinal = subtotalFinal + isvFinal;

  currentRow++;

  const setTableTotal = (label, value, isTotal) => {
    const row = worksheet.getRow(currentRow++);
    const cellLabel = row.getCell(12);
    const cellValue = row.getCell(13);
    cellLabel.value = label;
    cellValue.value = value;
    const styleBase = {
      font: { name: "Arial", size: 12, bold: true },
      alignment: { horizontal: "right" },
    };
    if (isTotal) {
      const darkStyle = {
        ...styleBase,
        font: { ...styleBase.font, color: { argb: "FFFFFFFF" } },
        fill: {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF000000" },
        },
      };
      cellLabel.style = darkStyle;
      cellValue.style = darkStyle;
      cellValue.numFmt = '"$" #,##0.00';
    } else {
      cellLabel.style = styleBase;
      cellValue.style = styleBase;
      cellValue.numFmt = styles.currency;
      cellValue.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    }
  };

  setTableTotal("SUBTOTAL:", subtotalFinal, false);
  setTableTotal("ISV (15%):", isvFinal, false);
  setTableTotal("TOTAL:", totalFinal, true);

  currentRow += 2;
  return currentRow;
}

export const generarProformaExcel = async (reporte, clienteNombre) => {
  const workbook = new ExcelJS.Workbook();
  const periodoNombre = getNombrePeriodo(reporte.periodo_texto);
  const nombreCliente = clienteNombre.toUpperCase();
  const sheetName =
    periodoNombre.length > 30 ? periodoNombre.substring(0, 30) : periodoNombre;
  const worksheet = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: false }],
  });

  // --- 1. DEFINICIÓN DE COLUMNAS (AHORA DESDE B) ---
  // A: Vacía (Margen)
  // B: No, C: Cliente, D: Area, E: Serie, F: Modelo, G: Lease, H-L: Mono, M-Q: Color
  worksheet.columns = [
    { width: 3 }, // A
    { key: "col_b", width: 4 }, // B: No
    { key: "col_c", width: 24 }, // C: Cliente
    { key: "col_d", width: 24 }, // D: Area
    { key: "col_e", width: 18 }, // E: Serie
    { key: "col_f", width: 14 }, // F: Modelo
    { key: "col_g", width: 20 }, // G: Lease
    { key: "col_h", width: 15 }, // H: Ini M
    { key: "col_i", width: 12 }, // I: Fin M
    { key: "col_j", width: 22 }, // J: Uso M
    { key: "col_k", width: 15 }, // K: Pre M
    { key: "col_l", width: 22 }, // L: Tot M
    { key: "col_m", width: 16 }, // M: Ini C
    { key: "col_n", width: 13 }, // N: Fin C
    { key: "col_o", width: 14 }, // O: Uso C
    { key: "col_p", width: 15 }, // P: Pre C
    { key: "col_q", width: 14 }, // Q: Tot C
  ];

  const fontBase = { name: "Arial", size: 12 }; // Detalle un poco más chico
  const borderThin = { style: "thin" };
  const borderThick = { style: "medium" };

  const styles = {
    title: {
      font: {
        name: "Arial",
        size: 12,
        bold: true,
        color: { argb: "FFFFFFFF" },
      },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF000000" },
      },
      alignment: { horizontal: "center", vertical: "middle" },
    },
    headerGreen: {
      font: { name: "Arial", size: 12, bold: true },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFA9D08E" },
      },
      alignment: { horizontal: "center", vertical: "middle", wrapText: true },
      border: {
        top: borderThick,
        bottom: borderThin,
        right: borderThin,
        left: borderThin,
      },
    },
    headerBlack: {
      font: {
        name: "Arial",
        size: 12,
        bold: true,
        color: { argb: "FFFFFFFF" },
      },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF000000" },
      },
      alignment: { horizontal: "center", vertical: "middle", wrapText: true },
      border: {
        top: borderThick,
        bottom: borderThin,
        right: borderThin,
        left: borderThin,
      },
    },
    headerBlue: {
      font: {
        name: "Arial",
        size: 12,
        bold: true,
        color: { argb: "FFFFFFFF" },
      },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0070C0" },
      },
      alignment: { horizontal: "center", vertical: "middle", wrapText: true },
      border: {
        top: borderThick,
        bottom: borderThin,
        right: borderThin,
        left: borderThin,
      },
    },
    cellData: {
      font: fontBase,
      alignment: { vertical: "middle" },
      border: {
        top: borderThin,
        left: borderThin,
        bottom: borderThin,
        right: borderThin,
      },
    },
    headerWhite: {
      font: {
        name: "Arial",
        size: 12,
        bold: true,
        color: { argb: "00000000" },
      },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFFFF" },
      },
      alignment: { horizontal: "center", vertical: "middle", wrapText: true },
      border: {
        top: borderThick,
        bottom: borderThin,
        left: borderThin,
        right: borderThick,
      },
    },
    currency: '"$" #,##0.00',
    currency4: '"$" #,##0.0000',
    number: "#,##0",
  };

  // =========================================================
  // SECCIÓN 1: DETALLE DE EQUIPOS
  // =========================================================

  worksheet.mergeCells("B2:Q2");
  const titleCell = worksheet.getCell("B2");
  titleCell.value = `DETALLE DE EQUIPOS - ${nombreCliente} - ${periodoNombre}`;
  titleCell.style = styles.title;
  worksheet.getRow(2).height = 20;
  worksheet.addRow([]);

  // Cabecera Detalle (Fila 4)
  const headerRow = worksheet.getRow(4);
  headerRow.height = 25;

  const headers = [
    { col: 2, val: "N°", style: styles.headerGreen },
    { col: 3, val: "Cliente", style: styles.headerGreen },
    { col: 4, val: "Area", style: styles.headerGreen },
    { col: 5, val: "Serie", style: styles.headerGreen },
    { col: 6, val: "Modelo", style: styles.headerGreen },
    { col: 7, val: "Monthly Lease", style: styles.headerGreen },
    // Mono
    { col: 8, val: "Inicio Mono", style: styles.headerBlack },
    { col: 9, val: "Fin Mono", style: styles.headerBlack },
    { col: 10, val: "Uso Mono", style: styles.headerBlack },
    { col: 11, val: "Precio Mono", style: styles.headerBlack },
    { col: 12, val: "Total Mono", style: styles.headerBlack },
    // Color
    { col: 13, val: "Inicio Color", style: styles.headerBlue },
    { col: 14, val: "Fin Color", style: styles.headerBlue },
    { col: 15, val: "Uso Color", style: styles.headerBlue },
    { col: 16, val: "Precio Color", style: styles.headerBlue },
    { col: 17, val: "Total Color", style: styles.headerBlue },
  ];

  headers.forEach((h) => {
    const cell = headerRow.getCell(h.col);
    cell.value = h.val;
    cell.font = h.style.font;
    cell.fill = h.style.fill;
    cell.border = h.style.border;
    cell.alignment = h.style.alignment;
  });

  // Datos Detalle
  let currentRow = 5;
  let contadorItems = 1;
  const firstDetailRow = 5;

  reporte.detalles.forEach((contrato) => {
    // ===== EQUIPOS INDIVIDUALES =====
    if (contrato.items_individuales?.length > 0) {
      contrato.items_individuales.forEach((item) => {
        const row = worksheet.getRow(currentRow);

        const totalMono =
          (item.uso_mono || 0) * (parseFloat(item.precio_clic_mono) || 0);
        const totalColor =
          (item.uso_color || 0) * (parseFloat(item.precio_clic_color) || 0);

        row.values = [
          null,
          contadorItems++,
          nombreCliente,
          item.area || "N/A",
          item.serial,
          item.modelo,
          parseFloat(item.precio_renta),
          item.inicio_mono,
          item.fin_mono,
          item.uso_mono,
          parseFloat(item.precio_clic_mono),
          totalMono,
          item.inicio_color,
          item.fin_color,
          item.uso_color,
          parseFloat(item.precio_clic_color),
          totalColor,
        ];

        // estilos (NO CAMBIA)
        for (let c = 2; c <= 17; c++) {
          const cell = row.getCell(c);
          cell.font = styles.cellData.font;
          cell.border = styles.cellData.border;
          cell.alignment = styles.cellData.alignment;

          if (c === 2) {
            cell.numFmt = "0";
            cell.alignment = { horizontal: "center" };
          }

          if ([3, 4, 5, 6].includes(c)) {
            cell.alignment = { horizontal: "left" };
          }

          if ([7, 8, 9, 10, 13, 14, 15].includes(c)) {
            cell.numFmt = "0";
            cell.alignment = { horizontal: "center" };
          }

          if ([7, 12, 17].includes(c)) {
            cell.numFmt = styles.currency;
            cell.alignment = { horizontal: "right" };
          }

          if ([11, 16].includes(c)) {
            cell.numFmt = styles.currency4;
            cell.alignment = { horizontal: "right" };
          }
        }

        currentRow++;
      });
    }

    // ===== GRUPOS / BOLSONES =====
    if (contrato.grupos_bolsones?.length > 0) {
      contrato.grupos_bolsones.forEach((grupo) => {
        grupo.items_detalle.forEach((item) => {
          const row = worksheet.getRow(currentRow);

          row.values = [
            null,
            contadorItems++,
            nombreCliente,
            item.area || "N/A",
            item.serial,
            item.modelo,
            item.precio_renta,
            item.inicio_mono,
            item.fin_mono,
            item.uso_mono,
            item.precio_mono,
            item.total_mono,
            item.inicio_color,
            item.fin_color,
            item.uso_color,
            item.precio_color,
            item.total_color,
          ];

          for (let c = 2; c <= 17; c++) {
            const cell = row.getCell(c);
            cell.font = styles.cellData.font;
            cell.border = styles.cellData.border;
            cell.alignment = styles.cellData.alignment;
          }

          currentRow++;
        });

        // TOTAL DEL GRUPO
        // const totalRow = worksheet.getRow(currentRow++);
        // totalRow.getCell(16).value = "TOTAL GRUPO:";
        // totalRow.getCell(17).value = parseFloat(grupo.total_pagar);
        // totalRow.getCell(17).numFmt = styles.currency;
      });
    }
  });

  const lastDetailRow = currentRow - 1;

  // ===== BORDES TABLA DETALLE (ORDEN CORRECTO) =====

  // 1. TODOS los bordes delgados
  for (let r = 4; r <= lastDetailRow; r++) {
    for (let c = 2; c <= 17; c++) {
      worksheet.getCell(r, c).border = {
        top: borderThin,
        bottom: borderThin,
        left: borderThin,
        right: borderThin,
      };
    }
  }

  // 2. Borde EXTERIOR grueso
  for (let r = 4; r <= lastDetailRow; r++) {
    worksheet.getCell(r, 2).border.left = borderThick;
    worksheet.getCell(r, 17).border.right = borderThick;
  }

  for (let c = 2; c <= 17; c++) {
    worksheet.getCell(4, c).border.top = borderThick;
    worksheet.getCell(lastDetailRow, c).border.bottom = borderThick;
  }

  // 3. Encabezados con contorno grueso
  for (let c = 2; c <= 17; c++) {
    worksheet.getCell(4, c).border = {
      top: borderThick,
      bottom: borderThick,
      left: c === 2 ? borderThick : borderThin,
      right: c === 17 ? borderThick : borderThin,
    };
  }

  // =========================================================
  // SECCIÓN 2: RESUMEN GENERAL (DINÁMICO)
  // =========================================================

  currentRow += 3;

  reporte.detalles.forEach((contrato) => {
    // A. TABLA PARA ITEMS SUELTOS
    // NO pasamos subtotal manual, así que la función lo CALCULARÁ sumando las filas.
    if (contrato.items_individuales?.length > 0) {
      const tituloTabla = `SERVICIO DE IMPRESIÓN ADMINISTRADA - ${clienteNombre} - ${periodoNombre}`;
      currentRow = dibujarTablaResumen(
        worksheet,
        currentRow,
        tituloTabla,
        contrato.items_individuales,
        styles,
        // Sin último parametro -> Calcula automático
      );
    }

    // B. TABLAS PARA CADA GRUPO
    // SI pasamos subtotal manual (grupo.total_pagar).
    if (contrato.grupos_bolsones?.length > 0) {
      contrato.grupos_bolsones.forEach((grupo) => {
        if (grupo.items_detalle?.length > 0) {
          const tituloGrupo = `SERVICIO DE IMPRESIÓN ADMINISTRADA - ${grupo.nombre_grupo} - ${periodoNombre}`;

          currentRow = dibujarTablaResumen(
            worksheet,
            currentRow,
            tituloGrupo,
            grupo.items_detalle,
            styles,
            grupo,
          );
        }
      });
    }
  });

  // --- TOTALES FINALES ---
  //   currentRow++;
  //   const rSub = worksheet.getRow(currentRow++);
  //   const rIsv = worksheet.getRow(currentRow++);
  //   const rTot = worksheet.getRow(currentRow++);

  //   const setTotalRow = (row, label, value, isTotal = false) => {
  //     const lbl = row.getCell(12);
  //     const val = row.getCell(13);
  //     lbl.value = label;
  //     val.value = value;

  //     const baseStyle = {
  //       font: { name: "Arial", size: 12, bold: true },
  //       alignment: { horizontal: "right" },
  //     };

  //     if (isTotal) {
  //       const darkStyle = {
  //         ...baseStyle,
  //         font: { ...baseStyle.font, color: { argb: "FFFFFFFF" } },
  //         fill: {
  //           type: "pattern",
  //           pattern: "solid",
  //           fgColor: { argb: "FF000000" },
  //         },
  //       };
  //       lbl.style = darkStyle;
  //       val.style = darkStyle;
  //       val.numFmt = '"$" #,##0.00';
  //     } else {
  //       lbl.style = baseStyle;
  //       val.style = baseStyle;
  //       val.numFmt = styles.currency;
  //       val.border = {
  //         top: borderThin,
  //         bottom: borderThin,
  //         left: borderThin,
  //         right: borderThin,
  //       };
  //     }
  //   };

  //   setTotalRow(rSub, "SUBTOTAL:", reporte.subtotal_general);
  //   setTotalRow(rIsv, "ISV (15%):", reporte.isv_total);
  //   setTotalRow(rTot, "TOTAL GENERAL:", reporte.gran_total, true);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const fileName = `Proforma y Reporte de Contadores ${clienteNombre.replace(/\s+/g, "_")}_${periodoNombre.replace(" ", "_")}.xlsx`;
  saveAs(blob, fileName);
};

// Estilos Resumen (Base)
function applyRowStylesResumen(row, styles) {
  for (let c = 3; c <= 13; c++) {
    row.getCell(c).font = {
      name: "Arial",
      size: 12,
    };
  }

  row.getCell(3).alignment = { horizontal: "left" };
  row.getCell(4).alignment = { horizontal: "center" };

  [5, 6, 9, 12, 13].forEach((i) => {
    row.getCell(i).numFmt = styles.currency;
    row.getCell(i).alignment = { horizontal: "right" };
  });
  [8, 11].forEach((i) => {
    row.getCell(i).numFmt = styles.currency4;
    row.getCell(i).alignment = { horizontal: "right" };
  });
  [7, 10].forEach((i) => {
    row.getCell(i).numFmt = styles.number;
    row.getCell(i).alignment = { horizontal: "center" };
  });

  // Bordes base delgados (luego se sobrescriben los externos)
  for (let c = 3; c <= 13; c++) {
    row.getCell(c).border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
  }
}
