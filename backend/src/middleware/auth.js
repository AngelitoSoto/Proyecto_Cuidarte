const jwt = require('jsonwebtoken');
const config = require('../config/config');
const db = require('../config/database');

/**
 * Middleware de verificación de autenticación mediante JWT (RF-1.1, NFR-SEG-9)
 * Valida firma, vigencia del token y lista de revocación (RF-1.2).
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Acceso no autorizado: Token de autenticación requerido'
    });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);

    // Verificar si el token fue revocado tras logout (RF-1.2)
    if (decoded.jti) {
      const revokedCheck = await db.query(
        'SELECT * FROM tokens_revocados WHERE token_id = $1',
        [decoded.jti]
      );
      if (revokedCheck.rows && revokedCheck.rows.length > 0) {
        return res.status(401).json({
          success: false,
          error: 'Token revocado o sesión cerrada. Inicie sesión nuevamente.'
        });
      }
    }

    req.user = decoded;
    req.tokenJti = decoded.jti;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: 'Token inválido o expirado'
    });
  }
}

module.exports = {
  authenticateToken
};
