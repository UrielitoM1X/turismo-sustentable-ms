const { S3Client, HeadBucketCommand, CreateBucketCommand } = require('@aws-sdk/client-s3');
const settings = require('./settings');

// Normalizar endpoint de MinIO/RustFS conservando esquema si ya existe
const rawEndpoint = (settings.minioEndpoint || 'minio:9000').trim();
const normalizedEndpoint = /^https?:\/\//i.test(rawEndpoint) ? rawEndpoint : `http://${rawEndpoint}`;

// Inicializar cliente compatible con S3 apuntando a RustFS/MinIO
const s3Client = new S3Client({
    endpoint: normalizedEndpoint,
    region: 'us-east-1',
    credentials: {
        accessKeyId: settings.minioAccessKey,
        secretAccessKey: settings.minioSecretKey
    },
    forcePathStyle: true
});

// Verificar o crear bucket para galerias fotograficas de resenas
const ensureBucketExists = async () => {
    try {
        await s3Client.send(new HeadBucketCommand({ Bucket: settings.s3BucketName }));
    } catch (error) {
        const isNotFound =
            error?.$metadata?.httpStatusCode === 404 ||
            error?.name === 'NotFound' ||
            error?.name === 'NoSuchBucket';

        if (!isNotFound) {
            throw error;
        }

        await s3Client.send(new CreateBucketCommand({ Bucket: settings.s3BucketName }));
    }
};

module.exports = { s3Client, ensureBucketExists };