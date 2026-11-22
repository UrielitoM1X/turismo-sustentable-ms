const mongoose = require('mongoose');

// Definir esquema de resena y galeria fotografica contra greenwashing
const reviewSchema = new mongoose.Schema({
    experienceId: { type: Number, required: true, index: true },
    touristId: { type: Number, required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 1000 },
    ecologicalComplianceVerified: { type: Boolean, default: true },
    photoKeys: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);