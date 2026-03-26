import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // 👈 CAMBIO 1: Importar así
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Función auxiliar para formatear moneda en el PDF
const money = (val) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(val || 0);
};

export const generarProformaPDF = (reporte, clienteNombre) => {
  const doc = new jsPDF();
  const fechaGeneracion = format(new Date(), "dd 'de' MMMM, yyyy", {
    locale: es,
  });

  // ==========================================
  // 1. CABECERA
  // ==========================================

  // OPCIONAL: Si tienes un logo
  // doc.addImage("/logo.png", "PNG", 14, 10, 30, 15);

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Estado de Cuenta Mensual", 14, 22);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100); // Gris

  doc.text(`Cliente:`, 14, 32);
  doc.setTextColor(0); // Negro
  doc.text(clienteNombre, 30, 32);

  doc.setTextColor(100);
  doc.text(`Periodo:`, 14, 38);
  doc.setTextColor(0);
  doc.text(reporte.periodo_texto, 30, 38);

  doc.setTextColor(100);
  doc.text(`Fecha Emisión:`, 140, 32); // Alineado a la derecha
  doc.setTextColor(0);
  doc.text(fechaGeneracion, 168, 32);

  let finalY = 45; // Posición vertical inicial para el contenido

  // ==========================================
  // 2. DETALLE DE CONTRATOS
  // ==========================================
  reporte.detalles.forEach((contrato) => {
    // Título del Contrato (Separador)
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setFillColor(240, 240, 240); // Gris claro de fondo
    doc.rect(14, finalY, 182, 8, "F"); // Barra de fondo
    doc.text(`Contrato: ${contrato.contrato}`, 16, finalY + 5.5);
    finalY += 12;

    // ------------------------------------------
    // A. TABLA DE RENTAS / CLICS INDIVIDUALES
    // ------------------------------------------
    if (contrato.items_individuales.length > 0) {
      doc.setFontSize(10);
      doc.text("Equipos en Renta Individual", 14, finalY - 2);

      const bodyData = contrato.items_individuales.map((item) => [
        `${item.serial}\n${item.modelo}`,
        item.uso_mono,
        item.uso_color,
        money(item.total_pagar),
      ]);

      // 👇 CAMBIO 2: Usar autoTable(doc, ...) en vez de doc.autoTable(...)
      autoTable(doc, {
        startY: finalY,
        head: [["Equipo / Serial", "Uso B/N", "Uso Color", "Subtotal"]],
        body: bodyData,
        theme: "striped",
        headStyles: { fillColor: [41, 128, 185] }, // Azul
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 80 },
          3: { halign: "right", fontStyle: "bold" },
        },
      });

      // 👇 CAMBIO 3: Obtener finalY desde la propiedad lastAutoTable del DOC
      finalY = doc.lastAutoTable.finalY + 10;
    }

    // ------------------------------------------
    // B. TABLA DE BOLSONES (GRUPOS)
    // ------------------------------------------
    if (contrato.grupos_bolsones.length > 0) {
      // Título de sección si no había tabla anterior pegada
      if (contrato.items_individuales.length === 0) finalY += 2;

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Esquemas de Bolsa Compartida (Pool)", 14, finalY - 2);

      const bodyGrupos = contrato.grupos_bolsones.map((grupo) => {
        const tipoCierre =
          grupo.frecuencia === "ANUAL" ? "(Cierre Anual)" : "(Mensual)";
        return [
          `${grupo.nombre_grupo}\n${tipoCierre}`,
          `${grupo.uso_total_mono} / ${grupo.bolsa_mono}`,
          `${grupo.uso_total_color} / ${grupo.bolsa_color}`,
          money(grupo.total_pagar),
        ];
      });

      // 👇 CAMBIO 4: Usar autoTable(doc, ...)
      autoTable(doc, {
        startY: finalY,
        head: [
          [
            "Grupo / Ubicación",
            "Consumo B/N vs Bolsa",
            "Consumo Color vs Bolsa",
            "Total Grupo",
          ],
        ],
        body: bodyGrupos,
        theme: "grid",
        headStyles: { fillColor: [39, 174, 96] }, // Verde
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          3: { halign: "right", fontStyle: "bold" },
        },
      });

      finalY = doc.lastAutoTable.finalY + 10;
    }

    // Subtotal del Contrato (Pequeño resumen por contrato)
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(
      `Subtotal ${contrato.contrato}: ${money(contrato.subtotal_contrato)}`,
      196,
      finalY - 2,
      { align: "right" },
    );

    finalY += 5; // Espacio entre contratos
  });

  // ==========================================
  // 3. TOTALES FINALES (CON IMPUESTOS)
  // ==========================================

  if (finalY > 250) {
    doc.addPage();
    finalY = 20;
  }

  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(120, finalY, 196, finalY);

  finalY += 8;

  // A. Subtotal General
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Subtotal:`, 160, finalY, { align: "right" });
  doc.setTextColor(0);
  doc.text(money(reporte.subtotal_general), 196, finalY, { align: "right" });

  finalY += 6;

  // B. ISV (15%)
  doc.setTextColor(100);
  doc.text(`ISV (15%):`, 160, finalY, { align: "right" });
  doc.setTextColor(0);
  doc.text(money(reporte.isv_total), 196, finalY, { align: "right" });

  finalY += 4;
  doc.line(160, finalY, 196, finalY);
  finalY += 8;

  // C. Gran Total
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text(`TOTAL A PAGAR:`, 150, finalY, { align: "right" });
  doc.setTextColor(200, 0, 0);
  doc.text(money(reporte.gran_total), 196, finalY, { align: "right" });

  // ==========================================
  // 4. GUARDAR
  // ==========================================
  const nombreArchivo = `EstadoCuenta_${clienteNombre.replace(/\s+/g, "_")}_${reporte.periodo_texto.replace("/", "-")}.pdf`;
  doc.save(nombreArchivo);
};
