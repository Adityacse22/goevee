import type { RequestHandler } from 'express';

export function securityHeaders(production: boolean, canonicalOrigin: string): RequestHandler {
  return (req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
      'Cache-Control': 'no-store',
    });
    if (production && !req.secure) {
      if (req.method === 'GET' || req.method === 'HEAD') {
        res.redirect(308, canonicalOrigin + req.originalUrl);
      } else {
        res.status(426).json({ error: 'HTTPS is required.' });
      }
      return;
    }
    if (production) res.setHeader('Strict-Transport-Security', 'max-age=31536000');
    next();
  };
}

// Per-instance backstop. Turnstile handles cross-instance bot checks; use the
// hosting firewall for distributed request limits before scaling serverless.
export function rateLimit({ limit, windowMs, maxEntries = 10000 }: { limit: number; windowMs: number; maxEntries?: number }): RequestHandler {
  const entries = new Map<string, { count: number; reset: number }>();
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    let entry = entries.get(key);
    if (!entry || entry.reset <= now) {
      if (entries.size >= maxEntries) {
        for (const [address, bucket] of entries) if (bucket.reset <= now) entries.delete(address);
        if (entries.size >= maxEntries) {
          res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
          res.status(429).json({ error: 'Too many requests. Please try again later.' });
          return;
        }
      }
      entry = { count: 0, reset: now + windowMs };
      entries.set(key, entry);
    }
    entry.count++;
    res.setHeader('RateLimit-Limit', limit);
    res.setHeader('RateLimit-Remaining', Math.max(0, limit - entry.count));
    if (entry.count > limit) {
      res.setHeader('Retry-After', Math.ceil((entry.reset - now) / 1000));
      res.status(429).json({ error: 'Too many requests. Please try again later.' });
      return;
    }
    next();
  };
}
