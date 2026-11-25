const Message = require('../models/Message');

const parsePositiveInt = (value) => {
    if (value === undefined || value === null || typeof value === 'boolean') {
        return null;
    }
    if (typeof value === 'string' && value.trim() === '') {
        return null;
    }
    const num = Number(value);
    return Number.isInteger(num) && num > 0 ? num : null;
};

// Construir identificador determinista para hilo entre turista y proveedor
const buildConversationId = (experienceId, userA, userB) => {
    const expId = Number(experienceId);
    const sortedUsers = [Number(userA), Number(userB)].sort((a, b) => a - b);
    return `exp_${expId}_u_${sortedUsers[0]}_${sortedUsers[1]}`;
};

// Enviar mensaje directo en el buzon de consultas
const sendMessage = async (req, res) => {
    try {
        const { experienceId, recipientId, content } = req.body || {};
        const senderId = Number(req.user.sub);
        const senderRole = req.user.role;
        const expIdNum = parsePositiveInt(experienceId);
        const recipientIdNum = parsePositiveInt(recipientId);

        if (!expIdNum || !recipientIdNum) {
            return res.status(400).json({ detail: 'experienceId y recipientId deben ser enteros positivos' });
        }
        if (senderId === recipientIdNum) {
            return res.status(400).json({ detail: 'No puedes enviarte mensajes a ti mismo' });
        }
        if (typeof content !== 'string') {
            return res.status(400).json({ detail: 'El contenido del mensaje debe ser texto' });
        }
        const trimmedContent = content.trim();
        if (!trimmedContent || trimmedContent.length > 1500) {
            return res.status(400).json({ detail: 'El mensaje debe tener entre 1 y 1500 caracteres' });
        }

        const conversationId = buildConversationId(expIdNum, senderId, recipientIdNum);
        const message = await Message.create({
            conversationId,
            experienceId: expIdNum,
            senderId,
            senderRole,
            recipientId: recipientIdNum,
            content: trimmedContent
        });

        return res.status(201).json(message);
    } catch (error) {
        console.error('Error al enviar mensaje:', error);
        return res.status(500).json({ detail: 'Error al enviar mensaje' });
    }
};

// Consultar historial de mensajes de una conversacion especifica
const getConversationHistory = async (req, res) => {
    try {
        const expIdNum = parsePositiveInt(req.params.experienceId);
        const otherUserIdNum = parsePositiveInt(req.params.otherUserId);
        const currentUserId = Number(req.user.sub);

        if (!expIdNum || !otherUserIdNum) {
            return res.status(400).json({ detail: 'experienceId y otherUserId deben ser enteros positivos' });
        }
        if (currentUserId === otherUserIdNum) {
            return res.status(400).json({ detail: 'otherUserId no puede coincidir con el usuario autenticado' });
        }

        const conversationId = buildConversationId(expIdNum, currentUserId, otherUserIdNum);

        const messages = await Message.find({ conversationId }).sort({ sentAt: 1 });
        return res.status(200).json({ conversation_id: conversationId, messages });
    } catch (error) {
        console.error('Error al recuperar historial de chat:', error);
        return res.status(500).json({ detail: 'Error al recuperar historial de chat' });
    }
};

// Listar conversaciones activas del usuario autenticado agrupadas por hilo
const getUserConversations = async (req, res) => {
    try {
        const currentUserId = Number(req.user.sub);
        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { senderId: currentUserId },
                        { recipientId: currentUserId }
                    ]
                }
            },
            { $sort: { sentAt: -1 } },
            {
                $group: {
                    _id: '$conversationId',
                    experienceId: { $first: '$experienceId' },
                    senderId: { $first: '$senderId' },
                    recipientId: { $first: '$recipientId' },
                    lastMessage: { $first: '$content' },
                    lastTimestamp: { $first: '$sentAt' }
                }
            },
            {
                $project: {
                    _id: 0,
                    conversationId: '$_id',
                    experienceId: 1,
                    otherUserId: {
                        $cond: [
                            { $eq: ['$senderId', currentUserId] },
                            '$recipientId',
                            '$senderId'
                        ]
                    },
                    lastMessage: 1,
                    lastTimestamp: 1
                }
            },
            { $sort: { lastTimestamp: -1 } }
        ]);

        return res.status(200).json({ conversations });
    } catch (error) {
        console.error('Error al recuperar conversaciones:', error);
        return res.status(500).json({ detail: 'Error al recuperar conversaciones' });
    }
};

module.exports = { sendMessage, getConversationHistory, getUserConversations };