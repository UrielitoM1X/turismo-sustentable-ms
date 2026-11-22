const mongoose = require('mongoose');

// Definir esquema de mensajeria directa entre turista y proveedor
const messageSchema = new mongoose.Schema({
    conversationId: { type: String, required: true, index: true },
    experienceId: { type: Number, required: true },
    senderId: { type: Number, required: true },
    senderRole: { type: String, enum: ['TOURIST', 'PROVIDER'], required: true },
    recipientId: { type: Number, required: true },
    content: { type: String, required: true, trim: true, maxlength: 1500 },
    isRead: { type: Boolean, default: false },
    sentAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);