const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const config = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    IS_PRODUCTION: process.env.NODE_ENV === 'production',
    PORT: parseInt(process.env.PORT, 10) || 3000,
    
    // Server-Side Session Security
    SESSION_SECRET: process.env.SESSION_SECRET || 'dev_session_secret_change_in_production_32b',
    SESSION_LIFETIME_MS: (parseInt(process.env.SESSION_LIFETIME_MINUTES, 10) || 10) * 60 * 1000,
    
    // Splunk Enterprise REST API Configuration
    // Authenticates live against Splunk Management endpoint (https://127.0.0.1:8089/services/auth/login)
    SPLUNK_HOST: process.env.SPLUNK_HOST || '127.0.0.1',
    SPLUNK_MGMT_PORT: parseInt(process.env.SPLUNK_MGMT_PORT, 10) || 8089,
    SPLUNK_WEB_PORT: parseInt(process.env.SPLUNK_WEB_PORT, 10) || 8000,
    SPLUNK_VERIFY_SSL: process.env.SPLUNK_VERIFY_SSL === 'true', // Default false for local self-signed loopback
    SPLUNK_TIMEOUT_MS: parseInt(process.env.SPLUNK_TIMEOUT_MS, 10) || 5000,
    
    // Rate Limiting
    LOGIN_MAX_FAILED_ATTEMPTS: parseInt(process.env.LOGIN_MAX_FAILED_ATTEMPTS, 10) || 5,
    LOGIN_LOCKOUT_WINDOW_MS: (parseInt(process.env.LOGIN_LOCKOUT_WINDOW_MINUTES, 10) || 15) * 60 * 1000,
    
    // SMTP / Email Approval Configuration
    SMTP_HOST: process.env.SMTP_HOST || '',
    SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
    SMTP_SECURE: process.env.SMTP_SECURE === 'true',
    SMTP_USER: process.env.SMTP_USER || '',
    SMTP_PASS: process.env.SMTP_PASS || '',
    SMTP_FROM: process.env.SMTP_FROM || 'SOC Lab Access <noreply@akash-sec.internal>',
    ADMIN_NOTIFY_EMAIL: process.env.ADMIN_NOTIFY_EMAIL || 'akashdjadhav3730@gmail.com',
    APPROVAL_TOKEN_LIFETIME_MS: (parseInt(process.env.APPROVAL_TOKEN_LIFETIME_MINUTES, 10) || 15) * 60 * 1000,
    
    isSmtpConfigured() {
        return Boolean(this.SMTP_HOST && this.SMTP_USER && this.SMTP_PASS);
    }
};

module.exports = config;
