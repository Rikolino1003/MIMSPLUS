from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from datetime import datetime
from django.conf import settings


def generar_factura_pdf(factura):
    """
    Genera un PDF de factura usando ReportLab
    """
    buffer = BytesIO()
    
    # Crear documento PDF
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
    
    # Estilos
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=6,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=12,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=6,
        fontName='Helvetica-Bold'
    )
    
    normal_style = styles['Normal']
    normal_style.fontSize = 10
    
    # Contenido del documento
    elements = []
    
    # Encabezado
    elements.append(Paragraph("FACTURA", title_style))
    elements.append(Spacer(1, 0.15*inch))
    
    # Información de la empresa y factura
    empresa_data = [
        ['FARMACIA SISTEMA', f"Factura #{factura.id:05d}"],
        ['Cali, Colombia', f"Fecha: {factura.fecha_emision.strftime('%d/%m/%Y')}"],
        ['', f"Hora: {factura.fecha_emision.strftime('%H:%M')}"],
    ]
    
    empresa_table = Table(empresa_data, colWidths=[3.5*inch, 3*inch])
    empresa_table.setStyle(TableStyle([
        ('FONT', (0, 0), (0, -1), 'Helvetica', 10),
        ('FONT', (1, 0), (1, -1), 'Helvetica-Bold', 10),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.black),
        ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#1e40af')),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    
    elements.append(empresa_table)
    elements.append(Spacer(1, 0.2*inch))
    
    # Datos del cliente
    elements.append(Paragraph("CLIENTE", heading_style))
    
    cliente_info = [
        ['Nombre:', factura.cliente.nombre_completo or factura.cliente.username],
        ['Correo:', factura.cliente.email or 'N/A'],
        ['Teléfono:', factura.cliente.phone or 'N/A'],
        ['Dirección:', factura.direccion_entrega or 'No especificada'],
    ]
    
    cliente_table = Table(cliente_info, colWidths=[1.5*inch, 5*inch])
    cliente_table.setStyle(TableStyle([
        ('FONT', (0, 0), (0, -1), 'Helvetica-Bold', 9),
        ('FONT', (1, 0), (1, -1), 'Helvetica', 9),
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e0e7ff')),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#1e40af')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    
    elements.append(cliente_table)
    elements.append(Spacer(1, 0.25*inch))
    
    # Tabla de productos
    elements.append(Paragraph("DETALLES DEL PEDIDO", heading_style))
    elements.append(Spacer(1, 0.1*inch))
    
    # Encabezados de la tabla
    detalles_data = [['MEDICAMENTO', 'CANTIDAD', 'PRECIO UND.', 'SUBTOTAL']]
    
    # Datos de los productos
    for detalle in factura.detalles.all():
        detalles_data.append([
            detalle.medicamento.nombre[:40],
            str(detalle.cantidad),
            f"${detalle.precio_unitario:.2f}",
            f"${detalle.subtotal:.2f}"
        ])
    
    # Fila de totales
    detalles_data.append(['', '', 'TOTAL:', f"${factura.total:.2f}"])
    
    # Crear tabla
    detalles_table = Table(detalles_data, colWidths=[3*inch, 1*inch, 1.5*inch, 1.5*inch])
    detalles_table.setStyle(TableStyle([
        # Encabezado
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONT', (0, 0), (-1, 0), 'Helvetica-Bold', 10),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, 0), 5),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 5),
        
        # Datos
        ('FONT', (0, 1), (-1, -2), 'Helvetica', 9),
        ('ALIGN', (0, 1), (-1, -2), 'LEFT'),
        ('ALIGN', (1, 1), (-1, -2), 'CENTER'),
        ('ALIGN', (2, 1), (-1, -2), 'RIGHT'),
        ('ALIGN', (3, 1), (-1, -2), 'RIGHT'),
        ('TOPPADDING', (0, 1), (-1, -2), 3),
        ('BOTTOMPADDING', (0, 1), (-1, -2), 3),
        ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, colors.HexColor('#f3f4f6')]),
        
        # Total
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#dbeafe')),
        ('FONT', (0, -1), (-1, -1), 'Helvetica-Bold', 11),
        ('TEXTCOLOR', (0, -1), (-1, -1), colors.HexColor('#1e40af')),
        ('ALIGN', (0, -1), (2, -1), 'RIGHT'),
        ('ALIGN', (3, -1), (3, -1), 'RIGHT'),
        ('TOPPADDING', (0, -1), (-1, -1), 5),
        ('BOTTOMPADDING', (0, -1), (-1, -1), 5),
        
        # Bordes
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d1d5db')),
    ]))
    
    elements.append(detalles_table)
    elements.append(Spacer(1, 0.2*inch))
    
    # Información adicional
    info_data = [
        ['Método de Pago:', factura.get_metodo_pago_display()],
    ]
    
    if factura.observaciones:
        info_data.append(['Observaciones:', factura.observaciones])
    
    info_table = Table(info_data, colWidths=[1.5*inch, 5*inch])
    info_table.setStyle(TableStyle([
        ('FONT', (0, 0), (-1, -1), 'Helvetica', 9),
        ('FONT', (0, 0), (0, -1), 'Helvetica-Bold', 9),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    
    elements.append(info_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Pie de página
    elements.append(Paragraph(
        "Gracias por su compra. Esta factura es válida como comprobante de pago.",
        ParagraphStyle('Footer', parent=normal_style, fontSize=8, textColor=colors.grey, alignment=TA_CENTER)
    ))
    
    # Generar PDF
    doc.build(elements)
    buffer.seek(0)
    
    return buffer
