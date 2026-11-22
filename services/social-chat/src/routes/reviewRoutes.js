const express = require('express');
const multer = require('multer');
const router = express.Router();
const verifyJwtToken = require('../middlewares/authGuard');
const { createReview, getExperienceReviews } = require('../controllers/reviewController');

// Configurar almacenamiento temporal en memoria para carga de imagenes
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Publicar nueva resena con hasta 5 fotografias de evidencia
router.post('/', verifyJwtToken, upload.array('photos', 5), (req, res) => {
    if (req.user.role !== 'TOURIST') {
        return res.status(403).json({ detail: 'Solo turistas pueden publicar resenas' });
    }
    return createReview(req, res);
});

// Consultar resenas publicas de una experiencia
router.get('/experience/:experienceId', getExperienceReviews);

module.exports = router;