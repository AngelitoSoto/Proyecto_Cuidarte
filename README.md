# Cuidarte+ | Sistema de Exámenes Médicos
## Evaluación Parcial Nº 3 - ISY1102 (Seguridad y Calidad en el Desarrollo de Software)

Proyecto completo desarrollado de acuerdo a la **Especificación de Requerimientos de Software (ERS)** de CreaLab SpA / Duoc UC y evaluado mediante análisis estático de código con **SonarQube LTS Community** y pruebas automatizadas con **Jest**.

---

### 1. Arquitectura y Tecnologías
- **Backend**: Node.js v24 con framework Express v4.19.2, JWT (`jsonwebtoken` v9.0.2), cifrado de contraseñas (`bcryptjs`), cabeceras seguras (`helmet`), CORS (`cors` v2.8.5), subida de archivos multipart (`multer`), documentación OpenAPI interactiva (`swagger-ui-express`).
- **Base de Datos**: PostgreSQL v15 (con adaptador relacional dual y fallback autónomo para ejecución sin fricción).
- **Frontend**: Single Page Application (React, Tailwind CSS, Material UI) con herramientas de accesibilidad para adultos mayores (alto contraste, fuentes dinámicas) y flujo escalonado paciente → exámenes.
- **Auditoría Estática**: SonarQube Community v9.9.8 (SAST) + SonarScanner CLI.
- **Pruebas Automatizadas**: Jest v29.7.0 + Supertest v6.3.4 (25/25 pruebas aprobadas, 70.7% cobertura de código).

---

### 2. Resultados de la Auditoría SonarQube (SAST)
- **Quality Gate**: **Aprobado (OK / Passed)**
- **Bugs**: **0** (Grado A)
- **Vulnerabilidades**: **0** (Grado A)
- **Security Hotspots**: **3** (Revisados y mitigados)
- **Code Smells**: **5** (Con plan de remediación documentado)
- **Duplicaciones**: **0.0%**
- **Cobertura de Pruebas**: **70.7%**
- **Dashboard Activo**: [http://localhost:9000/dashboard?id=cuidarte-plus](http://localhost:9000/dashboard?id=cuidarte-plus)

---

### 3. Instrucciones de Ejecución

#### A. Iniciar el Backend
```bash
cd backend
npm install
npm start
```
- API REST escuchando en: `http://localhost:5000`
- Documentación interactiva Swagger: `http://localhost:5000/api-docs`
- Healthcheck de rendimiento: `http://localhost:5000/api/health`

#### B. Ejecutar Pruebas Automatizadas y Cobertura
```bash
cd backend
npm test
```
*Ejecuta los 5 módulos de pruebas (auth, patient, exam, user, security) generando el reporte de cobertura en `coverage/lcov.info`.*

#### C. Re-escanear con SonarQube
```bash
cd backend
npm run sonar
```
*Se conecta a SonarQube en `http://localhost:9000` usando el token del proyecto y actualiza las métricas en tiempo real.*

#### D. Desplegar con Docker Compose
```bash
docker compose up -d
```
*Levanta simultáneamente PostgreSQL, SonarQube, Backend y Frontend.*

---

### 4. Credenciales de Prueba Preconfiguradas
- **Administrador**: `admin` / `Admin123456!#`
- **Médico**: `dr_perez` / `Medico123456!#`
- **Paciente**: `paciente_demo` / `Paciente123456!#`

---

### 5. Documento de Entrega (Informe Duoc UC)
El informe formal en formato Word con formato institucional (Arial 12/11, interlineado 1.5, tablas completas de casos de prueba y análisis ético/normativo) se encuentra disponible en:
- `informe/Informe_EP3_ISY1102_CuidartePlus.docx`
- Y una copia lista para descarga en la carpeta de Descargas del sistema.
