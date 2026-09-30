import type { RequestHandler } from 'express';

export function botProtection({ secret, required, hostnames, action, verify = fetch }: {
  secret: string; required: boolean; hostnames: string[]; action: string; verify?: typeof fetch;
}): RequestHandler {
  return async (req, res, next) => {
    if (req.body?.website) { res.status(400).json({ error: 'Unable to submit this form.' }); return; }
    if (!secret) {
      if (required) { res.status(503).json({ error: 'Account security is temporarily unavailable. Please contact support.' }); return; }
      next(); return;
    }
    const token = req.body?.turnstileToken;
    if (typeof token !== 'string' || !token || token.length > 2048) {
      res.status(400).json({ error: 'Complete the security check and try again.' }); return;
    }
    try {
      const response = await verify('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: new URLSearchParams({ secret, response: token }),
        signal: AbortSignal.timeout(8000),
      });
      const result = await response.json() as { success?: boolean; hostname?: string; action?: string };
      if (!response.ok || !result.success || result.action !== action || !hostnames.includes(result.hostname ?? '')) {
        res.status(400).json({ error: 'Security check failed or expired. Please try again.' }); return;
      }
      next();
    } catch {
      res.status(503).json({ error: 'Security check unavailable. Please try again shortly.' });
    }
  };
}
