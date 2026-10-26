const config = require('../config/config');

/**
 * Validador de política estricta de contraseñas (Sección 2.4 Restricciones, NFR-SEG-2)
 * Mínimo 12 caracteres, mayúsculas, minúsculas, número y símbolo.
 */
function validatePasswordPolicy(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'La contraseña es obligatoria' };
  }

  const { minLength, requireUppercase, requireLowercase, requireNumber, requireSymbol } = config.PASSWORD_POLICY;

  if (password.length < minLength) {
    return { valid: false, message: `La contraseña debe contener al menos ${minLength} caracteres` };
  }
  if (requireUppercase && !/[A-Z]/.test(password)) {
    return { valid: false, message: 'La contraseña debe incluir al menos una letra mayúscula' };
  }
  if (requireLowercase && !/[a-z]/.test(password)) {
    return { valid: false, message: 'La contraseña debe incluir al menos una letra minúscula' };
  }
  if (requireNumber && !/[0-9]/.test(password)) {
    return { valid: false, message: 'La contraseña debe incluir al menos un número' };
  }
  if (requireSymbol && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return { valid: false, message: 'La contraseña debe incluir al menos un símbolo o carácter especial' };
  }

  return { valid: true };
}

/**
 * Validador de RUT chileno con dígito verificador (Módulo 11)
 */
function validateRut(rutCompleto) {
  if (!rutCompleto || typeof rutCompleto !== 'string') return false;
  const limpio = rutCompleto.replace(/[^0-9kK]/g, '').toUpperCase();
  if (limpio.length < 8 || limpio.length > 9) return false;

  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);

  let suma = 0;
  let multiplo = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo.charAt(i), 10) * multiplo;
    multiplo = multiplo < 7 ? multiplo + 1 : 2;
  }

  const dvEsperadoCalculado = 11 - (suma % 11);
  let dvEsperado = '0';
  if (dvEsperadoCalculado === 11) dvEsperado = '0';
  else if (dvEsperadoCalculado === 10) dvEsperado = 'K';
  else dvEsperado = dvEsperadoCalculado.toString();

  return dv === dvEsperado;
}

/**
 * Middleware para sanear campos de texto y prevenir XSS (NFR-SEG-5)
 */
function sanitizeInputs(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string' && key !== 'password' && key !== 'contrasena') {
        // Escapar caracteres peligrosos para HTML/scripts
        req.body[key] = req.body[key]
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .trim();
      }
    }
  }
  next();
}

module.exports = {
  validatePasswordPolicy,
  validateRut,
  sanitizeInputs
};
