const express = require('express');
const router = express.Router();
const config = require('../config');
const approvalService = require('../services/approvalService');

/**
 * Custom backend login endpoint disabled per security requirements.
 * Authentication is handled natively by Splunk Enterprise Web at http://localhost:8000.
 */
router.all('/login', (req, res) => {
    res.status(410).json({
        success: false,
        error: 'Custom backend authentication has been deprecated. Authentication is handled natively by Splunk Enterprise at http://localhost:8000.'
    });
});

/**
 * GET /api/auth/smtp-status
 * Transparent disclosure of SMTP service readiness
 */
router.get('/smtp-status', (req, res) => {
    res.json(approvalService.getRequiredConfig());
});

/**
 * POST /api/auth/request-access
 * Access request workflow (email inquiry)
 */
router.post('/request-access', (req, res) => {
    const { email } = req.body || {};

    if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({
            success: false,
            error: 'A valid email address is required.'
        });
    }

    if (!approvalService.isEmailConfigured()) {
        return res.status(503).json({
            success: false,
            serviceConfigured: false,
            error: 'Automated email approval dispatch is inactive. Administrator SMTP credentials have not been configured in the backend environment.',
            recommendedAction: 'Please submit your access request directly to akashdjadhav3730@gmail.com.',
            contactEmail: config.ADMIN_NOTIFY_EMAIL
        });
    }

    const { token, expiresAt } = approvalService.createApprovalToken(req.body);
    res.json({
        success: true,
        message: 'Approval request recorded.',
        expiresAt: new Date(expiresAt).toISOString()
    });
});

module.exports = router;
