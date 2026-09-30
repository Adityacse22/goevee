import cors from 'cors';
import express from 'express';
import { CORS_ORIGINS, NODE_ENV, PUBLIC_ORIGIN, TRUST_PROXY_HOPS } from './config/index.js';
import { errorHandler, notFound } from './middlewares/error.js';
import v1Routes from './routes/v1.js';

import { securityHeaders, rateLimit } from './middlewares/security.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', TRUST_PROXY_HOPS);
app.use(securityHeaders(NODE_ENV === 'production', PUBLIC_ORIGIN));
app.use('/api', rateLimit({ limit: 120, windowMs: 60000 }));

app.use(cors({
  origin: CORS_ORIGINS,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '16kb' }));

app.get(['/health', '/api/health'], (_req, res) => {
  res.json({
    status: 'ok',
    api: 'serverless-ready',
  });
});

app.use('/api/v1', v1Routes);

app.use(notFound);
app.use(errorHandler);

export default app;
