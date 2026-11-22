const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const Review = require('../models/Review');
const { s3Client, ensureBucketExists } = require('../config/s3Client');
const settings = require('../config/settings');

// Publicar resena con calificacion y evidencia fotografica del turista
const createReview = async (req, res) => {
    try {
        const { experienceId, rating, comment, ecologicalComplianceVerified } = req.body;
        const touristId = Number(req.user.sub);
        const files = req.files || [];

        if (!experienceId || !rating || !comment) {
            return res.status(400).json({ detail: 'Faltan campos obligatorios en la resena' });
        }

        const photoKeys = [];
        if (files.length > 0) {
            await ensureBucketExists();
            for (const file of files) {
                const ext = file.originalname.split('.').pop().toLowerCase();
                const objectKey = `reviews/${experienceId}/${touristId}/${uuidv4()}.${ext}`;

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
            experienceId: Number(experienceId),
            touristId,
            rating: Number(rating),
            comment,
            ecologicalComplianceVerified: ecologicalComplianceVerified !== 'false',
            photoKeys
        });

        return res.status(201).json(review);
    } catch (error) {
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