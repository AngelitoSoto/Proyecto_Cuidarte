const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');

// Consulta de auditoría reservada a administradores (RF-5.1, RB-2)
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

router.get('/', auditController.listAuditLogs);

module.exports = router;
