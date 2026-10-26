const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { sanitizeInputs } = require('../middleware/validator');

// Todas las rutas de gestión de usuarios requieren rol 'admin' (RF-2.5, RF-2.6, RF-2.7, RB-2)
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

router.get('/', userController.listUsers);
router.put('/:id', sanitizeInputs, userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
