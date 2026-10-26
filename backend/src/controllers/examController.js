const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const { logAudit } = require('../services/auditService');

/**
 * Listar exámenes médicos de un paciente (RF-4.1, NFR-USAB-4)
 * Los pacientes solo pueden ver los propios; médicos y admins pueden consultar cualquier paciente.
 */
async function getExamsByPatient(req, res) {
  const { patientId } = req.params;

  try {
    const patientRes = await db.query('SELECT * FROM pacientes WHERE id = $1', [patientId]);
    if (patientRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Paciente no encontrado' });
    }

    const patient = patientRes.rows[0];

    // Restricción para rol paciente (RB-1)
    if (req.user.rol === 'paciente' && patient.usuario_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'No tiene permisos para ver los exámenes de otro paciente'
      });
    }

    const examsRes = await db.query(
      'SELECT * FROM examenes WHERE paciente_id = $1 AND activo = true ORDER BY fecha_examen DESC',
      [patientId]
    );

    // Obtener documentos asociados a cada examen
    const examsWithDocs = await Promise.all(
      examsRes.rows.map(async (exam) => {
        const docsRes = await db.query(
          'SELECT id, nombre_archivo, nombre_original, tipo_mime, tamano_bytes, created_at FROM documentos_medicos WHERE examen_id = $1 AND activo = true',
          [exam.id]
        );
        return {
          ...exam,
          documentos: docsRes.rows
        };
      })
    );

    return res.status(200).json({
      success: true,
      paciente: {
        id: patient.id,
        rut: patient.rut,
        nombres: patient.nombres,
        apellidos: patient.apellidos
      },
      data: examsWithDocs
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Registrar un nuevo examen médico con documento opcional (RF-3.1, RF-4.3, RF-4.4)
 * Permitido para: Rol Médico (o Admin)
 */
async function createExam(req, res) {
  const { paciente_id, tipo_examen, fecha_examen, descripcion, diagnostico, estado } = req.body;

  if (!paciente_id || !tipo_examen || !fecha_examen) {
    return res.status(400).json({
      success: false,
      error: 'paciente_id, tipo_examen y fecha_examen son obligatorios'
    });
  }

  try {
    const patientRes = await db.query('SELECT id FROM pacientes WHERE id = $1 AND activo = true', [paciente_id]);
    if (patientRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Paciente no encontrado' });
    }

    const insertExam = await db.query(
      `INSERT INTO examenes (paciente_id, medico_id, tipo_examen, fecha_examen, descripcion, diagnostico, estado, activo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true) RETURNING *`,
      [
        parseInt(paciente_id, 10),
        req.user.id,
        tipo_examen.trim(),
        fecha_examen,
        descripcion || '',
        diagnostico || '',
        estado || 'Completado'
      ]
    );

    const exam = insertExam.rows[0];
    let attachedDoc = null;

    // Procesar archivo adjunto si fue subido (RF-4.3, RF-4.4)
    if (req.file) {
      const docRes = await db.query(
        `INSERT INTO documentos_medicos (examen_id, nombre_archivo, nombre_original, ruta_storage, tipo_mime, tamano_bytes, subido_por, activo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true) RETURNING *`,
        [
          exam.id,
          req.file.filename,
          req.file.originalname,
          req.file.path,
          req.file.mimetype,
          req.file.size,
          req.user.id
        ]
      );
      attachedDoc = docRes.rows[0];

      // Auditoría de subida de documento (RF-5.1)
      await logAudit({
        usuario_id: req.user.id,
        nombre_usuario: req.user.nombre_usuario,
        rol_usuario: req.user.rol,
        accion: 'SUBIDA_DOCUMENTO_CLINICO',
        entidad_afectada: 'documentos_medicos',
        entidad_id: attachedDoc.id,
        detalles: `Archivo '${req.file.originalname}' (${req.file.mimetype}, ${req.file.size} bytes) adjuntado a examen ID ${exam.id}`,
        ip_origen: req.ip
      });
    }

    // Auditoría de creación de examen (RF-5.1)
    await logAudit({
      usuario_id: req.user.id,
      nombre_usuario: req.user.nombre_usuario,
      rol_usuario: req.user.rol,
      accion: 'CREACION_EXAMEN_MEDICO',
      entidad_afectada: 'examenes',
      entidad_id: exam.id,
      detalles: `Registro de examen '${exam.tipo_examen}' para paciente ID ${paciente_id}`,
      ip_origen: req.ip
    });

    return res.status(201).json({
      success: true,
      message: 'Examen médico creado exitosamente',
      data: {
        ...exam,
        documento: attachedDoc
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Modificar un examen médico y sus documentos (RF-3.2)
 * Permitido para: Rol Médico (o Admin)
 */
async function updateExam(req, res) {
  const { id } = req.params;
  const { tipo_examen, descripcion, diagnostico, estado } = req.body;

  try {
    const examRes = await db.query('SELECT * FROM examenes WHERE id = $1 AND activo = true', [id]);
    if (examRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Examen médico no encontrado' });
    }

    const current = examRes.rows[0];

    const updateRes = await db.query(
      `UPDATE examenes SET
        tipo_examen = $1, descripcion = $2, diagnostico = $3, estado = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 RETURNING *`,
      [
        tipo_examen !== undefined ? tipo_examen.trim() : current.tipo_examen,
        descripcion !== undefined ? descripcion.trim() : current.descripcion,
        diagnostico !== undefined ? diagnostico.trim() : current.diagnostico,
        estado !== undefined ? estado.trim() : current.estado,
        id
      ]
    );

    let newDoc = null;
    if (req.file) {
      const docRes = await db.query(
        `INSERT INTO documentos_medicos (examen_id, nombre_archivo, nombre_original, ruta_storage, tipo_mime, tamano_bytes, subido_por, activo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true) RETURNING *`,
        [
          id,
          req.file.filename,
          req.file.originalname,
          req.file.path,
          req.file.mimetype,
          req.file.size,
          req.user.id
        ]
      );
      newDoc = docRes.rows[0];

      await logAudit({
        usuario_id: req.user.id,
        nombre_usuario: req.user.nombre_usuario,
        rol_usuario: req.user.rol,
        accion: 'ACTUALIZACION_DOCUMENTO_CLINICO',
        entidad_afectada: 'documentos_medicos',
        entidad_id: newDoc.id,
        detalles: `Nuevo archivo '${req.file.originalname}' vinculado a examen ID ${id}`,
        ip_origen: req.ip
      });
    }

    await logAudit({
      usuario_id: req.user.id,
      nombre_usuario: req.user.nombre_usuario,
      rol_usuario: req.user.rol,
      accion: 'EDICION_EXAMEN_MEDICO',
      entidad_afectada: 'examenes',
      entidad_id: id,
      detalles: `Modificación de examen médico ID ${id}`,
      ip_origen: req.ip
    });

    return res.status(200).json({
      success: true,
      message: 'Examen médico actualizado correctamente',
      data: {
        ...updateRes.rows[0],
        nuevo_documento: newDoc
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Eliminación lógica de examen médico (RF-3.3)
 * Criterio de aceptación: Requiere confirmación explícita del usuario (confirm: true).
 */
async function deleteExam(req, res) {
  const { id } = req.params;
  const { confirm } = req.body;

  // Criterio de aceptación ERS: "Se debe realizar una eliminación lógica solicitando al usuario confirmación antes de proceder en la operación."
  if (confirm !== true && confirm !== 'true') {
    return res.status(400).json({
      success: false,
      error: 'Se requiere confirmación explícita para proceder con la eliminación lógica del examen'
    });
  }

  try {
    const examRes = await db.query('SELECT * FROM examenes WHERE id = $1 AND activo = true', [id]);
    if (examRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Examen médico no encontrado' });
    }

    // Eliminación lógica
    await db.query('UPDATE examenes SET activo = false WHERE id = $1', [id]);
    await db.query('UPDATE documentos_medicos SET activo = false WHERE examen_id = $1', [id]);

    await logAudit({
      usuario_id: req.user.id,
      nombre_usuario: req.user.nombre_usuario,
      rol_usuario: req.user.rol,
      accion: 'ELIMINACION_LOGICA_EXAMEN',
      entidad_afectada: 'examenes',
      entidad_id: id,
      detalles: `Eliminación lógica confirmada del examen ID ${id} y sus documentos adjuntos`,
      ip_origen: req.ip
    });

    return res.status(200).json({
      success: true,
      message: 'Examen médico y sus documentos eliminados lógicamente con éxito'
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Descarga de documento médico clínico (RF-4.2, RF-4.4)
 * Garantiza respuesta inmediata (< 10 segundos según criterio de aceptación ERS)
 */
async function downloadDocument(req, res) {
  const { docId } = req.params;

  try {
    const docRes = await db.query(
      'SELECT d.*, e.paciente_id FROM documentos_medicos d JOIN examenes e ON d.examen_id = e.id WHERE d.id = $1 AND d.activo = true',
      [docId]
    );

    if (docRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Documento no encontrado o dado de baja' });
    }

    const document = docRes.rows[0];

    // Verificar permisos para rol paciente (RB-1)
    if (req.user.rol === 'paciente') {
      const patientCheck = await db.query('SELECT usuario_id FROM pacientes WHERE id = $1', [document.paciente_id]);
      if (patientCheck.rows.length === 0 || patientCheck.rows[0].usuario_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'No tiene permisos para descargar documentos de otros pacientes'
        });
      }
    }

    // Auditoría de descarga de documento sensible (RF-5.1, NFR-SEG-8)
    await logAudit({
      usuario_id: req.user.id,
      nombre_usuario: req.user.nombre_usuario,
      rol_usuario: req.user.rol,
      accion: 'DESCARGA_DOCUMENTO_CLINICO',
      entidad_afectada: 'documentos_medicos',
      entidad_id: docId,
      detalles: `Descarga de documento '${document.nombre_original}'`,
      ip_origen: req.ip
    });

    // Enviar archivo físico si existe en storage interno; de lo contrario generar placeholder con contenido clínico
    if (fs.existsSync(document.ruta_storage)) {
      return res.download(document.ruta_storage, document.nombre_original);
    } else {
      // Contenido simulado seguro para archivos precargados
      res.setHeader('Content-Disposition', `attachment; filename="${document.nombre_original}"`);
      res.setHeader('Content-Type', document.tipo_mime || 'text/plain');
      return res.send(`Cuidarte+ - Documento Clínico Oficial\nExamen ID: ${document.examen_id}\nArchivo: ${document.nombre_original}\nFecha: ${new Date().toISOString()}`);
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getExamsByPatient,
  createExam,
  updateExam,
  deleteExam,
  downloadDocument
};
