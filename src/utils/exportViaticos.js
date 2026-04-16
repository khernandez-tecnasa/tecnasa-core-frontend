import ExcelJS from "exceljs";

const styles = {
  boldFont: { bold: true },
  redBoldFont: { bold: true, color: { argb: "FFFF0000" } },
  centered: { vertical: "middle", horizontal: "center" },
  rightAligned: { vertical: "middle", horizontal: "right" },
  leftAligned: { vertical: "middle", horizontal: "left" },
  borderThin: {
    top: { style: "thin", color: { argb: "FF000000" } },
    left: { style: "thin", color: { argb: "FF000000" } },
    bottom: { style: "thin", color: { argb: "FF000000" } },
    right: { style: "thin", color: { argb: "FF000000" } },
  },
  borderMediumOuter: {
    top: { style: "medium" },
    left: { style: "medium" },
    bottom: { style: "medium" },
    right: { style: "medium" },
  },
  headerFont: { bold: true, size: 10, name: "Arial" },
  headerAlignment: {
    wrapText: true,
    vertical: "middle",
    horizontal: "center",
  },
};

// Convertir pixels a altura de fila
const pxToHeight = (px) => px / 1.333;
const pxToWidth = (px) => (px - 5) / 7;

function formatearFechaHora(fechaString) {
  if (!fechaString) return "";

  // Intentamos parsear manualmente para evitar desfases de zona horaria (UTC vs Local)
  try {
    const regex = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/;
    const match = String(fechaString).match(regex);

    if (match) {
      const [_, anio, mes, dia, hora24, min] = match;
      let hora = parseInt(hora24);
      const ampm = hora >= 12 ? "P.M" : "A.M";
      hora = hora % 12;
      hora = hora ? hora : 12;
      return `${hora}:${min} ${ampm} ${dia}-${mes}-${anio}`;
    }
  } catch (e) {
    console.error("Error parseando fecha en excel:", e);
  }

  // Fallback si el regex falla
  const date = new Date(fechaString);
  if (isNaN(date.getTime())) return fechaString;
  let horas = date.getHours();
  let minutos = date.getMinutes();
  const ampm = horas >= 12 ? "P.M" : "A.M";
  horas = horas % 12;
  horas = horas ? horas : 12;
  minutos = minutos < 10 ? "0" + minutos : minutos;
  const dia = date.getDate().toString().padStart(2, "0");
  const mes = (date.getMonth() + 1).toString().padStart(2, "0");
  const anio = date.getFullYear();
  return `${horas}:${minutos} ${ampm} ${dia}-${mes}-${anio}`;
}

function addSection(
  worksheet,
  systemRow,
  sectionLetter,
  sectionTitle,
  colHeaders,
  dataItems,
  minRows = 3,
) {
  let rIdx = systemRow;

  // 1. FILA DE ENCABEZADOS DE COLUMNA
  const rCols = worksheet.getRow(rIdx);
  rCols.height = pxToHeight(44);
  rCols.getCell("A").value = sectionLetter;
  rCols.getCell("B").value = sectionTitle;
  rCols.getCell("C").value = colHeaders[0];
  rCols.getCell("D").value = colHeaders[1];

  // worksheet.mergeCells(`E${rIdx}:F${rIdx}`);
  rCols.getCell("F").value = colHeaders[2];

  ["A", "B", "C", "D", "E", "F"].forEach((c) => {
    rCols.getCell(c).font = styles.boldFont;
    rCols.getCell(c).alignment = styles.headerAlignment;
    rCols.getCell(c).border = styles.borderMediumOuter;
    rCols.getCell(c).font = styles.headerFont;
    // if (c !== "A") rCols.getCell(c).border = styles.borderThin;
    // Lógica de bordes para crear un "contorno" desde B hasta F
    if (c === "B") {
      // Celda inicial del bloque: borde Izquierdo, Superior e Inferior
      rCols.getCell(c).border = {
        left: styles.borderMediumOuter.left,
        top: styles.borderMediumOuter.top,
        bottom: styles.borderMediumOuter.bottom,
      };
    } else if (c === "F") {
      // Celda final del bloque: borde Derecho, Superior e Inferior
      rCols.getCell(c).border = {
        right: styles.borderMediumOuter.right,
        top: styles.borderMediumOuter.top,
        bottom: styles.borderMediumOuter.bottom,
      };
    } else if (["C", "D", "E"].includes(c)) {
      // Celdas internas: solo borde Superior e Inferior
      rCols.getCell(c).border = {
        top: styles.borderMediumOuter.top,
        bottom: styles.borderMediumOuter.bottom,
      };
    }
  });
  rCols.getCell("A").border = {};
  rIdx++;

  const startItemRow = rIdx;

  let safeDataItems = dataItems ? [...dataItems] : [];
  while (safeDataItems.length < minRows) {
    safeDataItems.push({ label: "", days: "", rate: "" });
  }

  // 2. FILAS DE DATOS
  safeDataItems.forEach((item, i) => {
    const rData = worksheet.getRow(rIdx++);
    rData.getCell("B").value = item.label;
    rData.getCell("C").value = item.days;
    rData.getCell("D").value = item.rate;

    // Solo ponemos la 'L' y la fórmula si la fila tiene un título (ej. "Hotel" o "Desayuno")
    if (item.label !== "") {
      rData.getCell("E").value = "L";
      const subTotalFormula = `IF(C${rIdx - 1}<>0, C${rIdx - 1}*D${rIdx - 1}, "")`;
      rData.getCell("F").value = { formula: subTotalFormula };
    }

    rData.getCell("B").alignment = styles.leftAligned;
    ["C", "D"].forEach((c) => (rData.getCell(c).alignment = styles.centered));
    ["E", "F"].forEach(
      (c) => (rData.getCell(c).alignment = styles.rightAligned),
    );

    rData.getCell("D").numFmt = "#,##0.00";
    rData.getCell("F").numFmt = "#,##0.00";

    ["B", "C", "D", "E", "F"].forEach(
      (c) => (rData.getCell(c).border = styles.borderThin),
    );
  });

  // 3. FILA DE TOTAL
  const rTotal = worksheet.getRow(rIdx++);
  rTotal.getCell("E").value = "L";
  rTotal.getCell("F").value = { formula: `SUM(F${startItemRow}:F${rIdx - 2})` };

  rTotal.getCell("F").font = styles.boldFont;
  rTotal.getCell("F").numFmt = "#,##0.00";
  ["E", "F"].forEach(
    (c) => (rTotal.getCell(c).alignment = styles.rightAligned),
  );
  ["E", "F"].forEach((c) => (rTotal.getCell(c).border = styles.borderThin));

  worksheet.addRow([]); // Fila separadora en blanco
  return rIdx + 1;
}

// Agregamos customFormat = '#,##0.00' al final de los parámetros
function addOtherSection(
  worksheet,
  systemRow,
  sectionLetter,
  sectionTitle,
  headerC,
  headerD,
  headerF,
  dataItems,
  formulaBuilder,
  customFormat = "#,##0.00",
) {
  let rIdx = systemRow;

  // ... (El código de los encabezados se mantiene igual) ...
  const rCols = worksheet.getRow(rIdx);
  rCols.height = pxToHeight(44);
  rCols.getCell("A").value = sectionLetter;
  rCols.getCell("B").value = sectionTitle;
  rCols.getCell("C").value = headerC;
  rCols.getCell("D").value = headerD;
  rCols.getCell("F").value = headerF;
  // worksheet.mergeCells(`E${rIdx}:F${rIdx}`);

  ["A", "B", "C", "D", "E", "F"].forEach((c) => {
    rCols.getCell(c).font = styles.boldFont;
    rCols.getCell(c).alignment = styles.headerAlignment;
    rCols.getCell(c).border = styles.borderMediumOuter;
    rCols.getCell(c).font = styles.headerFont;
    // if (c !== "A") rCols.getCell(c).border = styles.borderThin;
    // Lógica de bordes para crear un "contorno" desde B hasta F
    if (c === "B") {
      // Celda inicial del bloque: borde Izquierdo, Superior e Inferior
      rCols.getCell(c).border = {
        left: styles.borderMediumOuter.left,
        top: styles.borderMediumOuter.top,
        bottom: styles.borderMediumOuter.bottom,
      };
    } else if (c === "F") {
      // Celda final del bloque: borde Derecho, Superior e Inferior
      rCols.getCell(c).border = {
        right: styles.borderMediumOuter.right,
        top: styles.borderMediumOuter.top,
        bottom: styles.borderMediumOuter.bottom,
      };
    } else if (["C", "D", "E"].includes(c)) {
      // Celdas internas: solo borde Superior e Inferior
      rCols.getCell(c).border = {
        top: styles.borderMediumOuter.top,
        bottom: styles.borderMediumOuter.bottom,
      };
    }
  });
  rCols.getCell("A").border = {};
  rIdx++;

  const startItemRow = rIdx;

  let safeDataItems = dataItems ? [...dataItems] : [];

  while (safeDataItems.length < 3) {
    safeDataItems.push({ cVal: "", dVal: "", isPadding: true });
  }

  safeDataItems.forEach((item, i) => {
    const rData = worksheet.getRow(rIdx++);

    if (i === 0) rData.getCell("B").value = sectionTitle;

    rData.getCell("C").value = item.cVal;
    rData.getCell("D").value = item.dVal;

    if (!item.isPadding) {
      rData.getCell("E").value = "L";
      rData.getCell("F").value = { formula: formulaBuilder(rIdx - 1) };
    }

    rData.getCell("B").alignment = styles.leftAligned;
    ["C", "D"].forEach((c) => (rData.getCell(c).alignment = styles.centered));
    ["E", "F"].forEach(
      (c) => (rData.getCell(c).alignment = styles.rightAligned),
    );

    // ¡AQUÍ ESTÁ EL CAMBIO! Usamos customFormat en lugar del texto fijo
    ["C", "D", "F"].forEach((c) => (rData.getCell(c).numFmt = customFormat));

    ["B", "C", "D", "E", "F"].forEach(
      (c) => (rData.getCell(c).border = styles.borderThin),
    );
  });

  const rTotal = worksheet.getRow(rIdx++);
  rTotal.getCell("E").value = "L";
  rTotal.getCell("F").value = { formula: `SUM(F${startItemRow}:F${rIdx - 2})` };

  rTotal.getCell("F").font = styles.boldFont;

  // ¡AQUÍ TAMBIÉN! Usamos customFormat para el total
  rTotal.getCell("F").numFmt = customFormat;

  ["E", "F"].forEach(
    (c) => (rTotal.getCell(c).alignment = styles.rightAligned),
  );
  ["E", "F"].forEach((c) => (rTotal.getCell(c).border = styles.borderThin));

  worksheet.addRow([]);
  return rIdx + 1;
}

export default async function exportViaticos(viaticoData) {
  const data = viaticoData || {};
  const detalles = data.detalles || [];

  const getByTipo = (tipo) =>
    detalles.filter((d) => (d.tipo || "").toUpperCase() === tipo.toUpperCase());

  const calcDias = (items) => {
    if (!items.length) return 0;
    const total = items.reduce((s, d) => s + Number(d.total || 0), 0);
    const precioBase = Number(items[0]?.precio_unitario || 0);
    return precioBase > 0
      ? Math.round(total / precioBase)
      : items.reduce((s, d) => s + Number(d.cantidad || 1), 0);
  };

  const sumTotal = (items) =>
    items.reduce((s, d) => s + Number(d.total || 0), 0);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Hoja de Cálculo");

  // const pxToHeight = (px) => px / 1.333;

  // --- ANCHOS DE COLUMNA ---
  worksheet.getColumn("A").width = pxToWidth(47);
  worksheet.getColumn("B").width = pxToWidth(204);
  worksheet.getColumn("C").width = pxToWidth(126.5);
  worksheet.getColumn("D").width = pxToWidth(126.5);
  worksheet.getColumn("E").width = pxToWidth(42);
  worksheet.getColumn("F").width = pxToWidth(129.6);

  // --- CABECERA ---
  worksheet.mergeCells("B1:F1");
  const titleCell = worksheet.getCell("B1");
  titleCell.value = "HOJA DE CALCULO DE VIATICOS";
  titleCell.font = { bold: true, size: 14, underline: true };
  titleCell.alignment = styles.centered;
  worksheet.getRow(1).height = pxToHeight(29);

  worksheet.mergeCells("B2:F2");
  const paraCell = worksheet.getCell("B2");
  paraCell.value = `Para : ${data.nombre_empleado || "No especificado"}`;
  paraCell.font = styles.boldFont;
  paraCell.alignment = styles.centered;
  worksheet.getRow(2).height = pxToHeight(38);

  worksheet.mergeCells("B3:F3");
  const divisionCell = worksheet.getCell("B3");
  divisionCell.value = {
    richText: [
      { text: "Division: ", font: styles.redBoldFont },
      { text: "SOL-FIN/ATM", font: styles.boldFont },
    ],
  };
  divisionCell.alignment = styles.centered;

  let sysRow = 4;

  worksheet.mergeCells(`B${sysRow}:F${sysRow}`);
  const rMission = worksheet.getCell(`B${sysRow}`);
  rMission.value =
    data.motivo_viaje || data.motivoViaje || "MOTIVO NO ENCONTRADO";
  rMission.font = styles.boldFont;
  rMission.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  rMission.border = styles.borderMediumOuter;
  worksheet.getRow(sysRow).height = pxToHeight(63);
  sysRow++;

  // --- FILA 5: FECHAS ---
  const rDateLabels = worksheet.getRow(sysRow++);
  rDateLabels.getCell("B").value = "Fecha y Hora de Salida";
  rDateLabels.getCell("C").value = formatearFechaHora(data.fecha_salida);
  rDateLabels.getCell("D").value = "Fecha y hora de Regreso";
  worksheet.mergeCells(`D${sysRow - 1}:E${sysRow - 1}`);
  rDateLabels.getCell("F").value = formatearFechaHora(data.fecha_regreso);

  ["B", "C", "D", "E", "F"].forEach((c) => {
    rDateLabels.getCell(c).alignment = styles.centered;
    rDateLabels.getCell(c).border = styles.borderThin;
  });
  rDateLabels.getCell("B").font = { size: 9, bold: true };
  rDateLabels.getCell("D").font = { size: 9, bold: true };
  rDateLabels.getCell("C").font = { size: 9 };
  rDateLabels.getCell("F").font = { size: 9 };

  // === AQUÍ GUARDAMOS LOS TOTALES DE CADA SECCIÓN ===
  let celdasTotales = [];

  // --- SECCIÓN A ---
  const desayunosItems = getByTipo("DESAYUNO");
  const almuerzosItems = getByTipo("ALMUERZO");
  const cenasItems = getByTipo("CENA");
  const datosAlimentacion = [
    {
      label: "Desayuno",
      days: calcDias(desayunosItems),
      rate: Number(desayunosItems[0]?.precio_unitario || 150),
    },
    {
      label: "Almuerzo",
      days: calcDias(almuerzosItems),
      rate: Number(almuerzosItems[0]?.precio_unitario || 200),
    },
    {
      label: "Cena",
      days: calcDias(cenasItems),
      rate: Number(cenasItems[0]?.precio_unitario || 200),
    },
  ];
  sysRow = addSection(
    worksheet,
    sysRow,
    "A.",
    "Alimentación",
    ["No. de días", "Asignación por Día", "Sub Total"],
    datosAlimentacion,
    3,
  );
  celdasTotales.push(`F${sysRow - 2}`); // Guardamos la coordenada del total

  // --- SECCIÓN B ---
  const hospedajeItems = getByTipo("HOSPEDAJE");
  const datosHospedaje = [
    {
      label: "Hotel",
      days: calcDias(hospedajeItems),
      rate: Number(hospedajeItems[0]?.precio_unitario || 0),
    },
  ];
  sysRow = addSection(
    worksheet,
    sysRow,
    "B.",
    "Hospedaje",
    ["No. de dias", "Asignación por Día", "Sub Total"],
    datosHospedaje,
    4,
  );
  celdasTotales.push(`F${sysRow - 2}`);

  // --- SECCIÓN C ---
  const peajesTotal = sumTotal(getByTipo("PEAJE"));
  const datosPeajes = [{ cVal: peajesTotal / 2, dVal: peajesTotal / 2 }];
  sysRow = addOtherSection(
    worksheet,
    sysRow,
    "C.",
    "Peajes",
    "Ida",
    "Regreso",
    "Sub Total",
    datosPeajes,
    (row) => `SUM(C${row}:D${row})`,
  );
  celdasTotales.push(`F${sysRow - 2}`);

  // --- SECCIÓN D ---
  const combustibleTotal = sumTotal(getByTipo("COMBUSTIBLE"));
  const datosCombustible = [
    { cVal: combustibleTotal / 2, dVal: combustibleTotal / 2 },
  ];

  sysRow = addOtherSection(
    worksheet,
    sysRow,
    "D.",
    "Combustible",
    "Ida",
    "Regreso",
    "Sub Total",
    datosCombustible,
    (row) => `SUM(C${row}:D${row})`,
  );
  celdasTotales.push(`F${sysRow - 2}`);

  // --- SECCIÓN E ---
  sysRow = addOtherSection(
    worksheet,
    sysRow,
    "E.",
    "Movilización # de Días",
    "Asignación Diaria",
    "Asignación Adicional",
    "Sub Total",
    [],
    (row) => `SUM(C${row}:D${row})`,
  );
  celdasTotales.push(`F${sysRow - 2}`);

  // --- SECCIÓN F ---
  const imprevistosTotal = sumTotal(
    detalles.filter((d) => /^IMPREVISTO/i.test(d.tipo || "")),
  );
  const datosImprevisto = [{ cVal: 1, dVal: imprevistosTotal }];
  sysRow = addOtherSection(
    worksheet,
    sysRow,
    "F.",
    "Imprevistos",
    "No. de días",
    "Lps. 150.00 x Día (máximo Lps. 750.00)",
    "Sub Total",
    datosImprevisto,
    (row) => `C${row}*D${row}`,
    "#,##0",
  );
  celdasTotales.push(`F${sysRow - 2}`);

  // ==========================================
  // --- FOOTER Y TOTALES FINALES ---
  // ==========================================
  const rowFooterStart = sysRow;

  // Cuadro de Advertencia
  worksheet.mergeCells(`A${rowFooterStart}:B${rowFooterStart + 6}`);
  const warningCell = worksheet.getCell(`A${rowFooterStart}`);
  warningCell.value =
    "Es obligatorio presentar la Liquidacion\nde Viaticos a mas tardar 5 dias despues\nde que concluye el viaje. Las\nliquidaciones que se presenten tarde o\nsea despues de 5 dias seran cargados\nal empleado y deducidos por planilla. Y\nse hara el reembolso hasta que\npresente la liquidacion.";
  warningCell.font = { bold: true, size: 9 };
  warningCell.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  warningCell.border = styles.borderMediumOuter;

  // Función para las filas de totales
  const pintarFilaTotal = (fila, titulo, formulaStr) => {
    const r = worksheet.getRow(fila);
    worksheet.mergeCells(`C${fila}:D${fila}`);
    r.getCell("C").value = titulo;
    r.getCell("E").value = "L";
    if (formulaStr) r.getCell("F").value = { formula: formulaStr };

    r.getCell("D").font = styles.boldFont;
    r.getCell("F").font = styles.boldFont;
    r.getCell("D").alignment = styles.rightAligned;
    ["E", "F"].forEach((c) => (r.getCell(c).alignment = styles.rightAligned));
    r.getCell("F").numFmt = "#,##0.00";
    ["D", "E", "F"].forEach((c) => (r.getCell(c).border = styles.borderThin));
  };

  const formulaSumaTotal = celdasTotales.join("+"); // Une: F13+F20+F27...

  pintarFilaTotal(
    rowFooterStart + 1,
    "TOTAL Viáticos a Empleado",
    formulaSumaTotal,
  );
  pintarFilaTotal(rowFooterStart + 3, "TOTAL Pago a Proveedores", "");
  pintarFilaTotal(
    rowFooterStart + 5,
    "Valor TOTAL de este Viaje",
    `F${rowFooterStart + 1}+F${rowFooterStart + 3}`,
  );

  sysRow = rowFooterStart + 7;

  // ==========================================
  // --- FIRMAS Y CHECKBOX ---
  // ==========================================
  // worksheet.mergeCells(`B${sysRow}:C${sysRow}`);
  worksheet.getCell(`B${sysRow}`).value = "El cliente pagará este viaje?";
  worksheet.getCell(`B${sysRow}`).alignment = {
    horizontal: "left",
    italic: true,
  };
  sysRow++;

  worksheet.getCell("C" + (sysRow - 1)).value = "Si   X";
  worksheet.getCell("D" + (sysRow - 1)).value = "No";
  worksheet.getCell("C" + (sysRow - 1)).alignment = styles.centered;
  worksheet.getCell("D" + (sysRow - 1)).alignment = styles.centered;
  worksheet.getCell("C" + (sysRow - 1)).border = styles.borderThin;
  worksheet.getCell("D" + (sysRow - 1)).border = styles.borderThin;
  sysRow++;

  worksheet.mergeCells(`B${sysRow}:F${sysRow}`);
  worksheet.getCell(`B${sysRow}`).value =
    "* Si es afirmativo Contabilidad estará dando recibo por el valor reembolsable y el empleado a su regreso deberá traer cheque por el valor indicado en el recibo.";
  worksheet.getCell(`B${sysRow}`).font = { size: 9, italic: true };
  sysRow += 2;

  worksheet.getCell(`B${sysRow}`).value = "Aprobado:";
  worksheet.getCell(`B${sysRow}`).font = styles.boldFont;
  worksheet.getCell(`B${sysRow}`).alignment = styles.rightAligned;
  worksheet.mergeCells(`C${sysRow}:E${sysRow}`);
  worksheet.getCell(`C${sysRow}`).border = { bottom: styles.borderThin.bottom };
  sysRow++;

  worksheet.mergeCells(`C${sysRow}:E${sysRow}`);
  worksheet.getCell(`C${sysRow}`).value = "Recursos Humanos";
  worksheet.getCell(`C${sysRow}`).font = styles.boldFont;
  worksheet.getCell(`C${sysRow}`).alignment = styles.centered;

  worksheet.eachRow((row) => {
    row.eachCell({ includeEmpty: true }, (cell) => {
      const currentFont = cell.font || {};
      cell.font = { ...currentFont, name: "Arial" };
    });
  });

  // --- EXPORTAR ---
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

  const timestamp = getTimestamp();
  const fileName = `Viaticos_${clean(data.nombre_empleado)}_${timestamp}`;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${fileName}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}
