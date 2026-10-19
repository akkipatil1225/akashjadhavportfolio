/**
 * Akash.Sec Portfolio - Local HTTP Development Server
 * Zero external dependencies. Uses Node.js standard library.
 * Serves portfolio on http://localhost:8080 and verifies local Splunk Web status.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 8080;
const ROOT_DIR = path.resolve(__dirname);
const SPLUNK_URL = 'http://localhost:8000';

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
    '.spl': 'text/plain; charset=utf-8'
};

// Check whether local Splunk Web is responding
function checkSplunkStatus(callback) {
    const req = http.get(SPLUNK_URL, { timeout: 1500 }, (res) => {
        callback(true, res.statusCode);
    });
    req.on('error', () => callback(false, null));
    req.on('timeout', () => {
        req.destroy();
        callback(false, null);
    });
}

// Request Handler
const server = http.createServer((req, res) => {
    // Parse safe file path
    const urlPath = req.url.split('?')[0].split('#')[0];
    let decodedPath = decodeURIComponent(urlPath);
    if (decodedPath === '/' || decodedPath === '') {
        decodedPath = '/index.html';
    }

    let filePath = path.join(ROOT_DIR, decodedPath);

    // Prevent directory traversal
    if (!filePath.startsWith(ROOT_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats) {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`<h2>404 Not Found</h2><p>The requested file <code>${decodedPath}</code> was not found.</p><p><a href="/">Return to Portfolio</a></p>`);
            return;
        }

        if (stats.isDirectory()) {
            filePath = path.join(filePath, 'index.html');
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        fs.readFile(filePath, (readErr, content) => {
            if (readErr) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end(`500 Internal Server Error: ${readErr.message}`);
                return;
            }

            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'X-Content-Type-Options': 'nosniff'
            });
            res.end(content);
        });
    });
});

// Start Server and Handle Port In-Use
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n[!] Port ${PORT} is already in use by another process.`);
        console.log(`[*] Opening index.html directly in default browser...\n`);
        exec(`start "" "${path.join(ROOT_DIR, 'index.html')}"`);
    } else {
        console.error('[!] Server Error:', err.message);
    }
});

server.listen(PORT, '127.0.0.1', () => {
    console.log('\n================================================================');
    console.log('   🛡️  AKASH.SEC CYBERSECURITY PORTFOLIO - LOCAL SERVER');
    console.log('================================================================');
    console.log(`🌐 Local Portfolio:        http://localhost:${PORT}/`);
    console.log(`📄 SOC Lab Case Study:     http://localhost:${PORT}/projects/soc-home-lab.html`);
    console.log(`📂 Root Directory:         ${ROOT_DIR}`);
    console.log('----------------------------------------------------------------');

    checkSplunkStatus((isOnline, statusCode) => {
        if (isOnline) {
            console.log(`✅ Splunk Enterprise:      ONLINE (http://localhost:8000 - HTTP ${statusCode})`);
            console.log('   Live Command Center dashboard is accessible on this host.');
        } else {
            console.log('⚠️  Splunk Enterprise:      NOT DETECTED on port 8000');
            console.log('   To start Splunk service: Open PowerShell as Admin and run:');
            console.log('   Start-Service Splunkd');
        }
        console.log('================================================================');
        console.log('Press Ctrl+C to stop the local server.\n');

        // Automatically open the portfolio in the default browser
        exec(`start http://localhost:${PORT}/`);
    });
});
