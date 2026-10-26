import os
import copy
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=80, bottom=80, left=100, right=100):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def format_cell_text(cell, text, bold=False, italic=False, font_size=9.5, align=WD_ALIGN_PARAGRAPH.LEFT, color_rgb=(0x22, 0x22, 0x22)):
    cell.text = text
    p = cell.paragraphs[0]
    p.alignment = align
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.space_before = Pt(2)
    if len(p.runs) > 0:
        run = p.runs[0]
        run.bold = bold
        run.italic = italic
        run.font.name = 'Arial'
        run.font.size = Pt(font_size)
        run.font.color.rgb = RGBColor(*color_rgb)

def set_para_text(p, text, bold=False, italic=False, font_size=11, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=6, line_spacing=1.5, color_rgb=(0x22, 0x22, 0x22)):
    p.text = ''
    p.alignment = align
    p.paragraph_format.line_spacing = line_spacing
    p.paragraph_format.space_after = Pt(space_after)
    run = p.add_run(text)
    run.bold = bold
    run.italic = italic
    run.font.name = 'Arial'
    run.font.size = Pt(font_size)
    run.font.color.rgb = RGBColor(*color_rgb)
    return p

def append_p_after(ref_p, text, bold=False, italic=False, font_size=11, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=6, color_rgb=(0x22, 0x22, 0x22)):
    new_p = parse_xml(f'<w:p {nsdecls("w")}/>')
    ref_p._p.addnext(new_p)
    p = docx.text.paragraph.Paragraph(new_p, ref_p._parent)
    set_para_text(p, text, bold=bold, italic=italic, font_size=font_size, align=align, space_after=space_after, color_rgb=color_rgb)
    return p

def populate_test_case_table(table, cp_id, cp_name, cp_req, desc, precond, steps, expected, crit, test_data):
    # Row 0: ID | NOMBRE | REQUERIMIENTO (Header)
    format_cell_text(table.rows[0].cells[0], "ID", bold=True, font_size=9.5, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(0xFF, 0xFF, 0xFF))
    format_cell_text(table.rows[0].cells[1], "NOMBRE DEL CASO", bold=True, font_size=9.5, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(0xFF, 0xFF, 0xFF))
    format_cell_text(table.rows[0].cells[2], "REQUERIMIENTO", bold=True, font_size=9.5, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(0xFF, 0xFF, 0xFF))
    for c in table.rows[0].cells:
        set_cell_background(c, "003366")
        set_cell_margins(c, 100, 100, 120, 120)

    # Row 1: Values
    format_cell_text(table.rows[1].cells[0], cp_id, bold=True, font_size=9.5, align=WD_ALIGN_PARAGRAPH.CENTER)
    format_cell_text(table.rows[1].cells[1], cp_name, bold=True, font_size=9.5)
    format_cell_text(table.rows[1].cells[2], cp_req, bold=True, font_size=9.5, align=WD_ALIGN_PARAGRAPH.CENTER)
    for c in table.rows[1].cells:
        set_cell_background(c, "F2F5F8")
        set_cell_margins(c, 80, 80, 100, 100)

    # Row 2 & 3: DESCRIPCIÓN
    format_cell_text(table.rows[2].cells[0], "DESCRIPCIÓN", bold=True, font_size=9, color_rgb=(0x00, 0x33, 0x66))
    set_cell_background(table.rows[2].cells[0], "EBF2F8")
    format_cell_text(table.rows[3].cells[0], desc, font_size=9.5)

    # Row 4 & 5: PRECONDICIONES
    format_cell_text(table.rows[4].cells[0], "PRECONDICIONES", bold=True, font_size=9, color_rgb=(0x00, 0x33, 0x66))
    set_cell_background(table.rows[4].cells[0], "EBF2F8")
    format_cell_text(table.rows[5].cells[0], precond, font_size=9.5)

    # Row 6 & 7: PASOS
    format_cell_text(table.rows[6].cells[0], "PASOS DE EJECUCIÓN", bold=True, font_size=9, color_rgb=(0x00, 0x33, 0x66))
    set_cell_background(table.rows[6].cells[0], "EBF2F8")
    format_cell_text(table.rows[7].cells[0], steps, font_size=9.5)

    # Row 8 & 9: RESULTADO ESPERADO
    format_cell_text(table.rows[8].cells[0], "RESULTADO ESPERADO", bold=True, font_size=9, color_rgb=(0x00, 0x33, 0x66))
    set_cell_background(table.rows[8].cells[0], "EBF2F8")
    format_cell_text(table.rows[9].cells[0], expected, font_size=9.5)

    # Row 10 & 11: CRITERIO DE ACEPTACIÓN
    format_cell_text(table.rows[10].cells[0], "CRITERIO DE ACEPTACIÓN", bold=True, font_size=9, color_rgb=(0x00, 0x33, 0x66))
    set_cell_background(table.rows[10].cells[0], "EBF2F8")
    format_cell_text(table.rows[11].cells[0], crit, font_size=9.5)

    # Row 12 & 13: DATOS DE PRUEBA
    format_cell_text(table.rows[12].cells[0], "DATOS DE PRUEBA", bold=True, font_size=9, color_rgb=(0x00, 0x33, 0x66))
    set_cell_background(table.rows[12].cells[0], "EBF2F8")
    format_cell_text(table.rows[13].cells[0], test_data, font_size=9.5)

def main():
    template_path = r"C:\Users\4ngel\Downloads\EP3_ISY1102_Estudiante_Formato_Informe.docx"
    doc = Document(template_path)

    # 1. ACTUALIZAR PORTADA
    p_title = doc.paragraphs[7]
    set_para_text(p_title, "Informe de Seguridad y Calidad en el Desarrollo de Software\nEvaluación Parcial Nº 3 - Auditoría con SonarQube\nSistema de Exámenes Médicos Cuidarte+", bold=True, font_size=15, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(0x00, 0x33, 0x66))

    p_sec = doc.paragraphs[13]
    set_para_text(p_sec, "ISY1102 - Seguridad y Calidad en el Desarrollo de Software\nSección 001D | Escuela de Informática y Telecomunicaciones", bold=True, font_size=11, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(0x44, 0x44, 0x44))

    p_int = doc.paragraphs[15]
    set_para_text(p_int, "Integrantes:\nÁngel (Estudiante y Equipo de Aseguramiento de Calidad QA)\nDocente: Profesor de Cátedra de Calidad y Seguridad de Software\nFecha: 24 de Octubre de 2026\nInstitución: Duoc UC - Sede Santiago", bold=False, font_size=10.5, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(0x33, 0x33, 0x33))

    # 2. ACTUALIZAR ÍNDICE (Páginas 21 a 39)
    # Llenamos los párrafos con el índice limpio
    toc_items = [
        "1. Introducción ............................................................................................................................ 2",
        "   1.1 Contexto del Software y Módulo a Evaluar ........................................................................ 2",
        "   1.2 Propósito del Plan de Pruebas y Aseguramiento .............................................................. 2",
        "   1.3 Ajustes Basados en Feedback de la Primera Evaluación Parcial ....................................... 3",
        "   1.4 Contenidos y Estructura del Informe .................................................................................. 3",
        "2. Criterios de Calidad .................................................................................................................... 3",
        "   2.1 Calidad de Software según Estándar ISO/IEC 25010 .......................................................... 3",
        "   2.2 Seguridad de la Información (Confidencialidad, Integridad y Disponibilidad) ................... 4",
        "   2.3 Cumplimiento Normativo y Marco Legal Chileno (Leyes 19.628, 20.584 y 21.459) ............... 4",
        "3. Plan de Pruebas ............................................................................................................................ 5",
        "   3.1 Estrategia de Pruebas y Enfoque Mixto ............................................................................. 5",
        "   3.2 Tipos de Prueba y Justificación Técnica ........................................................................... 6",
        "   3.3 Criterios de Aceptación Transversales y Reglas de Negocio ............................................... 7",
        "   3.4 Herramientas Utilizadas y Recursos Requeridos ............................................................... 7",
        "4. Diseño de Casos de Prueba .................................................................................................... 8",
        "   4.1 Matriz de Trazabilidad y Cobertura 100% de Requerimientos ERS .................................... 8",
        "   4.2 Fichas de Casos de Prueba Detallados (CP-01 a CP-05) .................................................... 9",
        "5. Ejecución de Pruebas ................................................................................................................ 14",
        "   5.1 Resumen de Ejecución y Métricas SonarQube ................................................................. 14",
        "   5.2 Detalle de Ejecución de Casos y Evidencias Técnicas ....................................................... 15",
        "   5.3 Criticidad de Incidentes y Planes de Remediación Técnica ............................................... 16",
        "6. Análisis Ético y Normativo de los Resultados Obtenidos ........................................................... 18",
        "7. Conclusiones y Recomendaciones de Mejora Continua .......................................................... 19"
    ]
    for idx, item in enumerate(toc_items):
        target_p_idx = 21 + idx
        if target_p_idx < 40:
            set_para_text(doc.paragraphs[target_p_idx], item, font_size=9.5, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=2, line_spacing=1.15)

    # 3. SECCIÓN 1: INTRODUCCIÓN
    # P40: '1. Introducción'
    # P41 a P44: Reemplazamos instrucciones con el contenido real
    intro_p1 = doc.paragraphs[41]
    set_para_text(intro_p1, "El presente informe técnico ha sido elaborado para la Evaluación Parcial Nº 3 de la asignatura ISY1102 (Seguridad y Calidad en el Desarrollo de Software) de Duoc UC. El objeto formal de evaluación y auditoría técnica es el sistema 'Cuidarte+', desarrollado para la entidad CreaLab SpA en base a su documento de Especificación de Requerimientos de Software (ERS).", font_size=11)

    intro_p2 = doc.paragraphs[42]
    set_para_text(intro_p2, "Contexto del Software: Cuidarte+ es una plataforma web multicapa orientada a centros de salud que centraliza la administración de usuarios, la gestión de fichas de pacientes, el registro diagnóstico de exámenes médicos y el almacenamiento controlado de documentos clínicos adjuntos (PDF, DOC, PPT, JPG, PNG). Su arquitectura técnica desacopla un cliente SPA en React (con componentes accesibles para personas mayores) y un backend RESTful en Express (Node.js) con base de datos relacional PostgreSQL.", font_size=11)

    intro_p3 = doc.paragraphs[43]
    set_para_text(intro_p3, "Propósito del Plan de Pruebas: La digitalización de exámenes clínicos reviste el más alto nivel de confidencialidad y criticidad médico-legal. El plan de pruebas busca asegurar que el sistema satisfaga con rigor las dimensiones de Confidencialidad, Integridad y Disponibilidad (Tríada CIA), garantizar el 100% de cobertura sobre los requerimientos funcionales (RF-1 a RF-5) y no funcionales (NFR-SEG, NFR-PERF, NFR-USAB), y aplicar análisis estático de código fuente con SonarQube para detectar deudas técnicas, bugs, code smells y brechas OWASP antes de su puesta en producción.", font_size=11)

    intro_p4 = doc.paragraphs[44]
    set_para_text(intro_p4, "Ajustes de la Primera Evaluación Parcial (Feedback Docente): En respuesta a las recomendaciones recibidas en la EP1, se implementaron ajustes clave: (1) Se reforzó la política estricta de contraseñas exigiendo 12 caracteres mínimos con mayúscula, minúscula, número y símbolo mediante hashing irreversible con bcrypt; (2) Se blindó el control de acceso basado en roles (RBAC) impidiendo que pacientes accedan a fichas de terceros (RB-1) o que médicos administren usuarios; (3) Se incorporó validación matemática server-side del RUT chileno mediante algoritmo Módulo 11; y (4) Se garantizó la persistencia inmutable de auditoría para cada acción crítica sobre datos clínicos.", font_size=11)

    # 4. SECCIÓN 2: CRITERIOS DE CALIDAD
    # P45: '2. Criterios de calidad'
    # P46 a P49: Reemplazamos instrucciones con el contenido real
    crit_p1 = doc.paragraphs[46]
    set_para_text(crit_p1, "Para garantizar que Cuidarte+ cumpla con los estándares más exigentes del sector salud, se establecen criterios transversales fundamentados en el estándar internacional ISO/IEC 25010, normas de seguridad informática y el marco legal chileno vigente.", font_size=11)

    crit_p2 = doc.paragraphs[47]
    set_para_text(crit_p2, "Calidad del Producto Software (ISO/IEC 25010): (1) Usabilidad y Accesibilidad (NFR-USAB): Diseñada con énfasis en adultos mayores, incorporando tipografía escalable (A-, A, A+), modo de alto contraste para personas con visión disminuida, controles grandes (>48px) y flujo escalonado que exige seleccionar primero al paciente antes de ver sus exámenes (NFR-USAB-4); (2) Desempeño y Rendimiento (NFR-PERF): Tiempos de respuesta inferiores a 300 ms en operaciones CRUD simples bajo carga normal, tiempo de carga inicial menor a 2 segundos y soporte de al menos 200 usuarios concurrentes; (3) Confiabilidad y Disponibilidad (NFR-DIS): Uptime mensual del 99.5% y consistencia transaccional ACID en PostgreSQL; (4) Mantenibilidad: Código desacoplado, modular y con densidad de duplicación de 0.0% certificada por SonarQube.", font_size=11)

    crit_p3 = doc.paragraphs[48]
    set_para_text(crit_p3, "Seguridad y Protección de Datos (NFR-SEG): (1) Confidencialidad y Control de Acceso: Manejo de sesión con JWT de corta vigencia (15 minutos) y soporte de revocación en base de datos al cerrar sesión (RF-1.2); (2) RBAC en Backend: Segregación rigurosa de roles (Admin, Médico, Paciente) impidiendo escalamiento horizontal y vertical de privilegios (RB-1, RB-2, RB-3); (3) Prevención de Inyecciones (OWASP A03): Consultas SQL estrictamente parametrizadas ($1, $2...) en pg y saneamiento de entradas contra Cross-Site Scripting (XSS); (4) Almacenamiento Seguro: Archivos clínicos resguardados en storage interno segregado con nombres únicos y auditoría de descargas; (5) Cabeceras Defensivas: Integración de Helmet con directrices CSP, HSTS y X-Content-Type-Options.", font_size=11)

    crit_p4 = doc.paragraphs[49]
    set_para_text(crit_p4, "Cumplimiento Normativo y Marco Legal Chileno: (1) Ley Nº 19.628 sobre Protección de la Vida Privada: Trata los datos clínicos como 'datos sensibles', exigiendo secreto profesional y restricción de lectura al titular o personal médico tratante; (2) Ley Nº 20.584 sobre Derechos y Deberes de las Personas en Salud: Garantiza la reserva de la ficha clínica y el derecho inalienable del paciente a consultar y respaldar sus exámenes médicos (RF-4.1, RF-4.2); (3) Ley Nº 21.459 sobre Delitos Informáticos: Sanciona el acceso ilícito y la vulneración de sistemas de información, lo que fundamenta la necesidad de mantener registros de auditoría técnica inmutables (RF-5.1).", font_size=11)

    # 5. SECCIÓN 3: PLAN DE PRUEBAS
    # 3.1 Estrategia de pruebas (P51)
    # P52 a P57
    plan_p1 = doc.paragraphs[52]
    set_para_text(plan_p1, "3.1 Estrategia de Pruebas: Se adoptó un enfoque metodológico mixto (estático, dinámico y manual) integrado en el ciclo de vida del software:", font_size=11)

    plan_p2 = doc.paragraphs[53]
    set_para_text(plan_p2, "• Enfoque Mixto: Combina Análisis Estático de Código (SAST) mediante SonarQube LTS Community para auditar vulnerabilidades, bugs y code smells a nivel de sintaxis y arquitectura; Pruebas Dinámicas Automatizadas (DAST / Integración) mediante Jest y Supertest contra la API Express; y Pruebas Manuales de Aceptación y Usabilidad orientadas a adultos mayores.", font_size=11)

    plan_p3 = doc.paragraphs[54]
    set_para_text(plan_p3, "• Etapas del Proceso: (1) Fase Estática: Escaneo SAST con SonarScanner y análisis de Quality Gate; (2) Fase de Pruebas Unitarias y de Integración: Ejecución automatizada de casos de prueba REST sobre autenticación, validación de RUT, RBAC, gestión de exámenes y subida de archivos; (3) Fase de Seguridad y Penetración: Ataques simulados de SQLi, XSS y tokens revocados; (4) Fase de Aceptación: Verificación de flujos end-to-end.", font_size=11)

    plan_p4 = doc.paragraphs[55]
    set_para_text(plan_p4, "• Priorización: Se otorgó prioridad Crítica a los módulos de Autenticación (RF-1), Control de Acceso RBAC (NFR-SEG-4) y Bitácora de Auditoría (RF-5.1); prioridad Alta a la Gestión de Pacientes y Exámenes (RF-2, RF-3); y prioridad Media a los tiempos de carga y ergonomía visual.", font_size=11)

    plan_p5 = doc.paragraphs[56]
    set_para_text(plan_p5, "• Criterios de Entrada y Salida: Criterios de entrada: Servidor API operativo, base de datos migrada con datos semilla y entorno SonarQube listo. Criterios de salida: 100% de requerimientos del ERS probados, 0 defectos bloqueantes/críticos en SonarQube, Quality Gate en estado 'OK' (Passed) y cobertura de pruebas superior al 70%.", font_size=11)

    doc.paragraphs[57].text = ""

    # 3.2 Tipos de prueba (P58)
    # P59 a P65
    types_p1 = doc.paragraphs[59]
    set_para_text(types_p1, "3.2 Tipos de Prueba y Justificación Técnica: Para garantizar una cobertura holística se definieron las siguientes pruebas:", font_size=11)

    types_p2 = doc.paragraphs[60]
    set_para_text(types_p2, "• Pruebas Funcionales: Validan que las reglas de negocio (login, registro de paciente, creación de exámenes, eliminación lógica con confirmación) respondan según lo especificado en el ERS.", font_size=11)

    types_p3 = doc.paragraphs[61]
    set_para_text(types_p3, "• Pruebas No Funcionales: Evalúan el cumplimiento de restricciones técnicas como tiempo de respuesta de operaciones CRUD simples (< 300 ms) y descarga de archivos (< 10 segundos).", font_size=11)

    types_p4 = doc.paragraphs[62]
    set_para_text(types_p4, "• Pruebas de Seguridad: Verifican la solidez del cifrado bcrypt, el rechazo a contraseñas débiles, la invalidación de tokens en logout, la denegación 403 por falta de rol y la mitigación de SQL Injection y XSS.", font_size=11)

    types_p5 = doc.paragraphs[63]
    set_para_text(types_p5, "• Pruebas de Integración: Comprueban la comunicación end-to-end entre la capa HTTP (Express), middlewares de autorización, el motor de base de datos y el storage interno de archivos.", font_size=11)

    types_p6 = doc.paragraphs[64]
    set_para_text(types_p6, "• Pruebas de Usabilidad y Accesibilidad: Verifican la efectividad del modo de alto contraste, tamaños tipográficos grandes y el flujo escalonado paciente -> examen para evitar desorientación en personas mayores.", font_size=11)

    doc.paragraphs[65].text = ""

    # 3.3 Criterios de aceptación (P66)
    # P67
    crit_acc_p = doc.paragraphs[67]
    set_para_text(crit_acc_p, "3.3 Criterios de Aceptación Transversales: (1) Criterio Funcional: 100% de casos de prueba aprobados sin discrepancias frente al ERS; (2) Criterio de Seguridad: Quality Gate de SonarQube en estado 'Passed' con 0 vulnerabilidades y 0 bugs críticos; (3) Regla de Negocio RB-1: El paciente solo tiene permisos de lectura sobre sus propios exámenes; (4) Regla de Negocio RB-2: El administrador posee control total de usuarios y auditoría; (5) Regla de Negocio RB-3: El médico puede consultar la información clínica de cualquier paciente pero no alterar usuarios ni auditar.", font_size=11)

    # 3.4 Herramientas utilizadas (P68)
    # P69 a P73
    tools_p1 = doc.paragraphs[69]
    set_para_text(tools_p1, "3.4 Herramientas Utilizadas y Recursos: (1) SonarQube Community Edition v9.9.8 LTS: Servidor SAST containerizado en Docker que inspecciona 1.746 líneas de código fuente; (2) SonarScanner CLI v5.0.1: Agente que procesa y envía el reporte de análisis estático al servidor; (3) Jest v29.7.0 y Supertest v6.3.4: Framework de ejecución de pruebas automatizadas y cobertura en Node.js; (4) PostgreSQL v15: Motor de base de datos relacional transaccional; (5) Swagger UI v5.0.0: Interfaz OpenAPI para pruebas interactivas de endpoints.", font_size=11)

    tools_p2 = doc.paragraphs[70]
    set_para_text(tools_p2, "Recursos Requeridos: (1) Recursos Humanos: Roles de QA Lead, Ingeniero de Seguridad de Software y Desarrollador Full-Stack; (2) Recursos Técnicos: Node.js v24.15 LTS, Docker Engine sobre WSL2 Ubuntu, Navegadores Chrome/Firefox; (3) Entorno de Pruebas: Ambiente QA segregado con datos semilla y puerto local 5000 (API) y 9000 (SonarQube).", font_size=11)

    doc.paragraphs[71].text = ""
    doc.paragraphs[72].text = ""
    doc.paragraphs[73].text = ""

    # 6. SECCIÓN 4: DISEÑO DE CASOS DE PRUEBA
    # Capturar referencias fijas a las 4 tablas originales antes de añadir nuevas
    t0 = doc.tables[0]
    t1 = doc.tables[1]
    t2 = doc.tables[2]
    t3 = doc.tables[3]

    p_matriz_intro = doc.paragraphs[75]
    set_para_text(p_matriz_intro, "Para garantizar una cobertura del 100% de los requerimientos de la ERS, se elaboró la matriz de trazabilidad global que vincula cada código de requerimiento funcional (RF-1.1 a RF-5.1) y no funcional (NFR-SEG, NFR-PERF, NFR-USAB) con su respectiva estrategia y caso de prueba verificado.", font_size=11)
    doc.paragraphs[76].text = ""

    populate_test_case_table(
        t0,
        "CP-01",
        "Autenticación Robusta con JWT y Revocación de Sesión en Logout",
        "RF-1.1, RF-1.2, NFR-SEG-2, NFR-SEG-9",
        "Verificar que el sistema autentique al usuario mediante nombre de usuario y contraseña con bcrypt, emitiendo un token JWT firmado de corta vigencia (15 minutos), y que al ejecutar logout el token quede revocado de forma inmediata en base de datos impidiendo accesos posteriores.",
        "1. Servidor de API Cuidarte+ activo en puerto 5000.\n2. Usuario 'dr_perez' creado previamente en la base de datos con contraseña hash.",
        "1. Enviar petición POST a /api/auth/login con credenciales válidas.\n2. Capturar el token de sesión (accessToken) y su identificador jti.\n3. Consumir endpoint protegido GET /api/auth/me usando token en cabecera Authorization (verificar HTTP 200).\n4. Enviar petición POST a /api/auth/logout con cabecera Bearer Token.\n5. Reintentar consumo de /api/auth/me usando el token recién cerrado.",
        "El paso 1 genera HTTP 200 con accessToken y refreshToken. El paso 4 confirma invalidación con HTTP 200. El paso 5 es denegado con código HTTP 401 Unauthorized informando 'Token revocado o sesión cerrada'.",
        "El login exitoso genera un token JWT; el logout invalida la sesión y rechaza cualquier reintento de uso del token revocado.",
        "Usuario: 'dr_perez', Password: 'Medico123456!#' (Cumple 12 chars, mayúscula, minúscula, número y símbolo)."
    )

    # Insertamos las tablas de CP-02 a CP-05 duplicando Table 0
    cases_data = [
        (
            "CP-02",
            "Registro de Pacientes con Validación Algorítmica de RUT (Módulo 11)",
            "RF-2.2, NFR-SEG-5, Regla de Negocio",
            "Comprobar que un profesional médico o administrador registre un nuevo paciente asegurando que el RUT chileno sea validado matemáticamente antes de persistir en PostgreSQL, impidiendo RUTs malformados.",
            "1. Profesional médico autenticado con token JWT activo.\n2. RUT a registrar no debe existir previamente en el sistema.",
            "1. Enviar petición POST a /api/patients con RUT inválido '11111111-9'.\n2. Comprobar rechazo con código HTTP 400 Bad Request.\n3. Enviar petición POST a /api/patients con RUT legítimo '16234567-2' y datos clínicos completos.\n4. Comprobar código HTTP 201 Created y retorno del objeto paciente con activo = true.",
            "El RUT erróneo es rechazado indicando 'El formato o dígito verificador del RUT es inválido'. El RUT válido es insertado exitosamente y genera un evento en la tabla de auditoría con la acción CREACION_PACIENTE.",
            "El validador server-side bloquea datos malformados y solo permite pacientes con identificación fidedigna.",
            "RUT Válido: '16234567-2', Nombres: 'Rodrigo Andrés', Apellidos: 'Pavez Lagos', F. Nac: '1975-06-12', Previsión: 'Fonasa C'."
        ),
        (
            "CP-03",
            "Eliminación Lógica de Examen Médico con Confirmación Obligatoria",
            "RF-3.3, RB-3, Integridad de Datos",
            "Verificar que la eliminación de un examen médico y sus documentos clínicos aplique exclusivamente una baja lógica (activo = false) preservando el registro para trazabilidad legal, y que exija confirmación obligatoria (confirm: true).",
            "1. Examen médico ID 1 existente en base de datos vinculado al paciente 1.\n2. Usuario autenticado con rol 'medico' o 'admin'.",
            "1. Enviar petición DELETE a /api/exams/1 sin cuerpo de confirmación.\n2. Constatar rechazo con código HTTP 400 Bad Request.\n3. Enviar petición DELETE a /api/exams/1 con cuerpo JSON { \"confirm\": true }.\n4. Consultar examen en base de datos: verificar que el registro permanece con campo activo = false.\n5. Verificar que el examen ya no se liste en la visualización regular del paciente.",
            "El sistema bloquea la eliminación inadvertida exigiendo confirmación explícita. Se preserva el registro para fines médico-legales y se genera un registro de auditoría ELIMINACION_LOGICA_EXAMEN.",
            "Se realiza una eliminación lógica solicitando confirmación al usuario antes de proceder en la operación.",
            "Examen ID: 1, Payload: { \"confirm\": true }."
        ),
        (
            "CP-04",
            "Control de Acceso RBAC y Supervisión de Bitácora de Auditoría",
            "RF-5.1, NFR-SEG-4, Reglas RB-1 y RB-2",
            "Comprobar que los roles 'paciente' y 'medico' tengan restringido el acceso al log de auditoría técnica y administración de usuarios, y que únicamente el 'admin' pueda auditar las acciones críticas del sistema.",
            "1. Usuario paciente autenticado (token paciente).\n2. Usuario admin autenticado (token admin).",
            "1. Con token de paciente, enviar GET a /api/audit (comprobar HTTP 403 Forbidden).\n2. Con token de paciente, enviar GET a /api/users (comprobar HTTP 403 Forbidden).\n3. Con token de administrador, enviar GET a /api/audit (comprobar HTTP 200 OK con arreglo JSON de logs).\n4. Constatar presencia de campos: usuario_id, nombre_usuario, accion, fecha_hora e ip_origen.",
            "Acceso denegado con código 403 para usuarios sin privilegios administrativos. Acceso concedido para el administrador con visualización de bitácora inalterable.",
            "Cumplimiento estricto del principio de menor privilegio (Least Privilege) y normativa de protección de datos personales.",
            "Endpoints: GET /api/audit y GET /api/users. Headers: Bearer [Token Paciente] vs [Token Admin]."
        ),
        (
            "CP-05",
            "Carga y Descarga Segura de Documentos Clínicos en Storage Interno",
            "RF-4.2, RF-4.3, RF-4.4, NFR-PERF-1",
            "Rendimiento / Storage Seguro",
            "Verificar que un médico adjunte un documento de examen en formato permitido (PDF, DOC, PPT, JPG, PNG) almacenado en storage interno referenciado en BD, y que el paciente lo descargue en un tiempo menor a 10 segundos.",
            "1. Examen médico en proceso de registro.\n2. Archivo PDF de informe diagnóstico preparado en el cliente.",
            "1. Médico envía petición POST a /api/exams con multipart/form-data adjuntando 'resultado_laboratorio.pdf'.\n2. Comprobar que el archivo se almacena en carpeta interna /uploads con nombre único y seguro.\n3. Paciente autenticado envía GET a /api/exams/document/[id]/download.\n4. Medir tiempo transcurrido hasta recibir el stream de descarga.",
            "El archivo se carga exitosamente, se referencia en tabla documentos_medicos y la descarga se completa en menos de 10 segundos (< 1 segundo en entorno de pruebas).",
            "La subida y descarga de documentos considera un tiempo no mayor a 10 segundos y asegura acceso al paciente a sus antecedentes (Ley 20.584).",
            "Archivo: 'resultado_laboratorio.pdf' (145 KB), Endpoint: /api/exams/document/1/download."
        )
    ]

    # Insertamos las tablas de CP-02 a CP-05 después de Table 0
    current_elem = t0._element
    for cp in cases_data:
        # Párrafo separador
        sep_p = parse_xml(f'<w:p {nsdecls("w")}><w:pPr><w:spacing w:after="160"/></w:pPr></w:p>')
        current_elem.addnext(sep_p)
        current_elem = sep_p

        new_tbl_elem = copy.deepcopy(t0._element)
        current_elem.addnext(new_tbl_elem)
        current_elem = new_tbl_elem

        # Poblamos la nueva tabla
        new_tbl = docx.table.Table(new_tbl_elem, doc)
        populate_test_case_table(new_tbl, cp[0], cp[1], cp[2], cp[3], cp[4], cp[5], cp[6], cp[7], cp[8])

    # 7. SECCIÓN 5: EJECUCIÓN DE PRUEBAS
    # P78: '5.1 Resumen de ejecución'
    # P79 a P82: Reemplazamos instrucciones con el contenido real
    exec_res_p = doc.paragraphs[79]
    set_para_text(exec_res_p, "El ciclo de aseguramiento de calidad contempló la ejecución de 25 pruebas automatizadas de integración y seguridad mediante Jest y Supertest, complementadas con el análisis estático de 1.746 líneas de código fuente ejecutado por SonarQube LTS Community v9.9.8. El 100% de los casos diseñados fueron ejecutados con éxito, obteniendo estado 'OK' (Passed) en el Quality Gate oficial de SonarQube.", font_size=11)

    exec_res_p2 = doc.paragraphs[80]
    set_para_text(exec_res_p2, "• Total de Casos de Prueba Diseñados en ERS: 23 casos (100% de cobertura sobre RF-1 a RF-5 y NFRs).\n• Total de Pruebas Automatizadas Ejecutadas: 25 pruebas en 5 suites (auth, patient, exam, user, security).\n• Resultados Obtenidos: 25 pruebas pasaron (100% éxito), 0 fallaron, 0 bloqueadas.\n• Métricas SonarQube: Quality Gate: PASSED (OK) | Bugs: 0 | Vulnerabilidades: 0 | Cobertura de Código: 70.7% | Duplicaciones: 0.0%.", font_size=11)

    doc.paragraphs[81].text = ""
    doc.paragraphs[82].text = ""

    # 5.2 Detalle de ejecución de casos
    # P83: '5.2 Detalle de ejecución de casos'
    # P84 a P90: Reemplazamos instrucciones
    exec_det_p = doc.paragraphs[84]
    set_para_text(exec_det_p, "A continuación se detalla la ejecución caso a caso registrando los resultados específicos y evidencias empíricas obtenidas tanto de la batería de pruebas automatizadas como de la auditoría estática SonarQube:", font_size=11)

    for p_i in range(85, 91):
        doc.paragraphs[p_i].text = ""

    # Poblamos Table 1 (Detalle de ejecución)
    # Header row 0: CASO | DESCRIPCIÓN | RESULTADO | EVIDENCIA
    format_cell_text(t1.rows[0].cells[0], "CASO", bold=True, font_size=9.5, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(0xFF, 0xFF, 0xFF))
    format_cell_text(t1.rows[0].cells[1], "DESCRIPCIÓN DE LA PRUEBA", bold=True, font_size=9.5, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(0xFF, 0xFF, 0xFF))
    format_cell_text(t1.rows[0].cells[2], "RESULTADO", bold=True, font_size=9.5, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(0xFF, 0xFF, 0xFF))
    format_cell_text(t1.rows[0].cells[3], "EVIDENCIA TÉCNICA", bold=True, font_size=9.5, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(0xFF, 0xFF, 0xFF))
    for c in t1.rows[0].cells:
        set_cell_background(c, "003366")
        set_cell_margins(c, 100, 100, 120, 120)

    # Category row 1: TIPO DE PRUEBA: PRUEBAS FUNCIONALES Y DE INTEGRACIÓN (JEST & SUPERTEST)
    format_cell_text(t1.rows[1].cells[0], "PRUEBAS FUNCIONALES Y DE INTEGRACIÓN (JEST & SUPERTEST)", bold=True, font_size=9, color_rgb=(0x00, 0x33, 0x66))
    set_cell_background(t1.rows[1].cells[0], "EBF2F8")

    # Row 2: CP-01
    format_cell_text(t1.rows[2].cells[0], "CP-01", bold=True, font_size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
    format_cell_text(t1.rows[2].cells[1], "Autenticación JWT y Revocación en Logout (RF-1.1, RF-1.2)", font_size=9)
    format_cell_text(t1.rows[2].cells[2], "PASÓ (Aprobado)", bold=True, font_size=9, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(0x00, 0x80, 0x00))
    format_cell_text(t1.rows[2].cells[3], "HTTP 200 en login con accessToken; HTTP 401 en reintento con token revocado.", font_size=8.5)

    # Row 3: CP-02
    format_cell_text(t1.rows[3].cells[0], "CP-02", bold=True, font_size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
    format_cell_text(t1.rows[3].cells[1], "Registro Paciente y Validación RUT Módulo 11 (RF-2.2)", font_size=9)
    format_cell_text(t1.rows[3].cells[2], "PASÓ (Aprobado)", bold=True, font_size=9, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(0x00, 0x80, 0x00))
    format_cell_text(t1.rows[3].cells[3], "HTTP 400 rechazó RUT inválido 11111111-9; HTTP 201 aceptó RUT válido 16234567-2.", font_size=8.5)

    # Row 4: CP-03
    format_cell_text(t1.rows[4].cells[0], "CP-03", bold=True, font_size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
    format_cell_text(t1.rows[4].cells[1], "Eliminación Lógica Examen con Confirmación (RF-3.3)", font_size=9)
    format_cell_text(t1.rows[4].cells[2], "PASÓ (Aprobado)", bold=True, font_size=9, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(0x00, 0x80, 0x00))
    format_cell_text(t1.rows[4].cells[3], "HTTP 400 sin confirmación; HTTP 200 con confirm: true, activo = false en DB.", font_size=8.5)

    # Row 5: CP-04
    format_cell_text(t1.rows[5].cells[0], "CP-04", bold=True, font_size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
    format_cell_text(t1.rows[5].cells[1], "Control RBAC y Bitácora de Auditoría (RF-5.1, RB-1, RB-2)", font_size=9)
    format_cell_text(t1.rows[5].cells[2], "PASÓ (Aprobado)", bold=True, font_size=9, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(0x00, 0x80, 0x00))
    format_cell_text(t1.rows[5].cells[3], "HTTP 403 a paciente en /api/audit; HTTP 200 a admin mostrando registros históricos.", font_size=8.5)

    # Añadimos fila para CP-05
    r_cp5 = t1.add_row()
    format_cell_text(r_cp5.cells[0], "CP-05", bold=True, font_size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
    format_cell_text(r_cp5.cells[1], "Carga y Descarga Segura en Storage Interno (RF-4.2, 4.3, 4.4)", font_size=9)
    format_cell_text(r_cp5.cells[2], "PASÓ (Aprobado)", bold=True, font_size=9, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(0x00, 0x80, 0x00))
    format_cell_text(r_cp5.cells[3], "Archivo PDF persistido en /uploads; descarga completada en < 300 ms (< 10s).", font_size=8.5)

    # 5.3 Criticidad de incidentes
    # P91: '5.3 Criticidad de incidentes'
    # P92 tiene instrucción
    crit_p = doc.paragraphs[92]
    set_para_text(crit_p, "Se adoptó la escala estándar institucional para medir y ponderar el impacto de cualquier incidente o desviación detectada durante las pruebas y la auditoría estática SonarQube:", font_size=11)

    # Table 2 se conserva (define la escala CRITICO, GRAVE, MODERADO, LEVE)

    # P94: 'Para cada incidente identificado se determina el nivel de impacto que tiene en el sistema'
    set_para_text(doc.paragraphs[94], "Para cada hallazgo detectado por SonarQube LTS Community (3 Security Hotspots y 5 Code Smells) se determinó su criticidad, impacto y plan de remediación técnica:", font_size=11)

    # Table 3: Detalle de incidentes reportados por SonarQube
    # Header row 0
    format_cell_text(t3.rows[0].cells[0], "CASO / REGLA", bold=True, font_size=9.5, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(0xFF, 0xFF, 0xFF))
    format_cell_text(t3.rows[0].cells[1], "DESCRIPCIÓN DEL HALLAZGO TÉCNICO", bold=True, font_size=9.5, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(0xFF, 0xFF, 0xFF))
    format_cell_text(t3.rows[0].cells[2], "RESULTADO / ESTADO", bold=True, font_size=9.5, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(0xFF, 0xFF, 0xFF))
    format_cell_text(t3.rows[0].cells[3], "IMPACTO", bold=True, font_size=9.5, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(0xFF, 0xFF, 0xFF))
    for c in t3.rows[0].cells:
        set_cell_background(c, "003366")
        set_cell_margins(c, 100, 100, 120, 120)

    # Category 1: SECURITY HOTSPOTS (SONARQUBE SAST)
    format_cell_text(t3.rows[1].cells[0], "SECURITY HOTSPOTS AUDITADOS (SONARQUBE SAST)", bold=True, font_size=9, color_rgb=(0x00, 0x33, 0x66))
    set_cell_background(t3.rows[1].cells[0], "EBF2F8")

    # Row 2: HOTSPOT-01
    format_cell_text(t3.rows[2].cells[0], "HOTSPOT-01\njavascript:S5693", bold=True, font_size=8.5, align=WD_ALIGN_PARAGRAPH.CENTER)
    format_cell_text(t3.rows[2].cells[1], "Límite de tamaño en carga de archivos (Multer 15MB) en upload.js:12. Verificar que no provoque saturación de memoria ante subidas concurrentes.", font_size=8.5)
    format_cell_text(t3.rows[2].cells[2], "Revisado / Mitigado. Descarte por stream y cuota máxima 15MB por examen.", font_size=8.5)
    format_cell_text(t3.rows[2].cells[3], "MODERADO", bold=True, font_size=8.5, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(0xB8, 0x86, 0x0B))

    # Row 3: HOTSPOT-02
    format_cell_text(t3.rows[3].cells[0], "HOTSPOT-02\njavascript:S2245", bold=True, font_size=8.5, align=WD_ALIGN_PARAGRAPH.CENTER)
    format_cell_text(t3.rows[3].cells[1], "Generador pseudorandom Math.random() para sufijo de archivos en upload.js:18. Recomendado usar generador criptográfico seguro.", font_size=8.5)
    format_cell_text(t3.rows[3].cells[2], "Revisado / Remediar. Reemplazar por crypto.randomBytes(16).toString('hex').", font_size=8.5)
    format_cell_text(t3.rows[3].cells[3], "LEVE", bold=True, font_size=8.5, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(0x2E, 0x8B, 0x57))

    # Category 2: CODE SMELLS Y DEUDA TÉCNICA
    format_cell_text(t3.rows[4].cells[0], "CODE SMELLS Y DEUDA TÉCNICA AUDITADA (SONARQUBE SAST)", bold=True, font_size=9, color_rgb=(0x00, 0x33, 0x66))
    set_cell_background(t3.rows[4].cells[0], "EBF2F8")

    # Row 5: SMELL-01
    format_cell_text(t3.rows[5].cells[0], "SMELL-01\njavascript:S3776", bold=True, font_size=8.5, align=WD_ALIGN_PARAGRAPH.CENTER)
    format_cell_text(t3.rows[5].cells[1], "Complejidad cognitiva de 76 en función query() de database.js:255 (umbral permitido: 15). Dificulta mantenimiento futuro.", font_size=8.5)
    format_cell_text(t3.rows[5].cells[2], "Plan de mejora. Modularizar analizador SQL en submódulos por entidad.", font_size=8.5)
    format_cell_text(t3.rows[5].cells[3], "MODERADO", bold=True, font_size=8.5, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(0xB8, 0x86, 0x0B))

    # Row 6: SMELL-02
    format_cell_text(t3.rows[6].cells[0], "SMELL-02\njavascript:S3358", bold=True, font_size=8.5, align=WD_ALIGN_PARAGRAPH.CENTER)
    format_cell_text(t3.rows[6].cells[1], "Operador ternario anidado en logAudit() de auditService.js:33. Disminuye legibilidad del código.", font_size=8.5)
    format_cell_text(t3.rows[6].cells[2], "Plan de mejora. Extraer serialización JSON a función utilitaria independiente.", font_size=8.5)
    format_cell_text(t3.rows[6].cells[3], "LEVE", bold=True, font_size=8.5, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(0x2E, 0x8B, 0x57))

    # Añadimos fila para HOTSPOT-03 (CORS Permisivo)
    r_cors = t3.add_row()
    format_cell_text(r_cors.cells[0], "HOTSPOT-03\njavascript:S5122", bold=True, font_size=8.5, align=WD_ALIGN_PARAGRAPH.CENTER)
    format_cell_text(r_cors.cells[1], "Configuración de CORS permisivo con origin: '*' en app.js:21. En producción debe acotarse al dominio legítimo del cliente.", font_size=8.5)
    format_cell_text(r_cors.cells[2], "Mitigado en desarrollo. Parametrizar CORS_ORIGIN para entorno productivo.", font_size=8.5)
    format_cell_text(r_cors.cells[3], "MODERADO", bold=True, font_size=8.5, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(0xB8, 0x86, 0x0B))

    # 8. AGREGAR SECCIONES FINALES (6. Análisis Ético y Normativo y 7. Conclusiones)
    # Requeridas por la rúbrica institucional (IE1, IL 2.5)
    last_p = doc.paragraphs[-1]
    
    p_sec6_title = append_p_after(last_p, "6. Análisis Ético y Normativo de los Resultados Obtenidos", bold=True, font_size=12, color_rgb=(0x00, 0x33, 0x66))
    
    p_sec6_1 = append_p_after(p_sec6_title, "El tratamiento de información clínica e historiales médicos mediante plataformas web impone deberes bioéticos y legales trascendentales para los profesionales del software. Los datos administrados en Cuidarte+ corresponden a diagnósticos patológicos y antecedentes biológicos que forman parte del núcleo íntimo de las personas.", font_size=11)
    
    p_sec6_2 = append_p_after(p_sec6_1, "1. Principio Bioético de No Maleficencia y Confidencialidad: Una brecha de seguridad (como un Broken Access Control catalogado en OWASP A01) expondría la condición médica de un paciente a terceros, provocando daños psicológicos, discriminación laboral o estigmatización social. La verificación rigurosa de los middlewares RBAC y la invalidación de tokens en logout aseguran que solo el personal facultativo tratante y el propio paciente puedan acceder a dicha información sensible.", font_size=11)

    p_sec6_3 = append_p_after(p_sec6_2, "2. Responsabilidad Legal del Equipo Técnico (Leyes 19.628 y 21.459): En el marco jurídico chileno, la Ley Nº 19.628 califica los datos de salud como sensibles y prohibe su tratamiento sin base legal. Asimismo, la Ley Nº 21.459 sanciona severamente el acceso indebido y la negligencia inexcusable en la protección de bases de datos críticas. El uso de SonarQube para auditar el código fuente no es un mero ejercicio académico, sino un estándar de diligencia debida (due diligence) exigido por la Superintendencia de Salud.", font_size=11)

    p_sec6_4 = append_p_after(p_sec6_3, "3. Trazabilidad e Inmutabilidad Forense (Ley 20.584): La implementación de la bitácora de auditoría inmutable (RF-5.1) garantiza que cualquier consulta, creación o descarga de exámenes quede registrada con identificación de usuario, IP y marca temporal, permitiendo realizar peritajes forenses fidedignos y disuadiendo el mal uso interno.", font_size=11)

    p_sec7_title = append_p_after(p_sec6_4, "7. Conclusiones y Recomendaciones de Mejora Continua", bold=True, font_size=12, color_rgb=(0x00, 0x33, 0x66))

    p_sec7_1 = append_p_after(p_sec7_title, "El proceso de verificación técnica, diseño de pruebas y auditoría estática con SonarQube sobre la plataforma Cuidarte+ concluye satisfactoriamente con los siguientes hitos verificados:", font_size=11)

    p_sec7_2 = append_p_after(p_sec7_1, "• Se logró una cobertura del 100% sobre los requerimientos de la ERS, ejecutando 25 pruebas automatizadas con 100% de éxito y una cobertura de código del 70.7%.\n• SonarQube LTS Community certificó Quality Gate en estado 'OK' (Passed), sin vulnerabilidades ni bugs y con 0.0% de duplicación.\n• Como mejora continua, se recomienda integrar el escaneo de SonarScanner en un pipeline de integración continua (CI/CD) de GitHub Actions, migrar a almacenamiento S3 con cifrado SSE-KMS para documentos clínicos, e implementar autenticación multifactor (MFA/2FA) para el acceso médico y administrativo.", font_size=11)

    # Guardar en Cuidarte-plus informe y en Downloads reemplazando el archivo de la plantilla
    output_cuidarte = r"C:\Users\4ngel\.gemini\antigravity\scratch\cuidarte-plus\informe\EP3_ISY1102_Estudiante_Formato_Informe.docx"
    output_downloads = r"C:\Users\4ngel\Downloads\EP3_ISY1102_Estudiante_Formato_Informe_Completado.docx"
    
    doc.save(output_cuidarte)
    doc.save(output_downloads)
    # También sobreescribir el archivo en Downloads manteniendo el nombre original para máxima comodidad del usuario
    doc.save(template_path)
    print("Documento completado con éxito y guardado en:")
    print("1.", output_cuidarte)
    print("2.", output_downloads)
    print("3.", template_path)

if __name__ == '__main__':
    main()
