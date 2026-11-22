const express = require('express');
const router = express.Router();
const { getHealthStatus } = require('../controllers/healthController');

// Definir ruta de verificacion de salud
router.get('/health', getHealthStatus);

module.exports = router;