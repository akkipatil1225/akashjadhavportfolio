const app = require('./app');
const config = require('./config');

const server = app.listen(config.PORT, () => {
    console.log('================================================================');
    console.log(`🛡️  SOC ANALYST PORTFOLIO BACKEND INITIALIZED`);
    console.log('================================================================');
    console.log(`📡 Server listening on:       http://localhost:${config.PORT}`);
    console.log(`🔒 Environment:               ${config.NODE_ENV}`);
    console.log(`🎯 Splunk Web Console:        http://${config.SPLUNK_HOST}:${config.SPLUNK_WEB_PORT} (Native Authentication)`);
    console.log(`🔐 Splunk REST API:           https://${config.SPLUNK_HOST}:${config.SPLUNK_MGMT_PORT} (Loopback Only)`);
    console.log(`📧 SMTP Service Status:       ${config.isSmtpConfigured() ? 'Active' : 'Inactive (Requires .env setup)'}`);
    console.log('================================================================');
    console.log(`🌐 Public Portfolio URL:      http://localhost:${config.PORT}/`);
    console.log(`📄 SOC Lab Case Study:        http://localhost:${config.PORT}/soc-analyst-home-lab.html`);
    console.log('================================================================\n');
});

// Graceful shutdown handling
function handleShutdown(signal) {
    console.log(`\nReceived ${signal}. Gracefully terminating backend server...`);
    server.close(() => {
        console.log('Backend server terminated cleanly.');
        process.exit(0);
    });
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
