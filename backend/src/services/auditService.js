const db = require('../config/database');

/**
 * Servicio centralizado de auditoría (RF-5.1, NFR-SEG-6)
 * Registra acciones críticas: creación, edición, eliminación de pacientes/usuarios,
 * subida o descarga de documentos clínicos.
 */
async function logAudit({
  usuario_id = null,
  nombre_usuario = 'ANONIMO',
  rol_usuario = 'VISITANTE',
  accion,
  entidad_afectada,
  entidad_id = null,
  detalles = null,
  ip_origen = '127.0.0.1'
}) {
  try {
    const queryText = `
      INSERT INTO auditoria (
        usuario_id, nombre_usuario, rol_usuario, accion,
        entidad_afectada, entidad_id, detalles, ip_origen
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [
      usuario_id,
      nombre_usuario,
      rol_usuario,
      accion,
      entidad_afectada,
      entidad_id ? String(entidad_id) : null,
      detalles ? (typeof detalles === 'object' ? JSON.stringify(detalles) : String(detalles)) : null,
      ip_origen
    ];

    const result = await db.query(queryText, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error registrando evento de auditoría:', error.message);
    return null;
  }
}

async function getAuditLogs() {
  const queryText = `SELECT * FROM auditoria ORDER BY fecha_hora DESC LIMIT 500`;
  const result = await db.query(queryText);
  return result.rows;
}

module.exports = {
  logAudit,
  getAuditLogs
};
