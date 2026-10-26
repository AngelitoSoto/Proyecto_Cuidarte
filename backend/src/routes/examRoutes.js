const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const upload = require('../middleware/upload');
const { sanitizeInputs } = require('../middleware/validator');

router.use(authenticateToken);

// Flujo escalonado: primero paciente, luego exámenes (RF-4.1, NFR-USAB-4)
router.get('/patient/:patientId', examController.getExamsByPatient);

// Descarga de documentos adjuntos (RF-4.2)
router.get('/document/:docId/download', examController.downloadDocument);

// Gestión médica de exámenes y documentos (RF-3.1, RF-3.2, RF-3.3, RF-4.3)
router.post('/', authorizeRoles('medico', 'admin'), upload.single('documento'), sanitizeInputs, examController.createExam);
router.put('/:id', authorizeRoles('medico', 'admin'), upload.single('documento'), sanitizeInputs, examController.updateExam);
router.delete('/:id', authorizeRoles('medico', 'admin'), examController.deleteExam);

module.exports = router;
