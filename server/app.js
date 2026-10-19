const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const config = require('./config');
const securityHeaders = require('./middleware/securityHeaders');
const authRoutes = require('./routes/auth');
const labRoutes = require('./routes/lab');

const app = express();

// Trust proxy if configured behind reverse proxy (e.g., Nginx)
if (config.IS_PRODUCTION) {
    app.set('trust proxy', 1);
}

// Request parsers
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(cookieParser());

// Security headers and CSRF verification
app.use(securityHeaders);

// Server-side session configuration
app.use(session({
    name: 'soc_lab_session',
    secret: config.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: false, // Strict absolute lifetime from createdAt
    cookie: {
        httpOnly: true,
        sameSite: 'strict',
        secure: config.IS_PRODUCTION,
        maxAge: config.SESSION_LIFETIME_MS
    }
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/lab', labRoutes);

// Public Static Files: Serves the entire existing portfolio seamlessly
// Visitors can freely explore index.html, soc-analyst-home-lab.html, screenshots, resume
const staticDir = path.resolve(__dirname, '..');
app.use(express.static(staticDir, {
    index: 'index.html',
    dotfiles: 'ignore',
    maxAge: config.IS_PRODUCTION ? '1d' : 0
}));

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ success: false, error: 'Endpoint not found.' });
});

// Centralized error handler
app.use((err, req, res, next) => {
    console.error('[Server Error]', err.stack || err.message);
    res.status(500).json({
        success: false,
        error: config.IS_PRODUCTION ? 'An internal error occurred.' : err.message
    });
});

module.exports = app;
