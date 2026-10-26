const request = require('supertest');
const app = require('../src/app');
const { initDb } = require('../src/config/database');

let adminToken = '';
let patientToken = '';

beforeAll(async () => {
  await initDb();

  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ nombre_usuario: 'admin', password: 'Admin123456!#' });
  adminToken = adminLogin.body.data.accessToken;

  const patLogin = await request(app)
    .post('/api/auth/login')
    .send({ nombre_usuario: 'paciente_demo', password: 'Paciente123456!#' });
  patientToken = patLogin.body.data.accessToken;
});

describe('Pruebas de Seguridad y Cumplimiento Normativo (NFR-SEG, RB-1, RB-2, OWASP)', () => {
  test('NFR-SEG-4 & RB-2: Solo administrador puede consultar logs de auditoría (403 para paciente)', async () => {
    const resForbidden = await request(app)
      .get('/api/audit')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(resForbidden.status).toBe(403);

    const resAdmin = await request(app)
      .get('/api/audit')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(resAdmin.status).toBe(200);
    expect(resAdmin.body.success).toBe(true);
    expect(Array.isArray(resAdmin.body.data)).toBe(true);
  });

  test('NFR-SEG-4: Acceso no autenticado debe retornar 401 Unauthorized', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  test('NFR-SEG-5: Protección contra SQL Injection en parámetros de login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        nombre_usuario: "' OR '1'='1' --",
        password: 'cualquierPassword123!'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('NFR-SEG-5: Saneamiento de entradas contra Cross-Site Scripting (XSS)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        nombre_usuario: '<script>alert(1)</script>paciente',
        password: 'PasswordValido123!#',
        email: `xss_${Date.now()}@correo.cl`
      });

    // Debe sanear o procesar con caracteres escapados
    if (res.status === 201) {
      expect(res.body.data.nombre_usuario).not.toContain('<script>');
    }
  });

  test('NFR-PERF-1: Tiempo de respuesta para endpoint healthcheck debe ser < 300ms', async () => {
    const start = Date.now();
    const res = await request(app).get('/api/health');
    const duration = Date.now() - start;

    expect(res.status).toBe(200);
    expect(duration).toBeLessThan(300);
  });
});
