const { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Review = require('../models/Review');
const { s3Client, ensureBucketExists } = require('../config/s3Client');
const settings = require('../config/settings');

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

const detectImageFormat = (buffer) => {
    if (!Buffer.isBuffer(buffer) || buffer.length < 3) {
        return null;
    }
    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return { ext: 'jpg', contentType: 'image/jpeg' };
    }
    // PNG: 89 50 4E 47 0D 0A 1A 0A (\x89PNG\r\n\x1a\n)
    if (
        buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47
    ) {
        return { ext: 'png', contentType: 'image/png' };
    }
    // WEBP: RIFF....WEBP
    if (
        buffer.length >= 12 &&
        buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
        buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    ) {
        return { ext: 'webp', contentType: 'image/webp' };
    }
    return null;
};

const cleanupS3Photos = async (photoKeys) => {
    if (!Array.isArray(photoKeys) || photoKeys.length === 0) {
        return;
    }
    await Promise.allSettled(
        photoKeys.map((key) =>
            s3Client.send(new DeleteObjectCommand({
                Bucket: settings.s3BucketName,
                Key: key
            }))
        )
    );
};

// Publicar resena solo si el turista reservo el lugar y aun no lo ha resenado
const createReview = async (req, res) => {
    const photoKeys = [];
    try {
        const { experienceId, rating, comment, ecologicalComplianceVerified } = req.body || {};
        const touristId = Number(req.user.sub);
        const expIdNum = parsePositiveInt(experienceId);
        const ratingNum = parsePositiveInt(rating);
        const files = req.files || [];

        if (!expIdNum) {
            return res.status(400).json({ detail: 'experienceId debe ser un entero positivo' });
        }
        if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
            return res.status(400).json({ detail: 'rating debe ser un entero entre 1 y 5' });
        }
        if (typeof comment !== 'string' || comment.trim().length === 0 || comment.trim().length > 2000) {
            return res.status(400).json({
                detail: 'comment debe ser un texto no vacio de hasta 2000 caracteres'
            });
        }

        // Validar magic bytes de cada archivo antes de interactuar con S3
        const validatedFiles = [];
        for (const file of files) {
            const detected = detectImageFormat(file.buffer);
            if (!detected) {
                return res.status(400).json({
                    detail: 'Archivo de imagen invalido. Solo se aceptan JPEG, PNG o WEBP autenticos.'
                });
            }
            validatedFiles.push({ buffer: file.buffer, ...detected });
        }

        // 1. Verificar que el turista no haya publicado ya una resena para esta experiencia
        const existingReview = await Review.findOne({ experienceId: expIdNum, touristId });
        if (existingReview) {
            return res.status(409).json({
                detail: 'Ya has publicado una resena para esta experiencia. Solo se permite 1 por visita.'
            });
        }

        // 2. Verificar contra booking-service que el turista tenga una reserva pagada/confirmada del lugar
        const authHeader = req.headers.authorization || '';
        let bookingsRes;
        try {
            bookingsRes = await fetch(`${settings.bookingServiceUrl}/reservations/my-bookings`, {
                headers: { Authorization: authHeader },
                signal: AbortSignal.timeout(5000)
            });
        } catch (fetchError) {
            console.error('Error al contactar booking-service:', fetchError);
            return res.status(503).json({
                detail: 'El servicio de reservaciones no esta disponible temporalmente.'
            });
        }

        if (!bookingsRes.ok) {
            if (bookingsRes.status >= 500) {
                return res.status(503).json({
                    detail: 'El servicio de reservaciones no esta disponible temporalmente.'
                });
            }
            return res.status(403).json({
                detail: 'No se pudo verificar tu historial de reservaciones para publicar la resena.'
            });
        }

        const myBookings = await bookingsRes.json();
        const hasValidBooking = Array.isArray(myBookings) && myBookings.some(
            (b) =>
                Number(b.experience_id) === expIdNum &&
                ['CONFIRMED', 'PAID', 'COMPLETED'].includes(String(b.status).toUpperCase())
        );

        if (!hasValidBooking) {
            return res.status(403).json({
                detail: 'Solo puedes resenar experiencias que hayas reservado y visitado.'
            });
        }

        // 3. Subir evidencia fotografica opcional a RustFS / S3
        if (validatedFiles.length > 0) {
            await ensureBucketExists();
            for (const file of validatedFiles) {
                const objectKey = `reviews/${expIdNum}/${touristId}/${uuidv4()}.${file.ext}`;

                await s3Client.send(new PutObjectCommand({
                    Bucket: settings.s3BucketName,
                    Key: objectKey,
                    Body: file.buffer,
                    ContentType: file.contentType
                }));
                photoKeys.push(objectKey);
            }
        }

        const review = await Review.create({
            experienceId: expIdNum,
            touristId,
            rating: ratingNum,
            comment: comment.trim(),
            ecologicalComplianceVerified:
                ecologicalComplianceVerified === true || ecologicalComplianceVerified === 'true',
            photoKeys
        });

        return res.status(201).json(review);
    } catch (error) {
        console.error('Error al guardar resena:', error);
        await cleanupS3Photos(photoKeys);

        if (error && error.code === 11000) {
            return res.status(409).json({
                detail: 'Ya has publicado una resena para esta experiencia.'
            });
        }
        return res.status(500).json({ detail: 'Error al guardar resena' });
    }
};

// Obtener resenas paginadas y promedio de calificacion por experiencia
const getExperienceReviews = async (req, res) => {
    try {
        const experienceId = parsePositiveInt(req.params.experienceId);
        if (!experienceId) {
            return res.status(400).json({ detail: 'experienceId debe ser un entero positivo' });
        }

        const limit = req.query.limit !== undefined ? Number(req.query.limit) : 20;
        const skip = req.query.skip !== undefined ? Number(req.query.skip) : 0;

        if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
            return res.status(400).json({ detail: 'limit debe ser un entero entre 1 y 100' });
        }
        if (!Number.isInteger(skip) || skip < 0) {
            return res.status(400).json({ detail: 'skip debe ser un entero mayor o igual a 0' });
        }

        const [reviews, stats] = await Promise.all([
            Review.find({ experienceId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Review.aggregate([
                { $match: { experienceId } },
                {
                    $group: {
                        _id: null,
                        totalReviews: { $sum: 1 },
                        avgRating: { $avg: '$rating' }
                    }
                }
            ])
        ]);

        const totalReviews = stats.length > 0 ? stats[0].totalReviews : 0;
        const averageRating = stats.length > 0 ? Number(stats[0].avgRating.toFixed(1)) : 0;

        return res.status(200).json({
            experience_id: experienceId,
            average_rating: averageRating,
            total_reviews: totalReviews,
            limit,
            skip,
            reviews
        });
    } catch (error) {
        console.error('Error al consultar resenas:', error);
        return res.status(500).json({ detail: 'Error al consultar resenas' });
    }
};

const resolveImageContentType = (s3ContentType, objectKey) => {
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (s3ContentType && allowed.has(s3ContentType.toLowerCase())) {
        return s3ContentType.toLowerCase();
    }
    const ext = String(objectKey).split('.').pop().toLowerCase();
    if (ext === 'png') return 'image/png';
    if (ext === 'webp') return 'image/webp';
    return 'image/jpeg';
};

// Descargar y servir fotografia de evidencia de una resena desde S3
const getReviewPhoto = async (req, res) => {
    try {
        const { reviewId, photoIndex } = req.params;
        if (!mongoose.Types.ObjectId.isValid(reviewId)) {
            return res.status(400).json({ detail: 'reviewId invalido' });
        }
        if (!/^\d+$/.test(String(photoIndex))) {
            return res.status(400).json({ detail: 'photoIndex invalido' });
        }

        const idx = Number(photoIndex);
        const review = await Review.findById(reviewId);
        if (!review || !Array.isArray(review.photoKeys) || idx < 0 || idx >= review.photoKeys.length) {
            return res.status(404).json({ detail: 'Fotografia no encontrada' });
        }

        const objectKey = review.photoKeys[idx];
        const s3Res = await s3Client.send(new GetObjectCommand({
            Bucket: settings.s3BucketName,
            Key: objectKey
        }));

        const bytes = await s3Res.Body.transformToByteArray();
        const contentType = resolveImageContentType(s3Res.ContentType, objectKey);

        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Type', contentType);
        return res.status(200).send(Buffer.from(bytes));
    } catch (error) {
        const isNotFound =
            error?.$metadata?.httpStatusCode === 404 ||
            error?.name === 'NoSuchKey' ||
            error?.name === 'NotFound';
        if (isNotFound) {
            return res.status(404).json({ detail: 'Fotografia no encontrada en almacenamiento' });
        }
        console.error('Error al obtener fotografia de resena:', error);
        return res.status(500).json({ detail: 'Error al recuperar fotografia' });
    }
};

module.exports = { createReview, getExperienceReviews, getReviewPhoto };