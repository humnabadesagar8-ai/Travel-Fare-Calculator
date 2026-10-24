import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  aiProvider: (process.env.AI_PROVIDER || 'auto').toLowerCase(), // 'auto' | 'ollama' | 'groq' | 'huggingface' | 'mock'
  
  // Local Ollama Settings (Zero-token, unlimited, 100% free)
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
    model: process.env.OLLAMA_MODEL || 'llama3.2:1b',
    timeoutMs: parseInt(process.env.OLLAMA_TIMEOUT_MS || '30000', 10),
  },

  // Free Tier Cloud AI Keys (Optional fallbacks)
  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
  },
  huggingface: {
    apiKey: process.env.HUGGINGFACE_API_KEY || '',
    model: process.env.HUGGINGFACE_MODEL || 'meta-llama/Llama-3.2-3B-Instruct',
  },

  // Fallback defaults
  enableMockFallback: process.env.ENABLE_MOCK_FALLBACK !== 'false',
};
