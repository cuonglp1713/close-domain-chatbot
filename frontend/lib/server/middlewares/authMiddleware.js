const jwt = require('jsonwebtoken');

// Middleware để xác thực token
function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];

    if (!token) return res.status(403).json({ error: 'Access denied' });

    jwt.verify(token, 'secret_key', (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });

        req.user = user;
        next();
    });
}

module.exports = authenticateToken;
