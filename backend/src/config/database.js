const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const config = require('./config');

let pool = null;
let isPostgresConnected = false;

// Almacén en memoria compatible para fallback / tests / despliegue autónomo
const memoryDb = {
  usuarios: [],
  pacientes: [],
  examenes: [],
  documentos_medicos: [],
  auditoria: [],
  tokens_revocados: []
};

let autoIncrement = {
  usuarios: 1,
  pacientes: 1,
  examenes: 1,
  documentos_medicos: 1,
  auditoria: 1,
  tokens_revocados: 1
};

async function seedData() {
  const hashAdmin = await bcrypt.hash('Admin123456!#', 10);
  const hashMedico = await bcrypt.hash('Medico123456!#', 10);
  const hashPaciente = await bcrypt.hash('Paciente123456!#', 10);

  const defaultUsers = [
    {
      id: 1,
      nombre_usuario: 'admin',
      password_hash: hashAdmin,
      email: 'admin@cuidarte.cl',
      rol: 'admin',
      activo: true,
      created_at: new Date()
    },
    {
      id: 2,
      nombre_usuario: 'dr_perez',
      password_hash: hashMedico,
      email: 'dr.perez@cuidarte.cl',
      rol: 'medico',
      activo: true,
      created_at: new Date()
    },
    {
      id: 3,
      nombre_usuario: 'paciente_demo',
      password_hash: hashPaciente,
      email: 'paciente@cuidarte.cl',
      rol: 'paciente',
      activo: true,
      created_at: new Date()
    }
  ];

  const defaultPatients = [
    {
      id: 1,
      rut: '12345678-5',
      nombres: 'Juan Carlos',
      apellidos: 'Soto Morales',
      fecha_nacimiento: '1955-08-14',
      telefono: '+56911223344',
      email: 'paciente@cuidarte.cl',
      direccion: 'Av. Providencia 1234, Santiago',
      prevision: 'Fonasa B',
      usuario_id: 3,
      activo: true,
      created_at: new Date()
    },
    {
      id: 2,
      rut: '9876543-2',
      nombres: 'María Elena',
      apellidos: 'Gómez Valdés',
      fecha_nacimiento: '1950-03-22',
      telefono: '+56999887766',
      email: 'maria.gomez@correo.cl',
      direccion: 'Los Leones 456, Providencia',
      prevision: 'Isapre Banmédica',
      usuario_id: null,
      activo: true,
      created_at: new Date()
    }
  ];

  const defaultExams = [
    {
      id: 1,
      paciente_id: 1,
      medico_id: 2,
      tipo_examen: 'Hemograma Completo',
      fecha_examen: '2026-10-15',
      descripcion: 'Control rutinario de glucosa y perfil lipídico',
      diagnostico: 'Niveles dentro del rango esperado con leve elevación de colesterol',
      estado: 'Completado',
      activo: true,
      created_at: new Date()
    },
    {
      id: 2,
      paciente_id: 1,
      medico_id: 2,
      tipo_examen: 'Radiografía de Tórax AP/L',
      fecha_examen: '2026-10-18',
      descripcion: 'Evaluación cardiorrespiratoria en adulto mayor',
      diagnostico: 'Sin hallazgos patológicos pleuropulmonares activos',
      estado: 'Completado',
      activo: true,
      created_at: new Date()
    }
  ];

  if (isPostgresConnected) {
    try {
      for (const u of defaultUsers) {
        await pool.query(
          `INSERT INTO usuarios (id, nombre_usuario, password_hash, email, rol, activo, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (nombre_usuario) DO NOTHING`,
          [u.id, u.nombre_usuario, u.password_hash, u.email, u.rol, u.activo, u.created_at]
        );
      }
      for (const p of defaultPatients) {
        await pool.query(
          `INSERT INTO pacientes (id, rut, nombres, apellidos, fecha_nacimiento, telefono, email, direccion, prevision, usuario_id, activo, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (rut) DO NOTHING`,
          [p.id, p.rut, p.nombres, p.apellidos, p.fecha_nacimiento, p.telefono, p.email, p.direccion, p.prevision, p.usuario_id, p.activo, p.created_at]
        );
      }
      for (const e of defaultExams) {
        await pool.query(
          `INSERT INTO examenes (id, paciente_id, medico_id, tipo_examen, fecha_examen, descripcion, diagnostico, estado, activo, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO NOTHING`,
          [e.id, e.paciente_id, e.medico_id, e.tipo_examen, e.fecha_examen, e.descripcion, e.diagnostico, e.estado, e.activo, e.created_at]
        );
      }
    } catch (err) {
      console.warn('Advertencia al insertar datos semilla en PostgreSQL:', err.message);
    }
  } else {
    memoryDb.usuarios = [...defaultUsers];
    memoryDb.pacientes = [...defaultPatients];
    memoryDb.examenes = [...defaultExams];
    autoIncrement.usuarios = 4;
    autoIncrement.pacientes = 3;
    autoIncrement.examenes = 3;
  }
}

async function initDb() {
  try {
    pool = new Pool(config.DB);
    // Verificar conexión
    const client = await pool.connect();
    isPostgresConnected = true;
    client.release();
    console.log('Conexión exitosa a PostgreSQL');

    // DDL de esquemas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre_usuario VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        rol VARCHAR(20) NOT NULL CHECK (rol IN ('admin', 'medico', 'paciente')),
        activo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS pacientes (
        id SERIAL PRIMARY KEY,
        rut VARCHAR(12) UNIQUE NOT NULL,
        nombres VARCHAR(100) NOT NULL,
        apellidos VARCHAR(100) NOT NULL,
        fecha_nacimiento DATE NOT NULL,
        telefono VARCHAR(20),
        email VARCHAR(100),
        direccion TEXT,
        prevision VARCHAR(50),
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
        activo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS examenes (
        id SERIAL PRIMARY KEY,
        paciente_id INTEGER NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
        medico_id INTEGER NOT NULL REFERENCES usuarios(id),
        tipo_examen VARCHAR(150) NOT NULL,
        fecha_examen DATE NOT NULL,
        descripcion TEXT,
        diagnostico TEXT,
        estado VARCHAR(50) DEFAULT 'Pendiente',
        activo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS documentos_medicos (
        id SERIAL PRIMARY KEY,
        examen_id INTEGER NOT NULL REFERENCES examenes(id) ON DELETE CASCADE,
        nombre_archivo VARCHAR(255) NOT NULL,
        nombre_original VARCHAR(255) NOT NULL,
        ruta_storage VARCHAR(500) NOT NULL,
        tipo_mime VARCHAR(100) NOT NULL,
        tamano_bytes BIGINT NOT NULL,
        subido_por INTEGER REFERENCES usuarios(id),
        activo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS auditoria (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER,
        nombre_usuario VARCHAR(50),
        rol_usuario VARCHAR(20),
        accion VARCHAR(100) NOT NULL,
        entidad_afectada VARCHAR(50) NOT NULL,
        entidad_id VARCHAR(50),
        detalles TEXT,
        ip_origen VARCHAR(45),
        fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tokens_revocados (
        id SERIAL PRIMARY KEY,
        token_id VARCHAR(255) UNIQUE NOT NULL,
        fecha_expiracion TIMESTAMP NOT NULL,
        revocado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (error) {
    console.log('PostgreSQL no disponible directamente en el host. Activando adaptador de persistencia en memoria/emulado.');
    isPostgresConnected = false;
  }

  await seedData();
}

/**
 * Ejecutor de consultas agnóstico para garantizar seguridad contra SQL Injection (NFR-SEG-5)
 */
async function query(text, params = []) {
  if (isPostgresConnected && pool) {
    return await pool.query(text, params);
  }

  // Emulación de consultas seguras en memoria para ejecución autónoma
  const cleanSql = text.trim();
  const lowerSql = cleanSql.toLowerCase();

  // Tokens revocados check
  if (lowerSql.includes('from tokens_revocados') && lowerSql.includes('token_id = $1')) {
    const tokenId = params[0];
    const found = memoryDb.tokens_revocados.filter(t => t.token_id === tokenId);
    return { rows: found, rowCount: found.length };
  }

  if (lowerSql.includes('insert into tokens_revocados')) {
    const newRecord = {
      id: autoIncrement.tokens_revocados++,
      token_id: params[0],
      fecha_expiracion: params[1],
      revocado_en: new Date()
    };
    memoryDb.tokens_revocados.push(newRecord);
    return { rows: [newRecord], rowCount: 1 };
  }

  // Auditoria insert
  if (lowerSql.includes('insert into auditoria')) {
    const auditRecord = {
      id: autoIncrement.auditoria++,
      usuario_id: params[0],
      nombre_usuario: params[1],
      rol_usuario: params[2],
      accion: params[3],
      entidad_afectada: params[4],
      entidad_id: params[5],
      detalles: params[6],
      ip_origen: params[7],
      fecha_hora: new Date()
    };
    memoryDb.auditoria.unshift(auditRecord);
    return { rows: [auditRecord], rowCount: 1 };
  }

  // Auditoria select
  if (lowerSql.includes('from auditoria')) {
    return { rows: [...memoryDb.auditoria], rowCount: memoryDb.auditoria.length };
  }

  // Usuarios select by username or email
  if (lowerSql.includes('from usuarios') && lowerSql.includes('nombre_usuario = $1')) {
    const username = params[0];
    const rows = memoryDb.usuarios.filter(u => u.nombre_usuario === username && u.activo !== false);
    return { rows, rowCount: rows.length };
  }

  if (lowerSql.includes('from usuarios') && lowerSql.includes('email = $1')) {
    const email = params[0];
    const rows = memoryDb.usuarios.filter(u => u.email === email && u.activo !== false);
    return { rows, rowCount: rows.length };
  }

  if (lowerSql.includes('from usuarios') && lowerSql.includes('id = $1')) {
    const id = parseInt(params[0], 10);
    const rows = memoryDb.usuarios.filter(u => u.id === id);
    return { rows, rowCount: rows.length };
  }

  if (lowerSql.startsWith('select') && lowerSql.includes('from usuarios') && !lowerSql.includes('where')) {
    const rows = memoryDb.usuarios.filter(u => u.activo !== false);
    return { rows, rowCount: rows.length };
  }

  // Usuarios insert
  if (lowerSql.includes('insert into usuarios')) {
    const newId = autoIncrement.usuarios++;
    const user = {
      id: newId,
      nombre_usuario: params[0],
      password_hash: params[1],
      email: params[2],
      rol: params[3] || 'paciente',
      activo: true,
      created_at: new Date()
    };
    memoryDb.usuarios.push(user);
    return { rows: [user], rowCount: 1 };
  }

  // Usuarios update
  if (lowerSql.includes('update usuarios set') && lowerSql.includes('rol = $1')) {
    const id = parseInt(params[2], 10);
    const user = memoryDb.usuarios.find(u => u.id === id);
    if (user) {
      user.rol = params[0];
      user.activo = params[1] !== undefined ? params[1] : user.activo;
      user.updated_at = new Date();
      return { rows: [user], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // Usuarios soft delete (RF-2.7)
  if (lowerSql.includes('update usuarios set activo = false') || lowerSql.includes('delete from usuarios')) {
    const id = parseInt(params[0], 10);
    const user = memoryDb.usuarios.find(u => u.id === id);
    if (user) {
      user.activo = false;
      return { rows: [user], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // Pacientes select
  if (lowerSql.includes('from pacientes') && lowerSql.includes('where id = $1')) {
    const id = parseInt(params[0], 10);
    const rows = memoryDb.pacientes.filter(p => p.id === id && p.activo !== false);
    return { rows, rowCount: rows.length };
  }

  if (lowerSql.includes('from pacientes') && lowerSql.includes('usuario_id = $1')) {
    const userId = parseInt(params[0], 10);
    const rows = memoryDb.pacientes.filter(p => p.usuario_id === userId && p.activo !== false);
    return { rows, rowCount: rows.length };
  }

  if (lowerSql.includes('from pacientes') && lowerSql.includes('rut = $1')) {
    const rut = params[0];
    const rows = memoryDb.pacientes.filter(p => p.rut === rut && p.activo !== false);
    return { rows, rowCount: rows.length };
  }

  if (lowerSql.startsWith('select') && lowerSql.includes('from pacientes')) {
    const rows = memoryDb.pacientes.filter(p => p.activo !== false);
    return { rows, rowCount: rows.length };
  }

  // Pacientes insert (RF-2.2)
  if (lowerSql.includes('insert into pacientes')) {
    const newId = autoIncrement.pacientes++;
    const patient = {
      id: newId,
      rut: params[0],
      nombres: params[1],
      apellidos: params[2],
      fecha_nacimiento: params[3],
      telefono: params[4],
      email: params[5],
      direccion: params[6],
      prevision: params[7],
      usuario_id: params[8] || null,
      activo: true,
      created_at: new Date()
    };
    memoryDb.pacientes.push(patient);
    return { rows: [patient], rowCount: 1 };
  }

  // Pacientes update (RF-2.3)
  if (lowerSql.includes('update pacientes set')) {
    const id = parseInt(params[7], 10);
    const patient = memoryDb.pacientes.find(p => p.id === id);
    if (patient) {
      patient.nombres = params[0];
      patient.apellidos = params[1];
      patient.telefono = params[2];
      patient.email = params[3];
      patient.direccion = params[4];
      patient.prevision = params[5];
      patient.activo = params[6] !== undefined ? params[6] : patient.activo;
      patient.updated_at = new Date();
      return { rows: [patient], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // Exámenes select
  if (lowerSql.includes('from examenes') && lowerSql.includes('where id = $1')) {
    const id = parseInt(params[0], 10);
    const rows = memoryDb.examenes.filter(e => e.id === id && e.activo !== false);
    return { rows, rowCount: rows.length };
  }

  if (lowerSql.includes('from examenes') && lowerSql.includes('paciente_id = $1')) {
    const patientId = parseInt(params[0], 10);
    const rows = memoryDb.examenes.filter(e => e.paciente_id === patientId && e.activo !== false);
    return { rows, rowCount: rows.length };
  }

  if (lowerSql.startsWith('select') && lowerSql.includes('from examenes')) {
    const rows = memoryDb.examenes.filter(e => e.activo !== false);
    return { rows, rowCount: rows.length };
  }

  // Exámenes insert (RF-3.1)
  if (lowerSql.includes('insert into examenes')) {
    const newId = autoIncrement.examenes++;
    const exam = {
      id: newId,
      paciente_id: parseInt(params[0], 10),
      medico_id: parseInt(params[1], 10),
      tipo_examen: params[2],
      fecha_examen: params[3],
      descripcion: params[4],
      diagnostico: params[5],
      estado: params[6] || 'Completado',
      activo: true,
      created_at: new Date()
    };
    memoryDb.examenes.push(exam);
    return { rows: [exam], rowCount: 1 };
  }

  // Exámenes update (RF-3.2)
  if (lowerSql.includes('update examenes set') && !lowerSql.includes('activo = false')) {
    const id = parseInt(params[4], 10);
    const exam = memoryDb.examenes.find(e => e.id === id);
    if (exam) {
      exam.tipo_examen = params[0];
      exam.descripcion = params[1];
      exam.diagnostico = params[2];
      exam.estado = params[3];
      exam.updated_at = new Date();
      return { rows: [exam], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // Exámenes soft delete (RF-3.3)
  if (lowerSql.includes('update examenes set activo = false')) {
    const id = parseInt(params[0], 10);
    const exam = memoryDb.examenes.find(e => e.id === id);
    if (exam) {
      exam.activo = false;
      return { rows: [exam], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // Documentos médicos
  if (lowerSql.includes('insert into documentos_medicos')) {
    const newId = autoIncrement.documentos_medicos++;
    const doc = {
      id: newId,
      examen_id: parseInt(params[0], 10),
      nombre_archivo: params[1],
      nombre_original: params[2],
      ruta_storage: params[3],
      tipo_mime: params[4],
      tamano_bytes: parseInt(params[5], 10),
      subido_por: parseInt(params[6], 10),
      activo: true,
      created_at: new Date()
    };
    memoryDb.documentos_medicos.push(doc);
    return { rows: [doc], rowCount: 1 };
  }

  if (lowerSql.includes('from documentos_medicos') && lowerSql.includes('where id = $1')) {
    const id = parseInt(params[0], 10);
    const rows = memoryDb.documentos_medicos.filter(d => d.id === id && d.activo !== false);
    return { rows, rowCount: rows.length };
  }

  if (lowerSql.includes('from documentos_medicos') && lowerSql.includes('examen_id = $1')) {
    const examId = parseInt(params[0], 10);
    const rows = memoryDb.documentos_medicos.filter(d => d.examen_id === examId && d.activo !== false);
    return { rows, rowCount: rows.length };
  }

  if (lowerSql.includes('update documentos_medicos set activo = false')) {
    const id = parseInt(params[0], 10);
    const doc = memoryDb.documentos_medicos.find(d => d.id === id);
    if (doc) {
      doc.activo = false;
      return { rows: [doc], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  return { rows: [], rowCount: 0 };
}

module.exports = {
  initDb,
  query,
  memoryDb,
  isPostgresConnected: () => isPostgresConnected
};
