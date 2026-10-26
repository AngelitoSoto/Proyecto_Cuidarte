const db = require('../config/database');
const { validateRut } = require('../middleware/validator');
const { logAudit } = require('../services/auditService');

/**
 * Listar pacientes (RF-2.4, RB-3, RB-1)
 */
async function listPatients(req, res) {
  try {
    // Si es paciente, solo ve su propio registro (RB-1)
    if (req.user.rol === 'paciente') {
      const result = await db.query(
        'SELECT * FROM pacientes WHERE usuario_id = $1 AND activo = true',
        [req.user.id]
      );
      return res.status(200).json({ success: true, data: result.rows });
    }

    // Médicos y administradores ven todos los pacientes (RB-2, RB-3)
    const result = await db.query(
      'SELECT * FROM pacientes WHERE activo = true ORDER BY nombres ASC'
    );
    return res.status(200).json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Visualizar un paciente específico (RF-2.4)
 */
async function getPatientById(req, res) {
  const { id } = req.params;

  try {
    const result = await db.query('SELECT * FROM pacientes WHERE id = $1 AND activo = true', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Paciente no encontrado' });
    }

    const patient = result.rows[0];

    // Regla de negocio: Si es rol paciente, solo puede ver sus propios datos
    if (req.user.rol === 'paciente' && patient.usuario_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Acceso no autorizado a la ficha de otro paciente'
      });
    }

    return res.status(200).json({ success: true, data: patient });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Registrar nuevo paciente (RF-2.2)
 * Permitido para: Médico o Administrador
 */
async function createPatient(req, res) {
  const { rut, nombres, apellidos, fecha_nacimiento, telefono, email, direccion, prevision, usuario_id } = req.body;

  if (!rut || !nombres || !apellidos || !fecha_nacimiento) {
    return res.status(400).json({
      success: false,
      error: 'RUT, nombres, apellidos y fecha de nacimiento son obligatorios'
    });
  }

  // Validación de RUT chileno
  if (!validateRut(rut)) {
    return res.status(400).json({
      success: false,
      error: 'El formato o dígito verificador del RUT es inválido (Ejemplo: 12345678-5)'
    });
  }

  try {
    const existing = await db.query('SELECT id FROM pacientes WHERE rut = $1', [rut.trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Ya existe un paciente registrado con el RUT ingresado'
      });
    }

    const insertRes = await db.query(
      `INSERT INTO pacientes (rut, nombres, apellidos, fecha_nacimiento, telefono, email, direccion, prevision, usuario_id, activo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true) RETURNING *`,
      [rut.trim(), nombres.trim(), apellidos.trim(), fecha_nacimiento, telefono, email, direccion, prevision, usuario_id || null]
    );

    const newPatient = insertRes.rows[0];

    await logAudit({
      usuario_id: req.user.id,
      nombre_usuario: req.user.nombre_usuario,
      rol_usuario: req.user.rol,
      accion: 'CREACION_PACIENTE',
      entidad_afectada: 'pacientes',
      entidad_id: newPatient.id,
      detalles: `Registro de nuevo paciente RUT ${newPatient.rut}`,
      ip_origen: req.ip
    });

    return res.status(201).json({
      success: true,
      message: 'Paciente registrado exitosamente',
      data: newPatient
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Editar paciente (RF-2.3)
 * Permitido para: Médico o Administrador
 */
async function updatePatient(req, res) {
  const { id } = req.params;
  const { nombres, apellidos, telefono, email, direccion, prevision, activo } = req.body;

  try {
    const currentRes = await db.query('SELECT * FROM pacientes WHERE id = $1', [id]);
    if (currentRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Paciente no encontrado' });
    }

    const current = currentRes.rows[0];

    const updateRes = await db.query(
      `UPDATE pacientes SET
        nombres = $1, apellidos = $2, telefono = $3, email = $4,
        direccion = $5, prevision = $6, activo = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 RETURNING *`,
      [
        nombres !== undefined ? nombres.trim() : current.nombres,
        apellidos !== undefined ? apellidos.trim() : current.apellidos,
        telefono !== undefined ? telefono : current.telefono,
        email !== undefined ? email : current.email,
        direccion !== undefined ? direccion : current.direccion,
        prevision !== undefined ? prevision : current.prevision,
        activo !== undefined ? Boolean(activo) : current.activo,
        id
      ]
    );

    await logAudit({
      usuario_id: req.user.id,
      nombre_usuario: req.user.nombre_usuario,
      rol_usuario: req.user.rol,
      accion: 'EDICION_PACIENTE',
      entidad_afectada: 'pacientes',
      entidad_id: id,
      detalles: `Actualización de antecedentes para paciente ID ${id}`,
      ip_origen: req.ip
    });

    return res.status(200).json({
      success: true,
      message: 'Ficha de paciente actualizada con éxito',
      data: updateRes.rows[0]
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  listPatients,
  getPatientById,
  createPatient,
  updatePatient
};
