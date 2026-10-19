/**
 * Splunk Authentication Service (Deprecated)
 * 
 * Per security architecture requirements, authentication is handled ENTIRELY
 * by Splunk Enterprise's official login page on http://localhost:8000.
 * The portfolio website and Node.js backend do not collect, intercept, store,
 * or forward user credentials.
 */

module.exports = {
    info: 'Authentication is delegated natively to Splunk Enterprise Web at http://localhost:8000.'
};
