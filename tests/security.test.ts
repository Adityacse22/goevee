import { bookingWindow } from '../shared/booking';
import test from 'node:test';
import assert from 'node:assert/strict';
import express, { type RequestHandler } from 'express';
import type { Server } from 'node:http';
import { securityHeaders, rateLimit } from '../server/middlewares/security';
import { botProtection } from '../server/middlewares/botProtection';
import { registerSchema, loginSchema } from '../server/validators/auth.validator';
import { createBookingSchema } from '../server/validators/booking.validator';
import { parseConsent, CONSENT_MAX_AGE } from '../src/services/consent';

async function withServer(middleware: RequestHandler[], run: (url: string) => Promise<void>, trustProxy = false) {
  const app = express();
  if (trustProxy) app.set('trust proxy', 1);
  app.use(express.json({ limit: '16kb' }));
  middleware.forEach(handler => app.use(handler));
  app.use((_req, res) => res.json({ ok: true }));
  let server: Server;
  await new Promise<void>(resolve => { server = app.listen(0, '127.0.0.1', resolve); });
  const address = server!.address();
  assert.ok(address && typeof address !== 'string');
  try { await run(`http://127.0.0.1:${address.port}`); }
  finally { await new Promise<void>((resolve, reject) => server!.close(error => error ? reject(error) : resolve())); }
}
const body = { fullName: 'Test Driver', email: 'test@example.com', password: 'a long unique passphrase', acceptedTerms: true };
const post = (url: string, data: unknown) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });

test('registration validates names, email, UTF-8 password length, age/terms and privilege escalation', () => {
  assert.equal(registerSchema.parse({ body: { ...body, email: ' TEST@example.com ' } }).body.email, 'test@example.com');
  for (const override of [{ fullName: ' ' }, { email: 'invalid' }, { password: 'short' }, { password: '🔒'.repeat(19) }, { acceptedTerms: false }, { acceptedTerms: undefined }, { role: 'ADMIN' }, { role: 'OPERATOR' }, { website: 'spam.example' }]) {
    assert.equal(registerSchema.safeParse({ body: { ...body, ...override } }).success, false);
  }
  assert.equal(loginSchema.safeParse({ body: { email: body.email, password: 'legacy' } }).success, true);
});

test('booking validation rejects past, reversed, excessively long and malformed sessions', () => {
  const start = Date.now() + 3600000;
  const valid = { chargerId: 'charger-id', startTime: new Date(start).toISOString(), endTime: new Date(start + 3600000).toISOString() };
  assert.equal(createBookingSchema.safeParse({ body: valid }).success, true);
  for (const override of [{ chargerId: '' }, { startTime: new Date(0).toISOString() }, { endTime: valid.startTime }, { endTime: new Date(start + 90000000).toISOString() }, { totalPrice: -1 }]) {
    assert.equal(createBookingSchema.safeParse({ body: { ...valid, ...override } }).success, false);
  }
});

test('consent rejects malformed, expired and future-dated choices', () => {
  for (const value of [null, '{', '{}', JSON.stringify({ version: 1, analytics: 'yes', updatedAt: Date.now() }), JSON.stringify({ version: 1, analytics: true, updatedAt: Date.now() - CONSENT_MAX_AGE }), JSON.stringify({ version: 1, analytics: true, updatedAt: Date.now() + 60000 })]) assert.equal(parseConsent(value), null);
  assert.equal(parseConsent(JSON.stringify({ version: 1, analytics: false, updatedAt: Date.now() }))?.analytics, false);
});

test('production HTTPS uses a fixed origin and refuses insecure writes', async () => {
  await withServer([securityHeaders(true, 'https://www.goevee.in')], async url => {
    const get = await fetch(url + '/privacy?x=1', { redirect: 'manual', headers: { Host: 'attacker.example' } });
    assert.equal(get.status, 308);
    assert.equal(get.headers.get('location'), 'https://www.goevee.in/privacy?x=1');
    assert.equal((await post(url, {})).status, 426);
    assert.equal(get.headers.get('x-content-type-options'), 'nosniff');
  });
  await withServer([securityHeaders(true, 'https://www.goevee.in')], async url => {
    const response = await fetch(url, { headers: { 'X-Forwarded-Proto': 'https' } });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('strict-transport-security'), 'max-age=31536000');
  }, true);
});

test('request limits cannot be bypassed with an untrusted forwarded IP', async () => {
  await withServer([rateLimit({ limit: 2, windowMs: 60000 })], async url => {
    assert.equal((await fetch(url)).status, 200);
    assert.equal((await fetch(url, { headers: { 'X-Forwarded-For': '1.2.3.4' } })).status, 200);
    const blocked = await fetch(url, { headers: { 'X-Forwarded-For': '4.3.2.1' } });
    assert.equal(blocked.status, 429);
    assert.ok(Number(blocked.headers.get('retry-after')) > 0);
  });
});

const options = { secret: 'test-server-secret', required: true, hostnames: ['www.goevee.in'], action: 'register' };
const verifier = (result: object): typeof fetch => async () => new Response(JSON.stringify(result), { status: 200 });

test('bot checks fail closed without configuration or a token and reject the honeypot', async () => {
  await withServer([botProtection({ ...options, secret: '' })], async url => assert.equal((await post(url, {})).status, 503));
  await withServer([botProtection(options)], async url => {
    assert.equal((await post(url, {})).status, 400);
    assert.equal((await post(url, { website: 'bot' })).status, 400);
    assert.equal((await post(url, { turnstileToken: 'x'.repeat(2049) })).status, 400);
  });
});

test('bot checks enforce success, hostname and action, and handle provider outages', async () => {
  for (const result of [{ success: false }, { success: true, hostname: 'attacker.example', action: 'register' }, { success: true, hostname: 'www.goevee.in', action: 'login' }]) {
    await withServer([botProtection({ ...options, verify: verifier(result) })], async url => assert.equal((await post(url, { turnstileToken: 'token' })).status, 400));
  }
  await withServer([botProtection({ ...options, verify: verifier({ success: true, hostname: 'www.goevee.in', action: 'register' }) })], async url => assert.equal((await post(url, { turnstileToken: 'token' })).status, 200));
  await withServer([botProtection({ ...options, verify: async () => { throw new Error('offline'); } })], async url => assert.equal((await post(url, { turnstileToken: 'token' })).status, 503));
});


test('local booking windows carry durations across midnight and reject invalid dates', () => {
  const result = bookingWindow('2099-10-01', '23:30', 2);
  assert.equal(Date.parse(result.endTime) - Date.parse(result.startTime), 7200000);
  assert.equal(new Date(result.endTime).getDate(), 2);
  assert.throws(() => bookingWindow('2099-02-31', '12:00', 1));
  assert.throws(() => bookingWindow('2000-01-01', '12:00', 1));
  assert.throws(() => bookingWindow('2099-10-01', '12:00', 0));
});
