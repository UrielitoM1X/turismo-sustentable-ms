const Message = require('../models/Message');

// Construir identificador determinista para hilo entre turista y proveedor
const buildConversationId = (experienceId, userA, userB) => {
    const sortedUsers = [Number(userA), Number(userB)].sort((a, b) => a - b);
    return `exp_${experienceId}_u_${sortedUsers[0]}_${sortedUsers[1]}`;
};

// Enviar mensaje directo en el buzon de consultas
const sendMessage = async (req, res) => {
    try {
        const { experienceId, recipientId, content } = req.body;
        const senderId = Number(req.user.sub);
        const senderRole = req.user.role;

        if (!experienceId || !recipientId || !content) {
            return res.status(400).json({ detail: 'Destinatario, experiencia y contenido son requeridos' });
        }

        const conversationId = buildConversationId(experienceId, senderId, recipientId);
        const message = await Message.create({
            conversationId,
            experienceId: Number(experienceId),
            senderId,
            senderRole,
            recipientId: Number(recipientId),
            content
        });

        return res.status(201).json(message);
    } catch (error) {
        return res.status(500).json({ detail: 'Error al enviar mensaje' });
    }
};

// Consultar historial de mensajes de una conversacion especifica
const getConversationHistory = async (req, res) => {
    try {
        const { experienceId, otherUserId } = req.params;
        const currentUserId = Number(req.user.sub);
        const conversationId = buildConversationId(experienceId, currentUserId, otherUserId);

        const messages = await Message.find({ conversationId }).sort({ sentAt: 1 });
        return res.status(200).json({ conversation_id: conversationId, messages });
    } catch (error) {
        return res.status(500).json({ detail: 'Error al recuperar historial de chat' });
    }
};

module.exports = { sendMessage, getConversationHistory };