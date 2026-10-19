const config = require('../config');

/**
 * Enforces server-side authentication and strict 10-minute session lifetime on every request.
 */
function requireAuth(req, res, next) {
    if (!req.session || !req.session.authenticated) {
        return res.status(401).json({
            success: false,
            authenticated: false,
            error: 'Authentication required. No active session found.'
        });
    }

    const now = Date.now();
    const createdAt = req.session.createdAt || 0;
    const elapsedMs = now - createdAt;

    // Strict 10-minute absolute session lifetime check
    if (elapsedMs > config.SESSION_LIFETIME_MS) {
        const expiredMinutes = Math.round(config.SESSION_LIFETIME_MS / 60000);
        req.session.destroy((err) => {
            if (err) console.error('Error destroying expired session:', err.message);
        });
        res.clearCookie('soc_lab_session');
        return res.status(401).json({
            success: false,
            authenticated: false,
            error: `Session expired: Strict ${expiredMinutes}-minute maximum session lifetime exceeded. Please log in again.`
        });
    }

    // Attach active session metadata to request
    req.sessionUser = req.session.user;
    req.sessionTimeRemainingMs = Math.max(0, config.SESSION_LIFETIME_MS - elapsedMs);
    req.session.lastActivity = now;

    next();
}

module.exports = requireAuth;
