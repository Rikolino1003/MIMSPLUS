// GUÍA RÁPIDA DE EXPORTACIÓN PDF - FACTURAS

// ✅ INSTALACIÓN (ya completada)
// npm install jspdf

// ✅ IMPORTAR EN TU COMPONENTE
import { exportarFacturaAPDF } from "../services/pdfServices.js";

// ✅ USAR EN TU COMPONENTE
// Opción 1: Desde un botón directamente
<button onClick={() => exportarFacturaAPDF(factura, factura.detalles)}>
  Descargar PDF
</button>

// Opción 2: Crear una función wrapper
const descargarFactura = (factura) => {
  exportarFacturaAPDF(factura, factura.detalles || []);
};

// ✅ ESTRUCTURA DEL PDF GENERADO
/**
 * El PDF incluye:
 * - Número de factura y fecha
 * - Información de empresa (Droguería MIMS)
 * - Datos del cliente
 * - Tabla con productos: Descripción, Cantidad, Precio, Total
 * - Cálculo de IVA (19%)
 * - Total final
 * - Fecha de generación
 */

// ✅ PARÁMETROS DE LA FUNCIÓN
/*
exportarFacturaAPDF(factura, detalles)

factura: {
  id: número,
  cliente_nombre: string,
  fecha_emision: datetime,
  metodo_pago: string,
  direccion_entrega: string (opcional),
  total: número (opcional - se calcula si no existe)
}

detalles: Array de {
  medicamento: string,
  cantidad: número,
  precio_unitario: número,
  subtotal: número
}
*/

// ✅ SOLUCIÓN DE PROBLEMAS

// Si ves: "❌ Error al generar PDF: Datos de factura inválidos"
// Solución: Verifica que factura tenga la propiedad "id"

// Si ves: "❌ Error: X is not a function"
// Solución: Asegúrate de importar correctamente:
//   import { exportarFacturaAPDF } from "../services/pdfServices.js";

// Si no se descarga el PDF:
// 1. Verifica la consola del navegador (F12)
// 2. Busca mensajes de error
// 3. Asegúrate que jsPDF esté en node_modules

// ✅ MONITOREO DE LOGS
// Abre DevTools (F12) > Console para ver:
// "📄 Generando PDF para factura #123"
// "✅ PDF descargado: Factura_123_1234567890.pdf"
