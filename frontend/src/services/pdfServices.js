// src/services/pdfServices.js
import jsPDF from "jspdf";

export const exportarFacturaAPDF = (factura, detalles = []) => {
  try {
    console.log(" Generando factura #" + factura.id);

    if (!factura || !factura.id) {
      throw new Error("Datos de factura inválidos");
    }

    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    let y = 20;

    /** -----------------------------
     *  ENCABEZADO CON LOGO + DATOS
     *  ----------------------------- */
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(" DROGUERÍA MIMS", 20, y);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    y += 6;
    doc.text("NIT: 900.123.456-7", 20, y);
    y += 5;
    doc.text("Régimen: Común – ICA 5.5 por mil", 20, y);
    y += 5;
    doc.text("Dirección: Calle 12 #18 Sur - Bogotá", 20, y);
    y += 5;
    doc.text("Tel: 320 555 5555 – Email: contacto@mims.com", 20, y);

    /** -----------------------------
     *  FACTURA / FECHA / PREFIJO
     *  ----------------------------- */
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("FACTURA DE VENTA", pageWidth - 70, 25);

    doc.setFontSize(11);
    doc.text("No. " + "MIMS-" + factura.id, pageWidth - 55, 32);

    const fecha = new Date(factura.fecha_emision).toLocaleString("es-CO");
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Fecha: " + fecha, pageWidth - 60, 38);

    y += 15;

    /** -----------------------------
     *  DATOS DEL CLIENTE
     *  ----------------------------- */
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("DATOS DEL CLIENTE", 20, y);

    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    doc.text(`Nombre: ${factura.cliente_nombre || "Cliente"}`, 20, y);
    y += 5;

    if (factura.cliente_documento) {
      doc.text(`Documento: ${factura.cliente_documento}`, 20, y);
      y += 5;
    }

    doc.text(`Método de Pago: ${factura.metodo_pago || "N/A"}`, 20, y);

    if (factura.direccion_entrega) {
      y += 5;
      doc.text(`Dirección: ${factura.direccion_entrega}`, 20, y);
    }

    /** -----------------------------
     *  TABLA DETALLE DE PRODUCTOS
     *  ----------------------------- */
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);

    // Encabezados
    doc.text("Descripción", 20, y);
    doc.text("Cant.", 110, y);
    doc.text("Precio", 140, y);
    doc.text("Subtotal", 175, y);

    y += 2;
    doc.line(20, y + 2, 190, y + 2);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    let totalCalculado = 0;

    detalles.forEach((item) => {
      if (y > 240) {
        doc.addPage();
        y = 20;
      }

      const desc = (item.medicamento || "Producto").substring(0, 50);
      const cant = parseFloat(item.cantidad) || 0;
      const precio = parseFloat(item.precio_unitario) || 0;
      const total = parseFloat(item.subtotal) || cant * precio;

      doc.text(desc, 20, y);
      doc.text(String(cant), 110, y);
      doc.text(`$${precio.toLocaleString("es-CO")}`, 140, y);
      doc.text(`$${total.toLocaleString("es-CO")}`, 175, y);

      totalCalculado += total;
      y += 5;
    });

    /** -----------------------------
     *  TOTALES
     *  ----------------------------- */
    y += 10;
    doc.line(20, y, 190, y);
    y += 8;

    const subTotal = totalCalculado;
    const iva = subTotal * 0.19;
    const totalFinal = subTotal + iva;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    doc.text("Subtotal:", 140, y);
    doc.text(`$${subTotal.toLocaleString("es-CO")}`, 175, y);

    y += 6;
    doc.text("IVA (19%):", 140, y);
    doc.text(`$${iva.toLocaleString("es-CO")}`, 175, y);

    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("TOTAL A PAGAR:", 130, y);
    doc.text(`$${totalFinal.toLocaleString("es-CO")}`, 175, y);

    /** -----------------------------
     *  TEXTOS LEGALES DIAN
     *  ----------------------------- */
    y += 20;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(120);

    doc.text(
      "Esta factura se asimila a título valor según el Art. 774 del Código de Comercio.",
      20,
      y
    );
    y += 4;
    doc.text(
      "Resolución DIAN vigente. El adquirente está obligado a conservar esta factura por al menos 5 años.",
      20,
      y
    );
    y += 4;
    doc.text(
      "Para cambios o devoluciones debe presentar este documento y cumplir políticas de la droguería.",
      20,
      y
    );

    /** -----------------------------
     *  PIE DE PÁGINA
     *  ----------------------------- */
    y = pageHeight - 15;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Gracias por su compra – Droguería MIMS", pageWidth / 2, y, {
      align: "center",
    });

    /** -----------------------------
     *  EXPORTAR
     *  ----------------------------- */
    const nombreArchivo = `Factura_MIMS_${factura.id}.pdf`;
    doc.save(nombreArchivo);

    console.log(" PDF generado:", nombreArchivo);
    return true;
  } catch (error) {
    console.error("❌ Error PDF:", error);
    alert("Error generando PDF: " + error.message);
    return false;
  }
};
// USO:
// exportarFacturaAPDF(factura, detalles);
// donde `factura` es el objeto factura y `detalles` es un arreglo de los detalles de la factura
