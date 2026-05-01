import cors from 'cors';
import express from 'express';
import { BOOKING_BUFFER_MINUTES, CORS_ORIGINS, GOOGLE_MAPS_API_KEY } from './config/index.js';
import { errorHandler, notFound } from './middlewares/error.js';
import v1Routes from './routes/v1.js';

const app = express();

app.use(cors({
  origin: CORS_ORIGINS,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

app.get(['/health', '/api/health'], (_req, res) => {
  res.json({
    status: 'ok',
    api: 'serverless-ready',
    google_maps_key_set: Boolean(GOOGLE_MAPS_API_KEY?.trim()),
    booking_buffer_minutes: BOOKING_BUFFER_MINUTES,
  });
});

app.use('/api/v1', v1Routes);

app.use(notFound);
app.use(errorHandler);

export default app;
