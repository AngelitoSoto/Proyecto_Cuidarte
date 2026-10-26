const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { sanitizeInputs } = require('../middleware/validator');

router.use(authenticateToken);

// Visualización (RF-2.4): Médicos/Admins ven todos; Pacientes ven su propia ficha (RB-1, RB-3)
router.get('/', patientController.listPatients);
router.get('/:id', patientController.getPatientById);

// Creación y edición (RF-2.2, RF-2.3): Solo médico o administrador
router.post('/', authorizeRoles('medico', 'admin'), sanitizeInputs, patientController.createPatient);
router.put('/:id', authorizeRoles('medico', 'admin'), sanitizeInputs, patientController.updatePatient);

module.exports = router;
