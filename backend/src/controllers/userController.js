const db = require('../config/database');
const { logAudit } = require('../services/auditService');

/**
 * Listar usuarios de la plataforma (RF-2.5)
 * Rol requerido: Admin (RB-2)
 */
async function listUsers(req, res) {
  try {
    const result = await db.query(
      'SELECT id, nombre_usuario, email, rol, activo, created_at, updated_at FROM usuarios ORDER BY id ASC'
    );
    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Editar usuario y asignar roles diferenciados (RF-2.6)
 * Rol requerido: Admin (RB-2)
 */
async function updateUser(req, res) {
  const { id } = req.params;
  const { rol, activo } = req.body;

  const validRoles = ['admin', 'medico', 'paciente'];
  if (rol && !validRoles.includes(rol)) {
    return res.status(400).json({
      success: false,
      error: `Rol inválido. Los roles permitidos son: ${validRoles.join(', ')}`
    });
  }

  try {
    const userCheck = await db.query('SELECT * FROM usuarios WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    const current = userCheck.rows[0];
    const newRol = rol || current.rol;
    const newActivo = activo !== undefined ? Boolean(activo) : current.activo;

    const updateRes = await db.query(
      'UPDATE usuarios SET rol = $1, activo = $2 WHERE id = $3 RETURNING id, nombre_usuario, email, rol, activo, updated_at',
      [newRol, newActivo, id]
    );

    // Auditoría de edición crítica (RF-5.1)
    await logAudit({
      usuario_id: req.user.id,
      nombre_usuario: req.user.nombre_usuario,
      rol_usuario: req.user.rol,
      accion: 'EDICION_USUARIO_ROL',
      entidad_afectada: 'usuarios',
      entidad_id: id,
      detalles: `Actualización de rol: de '${current.rol}' a '${newRol}', estado activo: ${newActivo}`,
      ip_origen: req.ip
    });

    return res.status(200).json({
      success: true,
      message: 'Usuario actualizado correctamente',
      data: updateRes.rows[0]
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Eliminar usuario de la plataforma (RF-2.7)
 * Realiza baja lógica conservando integridad referencial para auditoría.
 */
async function deleteUser(req, res) {
  const { id } = req.params;

  try {
    const userCheck = await db.query('SELECT * FROM usuarios WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    // Evitar que el administrador se elimine a sí mismo
    if (parseInt(id, 10) === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Operación no permitida: Un administrador no puede eliminarse a sí mismo'
      });
    }

    await db.query('UPDATE usuarios SET activo = false WHERE id = $1', [id]);

    await logAudit({
      usuario_id: req.user.id,
      nombre_usuario: req.user.nombre_usuario,
      rol_usuario: req.user.rol,
      accion: 'ELIMINACION_USUARIO',
      entidad_afectada: 'usuarios',
      entidad_id: id,
      detalles: `Baja lógica de usuario '${userCheck.rows[0].nombre_usuario}'`,
      ip_origen: req.ip
    });

    return res.status(200).json({
      success: true,
      message: 'Usuario eliminado exitosamente de la plataforma'
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  listUsers,
  updateUser,
  deleteUser
};
