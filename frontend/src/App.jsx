import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  // Accesibilidad (NFR-USAB-1)
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState('text-base'); // text-base, text-lg, text-xl

  // Autenticación (RF-1.1, RF-1.2)
  const [token, setToken] = useState(localStorage.getItem('cuidarte_token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('cuidarte_user') || 'null'));
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginForm, setLoginForm] = useState({ nombre_usuario: '', password: '' });
  const [regForm, setRegForm] = useState({ nombre_usuario: '', password: '', email: '' });
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Vistas activas y datos
  const [activeTab, setActiveTab] = useState('patients'); // 'patients', 'exams', 'users', 'audit'
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null); // Flujo escalonado (NFR-USAB-4)
  const [exams, setExams] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });

  // Formularios modales
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [newPatient, setNewPatient] = useState({
    rut: '', nombres: '', apellidos: '', fecha_nacimiento: '', telefono: '', email: '', direccion: '', prevision: 'Fonasa B'
  });

  const [showExamModal, setShowExamModal] = useState(false);
  const [newExam, setNewExam] = useState({
    tipo_examen: '', fecha_examen: new Date().toISOString().split('T')[0], descripcion: '', diagnostico: ''
  });
  const [examFile, setExamFile] = useState(null);

  // Inicialización
  useEffect(() => {
    if (token && user) {
      if (user.rol === 'admin') setActiveTab('users');
      else setActiveTab('patients');
      loadInitialData();
    }
  }, [token]);

  const loadInitialData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // Cargar pacientes
      const pRes = await fetch(`${API_BASE}/patients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const pData = await pRes.json();
      if (pData.success) {
        setPatients(pData.data);
        if (user.rol === 'paciente' && pData.data.length > 0) {
          selectPatientAndLoadExams(pData.data[0]);
        }
      }

      // Si es admin, cargar usuarios y auditoría
      if (user.rol === 'admin') {
        loadUsers();
        loadAudit();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setUsersList(data.data);
    } catch (err) { console.error(err); }
  };

  const loadAudit = async () => {
    try {
      const res = await fetch(`${API_BASE}/audit`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setAuditLogs(data.data);
    } catch (err) { console.error(err); }
  };

  // NFR-USAB-4: Acceso escalonado (seleccionar paciente -> cargar exámenes)
  const selectPatientAndLoadExams = async (patient) => {
    setSelectedPatient(patient);
    setActiveTab('exams');
    try {
      const res = await fetch(`${API_BASE}/exams/patient/${patient.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setExams(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers de Auth
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('cuidarte_token', data.data.accessToken);
        localStorage.setItem('cuidarte_user', JSON.stringify(data.data.usuario));
        setToken(data.data.accessToken);
        setUser(data.data.usuario);
      } else {
        setAuthError(data.error);
      }
    } catch (err) {
      setAuthError('Error conectando al servidor: ' + err.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm)
      });
      const data = await res.json();
      if (data.success) {
        setAuthSuccess('¡Registro exitoso! Ya puede iniciar sesión con rol Paciente.');
        setIsRegistering(false);
      } else {
        setAuthError(data.error);
      }
    } catch (err) {
      setAuthError('Error: ' + err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) { console.warn(err); }
    localStorage.removeItem('cuidarte_token');
    localStorage.removeItem('cuidarte_user');
    setToken('');
    setUser(null);
    setSelectedPatient(null);
  };

  // RF-2.2: Registrar paciente (Médico/Admin)
  const handleCreatePatient = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newPatient)
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({ type: 'success', text: 'Paciente registrado exitosamente' });
        setShowPatientModal(false);
        loadInitialData();
      } else {
        setFeedbackMsg({ type: 'error', text: data.error });
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message });
    }
  };

  // RF-3.1 & RF-4.3: Crear examen médico con adjunto
  const handleCreateExam = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;

    const formData = new FormData();
    formData.append('paciente_id', selectedPatient.id);
    formData.append('tipo_examen', newExam.tipo_examen);
    formData.append('fecha_examen', newExam.fecha_examen);
    formData.append('descripcion', newExam.descripcion);
    formData.append('diagnostico', newExam.diagnostico);
    if (examFile) formData.append('documento', examFile);

    try {
      const res = await fetch(`${API_BASE}/exams`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({ type: 'success', text: 'Examen médico y documento ingresados exitosamente' });
        setShowExamModal(false);
        selectPatientAndLoadExams(selectedPatient);
      } else {
        setFeedbackMsg({ type: 'error', text: data.error });
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message });
    }
  };

  // RF-3.3: Eliminación lógica con confirmación
  const handleDeleteExam = async (examId) => {
    const confirmacion = window.confirm('¿Está seguro de eliminar este examen médico? Esta acción aplicará una baja lógica con trazabilidad auditada.');
    if (!confirmacion) return;

    try {
      const res = await fetch(`${API_BASE}/exams/${examId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ confirm: true })
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({ type: 'success', text: 'Examen eliminado lógicamente con éxito' });
        selectPatientAndLoadExams(selectedPatient);
      } else {
        setFeedbackMsg({ type: 'error', text: data.error });
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message });
    }
  };

  // RF-2.6: Cambiar rol de usuario
  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await fetch(`${API_BASE}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rol: newRole })
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({ type: 'success', text: `Rol actualizado a ${newRole}` });
        loadUsers();
      } else {
        setFeedbackMsg({ type: 'error', text: data.error });
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message });
    }
  };

  // Render si NO está autenticado
  if (!token || !user) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${highContrast ? 'bg-black text-yellow-300' : 'bg-slate-100 text-slate-800'}`}>
        <div className={`w-full max-w-md p-8 rounded-2xl shadow-xl ${highContrast ? 'bg-neutral-900 border-2 border-yellow-400' : 'bg-white border border-slate-200'}`}>
          <div className="text-center mb-6">
            <h1 className="text-3xl font-extrabold text-blue-600 tracking-tight">Cuidarte+</h1>
            <p className="text-sm text-slate-500 mt-1">Plataforma de Gestión de Exámenes Clínicos</p>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
              {authError}
            </div>
          )}
          {authSuccess && (
            <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg text-sm">
              {authSuccess}
            </div>
          )}

          {!isRegistering ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Nombre de Usuario</label>
                <input
                  type="text"
                  required
                  value={loginForm.nombre_usuario}
                  onChange={(e) => setLoginForm({ ...loginForm, nombre_usuario: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
                  placeholder="Ej: dr_perez, admin, paciente_demo"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Contraseña</label>
                <input
                  type="password"
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition"
              >
                Iniciar Sesión
              </button>
              <div className="text-center mt-4 text-sm">
                ¿No tiene cuenta?{' '}
                <button
                  type="button"
                  onClick={() => { setIsRegistering(true); setAuthError(''); }}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Registrarse como Paciente
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Nombre de Usuario</label>
                <input
                  type="text"
                  required
                  value={regForm.nombre_usuario}
                  onChange={(e) => setRegForm({ ...regForm, nombre_usuario: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg text-slate-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg text-slate-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Contraseña (Mín. 12 caracteres, mayús, minús, num y símbolo)</label>
                <input
                  type="password"
                  required
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg text-slate-900 bg-white"
                  placeholder="Ej: Paciente2026!#"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md transition"
              >
                Completar Registro
              </button>
              <div className="text-center mt-4 text-sm">
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="text-slate-600 hover:underline"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-500">
            <p className="font-bold">Usuarios de prueba preconfigurados:</p>
            <p>• Admin: <code className="bg-slate-200 px-1 py-0.5 rounded">admin</code> / <code className="bg-slate-200 px-1 py-0.5 rounded">Admin123456!#</code></p>
            <p>• Médico: <code className="bg-slate-200 px-1 py-0.5 rounded">dr_perez</code> / <code className="bg-slate-200 px-1 py-0.5 rounded">Medico123456!#</code></p>
            <p>• Paciente: <code className="bg-slate-200 px-1 py-0.5 rounded">paciente_demo</code> / <code className="bg-slate-200 px-1 py-0.5 rounded">Paciente123456!#</code></p>
          </div>
        </div>
      </div>
    );
  }

  // Render para usuarios autenticados
  return (
    <div className={`min-h-screen ${fontSize} ${highContrast ? 'bg-black text-yellow-300' : 'bg-slate-50 text-slate-900'}`}>
      {/* Barra Superior con Controles de Accesibilidad para Adultos Mayores */}
      <header className={`px-6 py-4 border-b flex flex-wrap items-center justify-between ${highContrast ? 'bg-neutral-900 border-yellow-400' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-center space-x-3">
          <span className="text-2xl font-black text-blue-600">Cuidarte+</span>
          <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
            user.rol === 'admin' ? 'bg-purple-100 text-purple-800' :
            user.rol === 'medico' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
          }`}>
            Rol: {user.rol}
          </span>
        </div>

        {/* Herramientas de Accesibilidad (NFR-USAB-1) */}
        <div className="flex items-center space-x-2 my-2 sm:my-0">
          <span className="text-xs font-semibold mr-1">Accesibilidad:</span>
          <button
            onClick={() => setHighContrast(!highContrast)}
            className="px-3 py-1.5 border rounded font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 transition"
            aria-label="Alternar modo de alto contraste"
          >
            {highContrast ? 'Contraste Normal' : 'Alto Contraste'}
          </button>
          <div className="inline-flex rounded-md shadow-sm border" role="group">
            <button
              onClick={() => setFontSize('text-sm')}
              className={`px-2 py-1 text-xs border-r ${fontSize === 'text-sm' ? 'bg-blue-600 text-white' : 'bg-white text-slate-800'}`}
              aria-label="Tamaño de texto pequeño"
            >A-</button>
            <button
              onClick={() => setFontSize('text-base')}
              className={`px-2 py-1 text-xs border-r ${fontSize === 'text-base' ? 'bg-blue-600 text-white' : 'bg-white text-slate-800'}`}
              aria-label="Tamaño de texto normal"
            >A</button>
            <button
              onClick={() => setFontSize('text-xl')}
              className={`px-2 py-1 text-xs ${fontSize === 'text-xl' ? 'bg-blue-600 text-white' : 'bg-white text-slate-800'}`}
              aria-label="Tamaño de texto grande para adultos mayores"
            >A+</button>
          </div>
          <button
            onClick={handleLogout}
            className="ml-4 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Navegación por pestañas según Rol */}
      <nav className="bg-white border-b px-6 flex space-x-4">
        {user.rol !== 'admin' && (
          <button
            onClick={() => setActiveTab('patients')}
            className={`py-3 px-4 border-b-2 font-bold transition ${activeTab === 'patients' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600'}`}
          >
            {user.rol === 'paciente' ? 'Mi Ficha Clínica' : 'Gestión de Pacientes (RF-2)'}
          </button>
        )}
        {selectedPatient && (
          <button
            onClick={() => setActiveTab('exams')}
            className={`py-3 px-4 border-b-2 font-bold transition ${activeTab === 'exams' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600'}`}
          >
            Exámenes de {selectedPatient.nombres} (RF-3, RF-4)
          </button>
        )}
        {user.rol === 'admin' && (
          <>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-3 px-4 border-b-2 font-bold transition ${activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600'}`}
            >
              Gestión de Usuarios (RF-2.5, 2.6, 2.7)
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`py-3 px-4 border-b-2 font-bold transition ${activeTab === 'audit' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600'}`}
            >
              Auditoría Normativa (RF-5.1)
            </button>
          </>
        )}
      </nav>

      {/* Contenedor Principal */}
      <main className="max-w-6xl mx-auto p-6">
        {feedbackMsg.text && (
          <div className={`mb-4 p-4 rounded-lg font-medium flex justify-between items-center ${feedbackMsg.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            <span>{feedbackMsg.text}</span>
            <button onClick={() => setFeedbackMsg({ type: '', text: '' })} className="font-bold ml-4">✕</button>
          </div>
        )}

        {/* TAB: GESTIÓN DE PACIENTES */}
        {activeTab === 'patients' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">Directorio de Pacientes</h2>
                <p className="text-sm text-slate-500">Seleccione un paciente para revisar su historial de exámenes (NFR-USAB-4)</p>
              </div>
              {(user.rol === 'medico' || user.rol === 'admin') && (
                <button
                  onClick={() => setShowPatientModal(true)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow transition"
                >
                  + Registrar Nuevo Paciente (RF-2.2)
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {patients.map((pat) => (
                <div
                  key={pat.id}
                  className={`p-5 rounded-xl border transition shadow-sm cursor-pointer ${
                    selectedPatient?.id === pat.id ? 'border-blue-500 ring-2 ring-blue-300' : 'border-slate-200 hover:border-blue-300'
                  } bg-white`}
                  onClick={() => selectPatientAndLoadExams(pat)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{pat.nombres} {pat.apellidos}</h3>
                      <p className="text-sm text-slate-600 font-mono">RUT: {pat.rut}</p>
                    </div>
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded font-semibold">{pat.prevision || 'Fonasa'}</span>
                  </div>
                  <div className="mt-3 text-sm text-slate-600 space-y-1">
                    <p>• F. Nacimiento: {pat.fecha_nacimiento}</p>
                    <p>• Teléfono: {pat.telefono || 'No registrado'}</p>
                    <p>• Dirección: {pat.direccion || 'Sin dirección'}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t flex justify-end">
                    <span className="text-blue-600 font-bold text-sm hover:underline">
                      Ver Exámenes Clínicos →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: EXÁMENES MÉDICOS DEL PACIENTE */}
        {activeTab === 'exams' && selectedPatient && (
          <div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 mb-6 flex flex-wrap justify-between items-center">
              <div>
                <span className="text-xs uppercase font-extrabold text-blue-700">Ficha Médica Seleccionada</span>
                <h2 className="text-2xl font-bold text-blue-900">{selectedPatient.nombres} {selectedPatient.apellidos}</h2>
                <p className="text-sm text-blue-700">RUT: {selectedPatient.rut} | Previsión: {selectedPatient.prevision}</p>
              </div>
              {(user.rol === 'medico' || user.rol === 'admin') && (
                <button
                  onClick={() => setShowExamModal(true)}
                  className="mt-2 sm:mt-0 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow transition"
                >
                  + Agregar Examen Médico (RF-3.1)
                </button>
              )}
            </div>

            <h3 className="text-xl font-bold mb-4">Historial de Exámenes y Documentos Clínicos</h3>
            {exams.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border text-slate-500">
                No hay exámenes registrados aún para este paciente.
              </div>
            ) : (
              <div className="space-y-4">
                {exams.map((exam) => (
                  <div key={exam.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex flex-wrap justify-between items-start">
                      <div>
                        <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          {exam.tipo_examen}
                        </span>
                        <h4 className="text-lg font-bold mt-1 text-slate-800">{exam.descripcion || 'Sin descripción'}</h4>
                        <p className="text-xs text-slate-500">Fecha del examen: {exam.fecha_examen}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold px-2 py-1 rounded bg-green-100 text-green-800">{exam.estado}</span>
                        {(user.rol === 'medico' || user.rol === 'admin') && (
                          <button
                            onClick={() => handleDeleteExam(exam.id)}
                            className="text-xs px-2.5 py-1 text-red-600 border border-red-300 rounded hover:bg-red-50 font-bold transition"
                            title="Eliminación lógica con confirmación (RF-3.3)"
                          >
                            Eliminar (Lógica)
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm text-slate-700">
                      <strong>Diagnóstico Clínico:</strong> {exam.diagnostico || 'Pendiente de emisión médica'}
                    </div>

                    {/* Documentos Clínicos Adjuntos (RF-4.2, RF-4.3) */}
                    <div className="mt-4 pt-3 border-t">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Documentos Adjuntos (Storage Interno RF-4.4):</p>
                      {exam.documentos && exam.documentos.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {exam.documentos.map((doc) => (
                            <a
                              key={doc.id}
                              href={`${API_BASE}/exams/document/${doc.id}/download`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center space-x-2 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition"
                            >
                              <span>📥 {doc.nombre_original}</span>
                              <span className="text-slate-400 font-normal">({Math.round(doc.tamano_bytes / 1024)} KB)</span>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No se adjuntaron archivos para este registro.</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: GESTIÓN DE USUARIOS (ADMIN) */}
        {activeTab === 'users' && user.rol === 'admin' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">Administración de Usuarios y Roles (RF-2.5, RF-2.6)</h2>
                <p className="text-sm text-slate-500">Supervise credenciales, roles de acceso y bajas del sistema</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Nombre de Usuario</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Rol Actual</th>
                    <th className="p-3">Acciones / Cambio de Rol</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono">{u.id}</td>
                      <td className="p-3 font-bold">{u.nombre_usuario}</td>
                      <td className="p-3 text-slate-600">{u.email}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                          u.rol === 'admin' ? 'bg-purple-100 text-purple-800' :
                          u.rol === 'medico' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {u.rol}
                        </span>
                      </td>
                      <td className="p-3">
                        <select
                          value={u.rol}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="px-2 py-1 border rounded text-xs bg-white text-slate-800 mr-2"
                        >
                          <option value="paciente">Paciente</option>
                          <option value="medico">Médico</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: AUDITORÍA NORMATIVA (ADMIN) */}
        {activeTab === 'audit' && user.rol === 'admin' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">Bitácora de Auditoría Técnica (RF-5.1, Ley 19.628 / 20.584)</h2>
                <p className="text-sm text-slate-500">Registro inmutable de acciones críticas sobre fichas y documentos clínicos</p>
              </div>
              <button
                onClick={loadAudit}
                className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 border rounded font-bold"
              >
                🔄 Actualizar Logs
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                  <tr>
                    <th className="p-3">Fecha y Hora</th>
                    <th className="p-3">Usuario</th>
                    <th className="p-3">Rol</th>
                    <th className="p-3">Acción Crítica</th>
                    <th className="p-3">Entidad</th>
                    <th className="p-3">Detalle del Evento</th>
                    <th className="p-3">IP Origen</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-mono">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="p-3 text-slate-500">{new Date(log.fecha_hora).toLocaleString()}</td>
                      <td className="p-3 font-bold text-slate-800">{log.nombre_usuario}</td>
                      <td className="p-3 uppercase">{log.rol_usuario}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                          {log.accion}
                        </span>
                      </td>
                      <td className="p-3">{log.entidad_afectada} #{log.entidad_id}</td>
                      <td className="p-3 text-slate-700 max-w-xs truncate" title={log.detalles}>{log.detalles}</td>
                      <td className="p-3 text-slate-400">{log.ip_origen}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: REGISTRAR PACIENTE (RF-2.2) */}
      {showPatientModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Registrar Nuevo Paciente</h3>
            <form onSubmit={handleCreatePatient} className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1">RUT Chileno (con guion)</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 16234567-2"
                  value={newPatient.rut}
                  onChange={(e) => setNewPatient({ ...newPatient, rut: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Nombres</label>
                  <input
                    type="text"
                    required
                    value={newPatient.nombres}
                    onChange={(e) => setNewPatient({ ...newPatient, nombres: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Apellidos</label>
                  <input
                    type="text"
                    required
                    value={newPatient.apellidos}
                    onChange={(e) => setNewPatient({ ...newPatient, apellidos: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    required
                    value={newPatient.fecha_nacimiento}
                    onChange={(e) => setNewPatient({ ...newPatient, fecha_nacimiento: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Previsión</label>
                  <select
                    value={newPatient.prevision}
                    onChange={(e) => setNewPatient({ ...newPatient, prevision: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                  >
                    <option value="Fonasa A">Fonasa A</option>
                    <option value="Fonasa B">Fonasa B</option>
                    <option value="Fonasa C">Fonasa C</option>
                    <option value="Fonasa D">Fonasa D</option>
                    <option value="Isapre Banmédica">Isapre Banmédica</option>
                    <option value="Isapre Consalud">Isapre Consalud</option>
                    <option value="Particular">Particular</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Teléfono</label>
                <input
                  type="text"
                  value={newPatient.telefono}
                  onChange={(e) => setNewPatient({ ...newPatient, telefono: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="+569..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Dirección</label>
                <input
                  type="text"
                  value={newPatient.direccion}
                  onChange={(e) => setNewPatient({ ...newPatient, direccion: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPatientModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold"
                >
                  Guardar Paciente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AGREGAR EXAMEN (RF-3.1, RF-4.3) */}
      {showExamModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Ingresar Examen Médico</h3>
            <form onSubmit={handleCreateExam} className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1">Tipo de Examen</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Hemograma, Ecografía Abdominal, Scanner TAC"
                  value={newExam.tipo_examen}
                  onChange={(e) => setNewExam({ ...newExam, tipo_examen: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Fecha de Realización</label>
                <input
                  type="date"
                  required
                  value={newExam.fecha_examen}
                  onChange={(e) => setNewExam({ ...newExam, fecha_examen: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Descripción / Motivo</label>
                <textarea
                  rows="2"
                  value={newExam.descripcion}
                  onChange={(e) => setNewExam({ ...newExam, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="Motivo de la solicitud médica..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Diagnóstico / Conclusión</label>
                <textarea
                  rows="2"
                  value={newExam.diagnostico}
                  onChange={(e) => setNewExam({ ...newExam, diagnostico: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="Hallazgos clínicos y recomendaciones..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">
                  Adjuntar Documento Clínico (PDF, DOC, PPT, JPG, PNG - RF-4.3)
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
                  onChange={(e) => setExamFile(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowExamModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold"
                >
                  Guardar Examen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
