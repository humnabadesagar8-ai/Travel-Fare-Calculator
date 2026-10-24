import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import resumeRouter from './routes/resume.js';
import questionsRouter from './routes/questions.js';
import interviewRouter from './routes/interview.js';
import speechRouter from './routes/speech.js';
import healthRouter from './routes/health.js';

const app = express();

// Configure CORS
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'apikey', 'x-client-info'],
  })
);

// Body parsing with generous payload limits
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Request logging in development
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Mount Routes
app.use(healthRouter);
app.use(resumeRouter);
app.use(questionsRouter);
app.use(interviewRouter);
app.use(speechRouter);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'AI Interview Preparation Backend API',
    status: 'online',
    version: '1.0.0',
    endpoints: [
      'POST /api/analyze-resume',
      'POST /functions/v1/analyze-resume',
      'POST /api/generate-questions',
      'POST /api/analyze-answer',
      'POST /api/interview-feedback',
      'POST /api/speech-to-text',
      'GET  /api/health',
    ],
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error occurred.',
  });
});

// Start Server
const server = app.listen(config.port, () => {
  console.log(`=======================================================`);
  console.log(`🚀 AI Interview Prep Backend running on http://localhost:${config.port}`);
  console.log(`📡 AI Provider: ${config.aiProvider}`);
  console.log(`🦙 Ollama Endpoint: ${config.ollama.baseUrl} (model: ${config.ollama.model})`);
  console.log(`=======================================================`);
});

// Graceful shutdown
const shutdown = () => {
  console.log('\nShutting down server gracefully...');
  server.close(() => {
    console.log('Server terminated.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default app;
