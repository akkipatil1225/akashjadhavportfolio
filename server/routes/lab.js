const express = require('express');
const net = require('net');
const router = express.Router();
const config = require('../config');

/**
 * GET /api/lab/status
 * Probes local enclave reachability without exposing port 8000 or proxying traffic
 */
router.get('/status', (req, res) => {
    const socket = new net.Socket();
    let isConnected = false;

    socket.setTimeout(config.SPLUNK_TIMEOUT_MS);

    socket.connect(config.SPLUNK_WEB_PORT, config.SPLUNK_HOST, () => {
        isConnected = true;
        socket.destroy();
        return res.json({
            success: true,
            enclaveActive: true,
            status: 'OPERATIONAL',
            message: 'Local defensive enclave detected on host. Splunk Enterprise Web is responsive.',
            enclaveHost: 'DESKTOP-FOGONK9',
            splunkWebUrl: `http://${config.SPLUNK_HOST}:${config.SPLUNK_WEB_PORT}`
        });
    });

    socket.on('error', (err) => {
        socket.destroy();
        return res.json({
            success: true,
            enclaveActive: false,
            status: 'OFFLINE_OR_RESTRICTED',
            message: 'Private enclave host service unreachable on local port. Ensure Splunk Enterprise service is running or host VPN is active.',
            enclaveHost: 'DESKTOP-FOGONK9'
        });
    });

    socket.on('timeout', () => {
        socket.destroy();
        return res.json({
            success: true,
            enclaveActive: false,
            status: 'TIMEOUT',
            message: 'Enclave probe timed out. Service is inaccessible from current host network state.',
            enclaveHost: 'DESKTOP-FOGONK9'
        });
    });
});

/**
 * GET /api/lab/console
 * Zero-trust enclave guidance disclosure
 */
router.get('/console', (req, res) => {
    res.json({
        success: true,
        enclaveGuidance: {
            policy: 'Zero-Trust Network Access (ZTNA) & Defense-in-Depth',
            accessRule: 'Authentication is handled entirely by Splunk Enterprise on http://localhost:8000.',
            enclaveBoundary: 'In accordance with SOC hardening guidelines, port 8000 is never reverse-proxied over the public internet.'
        }
    });
});

module.exports = router;
