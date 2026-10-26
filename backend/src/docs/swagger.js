const swaggerJsdoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'API Cuidarte+ - Sistema de Exámenes Médicos',
    version: '1.0.0',
    description: 'Especificación de API RESTful para la plataforma Cuidarte+ (CreaLab SpA / Duoc UC). Incluye autenticación con JWT, control de acceso RBAC, gestión de fichas clínicas, exámenes, almacenamiento de documentos y auditoría normativa (Ley 19.628 / 20.584).'
  },
  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Servidor Local de Desarrollo / Pruebas'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Ingrese el token JWT obtenido tras autenticarse en /auth/login'
      }
    },
    schemas: {
      LoginRequest: {
        type: 'object',
        required: ['nombre_usuario', 'password'],
        properties: {
          nombre_usuario: { type: 'string', example: 'dr_perez' },
          password: { type: 'string', example: 'Medico123456!#' }
        }
      },
      RegisterRequest: {
        type: 'object',
        required: ['nombre_usuario', 'password', 'email'],
        properties: {
          nombre_usuario: { type: 'string', example: 'paciente_nuevo' },
          password: { type: 'string', example: 'Segura123456!#' },
          email: { type: 'string', example: 'nuevo@correo.cl' }
        }
      },
      PatientInput: {
        type: 'object',
        required: ['rut', 'nombres', 'apellidos', 'fecha_nacimiento'],
        properties: {
          rut: { type: 'string', example: '12345678-5' },
          nombres: { type: 'string', example: 'Juan Carlos' },
          apellidos: { type: 'string', example: 'Soto Morales' },
          fecha_nacimiento: { type: 'string', format: 'date', example: '1955-08-14' },
          telefono: { type: 'string', example: '+56911223344' },
          email: { type: 'string', example: 'juan.soto@correo.cl' },
          direccion: { type: 'string', example: 'Av. Providencia 1234, Santiago' },
          prevision: { type: 'string', example: 'Fonasa B' }
        }
      },
      ExamInput: {
        type: 'object',
        required: ['paciente_id', 'tipo_examen', 'fecha_examen'],
        properties: {
          paciente_id: { type: 'integer', example: 1 },
          tipo_examen: { type: 'string', example: 'Perfil Bioquímico' },
          fecha_examen: { type: 'string', format: 'date', example: '2026-10-24' },
          descripcion: { type: 'string', example: 'Control metabólico preventivo' },
          diagnostico: { type: 'string', example: 'Glicemia normal' },
          estado: { type: 'string', example: 'Completado' }
        }
      }
    }
  },
  paths: {
    '/auth/login': {
      post: {
        summary: 'Autenticación y generación de JWT (RF-1.1)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } }
        },
        responses: {
          200: { description: 'Login exitoso, retorna tokens' },
          401: { description: 'Credenciales inválidas' }
        }
      }
    },
    '/auth/logout': {
      post: {
        summary: 'Cierre de sesión y revocación de token (RF-1.2)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Sesión invalidada exitosamente' },
          401: { description: 'Token faltante o revocado' }
        }
      }
    },
    '/auth/register': {
      post: {
        summary: 'Registro rápido de usuarios (RF-2.1)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } }
        },
        responses: {
          201: { description: 'Usuario paciente creado' },
          400: { description: 'Contraseña no cumple política o faltan datos' }
        }
      }
    },
    '/patients': {
      get: {
        summary: 'Listar pacientes registrados (RF-2.4)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Lista de pacientes' } }
      },
      post: {
        summary: 'Registrar nuevo paciente (RF-2.2)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/PatientInput' } } }
        },
        responses: { 201: { description: 'Paciente creado' }, 400: { description: 'RUT inválido' } }
      }
    },
    '/exams/patient/{patientId}': {
      get: {
        summary: 'Visualizar exámenes de un paciente (RF-4.1, NFR-USAB-4)',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'patientId', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Lista de exámenes' } }
      }
    },
    '/exams': {
      post: {
        summary: 'Registrar nuevo examen médico con documento (RF-3.1, RF-4.3)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  paciente_id: { type: 'integer' },
                  tipo_examen: { type: 'string' },
                  fecha_examen: { type: 'string' },
                  descripcion: { type: 'string' },
                  diagnostico: { type: 'string' },
                  documento: { type: 'string', format: 'binary' }
                }
              }
            }
          }
        },
        responses: { 201: { description: 'Examen creado' } }
      }
    },
    '/exams/{id}': {
      delete: {
        summary: 'Eliminación lógica de examen médico con confirmación (RF-3.3)',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { confirm: { type: 'boolean', example: true } },
                required: ['confirm']
              }
            }
          }
        },
        responses: { 200: { description: 'Examen eliminado lógicamente' } }
      }
    },
    '/audit': {
      get: {
        summary: 'Visualizar eventos críticos de auditoría (RF-5.1)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Listado de auditoría' }, 403: { description: 'Requiere rol admin' } }
      }
    }
  }
};

const options = {
  swaggerDefinition,
  apis: []
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
