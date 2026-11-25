const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const Review = require('../models/Review');
const { s3Client, ensureBucketExists } = require('../config/s3Client');
const settings = require('../config/settings');

const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || 'http://booking-service:8000';

// Publicar resena solo si el turista reservo el lugar y aun no lo ha resenado
const createReview = async (req, res) => {
    try {
        const { experienceId, rating, comment, ecologicalComplianceVerified } = req.body;
        const touristId = Number(req.user.sub);
        const expIdNum = Number(experienceId);
        const files = req.files || [];

        if (!expIdNum || !rating || !comment) {
            return res.status(400).json({ detail: 'Faltan campos obligatorios en la resena' });
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
        const bookingsRes = await fetch(`${BOOKING_SERVICE_URL}/reservations/my-bookings`, {
            headers: { Authorization: authHeader }
        });

        if (!bookingsRes.ok) {
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
        const photoKeys = [];
        if (files.length > 0) {
            await ensureBucketExists();
            for (const file of files) {
                const ext = file.originalname.split('.').pop().toLowerCase();
                const objectKey = `reviews/${expIdNum}/${touristId}/${uuidv4()}.${ext}`;

                await s3Client.send(new PutObjectCommand({
                    Bucket: settings.s3BucketName,
                    Key: objectKey,
                    Body: file.buffer,
                    ContentType: file.mimetype
                }));
                photoKeys.push(objectKey);
            }
        }

        const review = await Review.create({
            experienceId: expIdNum,
            touristId,
            rating: Number(rating),
            comment,
            ecologicalComplianceVerified: ecologicalComplianceVerified !== 'false',
            photoKeys
        });

        return res.status(201).json(review);
    } catch (error) {
        if (error && error.code === 11000) {
            return res.status(409).json({
                detail: 'Ya has publicado una resena para esta experiencia.'
            });
        }
        return res.status(500).json({ detail: 'Error al guardar resena', error: error.message });
    }
};

// Obtener resenas y promedio de calificacion por experiencia
const getExperienceReviews = async (req, res) => {
    try {
        const experienceId = Number(req.params.experienceId);
        const reviews = await Review.find({ experienceId }).sort({ createdAt: -1 });

        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0
            ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1))
            : 0;

        return res.status(200).json({
            experience_id: experienceId,
            average_rating: averageRating,
            total_reviews: totalReviews,
            reviews
        });
    } catch (error) {
        return res.status(500).json({ detail: 'Error al consultar resenas' });
    }
};

module.exports = { createReview, getExperienceReviews };