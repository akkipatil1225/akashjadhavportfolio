/**
 * Security headers and CSRF/Origin validation middleware
 */
function securityHeaders(req, res, next) {
    // Prevent MIME-sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Strict referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Modern Permissions Policy
    res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
    
    // Content Security Policy compatible with FontAwesome & Google Fonts
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self' 'unsafe-inline' https:; " +
        "img-src 'self' data: https:; " +
        "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; " +
        "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; " +
        "connect-src 'self';"
    );

    // CSRF protection for mutating requests
    const mutatingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
    if (mutatingMethods.includes(req.method)) {
        const xRequestedWith = req.headers['x-requested-with'];
        const contentType = req.headers['content-type'] || '';
        
        // Ensure request comes from an asynchronous client (SPA / Fetch) using custom header or JSON
        const isSafeAsyncRequest = (xRequestedWith === 'XMLHttpRequest') || contentType.includes('application/json');
        
        if (!isSafeAsyncRequest) {
            return res.status(403).json({
                success: false,
                error: 'CSRF validation failed: Missing required application headers.'
            });
        }
    }

    next();
}

module.exports = securityHeaders;
