const request = require('supertest');
const app = require('../src/app');
const { initDb } = require('../src/config/database');

beforeAll(async () => {
  await initDb();
});

describe('Módulo de Autenticación y Sesión (RF-1, RF-2.1, NFR-SEG-2, NFR-SEG-9)', () => {
  test('RF-1.1: Debería autenticar usuario médico válido y retornar token JWT', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        nombre_usuario: 'dr_perez',
        password: 'Medico123456!#'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('accessToken');
    expect(response.body.data.usuario.rol).toBe('medico');
  });

  test('RF-1.1: Debería rechazar login con credenciales incorrectas (401)', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        nombre_usuario: 'dr_perez',
        password: 'PasswordIncorrecto123!'
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test('RF-2.1 & NFR-SEG-2: Debería rechazar registro si contraseña no cumple política (mín 12 chars, mayús, minús, num, simb)', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        nombre_usuario: 'paciente_debil',
        password: 'corta',
        email: 'debil@correo.cl'
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('caracteres');
  });

  test('RF-2.1: Debería permitir registro rápido con contraseña válida asignando rol paciente por defecto', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        nombre_usuario: 'paciente_nuevo_' + Date.now(),
        password: 'SeguraPass1234!#',
        email: `nuevo_${Date.now()}@correo.cl`
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.rol).toBe('paciente');
  });

  test('RF-1.2: Cierre de sesión y revocación del token JWT', async () => {
    // 1. Iniciar sesión
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        nombre_usuario: 'dr_perez',
        password: 'Medico123456!#'
      });
    const token = loginRes.body.data.accessToken;

    // 2. Cerrar sesión
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);

    // 3. Verificar que el token revocado ya no puede acceder a rutas protegidas
    const profileRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(profileRes.status).toBe(401);
    expect(profileRes.body.error).toContain('revocado');
  });
});
