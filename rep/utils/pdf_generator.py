"""
=================================================================
📊 GENERADOR DE PDF PARA REPORTES
=================================================================

Este módulo genera archivos PDF para los reportes del sistema.
Utiliza ReportLab para crear documentos PDF profesionales y bien formateados.

Funciones principales:
- generar_pdf_reporte(reporte): Genera un PDF completo del reporte

Autor: Sistema MIMS
Fecha: 2025
=================================================================
"""

from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
import json


def generar_pdf_reporte(reporte):
    """
    ================================
    📄 GENERAR PDF DEL REPORTE
    ================================
    
    Genera un archivo PDF completo con toda la información del reporte.
    
    Parámetros:
    - reporte: Instancia del modelo Reporte
    
    Retorna:
    - BytesIO: Buffer con el contenido del PDF
    """
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    elements = []
    styles = getSampleStyleSheet()

    # ===========================
    # 1. ENCABEZADO (Empresa)
    # ===========================
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
    # 2. TÍTULO DEL REPORTE
    # ===========================
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        alignment=TA_CENTER,
        fontSize=18,
        spaceAfter=20,
        textColor=colors.HexColor("#003366")
    )
    elements.append(Paragraph(f"REPORTE {reporte.id_reporte}", title_style))
    
    # Subtítulo con el título del reporte
    subtitle_style = ParagraphStyle(
        'SubtitleStyle',
        parent=styles['Normal'],
        alignment=TA_CENTER,
        fontSize=14,
        spaceAfter=20
    )
    elements.append(Paragraph(f"<i>{reporte.titulo}</i>", subtitle_style))
    elements.append(Spacer(1, 20))

    # ===========================
    # 3. INFORMACIÓN GENERAL DEL REPORTE
    # ===========================
    
    # Obtener nombres
    creado_por_nombre = reporte.creado_por.nombre_completo if reporte.creado_por else "No especificado"
    revisado_por_nombre = reporte.revisado_por.nombre_completo if reporte.revisado_por else "No revisado"
    drogueria_nombre = reporte.drogueria.nombre if reporte.drogueria else "No especificada"
    
    # Formatear fechas
    fecha_medicion_fmt = reporte.fecha_medicion.strftime('%Y-%m-%d %H:%M:%S')
    fecha_creacion_fmt = reporte.fecha_creacion.strftime('%Y-%m-%d %H:%M:%S')
    fecha_actualizacion_fmt = reporte.fecha_actualizacion.strftime('%Y-%m-%d %H:%M:%S')
    fecha_revision_fmt = reporte.fecha_revision.strftime('%Y-%m-%d %H:%M:%S') if reporte.fecha_revision else "No revisado"
    fecha_aprobacion_fmt = reporte.fecha_aprobacion.strftime('%Y-%m-%d %H:%M:%S') if reporte.fecha_aprobacion else "No aprobado"
    
    # Obtener el estado en español
    estado_display = dict(reporte.ESTADOS_REPORTE).get(reporte.estado, reporte.estado)
    tipo_display = dict(reporte.TIPOS_REPORTE).get(reporte.tipo_reporte, reporte.tipo_reporte)
    
    # Tabla con información del reporte
    data_info = [
        ["ID del Reporte:", reporte.id_reporte],
        ["Tipo de Reporte:", tipo_display],
        ["Estado:", estado_display],
        ["Fecha de Medición:", fecha_medicion_fmt],
        ["Fecha de Creación:", fecha_creacion_fmt],
        ["Última Actualización:", fecha_actualizacion_fmt],
        ["Creado Por:", creado_por_nombre],
        ["Revisado Por:", revisado_por_nombre],
        ["Fecha de Revisión:", fecha_revision_fmt],
        ["Fecha de Aprobación:", fecha_aprobacion_fmt],
        ["Droguería:", drogueria_nombre],
    ]

    t_info = Table(data_info, colWidths=[150, 380])
    t_info.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor("#E8F4F8")),  # Fondo azul claro
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
    ]))
    elements.append(t_info)
    elements.append(Spacer(1, 30))

    # ===========================
    # 4. DESCRIPCIÓN DEL REPORTE
    # ===========================
    if reporte.descripcion:
        desc_style = ParagraphStyle(
            'DescStyle',
            parent=styles['Normal'],
            alignment=TA_LEFT,
            fontSize=11,
            spaceAfter=10
        )
        
        elements.append(Paragraph("<b>DESCRIPCIÓN:</b>", desc_style))
        elements.append(Paragraph(reporte.descripcion, desc_style))
        elements.append(Spacer(1, 20))

    # ===========================
    # 5. OBSERVACIONES
    # ===========================
    if reporte.observaciones:
        obs_style = ParagraphStyle(
            'ObsStyle',
            parent=styles['Normal'],
            alignment=TA_LEFT,
            fontSize=11,
            spaceAfter=10
        )
        
        elements.append(Paragraph("<b>OBSERVACIONES:</b>", obs_style))
        elements.append(Paragraph(reporte.observaciones, obs_style))
        elements.append(Spacer(1, 20))

    # ===========================
    # 6. DATOS JSON (si existen)
    # ===========================
    if reporte.datos_json:
        elements.append(Spacer(1, 10))
        
        datos_style = ParagraphStyle(
            'DatosStyle',
            parent=styles['Normal'],
            alignment=TA_LEFT,
            fontSize=11,
            spaceAfter=10
        )
        
        elements.append(Paragraph("<b>DATOS ADICIONALES:</b>", datos_style))
        
        # Convertir JSON a texto formateado
        try:
            datos_texto = json.dumps(reporte.datos_json, indent=2, ensure_ascii=False)
            # Crear tabla con los datos
            datos_lines = datos_texto.split('\n')
            
            # Crear una tabla simple con los datos
            data_datos = [["Campo", "Valor"]]
            
            def parse_json_to_table(data, prefix=""):
                """Convierte JSON anidado a tabla"""
                rows = []
                if isinstance(data, dict):
                    for key, value in data.items():
                        full_key = f"{prefix}.{key}" if prefix else key
                        if isinstance(value, (dict, list)):
                            rows.extend(parse_json_to_table(value, full_key))
                        else:
                            rows.append([full_key, str(value)])
                elif isinstance(data, list):
                    for i, item in enumerate(data):
                        if isinstance(item, (dict, list)):
                            rows.extend(parse_json_to_table(item, f"{prefix}[{i}]"))
                        else:
                            rows.append([f"{prefix}[{i}]", str(item)])
                return rows
            
            datos_rows = parse_json_to_table(reporte.datos_json)
            data_datos.extend(datos_rows[:20])  # Limitar a 20 filas para no hacer el PDF muy largo
            
            if len(datos_rows) > 20:
                data_datos.append(["...", f"(Total de {len(datos_rows)} elementos, mostrando los primeros 20)"])
            
            t_datos = Table(data_datos, colWidths=[200, 330])
            t_datos.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#003366")),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('PADDING', (0, 0), (-1, -1), 6),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
            ]))
            
            elements.append(t_datos)
        except Exception as e:
            elements.append(Paragraph(f"Error al procesar datos JSON: {str(e)}", datos_style))
        
        elements.append(Spacer(1, 20))

    # ===========================
    # 7. RESUMEN DE ESTADO
    # ===========================
    estado_color = {
        'pendiente': colors.HexColor("#FFF3CD"),  # Amarillo claro
        'en_proceso': colors.HexColor("#D1ECF1"),  # Azul claro
        'completado': colors.HexColor("#D4EDDA"),  # Verde claro
        'revisado': colors.HexColor("#D1ECF1"),    # Azul claro
        'aprobado': colors.HexColor("#D4EDDA"),    # Verde claro
        'rechazado': colors.HexColor("#F8D7DA"),   # Rojo claro
        'cancelado': colors.HexColor("#F8D7DA"),   # Rojo claro
    }
    
    estado_bg = estado_color.get(reporte.estado, colors.whitesmoke)
    
    data_resumen = [
        ["<b>RESUMEN DEL ESTADO</b>", ""],
        ["Estado Actual:", estado_display],
        ["PDF Generado:", "Sí" if reporte.pdf_generado else "No"],
        ["Correo Enviado:", "Sí" if reporte.correo_enviado else "No"],
    ]
    
    t_resumen = Table(data_resumen, colWidths=[250, 280])
    t_resumen.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#003366")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BACKGROUND', (0, 1), (-1, -1), estado_bg),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor("#003366")),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
    ]))
    elements.append(t_resumen)
    elements.append(Spacer(1, 40))

    # ===========================
    # 8. FOOTER
    # ===========================
    footer_style = ParagraphStyle(
        'FooterStyle',
        parent=styles['Normal'],
        alignment=TA_CENTER,
        fontSize=9,
        textColor=colors.HexColor("#666666")
    )
    
    elements.append(Paragraph("<b>Sistema MIMS - Gestión de Droguerías</b>", footer_style))
    elements.append(Paragraph("Este documento es generado automáticamente.", footer_style))
    elements.append(Paragraph(f"Reporte generado el {fecha_actualizacion_fmt}", footer_style))

    # ===========================
    # GENERAR PDF
    # ===========================
    doc.build(elements)
    buffer.seek(0)
    return buffer
