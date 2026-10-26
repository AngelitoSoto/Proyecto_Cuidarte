const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');
const db = require('../config/database');
const { validatePasswordPolicy } = require('../middleware/validator');
const { logAudit } = require('../services/auditService');

/**
 * Autenticación de usuario (RF-1.1)
 */
async function login(req, res) {
  const { nombre_usuario, password } = req.body;

  if (!nombre_usuario || !password) {
    return res.status(400).json({
      success: false,
      error: 'Se requiere nombre de usuario y contraseña'
    });
  }

  try {
    const userRes = await db.query(
      'SELECT * FROM usuarios WHERE nombre_usuario = $1',
      [nombre_usuario.trim()]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    const user = userRes.rows[0];

    if (!user.activo) {
      return res.status(403).json({
        success: false,
        error: 'Usuario inactivo. Contacte al administrador.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Generar token JWT con identificador único (jti) para soporte de revocación (RF-1.2, NFR-SEG-9)
    const jti = uuidv4();
    const tokenPayload = {
      id: user.id,
      nombre_usuario: user.nombre_usuario,
      email: user.email,
      rol: user.rol,
      jti
    };

    const accessToken = jwt.sign(tokenPayload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN
    });

    const refreshToken = jwt.sign({ id: user.id, jti }, config.REFRESH_TOKEN_SECRET, {
      expiresIn: config.REFRESH_TOKEN_EXPIRES_IN
    });

    // Registrar en auditoría (RF-5.1)
    await logAudit({
      usuario_id: user.id,
      nombre_usuario: user.nombre_usuario,
      rol_usuario: user.rol,
      accion: 'LOGIN_EXITOSO',
      entidad_afectada: 'usuarios',
      entidad_id: user.id,
      detalles: 'Inicio de sesión satisfactorio',
      ip_origen: req.ip || req.connection.remoteAddress
    });

    return res.status(200).json({
      success: true,
      message: 'Autenticación exitosa',
      data: {
        accessToken,
        refreshToken,
        usuario: {
          id: user.id,
          nombre_usuario: user.nombre_usuario,
          email: user.email,
          rol: user.rol
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Error interno en autenticación: ' + error.message
    });
  }
}

/**
 * Cierre de sesión y revocación de token (RF-1.2)
 */
async function logout(req, res) {
  try {
    const jti = req.tokenJti;
    if (jti) {
      // Registrar token como revocado hasta su expiración
      const expDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await db.query(
        'INSERT INTO tokens_revocados (token_id, fecha_expiracion) VALUES ($1, $2)',
        [jti, expDate]
      );
    }

    await logAudit({
      usuario_id: req.user ? req.user.id : null,
      nombre_usuario: req.user ? req.user.nombre_usuario : 'ANONIMO',
      rol_usuario: req.user ? req.user.rol : 'VISITANTE',
      accion: 'LOGOUT_REVOCACION_TOKEN',
      entidad_afectada: 'tokens_revocados',
      entidad_id: jti,
      detalles: 'Cierre de sesión e invalidación de token JWT',
      ip_origen: req.ip || req.connection.remoteAddress
    });

    return res.status(200).json({
      success: true,
      message: 'Sesión cerrada exitosamente y token revocado'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Error al cerrar sesión: ' + error.message
    });
  }
}

/**
 * Registro rápido de usuarios (RF-2.1)
 * Asigna rol "paciente" por defecto y valida política de contraseñas.
 */
async function register(req, res) {
  const { nombre_usuario, password, email } = req.body;

  if (!nombre_usuario || !password || !email) {
    return res.status(400).json({
      success: false,
      error: 'Los campos usuario, contraseña y correo son obligatorios'
    });
  }

  // Validación de política de contraseñas (Sección 2.4, NFR-SEG-2)
  const passwordCheck = validatePasswordPolicy(password);
  if (!passwordCheck.valid) {
    return res.status(400).json({
      success: false,
      error: passwordCheck.message
    });
  }

  try {
    // Verificar unicidad de usuario y correo
    const existingUser = await db.query(
      'SELECT id FROM usuarios WHERE nombre_usuario = $1',
      [nombre_usuario.trim()]
    );
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'El nombre de usuario ya está registrado'
      });
    }

    const existingEmail = await db.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email.trim().toLowerCase()]
    );
    if (existingEmail.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'El correo electrónico ya está registrado'
      });
    }

    // Hash seguro con bcrypt (NFR-SEG-2)
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Rol por defecto: "paciente" (RF-2.1)
    const defaultRol = 'paciente';

    const insertRes = await db.query(
      `INSERT INTO usuarios (nombre_usuario, password_hash, email, rol, activo)
       VALUES ($1, $2, $3, $4, true) RETURNING id, nombre_usuario, email, rol, created_at`,
      [nombre_usuario.trim(), password_hash, email.trim().toLowerCase(), defaultRol]
    );

    const newUser = insertRes.rows[0];

    await logAudit({
      usuario_id: newUser.id,
      nombre_usuario: newUser.nombre_usuario,
      rol_usuario: newUser.rol,
      accion: 'REGISTRO_NUEVO_USUARIO',
      entidad_afectada: 'usuarios',
      entidad_id: newUser.id,
      detalles: 'Registro de usuario paciente por auto-servicio',
      ip_origen: req.ip || req.connection.remoteAddress
    });

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente con rol paciente',
      data: newUser
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Error al registrar usuario: ' + error.message
    });
  }
}

/**
 * Obtener perfil del usuario autenticado
 */
async function getProfile(req, res) {
  try {
    const userRes = await db.query(
      'SELECT id, nombre_usuario, email, rol, activo, created_at FROM usuarios WHERE id = $1',
      [req.user.id]
    );
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
    return res.status(200).json({ success: true, data: userRes.rows[0] });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  login,
  logout,
  register,
  getProfile
};
