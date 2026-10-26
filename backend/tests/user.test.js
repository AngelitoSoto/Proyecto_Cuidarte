const request = require('supertest');
const app = require('../src/app');
const { initDb } = require('../src/config/database');

let adminToken = '';
let doctorToken = '';

beforeAll(async () => {
  await initDb();

  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ nombre_usuario: 'admin', password: 'Admin123456!#' });
  adminToken = adminLogin.body.data.accessToken;

  const docLogin = await request(app)
    .post('/api/auth/login')
    .send({ nombre_usuario: 'dr_perez', password: 'Medico123456!#' });
  doctorToken = docLogin.body.data.accessToken;
});

describe('Módulo de Administración de Usuarios (RF-2.5, RF-2.6, RF-2.7, RB-2)', () => {
  test('RF-2.5 & RB-2: Administrador puede listar todos los usuarios registrados', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBeGreaterThan(0);
  });

  test('RF-2.5: Médico no tiene acceso a la administración de usuarios (403)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.status).toBe(403);
  });

  test('RF-2.6: Administrador puede cambiar el rol de un usuario existente', async () => {
    const res = await request(app)
      .put('/api/users/3')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ rol: 'medico' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rol).toBe('medico');
  });

  test('RF-2.6: Rechaza asignación de rol no válido (400)', async () => {
    const res = await request(app)
      .put('/api/users/3')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ rol: 'super_hacker' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Rol inválido');
  });

  test('RF-2.7: Administrador elimina lógicamente a un usuario', async () => {
    // Crear usuario temporal
    const tempUserRes = await request(app)
      .post('/api/auth/register')
      .send({
        nombre_usuario: 'usuario_a_eliminar',
        password: 'PasswordEliminar123!#',
        email: 'eliminar@correo.cl'
      });
    const tempUserId = tempUserRes.body.data.id;

    // Eliminarlo
    const delRes = await request(app)
      .delete(`/api/users/${tempUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);
  });

  test('RF-2.7: Administrador no puede eliminarse a sí mismo (400)', async () => {
    const delSelf = await request(app)
      .delete('/api/users/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(delSelf.status).toBe(400);
    expect(delSelf.body.error).toContain('no puede eliminarse a sí mismo');
  });
});
