/**
 * Control de Acceso Basado en Roles (RBAC) (NFR-SEG-4, Reglas de Negocio RB-1, RB-2, RB-3)
 * @param  {...string} allowedRoles Roles permitidos para acceder a la ruta
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.rol) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado para verificar permisos'
      });
    }

    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        error: `Acceso denegado: El rol '${req.user.rol}' no tiene permisos para esta operación`
      });
    }

    next();
  };
}

module.exports = {
  authorizeRoles
};
