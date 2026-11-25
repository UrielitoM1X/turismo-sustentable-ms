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
        const decoded = jwt.verify(token, settings.jwtSecret, { algorithms: ['HS256'] });
        const rawSub = decoded?.sub;
        const isValidSubType = typeof rawSub === 'number' || (typeof rawSub === 'string' && rawSub.trim() !== '');
        const sub = isValidSubType ? Number(rawSub) : NaN;

        if (!Number.isInteger(sub) || sub <= 0 || typeof decoded?.role !== 'string' || !decoded.role.trim()) {
            return res.status(401).json({ detail: 'Token invalido: claims requeridos ausentes' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ detail: 'Token expirado o invalido' });
    }
};

module.exports = verifyJwtToken;