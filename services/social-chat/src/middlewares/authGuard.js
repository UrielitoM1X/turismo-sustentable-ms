const jwt = require('jsonwebtoken');
const settings = require('../config/settings');

// Validar token JWT emitido por el microservicio de usuarios
const verifyJwtToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ detail: 'Formato de token invalido' });
    }

    const token = authHeader.split(' ')[1];
    try {
        req.user = jwt.verify(token, settings.jwtSecret);
        next();
    } catch (error) {
        return res.status(401).json({ detail: 'Token expirado o invalido' });
    }
};

module.exports = verifyJwtToken;