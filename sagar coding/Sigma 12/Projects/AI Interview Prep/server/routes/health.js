import express from 'express';
import { config } from '../config.js';
import { isOllamaAvailable } from '../ai/aiService.js';

const router = express.Router();

router.get('/api/health', async (req, res) => {
  const ollamaOnline = await isOllamaAvailable();

  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiProviderConfigured: config.aiProvider,
    activeProvider: ollamaOnline ? `ollama (${config.ollama.model})` : 'offline-heuristic-fallback',
    ollama: {
      baseUrl: config.ollama.baseUrl,
      model: config.ollama.model,
      isOnline: ollamaOnline,
    },
    cloudFallbacks: {
      hasGroqKey: Boolean(config.groq.apiKey),
      hasHuggingFaceKey: Boolean(config.huggingface.apiKey),
    },
  });
});

export default router;
