const express = require('express');
const router = express.Router();
const verifyJwtToken = require('../middlewares/authGuard');
const {
    sendMessage,
    getConversationHistory,
    getUserConversations
} = require('../controllers/chatController');

const requireChatRole = (req, res, next) => {
    if (!['TOURIST', 'PROVIDER'].includes(req.user.role)) {
        return res.status(403).json({ detail: 'Rol no autorizado para mensajeria' });
    }
    return next();
};

// Enviar consulta o respuesta directa
router.post('/send', verifyJwtToken, requireChatRole, sendMessage);

// Obtener mensajes de un hilo entre turista y proveedor
router.get('/history/:experienceId/:otherUserId', verifyJwtToken, requireChatRole, getConversationHistory);

// Listar conversaciones en las que participa el usuario autenticado
router.get('/conversations', verifyJwtToken, requireChatRole, getUserConversations);

module.exports = router;