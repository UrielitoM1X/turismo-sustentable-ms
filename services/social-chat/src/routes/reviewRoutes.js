const express = require('express');
const multer = require('multer');
const router = express.Router();
const verifyJwtToken = require('../middlewares/authGuard');
const {
    createReview,
    getExperienceReviews,
    getReviewPhoto
} = require('../controllers/reviewController');

const ALLOWED_IMAGE_MIMETYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

// Configurar almacenamiento temporal en memoria y filtro estricto de MIME de imagen
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_IMAGE_MIMETYPES.has(file.mimetype)) {
            return cb(null, true);
        }
        const err = new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname);
        err.message = 'Solo se permiten imagenes JPEG, PNG o WEBP';
        return cb(err);
    }
});

const requireTouristRole = (req, res, next) => {
    if (req.user.role !== 'TOURIST') {
        return res.status(403).json({ detail: 'Solo turistas pueden publicar resenas' });
    }
    return next();
};

// Publicar nueva resena con hasta 5 fotografias de evidencia
router.post('/', verifyJwtToken, requireTouristRole, upload.array('photos', 5), createReview);

// Consultar resenas publicas de una experiencia
router.get('/experience/:experienceId', getExperienceReviews);

// Servir fotografia de evidencia de una resena desde S3
router.get('/:reviewId/photos/:photoIndex', getReviewPhoto);

module.exports = router;