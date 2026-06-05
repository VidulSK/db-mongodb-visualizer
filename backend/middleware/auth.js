// backend/middleware/auth.js

/**
 * Simple authentication middleware for Express routes.
 * Expects a header "x-session-token" containing a UUID token.
 * Checks the token against the in‑memory map of active tokens.
 */
export default function auth(req, res, next) {
  const token = req.headers['x-session-token'];
  if (!token) {
    return res.status(401).json({ error: 'Missing session token.' });
  }
  // activeTokens map is attached to the server instance via global variable.
  if (!global.activeTokens || !global.activeTokens.has(token)) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
  // Attach adminId to request for downstream handlers if needed.
  req.adminId = global.activeTokens.get(token);
  next();
}
