require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'cuidarte_plus_jwt_secure_key_2026_super_secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m', // JWT de corta vigencia (NFR-SEG-9, 3.1.2)
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || 'cuidarte_plus_refresh_token_secure_key_2026',
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  DB: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'cuidarte_plus'
  },
  PASSWORD_POLICY: {
    minLength: 12, // Por defecto: 12 caracteres (Sección 2.4 Restricciones)
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSymbol: true
  },
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  ALLOWED_FILE_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'image/jpeg', 'image/png'],
  MAX_FILE_SIZE: 15 * 1024 * 1024 // 15MB
};
