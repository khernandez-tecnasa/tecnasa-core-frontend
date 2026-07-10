// src/utils/exportFacturacionReporte.js
// Exportación PDF de proforma de facturación — 100% frontend con jsPDF + autotable.
// El export Excel del backend queda intacto en api-autolog para uso futuro.

const MESES = [
  "ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO",
  "JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE",
];

// Colores de encabezado para la tabla detalle de impresoras
// Grupos: info básica #E2EFDA (verde) | lease amarillo | mono #161616 (negro) | color #4472C4 (azul)
const DETALLE_HEAD_COLORS = [
  [226, 239, 218], // 0  No.           — #E2EFDA verde
  [226, 239, 218], // 1  Cliente
  [226, 239, 218], // 2  Área
  [226, 239, 218], // 3  N° Serie
  [226, 239, 218], // 4  Modelo
  [255, 230,  60], // 5  Lease Mens.   — amarillo
  [ 22,  22,  22], // 6  Ini. Mono     — #161616 negro
  [ 22,  22,  22], // 7  Fin Mono
  [ 22,  22,  22], // 8  Uso Mono
  [ 22,  22,  22], // 9  P. Clic Mono
  [ 22,  22,  22], // 10 Total Mono
  [ 68, 114, 196], // 11 Ini. Color    — #4472C4 azul
  [ 68, 114, 196], // 12 Fin Color
  [ 68, 114, 196], // 13 Uso Color
  [ 68, 114, 196], // 14 P. Clic Color
  [ 68, 114, 196], // 15 Total Color
];
// Texto: negro sobre verde/amarillo, blanco sobre negro y azul
const DETALLE_HEAD_TEXT = [
  [0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],
  [0,0,0],
  [255,255,255],[255,255,255],[255,255,255],[255,255,255],[255,255,255],
  [255,255,255],[255,255,255],[255,255,255],[255,255,255],[255,255,255],
];

// Colores de encabezado para la tabla de ítems por sección
// Grupos: verde (lease+modelo) | negro+blanco (B/N) | azul (color) | gris (total)
const ITEMS_HEAD_COLORS = [
  [217, 232, 200], // 0  Modelo        — verde claro
  [217, 232, 200], // 1  Cant.
  [217, 232, 200], // 2  P. Lease
  [217, 232, 200], // 3  Total Lease
  [ 26,  26,  26], // 4  Impr. B/N     — negro
  [ 26,  26,  26], // 5  P. B/N
  [ 26,  26,  26], // 6  Total B/N
  [184, 212, 236], // 7  Impr. Color   — azul claro
  [184, 212, 236], // 8  P. Color
  [150, 190, 220], // 9  Total Color   — azul más intenso
  [229, 229, 229], // 10 Total General — gris
];
const ITEMS_HEAD_TEXT = [
  [0,0,0],[0,0,0],[0,0,0],[0,0,0],
  [255,255,255],[255,255,255],[255,255,255],
  [0,0,0],[0,0,0],[0,0,0],[0,0,0],
];

export async function exportFacturacionReportePDF(reporte, notaLectura = "", reemplazos = []) {
  const { default: jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const [mesNum, anio] = (reporte.periodo_texto || "1/2000").split("/");
  const mesTexto = `${MESES[Number(mesNum) - 1] || mesNum} ${anio}`;

  const money = (v, sim = "$") =>
    `${sim} ${Number(v || 0).toLocaleString("es-HN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // Precios por clic: siempre 4 decimales sin redondear
  const price4 = (v, sim = "$") =>
    `${sim} ${Number(v || 0).toLocaleString("es-HN", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    })}`;

  const pad = (n) => String(n).padStart(2, "0");
  const now = new Date();
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const PW = doc.internal.pageSize.width;   // 297
  const PH = doc.internal.pageSize.height;  // 210
  const MX = 10;

  const GREEN = [111, 230, 177];
  const BLACK = [26, 26, 26];
  const LGRAY = [245, 245, 245];
  const MGRAY = [217, 217, 217];

  // Dibuja solo la barra verde + timestamp. El número de página se escribe
  // en el post-pass final (cuando ya se sabe el total real de páginas).
  const drawnFooterPages = new Set();
  const drawFooterBar = (data) => {
    const pn = data.pageNumber;
    if (drawnFooterPages.has(pn)) return;
    drawnFooterPages.add(pn);
    const barX = MX + 2;
    const barW = PW - (MX + 2) * 2;
    const barY = PH - 13;
    doc.setFillColor(...GREEN);
    doc.rect(barX, barY, barW, 6, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(50, 50, 50);
    doc.text(`Generado: ${stamp}`, barX + 2, barY + 4.2);
  };

  // ── Header: Logo + Título ─────────────────────────────────────────────
  let curY = 8;

  try {
    const res = await fetch("/newLogoTecnasa.png", { cache: "no-cache" });
    const blob = await res.blob();
    const dataUrl = await new Promise((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.readAsDataURL(blob);
    });
    const dims = await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const lh = 13;
        resolve({ lw: lh * (img.naturalWidth / img.naturalHeight), lh });
      };
      img.src = dataUrl;
    });
    doc.addImage(dataUrl, "PNG", MX, curY, dims.lw, dims.lh);
    curY = Math.max(curY + dims.lh + 3, 25);
  } catch {
    curY = 25;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(`PROFORMA — ${mesTexto}`, PW / 2, curY, { align: "center" });
  curY += 10;

  const baseOpts = {
    margin: { left: MX, right: MX },
    styles: { fontSize: 6.5, cellPadding: 1.2, overflow: "linebreak", halign: "center", valign: "middle" },
    headStyles: { fillColor: MGRAY, textColor: [0, 0, 0], fontStyle: "bold", fontSize: 6.5 },
    alternateRowStyles: { fillColor: LGRAY },
    didDrawPage: drawFooterBar,
  };

  // ── Tabla detalle de impresoras (titulares + temporales) ─────────────
  const detalle = reporte.detalle_impresoras || [];
  const hayDetalle = detalle.length > 0 || reemplazos.length > 0;

  if (hayDetalle) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...BLACK);
    doc.text("DETALLE DE IMPRESORAS", MX, curY);
    curY += 4;

    // Filas de impresoras titulares
    const regularRows = detalle.map((imp) => [
      imp.numero,
      imp.cliente_nombre || "",
      imp.area || "",
      imp.serial || "",
      imp.modelo || "",
      money(imp.precio_renta),
      imp.inicio_mono || "", imp.fin_mono || "", imp.uso_mono ?? "",
      price4(imp.precio_clic_mono), money(imp.total_mono),
      imp.inicio_color || "", imp.fin_color || "", imp.uso_color ?? "",
      price4(imp.precio_clic_color), money(imp.total_color),
    ]);

    // Filas de impresoras temporales: heredan el precio clic del original,
    // calculan sus propios totales. Sin lease.
    const temporalRows = reemplazos.map((r) => {
      const original = detalle.find((imp) => imp.serial === r.serial_titular);
      const pMono  = Number(original?.precio_clic_mono  ?? 0);
      const pColor = Number(original?.precio_clic_color ?? 0);
      const usoMono  = Number(r.uso_calculado       ?? 0);
      const usoColor = Number(r.uso_calculado_color  ?? 0);
      return [
        "T",
        original?.cliente_nombre || "",
        `${original?.area || ""} Temporal`.trim(),
        r.serial_backup || "",
        r.modelo_backup || "",
        "—",
        r.lectura_inicial ?? "", r.lectura_final ?? "", usoMono,
        price4(pMono), money(usoMono * pMono),
        r.lectura_inicial_color ?? "", r.lectura_final_color ?? "", usoColor,
        price4(pColor), money(usoColor * pColor),
      ];
    });

    const regularCount = regularRows.length;

    autoTable(doc, {
      ...baseOpts,
      startY: curY,
      head: [[
        "No.", "Cliente", "Área", "N° Serie", "Modelo", "Lease Mens.",
        "Ini. Mono", "Fin Mono", "Uso Mono", "P. Clic Mono", "Total Mono",
        "Ini. Color", "Fin Color", "Uso Color", "P. Clic Color", "Total Color",
      ]],
      body: [...regularRows, ...temporalRows],
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 25, halign: "left" },
        2: { cellWidth: 18, halign: "left" },
        3: { cellWidth: 22, halign: "left" },
        4: { cellWidth: 22, halign: "left" },
        5: { cellWidth: 16 },
        6: { cellWidth: 13 }, 7: { cellWidth: 13 }, 8: { cellWidth: 12 },
        9: { cellWidth: 17 }, 10: { cellWidth: 17 },
        11: { cellWidth: 13 }, 12: { cellWidth: 13 }, 13: { cellWidth: 12 },
        14: { cellWidth: 17 }, 15: { cellWidth: 17 },
      },
      didParseCell: (data) => {
        if (data.section === "head") {
          const ci = data.column.index;
          data.cell.styles.fillColor = DETALLE_HEAD_COLORS[ci] ?? MGRAY;
          data.cell.styles.textColor = DETALLE_HEAD_TEXT[ci] ?? [0, 0, 0];
        }
        // Filas temporales: fondo violeta claro + texto en cursiva
        if (data.section === "body" && data.row.index >= regularCount) {
          data.cell.styles.fillColor = [237, 228, 252];
          data.cell.styles.fontStyle = "italic";
          data.cell.styles.textColor = [60, 30, 100];
        }
      },
    });

    curY = doc.lastAutoTable.finalY + 8;
  }

  // ── Secciones de resumen ──────────────────────────────────────────────
  for (const sec of reporte.secciones || []) {
    const sim = sec.moneda?.simbolo || "$";

    // Espacio mínimo: banner (10) + encabezado tabla (8) + 1 fila (6) + subtotales (20) + margen footer (20)
    if (curY > PH - 64) {
      doc.addPage();
      curY = 15;
    }

    // Banner negro con título de sección (sin [MONEDA])
    doc.setFillColor(...BLACK);
    doc.rect(MX, curY, PW - MX * 2, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(
      `SERVICIO DE IMPRESIÓN ADMINISTRADA — ${(sec.titulo || "").toUpperCase()} — ${mesTexto}`,
      PW / 2,
      curY + 5.5,
      { align: "center", maxWidth: PW - MX * 2 - 8 }
    );
    curY += 10;

    if (sec.tipo === "items") {
      autoTable(doc, {
        ...baseOpts,
        startY: curY,
        styles: { ...baseOpts.styles, fontSize: 7 },
        head: [["Modelo", "Cant.", "P. Lease", "Total Lease", "Impr. B/N", "P. B/N", "Total B/N", "Impr. Color", "P. Color", "Total Color", "Total General"]],
        body: (sec.items_individuales || []).map((it) => [
          it.modelo || "",
          it.cantidad,
          money(it.precio_lease, sim), money(it.total_lease, sim),
          it.impresiones_bn,
          price4(it.precio_bn, sim), money(it.total_bn, sim),
          it.impresiones_color,
          price4(it.precio_color, sim), money(it.total_color, sim),
          money(it.total_general, sim),
        ]),
        columnStyles: {
          0: { cellWidth: 45, halign: "left" },
          1: { cellWidth: 12 },
          2: { cellWidth: 20 }, 3: { cellWidth: 22 },
          4: { cellWidth: 16 },
          5: { cellWidth: 18 }, 6: { cellWidth: 22 },
          7: { cellWidth: 18 },
          8: { cellWidth: 18 }, 9: { cellWidth: 22 },
          10: { cellWidth: 24 },
        },
        didParseCell: (data) => {
          if (data.section === "head") {
            const ci = data.column.index;
            data.cell.styles.fillColor = ITEMS_HEAD_COLORS[ci] ?? MGRAY;
            data.cell.styles.textColor = ITEMS_HEAD_TEXT[ci] ?? [0, 0, 0];
            data.cell.styles.fontStyle = "bold";
          }
        },
      });
      curY = doc.lastAutoTable.finalY + 3;
    } else {
      // ── Tipo bolsón ──────────────────────────────────────────────────────
      const b = sec.bolson || {};
      const W = PW - MX * 2;

      // Encabezado: nombre del grupo + badges
      doc.setFillColor(30, 30, 30);
      doc.rect(MX, curY, W, 6.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      const badgeFrecuencia = b.frecuencia === "ANUAL" ? "Bolsón Anual" : "Bolsón Mensual";
      const badgeCierre = b.es_mes_de_cierre ? " · Mes de cierre anual" : "";
      doc.text(`${b.nombre_grupo || ""}   [${badgeFrecuencia}${badgeCierre}]`, MX + 3, curY + 4.5);
      curY += 8;

      // Zona contadores (fondo gris claro)
      const contRows = [
        ["Contadores del período", "Bolsa", "Uso", "Excedente"],
        ["Mono", String(b.bolsa_mono ?? 0), String(b.uso_total_mono ?? 0), String(b.excedente_mono ?? 0)],
        ["Color", String(b.bolsa_color ?? 0), String(b.uso_total_color ?? 0), String(b.excedente_color ?? 0)],
      ];
      autoTable(doc, {
        startY: curY,
        margin: { left: MX, right: MX },
        head: [contRows[0]],
        body: contRows.slice(1),
        styles: { fontSize: 7.5, cellPadding: 1.8 },
        headStyles: { fillColor: [210, 210, 210], textColor: [40, 40, 40], fontStyle: "bold" },
        bodyStyles: { fillColor: [245, 245, 245], textColor: [60, 60, 60] },
        columnStyles: { 0: { fontStyle: "bold" }, 3: { textColor: [180, 50, 50], fontStyle: "bold" } },
        didDrawPage: drawFooterBar,
      });
      curY = doc.lastAutoTable.finalY + 3;

      // Nota anual si no es mes de cierre
      if (b.frecuencia === "ANUAL" && !b.es_mes_de_cierre) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7);
        doc.setTextColor(180, 120, 0);
        doc.text(
          "* Bolsón anual: el excedente se acumula y se cobrará únicamente en el mes de cierre configurado. Este mes no genera cargo por excedente.",
          MX, curY + 3.5,
          { maxWidth: W }
        );
        curY += 9;
      }

      // Desglose de cobro
      const desgloseRows = [];
      desgloseRows.push(["Renta base mensual", "—", "—", money(b.renta_base ?? sec.subtotal, sim)]);
      if (b.hay_cobro_excedente) {
        if ((b.excedente_mono ?? 0) > 0) {
          desgloseRows.push([
            "Excedente Mono",
            String(b.excedente_mono ?? 0),
            price4(b.precio_unitario_excedente_mono ?? 0, sim),
            money(b.cobro_excedente_mono ?? 0, sim),
          ]);
        }
        if ((b.excedente_color ?? 0) > 0) {
          desgloseRows.push([
            "Excedente Color",
            String(b.excedente_color ?? 0),
            price4(b.precio_unitario_excedente_color ?? 0, sim),
            money(b.cobro_excedente_color ?? 0, sim),
          ]);
        }
      }
      autoTable(doc, {
        startY: curY,
        margin: { left: MX, right: MX },
        head: [["Concepto", "Cant.", "P. Unit.", "Total"]],
        body: desgloseRows,
        styles: { fontSize: 7.5, cellPadding: 1.8 },
        headStyles: { fillColor: [22, 22, 22], textColor: [255, 255, 255], fontStyle: "bold" },
        columnStyles: {
          0: { cellWidth: "auto" },
          1: { halign: "right" },
          2: { halign: "right" },
          3: { halign: "right", fontStyle: "bold" },
        },
        didDrawPage: drawFooterBar,
      });
      curY = doc.lastAutoTable.finalY + 3;

      // Bloque subtotales/ISV/Total (mismo estilo que tipo items)
      const subW = 70;
      const subX = PW - MX - subW;
      const subtRows = [
        { label: "Subtotales:", val: money(sec.subtotal, sim), bold: false, inv: false },
        { label: "ISV (15%):", val: money(sec.isv, sim), bold: false, inv: false },
        { label: "TOTAL:", val: money(sec.total, sim), bold: true, inv: true },
      ];
      for (const row of subtRows) {
        if (row.inv) {
          doc.setFillColor(...BLACK);
          doc.rect(subX, curY, subW, 5.5, "F");
        }
        doc.setFont("helvetica", row.bold ? "bold" : "normal");
        doc.setFontSize(8);
        doc.setTextColor(...(row.inv ? [255, 255, 255] : [0, 0, 0]));
        doc.text(row.label, subX + 2, curY + 4);
        doc.text(row.val, subX + subW - 2, curY + 4, { align: "right" });
        curY += 6;
      }
    }

    // bloque subtotales/ISV/Total para tipo items
    if (sec.tipo === "items") {
      const subW = 70;
      const subX = PW - MX - subW;
      const subtRows = [
        { label: "Subtotales:", val: money(sec.subtotal, sim), bold: false, inv: false },
        { label: "ISV (15%):", val: money(sec.isv, sim), bold: false, inv: false },
        { label: "TOTAL:", val: money(sec.total, sim), bold: true, inv: true },
      ];
      for (const row of subtRows) {
        if (row.inv) {
          doc.setFillColor(...BLACK);
          doc.rect(subX, curY, subW, 5.5, "F");
        }
        doc.setFont("helvetica", row.bold ? "bold" : "normal");
        doc.setFontSize(8);
        doc.setTextColor(...(row.inv ? [255, 255, 255] : [0, 0, 0]));
        doc.text(row.label, subX + 2, curY + 4);
        doc.text(row.val, subX + subW - 2, curY + 4, { align: "right" });
        curY += 6;
      }
    }

    curY += 8;
  }

  // ── Nota de lectura ───────────────────────────────────────────────────
  if (notaLectura?.trim()) {
    if (curY > PH - 28) {
      doc.addPage();
      curY = 15;
    }
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const notaLines = doc.splitTextToSize(`* ${notaLectura.trim()}`, PW - MX * 2);
    doc.text(notaLines, MX, curY + 4);
  }

  // ── Post-pass: footer completo en TODAS las páginas con total correcto ──
  // Se hace al final para que "Página X de N" siempre refleje el N real.
  const totalPages = doc.internal.getNumberOfPages();
  const barX = MX + 2;
  const barW = PW - (MX + 2) * 2;
  const barY = PH - 13;

  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    if (!drawnFooterPages.has(p)) {
      // Página sin tabla (ej: solo encabezado) — dibujar barra y timestamp también
      doc.setFillColor(...GREEN);
      doc.rect(barX, barY, barW, 6, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(50, 50, 50);
      doc.text(`Generado: ${stamp}`, barX + 2, barY + 4.2);
    }
    // Número de página sobre la barra verde (siempre con total correcto)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
    doc.text(`Página ${p} de ${totalPages}`, barX + barW - 2, barY + 4.2, { align: "right" });
  }

  const clienteNombre = (
    reporte.detalle_impresoras?.[0]?.cliente_nombre ||
    reporte.secciones?.[0]?.titulo ||
    `Cliente${reporte.cliente_id}`
  ).replace(/[/\\?%*:|"<>]/g, "-").trim();
  doc.save(`Proforma y Reporte de Contadores ${clienteNombre}.pdf`);
}
