import 'dotenv/config';          // load .env variables into process.env FIRST
import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoose from 'mongoose';
import authRouter from './routes/auth.js';
import issuesRouter from './routes/issues.js';

const app = express();

// Port falls back to 5000 if not provided in the environment
const port = Number(process.env.PORT) || 5000;

const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);


app.disable('x-powered-by');

app.use(helmet());

app.use(cors({
  credentials: true,
  origin(origin, callback) {
    // Allow server-to-server requests (no Origin header) and listed origins
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Origin is not allowed by CORS.'));
  }
}));


app.use(express.json({ limit: '10kb' }));

app.use(cookieParser());


app.get('/api/health', (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  res.status(databaseConnected ? 200 : 503).json({
    status:   databaseConnected ? 'ok' : 'unavailable',
    database: databaseConnected ? 'connected' : 'disconnected'
  });
});

app.use('/api/auth/login', rateLimit({
  windowMs:        15 * 60 * 1000,   // 15-minute window
  limit:           10,                // max 10 login attempts per window
  standardHeaders: 'draft-7',
  legacyHeaders:   false
}));


app.use('/api/auth', authRouter);

app.use('/api/issues', rateLimit({
  windowMs:        15 * 60 * 1000,   // 15-minute window
  limit:           300,               // generous limit for read-heavy dashboard
  standardHeaders: 'draft-7',
  legacyHeaders:   false
}));
app.use('/api/issues', issuesRouter);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

app.use((error, req, res, next) => {
  // If the response has already started streaming, delegate to Express default
  if (res.headersSent) {
    return next(error);
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Request body must contain valid JSON.' });
  }

  if (error.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body is too large.' });
  }

  if (error.message === 'Origin is not allowed by CORS.') {
    return res.status(403).json({ message: error.message });
  }

  // Log unexpected errors for debugging, but send a generic message to callers
  console.error(error);
  res.status(500).json({ message: 'An unexpected server error occurred.' });
});

async function startServer() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI must be set in the environment.');
  }

  // Connect to MongoDB; Mongoose manages a connection pool internally
  await mongoose.connect(mongoUri);

  const server = app.listen(port, () => {
    console.log(`CivicFix Pro API listening on port ${port}`);
  });

  async function shutdown(signal) {
    console.log(`${signal} received; shutting down.`);
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
  }

  // process.once ensures each signal handler fires at most once
  process.once('SIGINT',  () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

startServer().catch((error) => {
  console.error('Failed to start CivicFix Pro API:', error);
  process.exitCode = 1;
});
