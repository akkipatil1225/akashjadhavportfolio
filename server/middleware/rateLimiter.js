const config = require('../config');

class LoginRateLimiter {
    constructor() {
        // Map: ip -> { failedAttempts: number, lastAttempt: number, blockedUntil: number }
        this.records = new Map();
        
        // Clean up stale IP records every 30 minutes
        setInterval(() => this.cleanup(), 30 * 60 * 1000);
    }

    getClientIp(req) {
        return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
               req.socket?.remoteAddress ||
               '127.0.0.1';
    }

    checkRateLimit(req, res, next) {
        const ip = this.getClientIp(req);
        const now = Date.now();
        const record = this.records.get(ip);

        if (record && record.blockedUntil && now < record.blockedUntil) {
            const remainingSeconds = Math.ceil((record.blockedUntil - now) / 1000);
            res.setHeader('Retry-After', remainingSeconds);
            return res.status(429).json({
                success: false,
                error: `Too many failed login attempts. Enclave access locked out for this IP. Please retry in ${remainingSeconds} seconds.`
            });
        }

        next();
    }

    recordFailure(req) {
        const ip = this.getClientIp(req);
        const now = Date.now();
        const record = this.records.get(ip) || { failedAttempts: 0, lastAttempt: now, blockedUntil: 0 };

        // If window has passed, reset counter
        if (now - record.lastAttempt > config.LOGIN_LOCKOUT_WINDOW_MS) {
            record.failedAttempts = 0;
            record.blockedUntil = 0;
        }

        record.failedAttempts += 1;
        record.lastAttempt = now;

        if (record.failedAttempts >= config.LOGIN_MAX_FAILED_ATTEMPTS) {
            record.blockedUntil = now + config.LOGIN_LOCKOUT_WINDOW_MS;
            console.warn(`[Security Alert] Rate limit triggered: IP ${ip} exceeded ${config.LOGIN_MAX_FAILED_ATTEMPTS} failed attempts.`);
        }

        this.records.set(ip, record);
    }

    recordSuccess(req) {
        const ip = this.getClientIp(req);
        this.records.delete(ip);
    }

    cleanup() {
        const now = Date.now();
        for (const [ip, record] of this.records.entries()) {
            if (now - record.lastAttempt > config.LOGIN_LOCKOUT_WINDOW_MS && now > (record.blockedUntil || 0)) {
                this.records.delete(ip);
            }
        }
    }

    /**
     * Middleware for strict input validation on credentials
     */
    validateLoginInput(req, res, next) {
        const { username, password } = req.body || {};

        if (typeof username !== 'string' || typeof password !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Invalid request format. Username and password must be strings.'
            });
        }

        const trimmedUser = username.trim();

        // Username validation: length 3-32, safe alphanumeric chars
        if (trimmedUser.length < 3 || trimmedUser.length > 32 || !/^[a-zA-Z0-9_\-\.]{3,32}$/.test(trimmedUser)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid username format. Must be 3-32 alphanumeric characters, dashes, or dots.'
            });
        }

        // Password validation: minimum 8 characters, maximum 128
        if (password.length < 8 || password.length > 128) {
            return res.status(400).json({
                success: false,
                error: 'Invalid password format. Password must be between 8 and 128 characters.'
            });
        }

        req.sanitizedCredentials = {
            username: trimmedUser,
            password
        };

        next();
    }
}

const rateLimiterInstance = new LoginRateLimiter();

module.exports = {
    rateLimiter: (req, res, next) => rateLimiterInstance.checkRateLimit(req, res, next),
    validateLoginInput: (req, res, next) => rateLimiterInstance.validateLoginInput(req, res, next),
    recordFailure: (req) => rateLimiterInstance.recordFailure(req),
    recordSuccess: (req) => rateLimiterInstance.recordSuccess(req)
};
