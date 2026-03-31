import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Quote } from '../types';
import logo1 from '../../../public/logo1.png';

interface PDFOptions {
  quote: Quote;
}

export function generateQuotePDF({ quote }: PDFOptions): void {
  // Versión actualizada con tabla sin Unidad y filas separadas para Incluye
  const doc = new jsPDF();

  const primaryBlue: [number, number, number] = [30, 64, 175];
  const marginLeft = 15;
  const marginRight = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - marginLeft - marginRight;

  // ========== LÍNEA AZUL SUPERIOR ==========
  doc.setDrawColor(...primaryBlue);
  doc.setLineWidth(3);
  doc.line(marginLeft, 10, pageWidth - marginRight, 10);

  // ========== HEADER ==========
  // Logo a la izquierda
  const imgProps = doc.getImageProperties(logo1.src);
  const imgWidth = 45;
  const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
  doc.addImage(logo1.src, 'PNG', marginLeft, 15, imgWidth, imgHeight);

  // Título "COTIZACIÓN" a la derecha
  doc.setFontSize(22);
  doc.setTextColor(...primaryBlue);
  doc.setFont('helvetica', 'bold');
  doc.text('COTIZACIÓN', pageWidth - marginRight, 25, { align: 'right' });

  // ========== INFORMACIÓN DE LA EMPRESA Y FECHAS ==========
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');

  let currentY = 40;
  const infoBoxStartY = currentY - 5;

  // Columna izquierda - Datos de la empresa
  doc.setFontSize(9);
  doc.setTextColor(...primaryBlue);
  doc.setFont('helvetica', 'bold');
  doc.text('NIT:', marginLeft + 2, currentY);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text('333314024', marginLeft + 27, currentY);
  
  // Línea debajo de NIT
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(marginLeft + 27, currentY + 1, marginLeft + 90, currentY + 1);

  currentY += 5;
  doc.setTextColor(...primaryBlue);
  doc.setFont('helvetica', 'bold');
  doc.text('Correo:', marginLeft + 2, currentY);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text('srlsmartservices@gmail.com', marginLeft + 27, currentY);
  
  // Línea debajo de Correo
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(marginLeft + 27, currentY + 1, marginLeft + 90, currentY + 1);

  currentY += 5;
  doc.setTextColor(...primaryBlue);
  doc.setFont('helvetica', 'bold');
  doc.text('Teléfono:', marginLeft + 2, currentY);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text('77299562 / 75812336', marginLeft + 27, currentY);
  
  // Línea debajo de Teléfono
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(marginLeft + 27, currentY + 1, marginLeft + 90, currentY + 1);

  currentY += 3;

  // Columna derecha - N° de cotización y Fechas
  const quoteNumber = String(quote.quoteNumber ?? quote.id ?? '');
  const createdDate = quote.createdAt
    ? new Date(quote.createdAt).toLocaleDateString('es-BO')
    : new Date().toLocaleDateString('es-BO');

  const validDate = quote.validUntil
    ? new Date(quote.validUntil).toLocaleDateString('es-BO')
    : '';

  const rightColumn = pageWidth - 70;
  currentY = 35;

  doc.setTextColor(...primaryBlue);
  doc.setFont('helvetica', 'bold');
  doc.text('N° Cotización:', pageWidth - marginRight - 60, currentY);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text(quoteNumber, pageWidth - marginRight, currentY, { align: 'right' });
  
  // Línea debajo de N° Cotización
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(pageWidth - marginRight - 60, currentY + 1, pageWidth - marginRight, currentY + 1);

  currentY += 5;
  doc.setTextColor(...primaryBlue);
  doc.setFont('helvetica', 'bold');
  doc.text('Fecha:', pageWidth - marginRight - 60, currentY);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text(createdDate, pageWidth - marginRight, currentY, { align: 'right' });
  
  // Línea debajo de Fecha
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(pageWidth - marginRight - 60, currentY + 1, pageWidth - marginRight, currentY + 1);

  currentY += 5;
  doc.setTextColor(...primaryBlue);
  doc.setFont('helvetica', 'bold');
  doc.text('Válido hasta:', pageWidth - marginRight - 60, currentY);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text(validDate, pageWidth - marginRight, currentY, { align: 'right' });
  
  // Línea debajo de Válido hasta
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(pageWidth - marginRight - 60, currentY + 1, pageWidth - marginRight, currentY + 1);

  // ========== CLIENTE ==========
  currentY = 65;
  doc.setTextColor(...primaryBlue);
  doc.setFont('helvetica', 'bold');
  doc.text('Cliente:', marginLeft + 2, currentY);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  const clientName = quote.client?.name ?? 'Cliente';
  doc.text(clientName, marginLeft + 22, currentY);
  
  // Línea debajo de Cliente
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(marginLeft + 22, currentY + 1, pageWidth - marginRight - 2, currentY + 1);

  // ========== CREADO POR ==========
  currentY += 8;
  doc.setTextColor(...primaryBlue);
  doc.setFont('helvetica', 'bold');
  doc.text('Creado por:', marginLeft + 2, currentY);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  const creatorName = quote.creator?.fullName || quote.createdBy || 'N/A';
  doc.text(creatorName, marginLeft + 27, currentY);
  
  // Línea debajo de Creado por
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(marginLeft + 27, currentY + 1, pageWidth - marginRight - 2, currentY + 1);

  currentY += 3;

  // ========== DESCRIPCIÓN DEL SERVICIO ==========
  currentY += 5;
  if (quote.generalDescription) {
    doc.setFont('helvetica', 'bold');
    doc.text('Descripción del servicio: ', marginLeft, currentY);
    doc.setFont('helvetica', 'normal');
    const splitDescription = doc.splitTextToSize(
      quote.generalDescription,
      contentWidth - 55
    );
    doc.text(splitDescription, marginLeft + 55, currentY);
    currentY += splitDescription.length * 4 + 5;
  } else {
    currentY += 5;
  }

  // Línea separadora después de la descripción
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(marginLeft, currentY, pageWidth - marginRight, currentY);
  currentY += 8;

  // Guardar posición inicial para el borde de la sección de tabla y totales
  const tableSectionStartY = currentY;

  // ========== TABLA DE PRODUCTOS/SERVICIOS ==========
  const tableData: any[] = [];
  
  (quote.items ?? []).forEach((item, index) => {
    const quantity = Number(item.quantity ?? 0);
    const unitPrice = Number(item.unitPrice ?? 0);
    const discount = Number(item.discount ?? 0);
    const total = quantity * unitPrice * (1 - discount / 100);

    // Fila principal del producto
    tableData.push([
      index + 1,
      item.description ?? '',
      quantity,
      `${unitPrice.toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs`,
      `${total.toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs`
    ]);

    // Fila de detalles "Incluye:" si existen
    if (item.details && item.details.length > 0) {
      const detailsText = 'Incluye:\n' + item.details
        .map((d: any) => `• ${typeof d === 'string' ? d : d.description}`)
        .join('\n');
      
      tableData.push([
        '',
        detailsText,
        '',
        '',
        ''
      ]);
    }
  });

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginLeft, right: marginRight },
    tableWidth: contentWidth,
    head: [['Ítem', 'Descripción', 'Cant.', 'Precio', 'Total']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 1,
      overflow: 'linebreak',
      valign: 'top'
    },
    headStyles: {
      fillColor: primaryBlue,
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 10
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },   // Ítem
      1: { cellWidth: 104, halign: 'left' },    // Descripción (con incluye)
      2: { cellWidth: 12, halign: 'center' },   // Cantidad
      3: { cellWidth: 28, halign: 'right' },    // Precio
      4: { cellWidth: 28, halign: 'right' }     // Total
    }
  });

  currentY = (doc as any).lastAutoTable.finalY;

  // ========== SUBTOTAL Y TOTAL COMO TABLA ==========
  const subtotal = Number(quote.subtotal ?? 0);
  const totalAmount = Number(quote.grandTotal ?? quote.total ?? 0);
  
  const totalsTableData: any[] = [];
  
  // Fila de Subtotal
  totalsTableData.push([
    '',
    '',
    '',
    { content: 'Subtotal:', styles: { fontStyle: 'bold', textColor: primaryBlue, halign: 'right' } },
    { content: `${subtotal.toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs`, styles: { halign: 'right' } }
  ]);
  
  // Fila de TOTAL con Son en la misma fila
  const sonText = quote.observations || '';
  totalsTableData.push([
    { content: 'Son:', styles: { fontStyle: 'bold', textColor: primaryBlue } },
    { content: sonText, colSpan: 2 },
    { content: 'TOTAL:', styles: { fontStyle: 'bold', textColor: primaryBlue, halign: 'right' } },
    { content: `${totalAmount.toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs`, styles: { halign: 'right', fontStyle: 'bold' } }
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginLeft, right: marginRight },
    tableWidth: contentWidth,
    body: totalsTableData,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 2,
      overflow: 'linebreak',
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },   // Alineado con Ítem
      1: { cellWidth: 104, halign: 'left' },    // Alineado con Descripción
      2: { cellWidth: 12, halign: 'center' },   // Alineado con Cantidad
      3: { cellWidth: 28, halign: 'right' },    // Alineado con Precio
      4: { cellWidth: 28, halign: 'right' }     // Alineado con Total
    }
  });
  
  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Línea separadora antes de condiciones
  currentY += 8;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(marginLeft, currentY, pageWidth - marginRight, currentY);

  // ========== CONDICIONES ==========
  currentY += 8;

  // Título con fondo azul
  doc.setFillColor(...primaryBlue);
  doc.rect(marginLeft, currentY, contentWidth, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Condiciones:', pageWidth / 2, currentY + 5.5, { align: 'center' });

  currentY += 8;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const deliveryTime = quote.deliveryTime ?? '10 días';
  const paymentTypeMap: Record<string, string> = {
    'CONTADO': 'Contra entrega',
    'CREDITO_30': 'Crédito 30 días',
    'CREDITO_60': 'Crédito 60 días',
    'CREDITO_90': 'Crédito 90 días'
  };
  const paymentType = paymentTypeMap[quote.paymentType ?? 'CONTADO'] ?? 'Contra entrega';

  const defaultTerms = [
    '• Incluye impuestos',
    `• Validez: ${deliveryTime}`,
    `• Forma de pago: ${paymentType}`,
    '• Tiempo de entrega: Coordinado con el cliente'
  ];

  // Guardar posición inicial del contenido
  const conditionsStartY = currentY;

  currentY += 5;

  if (quote.termsConditions) {
    const customTerms = doc.splitTextToSize(
      quote.termsConditions,
      contentWidth - 10
    );
    doc.text(customTerms, marginLeft + 5, currentY);
    currentY += customTerms.length * 5;
  } else {
    defaultTerms.forEach(term => {
      doc.text(term, marginLeft + 5, currentY);
      currentY += 5;
    });
  }

  currentY += 3;

  // Dibujar borde alrededor del contenido de condiciones
  const conditionsHeight = currentY - conditionsStartY;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.rect(marginLeft, conditionsStartY, contentWidth, conditionsHeight);

  // ========== FOOTER ==========
  currentY += 8;
  
  // Línea separadora antes del footer
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(marginLeft, currentY, pageWidth - marginRight, currentY);
  
  currentY += 8;
  
  // Verificar si hay espacio suficiente, si no, agregar nueva página
  if (currentY > pageHeight - 30) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text('Si tiene algún otro problema consulte con nuestros soportes.', pageWidth / 2, currentY, { align: 'center' });

  // ========== GUARDAR PDF ==========
  const fileName = `Cotizacion_${quoteNumber}_${clientName.replace(/\s+/g, '_')}.pdf`;

  doc.save(fileName);
}
