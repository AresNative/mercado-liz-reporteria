// utils/pdf/purchaseOrderPDF.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CompanyLogo } from "../assets/images";
import { formatCurrency, formatDate } from "./formatters";

interface PurchaseOrderItem {
  id: string;
  productCode: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  stock: number;
  minStock: number;
  reorderPoint: number;
  supplierCode?: string;
  expirationDate?: string;
  batchNumber?: string;
}

interface PurchaseOrderData {
  orderNumber: string;
  orderDate: string;
  deliveryDate: string;
  validityDate: string;
  supplier: {
    code: string;
    name: string;
    address: string;
    phone: string;
    email: string;
    rfc: string;
  };
  warehouse: {
    code: string;
    name: string;
    address: string;
  };
  items: PurchaseOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  terms: string;
  notes: string;
  createdBy: string;
  approvedBy?: string;
}

// Función para agregar el logo de la empresa (debes tener tu logo en Base64 o URL)
async function addCompanyLogo(
  doc: jsPDF,
  logoUrl: string = CompanyLogo
): Promise<void> {
  try {
    const imgWidth = 40;
    const imgHeight = 40;

    doc.addImage(logoUrl, "PNG", 15, 10, imgWidth, imgHeight);
  } catch (error) {
    console.warn("No se pudo cargar el logo, continuando sin él");
  }
}

// Función para agregar encabezado profesional
function addProfessionalHeader(
  doc: jsPDF,
  companyInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    rfc: string;
  }
) {
  // Información de la empresa (alineado a la derecha)
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(companyInfo.name, 160, 15, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.text(`RFC: ${companyInfo.rfc}`, 160, 21, { align: "right" });
  doc.text(companyInfo.address, 160, 26, { align: "right" });
  doc.text(`Tel: ${companyInfo.phone} | Email: ${companyInfo.email}`, 160, 31, {
    align: "right",
  });
  doc.text(`Web: ${companyInfo.website}`, 160, 36, { align: "right" });

  // Título principal
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("ORDEN DE COMPRA", 105, 60, { align: "center" });

  // Línea decorativa
  doc.setDrawColor(0, 51, 102);
  doc.setLineWidth(0.5);
  doc.line(15, 65, 195, 65);
}

// Función para agregar información de la orden
function addOrderInfo(
  doc: jsPDF,
  orderData: PurchaseOrderData,
  startY: number = 70
) {
  doc.setFontSize(10);

  // Número y fecha de orden
  doc.setFont("helvetica", "bold");
  doc.text("No. Orden:", 15, startY);
  doc.setFont("helvetica", "normal");
  doc.text(orderData.orderNumber, 40, startY);

  doc.setFont("helvetica", "bold");
  doc.text("Fecha:", 15, startY + 5);
  doc.setFont("helvetica", "normal");
  doc.text(formatDate(orderData.orderDate), 40, startY + 5);

  // Fechas importantes
  doc.setFont("helvetica", "bold");
  doc.text("Fecha Entrega:", 15, startY + 10);
  doc.setFont("helvetica", "normal");
  doc.text(formatDate(orderData.deliveryDate), 40, startY + 10);

  doc.setFont("helvetica", "bold");
  doc.text("Validez:", 15, startY + 15);
  doc.setFont("helvetica", "normal");
  doc.text(formatDate(orderData.validityDate), 40, startY + 15);

  // Proveedor (lado derecho)
  const supplierX = 120;
  doc.setFont("helvetica", "bold");
  doc.text("PROVEEDOR:", supplierX, startY);
  doc.setFont("helvetica", "normal");

  let supplierY = startY + 5;
  doc.text(`Nombre: ${orderData.supplier.name}`, supplierX, supplierY);
  supplierY += 5;
  doc.text(`RFC: ${orderData.supplier.rfc}`, supplierX, supplierY);
  supplierY += 5;
  doc.text(`Dirección: ${orderData.supplier.address}`, supplierX, supplierY);
  supplierY += 5;
  doc.text(`Tel: ${orderData.supplier.phone}`, supplierX, supplierY);
  supplierY += 5;
  doc.text(`Email: ${orderData.supplier.email}`, supplierX, supplierY);

  // Línea separadora
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(15, supplierY + 10, 195, supplierY + 10);

  return supplierY + 15;
}

// Función para agregar tabla de productos con saldos y expiración
function addProductsTable(
  doc: jsPDF,
  items: PurchaseOrderItem[],
  startY: number
) {
  const tableColumn = [
    "Código",
    "Descripción",
    "Cant.",
    "Unidad",
    "Precio Unit.",
    "Importe",
    "Stock Actual",
    "Stock Mín.",
    "Pto. Reorden",
    "Expiración",
    "Lote",
  ];

  const tableRows = items.map((item) => [
    item.productCode,
    item.description.substring(0, 40), // Limitar longitud
    item.quantity.toString(),
    item.unit,
    formatCurrency(item.unitPrice),
    formatCurrency(item.total),
    item.stock.toString(),
    item.minStock.toString(),
    item.reorderPoint.toString(),
    item.expirationDate ? formatDate(item.expirationDate) : "N/A",
    item.batchNumber || "N/A",
  ]);

  autoTable(doc, {
    startY,
    head: [tableColumn],
    body: tableRows,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [0, 51, 102],
      textColor: 255,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 20 }, // Código
      1: { cellWidth: 50 }, // Descripción
      2: { cellWidth: 15 }, // Cantidad
      3: { cellWidth: 15 }, // Unidad
      4: { cellWidth: 25 }, // Precio Unitario
      5: { cellWidth: 25 }, // Importe
      6: { cellWidth: 20 }, // Stock Actual
      7: { cellWidth: 20 }, // Stock Mínimo
      8: { cellWidth: 20 }, // Punto Reorden
      9: { cellWidth: 25 }, // Expiración
      10: { cellWidth: 20 }, // Lote
    },
    didDrawCell: (data) => {
      // Resaltar productos con saldo bajo
      const item = items[data.row.index];
      if (item && data.column.index === 6) {
        // Columna de Stock Actual
        const needed = Math.max(
          0,
          item.minStock + item.reorderPoint - item.stock
        );
        if (needed > 0) {
          doc.setFillColor(255, 243, 205); // Amarillo suave
          doc.rect(
            data.cell.x,
            data.cell.y,
            data.cell.width,
            data.cell.height,
            "F"
          );
        }
      }

      // Resaltar productos por expirar
      if (item && data.column.index === 9 && item.expirationDate) {
        // Columna Expiración
        const expDate = new Date(item.expirationDate);
        const today = new Date();
        const thirtyDays = new Date();
        thirtyDays.setDate(today.getDate() + 30);

        if (expDate <= thirtyDays) {
          doc.setFillColor(248, 215, 218); // Rojo suave
          doc.rect(
            data.cell.x,
            data.cell.y,
            data.cell.width,
            data.cell.height,
            "F"
          );
        }
      }
    },
  });
}

// Función para agregar resumen y totales
function addSummary(doc: jsPDF, orderData: PurchaseOrderData, startY: number) {
  doc.setFontSize(10);

  // Resumen de cantidades
  const totalItems = orderData.items.length;
  const totalQuantity = orderData.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  doc.setFont("helvetica", "bold");
  doc.text("Resumen de la Orden:", 15, startY);
  doc.setFont("helvetica", "normal");
  doc.text(`Total de Ítems: ${totalItems}`, 15, startY + 5);
  doc.text(`Total de Unidades: ${totalQuantity}`, 15, startY + 10);

  // Totales financieros (lado derecho)
  const totalsX = 130;
  let totalsY = startY;

  doc.setFont("helvetica", "bold");
  doc.text("SUBTOTAL:", totalsX, totalsY);
  doc.text(
    `${orderData.currency} ${orderData.subtotal.toFixed(2)}`,
    180,
    totalsY,
    { align: "right" }
  );

  totalsY += 5;
  doc.text("IMPUESTOS:", totalsX, totalsY);
  doc.text(`${orderData.currency} ${orderData.tax.toFixed(2)}`, 180, totalsY, {
    align: "right",
  });

  totalsY += 5;
  doc.setFontSize(12);
  doc.text("TOTAL:", totalsX, totalsY);
  doc.text(
    `${orderData.currency} ${orderData.total.toFixed(2)}`,
    180,
    totalsY,
    { align: "right" }
  );

  return totalsY + 10;
}

// Función para agregar términos y condiciones
function addTermsAndConditions(
  doc: jsPDF,
  orderData: PurchaseOrderData,
  startY: number
) {
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("TÉRMINOS Y CONDICIONES:", 15, startY);

  doc.setFont("helvetica", "normal");
  const termsLines = doc.splitTextToSize(orderData.terms, 180);
  doc.text(termsLines, 15, startY + 5);

  let currentY = startY + 5 + termsLines.length * 4;

  if (orderData.notes) {
    currentY += 5;
    doc.setFont("helvetica", "bold");
    doc.text("NOTAS:", 15, currentY);

    doc.setFont("helvetica", "normal");
    const notesLines = doc.splitTextToSize(orderData.notes, 180);
    doc.text(notesLines, 15, currentY + 5);
    currentY += 5 + notesLines.length * 4;
  }

  return currentY + 10;
}

// Función para agregar firmas
function addSignatures(
  doc: jsPDF,
  orderData: PurchaseOrderData,
  startY: number
) {
  const today = new Date().toLocaleDateString("es-ES");

  // Línea para firma del solicitante
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("________________________________", 30, startY);
  doc.text("Solicitado por", 50, startY + 5);
  doc.text(orderData.createdBy, 50, startY + 10);
  doc.text(today, 50, startY + 15);

  // Línea para firma del aprobador
  doc.text("________________________________", 120, startY);
  doc.text("Autorizado por", 140, startY + 5);

  if (orderData.approvedBy) {
    doc.text(orderData.approvedBy, 140, startY + 10);
    doc.text(today, 140, startY + 15);
  } else {
    doc.text("[Pendiente de autorización]", 140, startY + 10, { maxWidth: 60 });
  }

  // Pie de página
  doc.setFontSize(8);
  doc.text(`Documento generado el ${today} - Página 1 de 1`, 105, 280, {
    align: "center",
  });
}

// Función principal para generar el PDF
export async function generatePurchaseOrderPDF(
  orderData: PurchaseOrderData,
  action: "download" | "print" = "download"
): Promise<void> {
  // Crear documento PDF en formato A4
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Información de la empresa (reemplazar con datos reales)
  const companyInfo = {
    name: "NOMBRE DE TU EMPRESA S.A. DE C.V.",
    address: "Av. Principal #123, Col. Centro, Ciudad, CP 00000",
    phone: "+52 (555) 123-4567",
    email: "contacto@tuempresa.com",
    website: "www.tuempresa.com",
    rfc: "TUE970101XXX",
  };

  // Agregar logo e información de la empresa
  await addCompanyLogo(doc);
  addProfessionalHeader(doc, companyInfo);

  // Agregar información de la orden
  const orderInfoY = addOrderInfo(doc, orderData, 70);

  // Agregar tabla de productos
  addProductsTable(doc, orderData.items, orderInfoY);

  // Obtener la posición Y después de la tabla
  const finalY = (doc as any).lastAutoTable?.finalY || orderInfoY + 100;

  // Agregar resumen y totales
  const summaryY = addSummary(doc, orderData, finalY + 10);

  // Agregar términos y condiciones
  const termsY = addTermsAndConditions(doc, orderData, summaryY + 10);

  // Agregar firmas
  addSignatures(doc, orderData, termsY + 10);

  // Guardar o imprimir el PDF
  const fileName = `Orden_Compra_${orderData.orderNumber}_${
    new Date().toISOString().split("T")[0]
  }.pdf`;

  if (action === "download") {
    doc.save(fileName);
  } else {
    doc.autoPrint();
    window.open(doc.output("bloburl"), "_blank");
  }
}

// Función para generar múltiples órdenes en un solo PDF
export async function generateBulkPurchaseOrdersPDF(
  orders: PurchaseOrderData[],
  fileName: string = "Ordenes_Compra.pdf"
): Promise<void> {
  const doc = new jsPDF();

  orders.forEach((order, index) => {
    if (index > 0) {
      doc.addPage();
    }

    // Llamar a las mismas funciones pero con el documento actual
    addProfessionalHeader(doc, {
      name: "TU EMPRESA",
      address: "Dirección de la empresa",
      phone: "Teléfono",
      email: "email@empresa.com",
      website: "www.empresa.com",
      rfc: "RFC123456XXX",
    });

    const orderInfoY = addOrderInfo(doc, order, 70);
    addProductsTable(doc, order.items, orderInfoY);

    const finalY = (doc as any).lastAutoTable?.finalY || orderInfoY + 100;
    const summaryY = addSummary(doc, order, finalY + 10);
    const termsY = addTermsAndConditions(doc, order, summaryY + 10);
    addSignatures(doc, order, termsY + 10);
  });

  doc.save(fileName);
}

// Función para generar reporte de saldos y expiración
export async function generateStockReportPDF(
  items: PurchaseOrderItem[]
): Promise<void> {
  const doc = new jsPDF();

  // Encabezado del reporte
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("REPORTE DE SALDOS Y EXPIRACIÓN", 105, 20, { align: "center" });

  doc.setFontSize(12);
  doc.text(`Generado: ${new Date().toLocaleDateString("es-ES")}`, 105, 30, {
    align: "center",
  });

  // Tabla de reporte
  const tableColumn = [
    "Código",
    "Producto",
    "Stock Actual",
    "Stock Mínimo",
    "Faltante",
    "Expiración",
    "Días Restantes",
    "Estado",
  ];

  const tableRows = items.map((item) => {
    const needed = Math.max(0, item.minStock + item.reorderPoint - item.stock);
    let daysRemaining = "N/A";
    let status = "OK";

    if (item.expirationDate) {
      const expDate = new Date(item.expirationDate);
      const today = new Date();
      const diffTime = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      daysRemaining = diffDays.toString();

      if (diffDays <= 0) {
        status = "EXPIRADO";
      } else if (diffDays <= 30) {
        status = "POR EXPIRAR";
      } else if (diffDays <= 60) {
        status = "PRÓXIMO";
      }
    }

    return [
      item.productCode,
      item.description.substring(0, 30),
      item.stock.toString(),
      (item.minStock + item.reorderPoint).toString(),
      needed.toString(),
      item.expirationDate ? formatDate(item.expirationDate) : "N/A",
      daysRemaining,
      status,
    ];
  });

  autoTable(doc, {
    startY: 40,
    head: [tableColumn],
    body: tableRows,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [0, 51, 102],
      textColor: 255,
      fontStyle: "bold",
    },
    didDrawCell: (data) => {
      if (data.row.index >= 0 && data.column.index === 7) {
        const status = data.cell.raw as string;
        let color: number[] = [255, 255, 255];

        switch (status) {
          case "EXPIRADO":
            color = [248, 215, 218]; // Rojo claro
            break;
          case "POR EXPIRAR":
            color = [255, 243, 205]; // Amarillo claro
            break;
          case "PRÓXIMO":
            color = [212, 237, 218]; // Verde claro
            break;
        }

        doc.setFillColor(color[0], color[1], color[2]);
        doc.rect(
          data.cell.x,
          data.cell.y,
          data.cell.width,
          data.cell.height,
          "F"
        );
      }
    },
  });

  // Resumen al final
  const expiredCount = items.filter((item) => {
    if (!item.expirationDate) return false;
    const expDate = new Date(item.expirationDate);
    return expDate <= new Date();
  }).length;

  const expiringCount = items.filter((item) => {
    if (!item.expirationDate) return false;
    const expDate = new Date(item.expirationDate);
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    return expDate <= thirtyDays && expDate > new Date();
  }).length;

  const lowStockCount = items.filter((item) => {
    const needed = Math.max(0, item.minStock + item.reorderPoint - item.stock);
    return needed > 0;
  }).length;

  const finalY = (doc as any).lastAutoTable?.finalY || 100;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("RESUMEN DEL REPORTE:", 15, finalY + 10);

  doc.setFont("helvetica", "normal");
  doc.text(`• Productos analizados: ${items.length}`, 20, finalY + 20);
  doc.text(`• Productos expirados: ${expiredCount}`, 20, finalY + 25);
  doc.text(
    `• Productos por expirar (≤30 días): ${expiringCount}`,
    20,
    finalY + 30
  );
  doc.text(`• Productos con saldo bajo: ${lowStockCount}`, 20, finalY + 35);

  doc.save(`Reporte_Saldos_${new Date().toISOString().split("T")[0]}.pdf`);
}
