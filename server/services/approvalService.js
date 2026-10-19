const crypto = require('crypto');
const config = require('../config');

class ApprovalService {
    constructor() {
        // In-memory store for approval requests: token -> { email, name, role, createdAt, expiresAt, status: 'pending'|'approved'|'rejected'|'used' }
        this.tokenStore = new Map();
        
        // Clean up expired tokens periodically (every 10 minutes)
        setInterval(() => this.cleanupExpiredTokens(), 10 * 60 * 1000);
    }

    /**
     * Checks if outbound email delivery is fully configured
     */
    isEmailConfigured() {
        return config.isSmtpConfigured();
    }

    /**
     * Retrieves the required SMTP and provider configuration schema
     */
    getRequiredConfig() {
        return {
            configured: this.isEmailConfigured(),
            requiredFields: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM', 'ADMIN_NOTIFY_EMAIL'],
            currentStatus: {
                SMTP_HOST: config.SMTP_HOST ? 'Configured' : 'Missing',
                SMTP_PORT: config.SMTP_PORT,
                SMTP_SECURE: config.SMTP_SECURE,
                SMTP_USER: config.SMTP_USER ? 'Configured' : 'Missing',
                SMTP_PASS: config.SMTP_PASS ? 'Configured (Redacted)' : 'Missing',
                SMTP_FROM: config.SMTP_FROM,
                ADMIN_NOTIFY_EMAIL: config.ADMIN_NOTIFY_EMAIL
            }
        };
    }

    /**
     * Generates a random, single-use, expiring approval token
     * 32 bytes of cryptographically secure entropy = 64 hex characters
     */
    createApprovalToken(requestData) {
        const token = crypto.randomBytes(32).toString('hex');
        const now = Date.now();
        const expiresAt = now + config.APPROVAL_TOKEN_LIFETIME_MS;

        const record = {
            token,
            email: requestData.email,
            name: requestData.name || 'Anonymous Evaluator',
            organization: requestData.organization || 'Independent',
            purpose: requestData.purpose || 'Technical Assessment',
            createdAt: now,
            expiresAt,
            status: 'pending'
        };

        this.tokenStore.set(token, record);
        return { token, expiresAt };
    }

    /**
     * Validates a single-use approval token server-side
     */
    validateToken(token) {
        if (!token || typeof token !== 'string') {
            return { valid: false, error: 'Token is required.' };
        }

        const record = this.tokenStore.get(token);
        if (!record) {
            return { valid: false, error: 'Approval token not found or invalid.' };
        }

        const now = Date.now();
        if (now > record.expiresAt) {
            this.tokenStore.delete(token);
            return { valid: false, error: 'Approval token has expired (15-minute validity window exceeded).' };
        }

        if (record.status === 'used') {
            return { valid: false, error: 'Approval token has already been consumed (single-use constraint).' };
        }

        if (record.status !== 'approved' && record.status !== 'pending') {
            return { valid: false, error: `Invalid token status: ${record.status}.` };
        }

        return { valid: true, record };
    }

    /**
     * Consumes an approved token (single-use enforcement)
     */
    consumeToken(token) {
        const validation = this.validateToken(token);
        if (!validation.valid) return validation;

        validation.record.status = 'used';
        validation.record.consumedAt = Date.now();
        return { valid: true, message: 'Token successfully consumed.' };
    }

    cleanupExpiredTokens() {
        const now = Date.now();
        for (const [token, record] of this.tokenStore.entries()) {
            if (now > record.expiresAt || record.status === 'used') {
                this.tokenStore.delete(token);
            }
        }
    }
}

module.exports = new ApprovalService();
