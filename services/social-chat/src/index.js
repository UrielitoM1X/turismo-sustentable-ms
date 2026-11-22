const express = require('express');
const settings = require('./config/settings');
const connectDatabase = require('./config/database');
const healthRoutes = require('./routes/healthRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const chatRoutes = require('./routes/chatRoutes');

// Conectar base de datos documental antes de levantar rutas
connectDatabase();

// Inicializar instancia de Express
const app = express();

// Habilitar lectura de cuerpos JSON
app.use(express.json());

// Registrar rutas de salud y dominio
app.use('/', healthRoutes);
app.use('/reviews', reviewRoutes);
app.use('/chat', chatRoutes);

// Iniciar escucha de peticiones HTTP
app.listen(settings.port, '0.0.0.0', () => {
    console.log(`Servicio social activo en puerto ${settings.port}`);
});