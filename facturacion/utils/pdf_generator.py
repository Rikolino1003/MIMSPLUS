from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT

def generar_pdf_factura(factura):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    elements = []
    styles = getSampleStyleSheet()

    # ===========================
    # 1. ENCABEZADO (Empresa)
    # ===========================
    # Estilo personalizado para el encabezado
    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Normal'],
        alignment=TA_CENTER,
        fontSize=10,
        leading=14
    )
    
    empresa_info = [
        "<b>DROGUERÍA MIMS S.A.S</b>",
        "NIT: 901.999.123-4",
        "Tel: 320 555 99 33",
        "Dirección: Calle 15 # 12-45, Bogotá"
    ]
    
    for line in empresa_info:
        elements.append(Paragraph(line, header_style))
    
    elements.append(Spacer(1, 20))

    # ===========================
    # 2. TÍTULO FACTURA
    # ===========================
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        alignment=TA_CENTER,
        fontSize=18,
        spaceAfter=20
    )
    elements.append(Paragraph(f"FACTURA #{factura.id}", title_style))

    # ===========================
    # 3. INFORMACIÓN DEL CLIENTE
    # ===========================
    # Datos
    cliente_nombre = factura.cliente.nombre_completo or factura.cliente.username
    fecha_fmt = factura.fecha_emision.strftime('%Y-%m-%d %H:%M:%S')
    
    data_cliente = [
        ["Cliente:", cliente_nombre],
        ["Fecha:", fecha_fmt],
        ["Método de pago:", factura.metodo_pago],
        ["Dirección de entrega:", factura.direccion_entrega],
        ["Observaciones:", factura.observaciones or "Ninguna"]
    ]

    # Tabla
    t_cliente = Table(data_cliente, colWidths=[150, 380])
    t_cliente.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('BACKGROUND', (0, 0), (0, -1), colors.whitesmoke),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
    ]))
    elements.append(t_cliente)
    elements.append(Spacer(1, 30))

    # ===========================
    # 4. DETALLES (ITEMS)
    # ===========================
    # Encabezados
    data_items = [["Medicamento", "Cantidad", "Precio Unitario", "Subtotal"]]
    
    # Filas
    for d in factura.detalles.all():
        data_items.append([
            d.medicamento.nombre,
            str(d.cantidad),
            f"${d.precio_unitario:,.2f}",
            f"${d.subtotal:,.2f}"
        ])

    # Tabla Items
    t_items = Table(data_items, colWidths=[230, 80, 110, 110])
    
    # Estilo Tabla Items
    t_items.setStyle(TableStyle([
        # Encabezado
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#003366")), # Azul oscuro
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        
        # Cuerpo
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ALIGN', (1, 1), (-1, -1), 'CENTER'), # Cantidad centrada
        ('ALIGN', (2, 1), (-1, -1), 'RIGHT'),  # Precios a la derecha
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(t_items)
    elements.append(Spacer(1, 10))

    # ===========================
    # 5. TOTAL
    # ===========================
    data_total = [
        ["Total a pagar:", f"${factura.total:,.2f}"]
    ]
    
    t_total = Table(data_total, colWidths=[420, 110])
    t_total.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#D6EAF8")), # Azul claro
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor("#003366")),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(t_total)
    elements.append(Spacer(1, 40))

    # ===========================
    # 6. FOOTER
    # ===========================
    footer_style = ParagraphStyle(
        'FooterStyle',
        parent=styles['Normal'],
        alignment=TA_CENTER,
        fontSize=9,
        textColor=colors.black
    )
    
    elements.append(Paragraph("<b>Gracias por confiar en Droguería Mims</b>", footer_style))
    elements.append(Paragraph("Este documento es generado automáticamente – No requiere firma.", footer_style))

    # Generar PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer
