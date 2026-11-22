const settings = require('../config/settings');

// Responder con el estado actual del contenedor
const getHealthStatus = (req, res) => {
    res.status(200).json({
        status: 'online',
        service: settings.serviceName,
        environment: settings.environment
    });
};

module.exports = { getHealthStatus };