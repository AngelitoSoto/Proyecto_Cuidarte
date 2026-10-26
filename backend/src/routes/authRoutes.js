const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { sanitizeInputs } = require('../middleware/validator');

router.post('/login', sanitizeInputs, authController.login);
router.post('/logout', authenticateToken, authController.logout);
router.post('/register', sanitizeInputs, authController.register);
router.get('/me', authenticateToken, authController.getProfile);

module.exports = router;
