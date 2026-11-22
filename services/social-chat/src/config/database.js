const mongoose = require('mongoose');
const settings = require('./settings');

// Establecer conexion persistente con MongoDB
const connectDatabase = async () => {
    try {
        await mongoose.connect(settings.mongoUrl);
        console.log('Conexion establecida con MongoDB');
    } catch (error) {
        console.error('Error al conectar con MongoDB:', error.message);
        process.exit(1);
    }
};

module.exports = connectDatabase;