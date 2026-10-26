const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');

// Rutas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const patientRoutes = require('./routes/patientRoutes');
const examRoutes = require('./routes/examRoutes');
const auditRoutes = require('./routes/auditRoutes');

const app = express();

// Seguridad en cabeceras HTTP (NFR-SEG-1, NFR-SEG-5)
app.use(helmet());

// Habilitar CORS para permitir cliente React (Sección 4.2 Back-end)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parseo de cuerpo JSON y URL-encoded con límite de carga
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Documentación interactiva Swagger OpenAPI (3.1.2)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Montaje de Endpoints API RESTful
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/audit', auditRoutes);

// Endpoint de verificación de estado y rendimiento (NFR-PERF-1)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'Cuidarte+ API'
  });
});

// Manejador de rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
});

// Manejador centralizado de errores seguro (NFR-SEG-6: sin fugar trazas sensibles)
app.use((err, req, res, next) => {
  console.error('Error capturado en middleware:', err.message);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Error interno del servidor'
  });
});

module.exports = app;
