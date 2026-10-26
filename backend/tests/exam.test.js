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

describe('Módulo de Gestión y Visualización de Exámenes (RF-3, RF-4, NFR-USAB-4)', () => {
  let createdExamId = null;

  test('RF-3.1: Médico registra nuevo examen médico a un paciente', async () => {
    const res = await request(app)
      .post('/api/exams')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        paciente_id: 1,
        tipo_examen: 'Electrocardiograma de Reposo',
        fecha_examen: '2026-10-24',
        descripcion: 'Control cardiológico preventivo',
        diagnostico: 'Ritmo sinusal regular sin alteraciones agudas',
        estado: 'Completado'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tipo_examen).toBe('Electrocardiograma de Reposo');
    createdExamId = res.body.data.id;
  });

  test('RF-4.1 & NFR-USAB-4: Acceso escalonado (ver exámenes del paciente)', async () => {
    const res = await request(app)
      .get('/api/exams/patient/1')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.paciente).toHaveProperty('rut');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('RF-3.3: Eliminación lógica falla si no se envía confirmación explícita', async () => {
    const res = await request(app)
      .delete(`/api/exams/${createdExamId}`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('confirmación');
  });

  test('RF-3.3: Eliminación lógica exitosa con confirmación del usuario', async () => {
    const res = await request(app)
      .delete(`/api/exams/${createdExamId}`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ confirm: true });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('eliminados lógicamente');
  });
});
