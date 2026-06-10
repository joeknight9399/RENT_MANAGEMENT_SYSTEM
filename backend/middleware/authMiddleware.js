const jwt = require('jsonwebtoken');
const db = require('../config/db'); // Import database configuration pool for stateful account checks

/**
 * @desc    Verify incoming Bearer token credentials, check active account integrity constraints, and mount identity payloads
 * @type    Express Middleware
 */
const protect = async (req, res, next) => {
    try {
        // 1. RUNTIME CONFIGURATION SAFEGUARD
        if (!process.env.JWT_SECRET) {
            console.error('[CRITICAL_AUTH_ERROR]: JWT_SECRET environmental variable configuration is undefined.');
            return res.status(500).json({
                status: 'Error',
                message: 'Internal authorization server configuration anomaly encountered.'
            });
        }

        // 2. EXTRACT BEARER TOKEN ELEMENT FROM HEADER STRUCT
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                status: 'Fail',
                message: 'Authentication required. Please sign in to establish a secure session context.'
            });
        }

        // 3. CRYPTOGRAPHIC SIGNATURE VERIFICATION
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. CRITICAL: RESOLVE STALE-TOKEN EXPLOIT HOLES
        // Query the active user state database cache to verify existence and baseline state verification
        const [userCheck] = await db.execute(
            'SELECT status, role FROM users WHERE id = ? LIMIT 1',
            [decoded.id]
        );

        if (userCheck.length === 0) {
            return res.status(401).json({
                status: 'Fail',
                message: 'The account holding this access token identity mapping record has been purged.'
            });
        }

        const activeProfile = userCheck[0];

        // Absolute State Guard: Lock out blacklisted, suspended, or rejected identities immediately
        if (activeProfile.status !== 'Active') {
            return res.status(403).json({
                status: 'Fail',
                message: `Session revoked. Your account access state is currently '${activeProfile.status}'.`
            });
        }

        // Hot Reload Security Context: Mount real-time verified database roles rather than trusting old token payloads
        req.user = {
            id: decoded.id,
            role: activeProfile.role
        };

        return next();

    } catch (error) {
        console.error('[JWT_INTERCEPT_EXCEPTION]:', error.name, '->', error.message);

        // Categorize exceptions uniquely to facilitate automated token management loops on front-facing layers
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                status: 'Fail',
                code: 'TOKEN_EXPIRED',
                message: 'Your active access token timeline context has expired.'
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                status: 'Fail',
                code: 'TOKEN_CORRUPTED',
                message: 'Cryptographic signature verification failed. Token structure is corrupted or altered.'
            });
        }

        return res.status(401).json({
            status: 'Fail',
            message: 'Session handshake authorization failed.'
        });
    }
};

/**
 * @desc    Restrict application route visibility to specific authorized categorical profiles
 * @param   {...string} allowedRoles - Set of database roles permitted to execute the controller
 */
const restrictTo = (...allowedRoles) => {
    return (req, res, next) => {
        // Fallback safety checkpoint logic
        if (!req.user) {
            return res.status(401).json({
                status: 'Fail',
                message: 'Execution contextual mapping failure. Authenticated routing identities not detected.'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            // Enhanced system visibility logging captures contextual audit matrices safely on server files
            console.warn(`[AUTH_GUARD_VIOLATION]: Access Denied for [${req.method}] ${req.originalUrl} | User UID: ${req.user.id} | Present Role: '${req.user.role}' | Authorized Targets Required: [${allowedRoles.join(', ')}]`);

            return res.status(403).json({
                status: 'Fail',
                message: 'Access Denied. Your profile tier lacks the permissions required to modify this record resource.'
            });
        }

        return next();
    };
};

module.exports = { protect, restrictTo };