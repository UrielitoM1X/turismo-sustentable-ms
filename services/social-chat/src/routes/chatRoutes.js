const express = require('express');
const router = express.Router();
const verifyJwtToken = require('../middlewares/authGuard');
const { sendMessage, getConversationHistory } = require('../controllers/chatController');

// Enviar consulta o respuesta directa
router.post('/send', verifyJwtToken, (req, res) => {
    if (!['TOURIST', 'PROVIDER'].includes(req.user.role)) {
        return res.status(403).json({ detail: 'Rol no autorizado para mensajeria' });
    }
    return sendMessage(req, res);
});

// Obtener mensajes de un hilo entre turista y proveedor
router.get('/history/:experienceId/:otherUserId', verifyJwtToken, getConversationHistory);

module.exports = router;