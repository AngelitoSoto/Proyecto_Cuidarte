const request = require('supertest');
const app = require('../src/app');
const { initDb } = require('../src/config/database');

let doctorToken = '';
let patientToken = '';

beforeAll(async () => {
  await initDb();

  const docLogin = await request(app)
    .post('/api/auth/login')
    .send({ nombre_usuario: 'dr_perez', password: 'Medico123456!#' });
  doctorToken = docLogin.body.data.accessToken;

  const patLogin = await request(app)
    .post('/api/auth/login')
    .send({ nombre_usuario: 'paciente_demo', password: 'Paciente123456!#' });
  patientToken = patLogin.body.data.accessToken;
});

describe('Módulo de Gestión de Pacientes (RF-2.2, RF-2.3, RF-2.4, RB-3)', () => {
  test('RF-2.4 & RB-3: Médico puede visualizar listado de todos los pacientes', async () => {
    const res = await request(app)
      .get('/api/patients')
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('RF-2.2: Debería rechazar registro de paciente con RUT inválido', async () => {
    const res = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        rut: '11111111-9', // DV incorrecto
        nombres: 'Test Invalido',
        apellidos: 'Error RUT',
        fecha_nacimiento: '1980-01-01'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('RUT');
  });

  test('RF-2.2: Médico registra nuevo paciente con RUT válido correctamente', async () => {
    const res = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        rut: '16234567-2',
        nombres: 'Rodrigo Andrés',
        apellidos: 'Pavez Lagos',
        fecha_nacimiento: '1975-06-12',
        telefono: '+56987654321',
        email: 'rodrigo.pavez@correo.cl',
        direccion: 'Calle Central 789',
        prevision: 'Fonasa C'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.nombres).toBe('Rodrigo Andrés');
  });

  test('RF-2.2: Paciente no tiene permisos para crear otros pacientes (403)', async () => {
    const res = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        rut: '18345678-2',
        nombres: 'Intento Denegado',
        apellidos: 'Sin Permiso',
        fecha_nacimiento: '1990-01-01'
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('RF-2.3: Médico actualiza información de un paciente', async () => {
    const res = await request(app)
      .put('/api/patients/1')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        telefono: '+56900000000',
        direccion: 'Nueva Dirección Modificada 999'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
