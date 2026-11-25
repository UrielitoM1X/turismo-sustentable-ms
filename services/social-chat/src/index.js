const express = require('express');
const multer = require('multer');
const settings = require('./config/settings');
const connectDatabase = require('./config/database');
const healthRoutes = require('./routes/healthRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const chatRoutes = require('./routes/chatRoutes');

// Inicializar instancia de Express
const app = express();

// Habilitar lectura de cuerpos JSON
app.use(express.json());

// Registrar rutas de salud y dominio
app.use('/', healthRoutes);
app.use('/reviews', reviewRoutes);
app.use('/chat', chatRoutes);

// Middleware global de manejo de errores sin exponer stack traces
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ detail: err.message || 'Error al procesar archivos adjuntos' });
    }
    if (err instanceof SyntaxError && (err.status === 400 || err.type === 'entity.parse.failed')) {
        return res.status(400).json({ detail: 'JSON malformado en el cuerpo de la peticion' });
    }
    console.error('Error no controlado:', err);
    return res.status(500).json({ detail: 'Error interno del servidor' });
});

// Conectar base de datos documental antes de escuchar peticiones HTTP
async function startServer() {
    await connectDatabase();
    app.listen(settings.port, '0.0.0.0', () => {
        console.log(`Servicio social activo en puerto ${settings.port}`);
    });
}

startServer().catch((error) => {
    console.error('Fallo critico al iniciar social-chat-service:', error);
    process.exit(1);
});