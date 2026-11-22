// Definir parametros globales y variables de entorno
const settings = {
    port: process.env.PORT || 3000,
    serviceName: 'social-chat-service',
    environment: process.env.NODE_ENV || 'development',
    mongoUrl: process.env.MONGO_URL,
    jwtSecret: process.env.JWT_SECRET,
    minioEndpoint: process.env.MINIO_ENDPOINT || 'minio:9000',
    minioAccessKey: process.env.MINIO_ACCESS_KEY,
    minioSecretKey: process.env.MINIO_SECRET_KEY,
    s3BucketName: 'ts-reviews-media'
};

module.exports = settings;