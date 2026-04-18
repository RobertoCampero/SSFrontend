import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Quote } from '../types';
import logo1 from '../../../public/logo1.png';

interface PDFOptions {
  quote: Quote;
}

function numberToWords(amount: number): string {
  const unidades = ['', 'Un', 'Dos', 'Tres', 'Cuatro', 'Cinco', 'Seis', 'Siete', 'Ocho', 'Nueve']
  const especiales = ['Diez', 'Once', 'Doce', 'Trece', 'Catorce', 'Quince', 'Dieciseis', 'Diecisiete', 'Dieciocho', 'Diecinueve']
  const decenas = ['', 'Diez', 'Veinte', 'Treinta', 'Cuarenta', 'Cincuenta', 'Sesenta', 'Setenta', 'Ochenta', 'Noventa']
  const centenas = ['', 'Ciento', 'Doscientos', 'Trescientos', 'Cuatrocientos', 'Quinientos', 'Seiscientos', 'Setecientos', 'Ochocientos', 'Novecientos']

  function convertGroup(n: number): string {
    if (n === 0) return ''
    if (n === 100) return 'Cien'
    
    let result = ''
    
    if (n >= 100) {
      result += centenas[Math.floor(n / 100)] + ' '
      n = n % 100
    }
    
    if (n >= 20) {
      const dec = Math.floor(n / 10)
      const uni = n % 10
      if (dec === 2 && uni > 0) {
        result += 'Veinti' + unidades[uni].toLowerCase()
      } else {
        result += decenas[dec]
        if (uni > 0) result += ' y ' + unidades[uni]
      }
    } else if (n >= 10) {
      result += especiales[n - 10]
    } else if (n > 0) {
      result += unidades[n]
    }
    
    return result.trim()
  }

  const entero = Math.floor(Math.abs(amount))
  const centavos = Math.round((Math.abs(amount) - entero) * 100)

  let palabras = ''

  if (entero === 0) {
    palabras = 'Cero'
  } else if (entero === 1) {
    palabras = 'Un'
  } else {
    const millones = Math.floor(entero / 1000000)
    const miles = Math.floor((entero % 1000000) / 1000)
    const resto = entero % 1000

    if (millones > 0) {
      if (millones === 1) {
        palabras += 'Un Millon '
      } else {
        palabras += convertGroup(millones) + ' Millones '
      }
    }

    if (miles > 0) {
      if (miles === 1) {
        palabras += 'Mil '
      } else {
        palabras += convertGroup(miles) + ' Mil '
      }
    }

    if (resto > 0) {
      palabras += convertGroup(resto)
    }
  }

  palabras = palabras.trim()

  if (centavos > 0) {
    const centavosText = convertGroup(centavos)
    return `${palabras} Bolivianos con ${centavosText} Centavos`
  } else {
    return `${palabras} Bolivianos`
  }
}

export function generateQuotePDF({ quote }: PDFOptions): void {
  
  const doc = new jsPDF();

  const primaryBlue: [number, number, number] = [30, 64, 175];
  const marginLeft = 15;
  const marginRight = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - marginLeft - marginRight;

  
  doc.setDrawColor(...primaryBlue);
  doc.setLineWidth(3);
  doc.line(marginLeft, 10, pageWidth - marginRight, 10);

  const imgProps = doc.getImageProperties(logo1.src);
  const imgWidth = 45;
  const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
  doc.addImage(logo1.src, 'PNG', marginLeft, 15, imgWidth, imgHeight);

  doc.setFontSize(22);
  doc.setTextColor(...primaryBlue);
  doc.setFont('helvetica', 'bold');
  doc.text('COTIZACIÓN', pageWidth - marginRight, 25, { align: 'right' });

  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');

  let currentY = 40;
  const infoBoxStartY = currentY - 5;

  doc.setFontSize(9);
  doc.setTextColor(...primaryBlue);
  doc.setFont('helvetica', 'bold');
  doc.text('NIT:', marginLeft + 2, currentY);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text('333314024', marginLeft + 27, currentY);
  
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
  
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(marginLeft + 27, currentY + 1, marginLeft + 90, currentY + 1);

  currentY += 3;

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
  
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(pageWidth - marginRight - 60, currentY + 1, pageWidth - marginRight, currentY + 1);

  currentY = 65;
  doc.setTextColor(...primaryBlue);
  doc.setFont('helvetica', 'bold');
  doc.text('Cliente:', marginLeft + 2, currentY);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  const clientName = quote.client?.name ?? 'Cliente';
  doc.text(clientName, marginLeft + 22, currentY);
  
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(marginLeft + 22, currentY + 1, pageWidth - marginRight - 2, currentY + 1);

  currentY += 6;
  const clientDocType = (quote.client as any)?.documentType || 'CI';
  const clientDocNum = (quote.client as any)?.documentNum || (quote.client as any)?.nit || '-';
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`${clientDocType}: ${clientDocNum}`, marginLeft + 22, currentY);
  doc.setFontSize(9);

  currentY += 8;
  doc.setTextColor(...primaryBlue);
  doc.setFont('helvetica', 'bold');
  doc.text('Creado por:', marginLeft + 2, currentY);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  const creatorName = quote.creator?.fullName || quote.createdBy || 'N/A';
  doc.text(creatorName, marginLeft + 27, currentY);
  
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(marginLeft + 27, currentY + 1, pageWidth - marginRight - 2, currentY + 1);

  currentY += 3;

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

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(marginLeft, currentY, pageWidth - marginRight, currentY);
  currentY += 8;

  const tableSectionStartY = currentY;

  const tableData: any[] = [];
  
  (quote.items ?? []).forEach((item, index) => {
    const quantity = Number(item.quantity ?? 0);
    const unitPrice = Number(item.unitPrice ?? 0);
    const discountPercent = Number(item.discount ?? 0);
    const discountAmount = quantity * unitPrice * (discountPercent / 100);
    const total = quantity * unitPrice - discountAmount;

    tableData.push([
      index + 1,
      item.description ?? '',
      `PZA`,
      quantity,
      `BS ${unitPrice.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`,
      `- BS ${discountAmount.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`,
      `BS ${total.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`
    ]);

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
    head: [['ITEM', 'DESCRIPCION', 'UND','CANT.', 'P. UNITARIO','DESCUENTO', 'SUBTOTAL']],
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
      fontSize: 8
    },
    columnStyles: {
      0: { cellWidth: 13, halign: 'center' },
      1: { cellWidth: 60, halign: 'left' },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 22, halign: 'right' }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY;

  const subtotal = Number(quote.subtotal ?? 0);
  const discountPercent = Number(quote.discountPercent ?? 0);
  const discountAmount = Number(quote.discount ?? (subtotal * discountPercent / 100));
  const totalAmount = Number(quote.grandTotal ?? quote.total ?? 0);
  const hasDiscount = discountPercent > 0 || discountAmount > 0;
  
  const totalsTableData: any[] = [];
  
  totalsTableData.push([
    '',
    '',
    '',
    '',
    '',
    { content: 'Total', styles: { fontStyle: 'bold', textColor: primaryBlue, halign: 'right' } },
    { content: `BS ${subtotal.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`, styles: { halign: 'right' } }
  ]);
  if (hasDiscount) {
    const discPctDisplay = discountPercent > 0 
      ? `${discountPercent.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} %`
      : `BS ${discountAmount.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`;
    totalsTableData.push([
      '',
      '',
      '',
      '',
      '',
      { content: 'Descuento', styles: { fontStyle: 'bold', textColor: primaryBlue, halign: 'right' } },
      { content: discPctDisplay, styles: { halign: 'right', textColor: [220, 50, 50] as [number, number, number] } }
    ]);
  }

  const totalEnLetras = numberToWords(totalAmount)
  totalsTableData.push([
    { content: 'SON:', styles: { fontStyle: 'bold', textColor: primaryBlue } },
    { content: totalEnLetras, colSpan: 4, styles: { fontStyle: 'italic', fontSize: 8 } },
    { content: 'Total', styles: { fontStyle: 'bold', textColor: primaryBlue, halign: 'right' } },
    { content: `BS ${totalAmount.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`, styles: { halign: 'right', fontStyle: 'bold' } }
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
      0: { cellWidth: 13, halign: 'center' },
      1: { cellWidth: 60, halign: 'left' },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 22, halign: 'right' }
    }
  });
  
  currentY = (doc as any).lastAutoTable.finalY + 8;

  currentY += 8;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(marginLeft, currentY, pageWidth - marginRight, currentY);

  currentY += 8;

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

  let validezText = 'N/A';
  if (quote.validUntil) {
    const created = quote.createdAt ? new Date(quote.createdAt) : new Date();
    const validDate = new Date(quote.validUntil);
    const diffDays = Math.round((validDate.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    validezText = `${diffDays} día${diffDays !== 1 ? 's' : ''}`;
  }

  const deliveryTime = quote.deliveryTime || 'Coordinado con el cliente';
  const paymentTypeMap: Record<string, string> = {
    'CONTADO': 'Contra entrega',
    'CREDITO': 'Crédito',
    'CREDITO_30': 'Crédito 30 días',
    'CREDITO_60': 'Crédito 60 días',
    'CREDITO_90': 'Crédito 90 días'
  };
  const paymentType = paymentTypeMap[quote.paymentType ?? 'CONTADO'] ?? quote.paymentType ?? 'Contra entrega';

  const defaultTerms = [
    '• Incluye impuestos',
    `• Validez: ${validezText}`,
    `• Forma de pago: ${paymentType}`,
    `• Tiempo de entrega: ${deliveryTime}`
  ];

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

  const conditionsHeight = currentY - conditionsStartY;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.rect(marginLeft, conditionsStartY, contentWidth, conditionsHeight);

  currentY += 8;
  
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(marginLeft, currentY, pageWidth - marginRight, currentY);
  
  currentY += 8;
  
  if (currentY > pageHeight - 30) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text('Si tiene algún otro problema consulte con nuestros soportes.', pageWidth / 2, currentY, { align: 'center' });

  const fileName = `Cotizacion_${quoteNumber}_${clientName.replace(/\s+/g, '_')}.pdf`;

  doc.save(fileName);
}
