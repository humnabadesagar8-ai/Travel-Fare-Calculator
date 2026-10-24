# AI Interview Preparation Platform - Full-Stack Application

A comprehensive, zero-token, production-grade AI Interview Preparation platform built with React, TypeScript, Tailwind CSS, and a Node.js/Express backend powered by local Ollama models and offline fallback engines.

---

## 🚀 Key Highlights & Zero-Token Solution

- **100% Free & Unlimited**: Runs locally with [Ollama](https://ollama.com) (`llama3.2:1b`, `llama3.2`, `mistral`, `phi-3`) via standard REST endpoints (`http://127.0.0.1:11434`).
- **Zero API Quota Expiration**: Does not rely on paid API credits, expiring trial keys, or expensive cloud LLM tokens.
- **Fail-Safe Heuristic Engine**: Guarantees zero downtime. Even if the AI backend service or Ollama is offline, the application seamlessly returns realistic, schema-compliant questions, ATS resume feedback, and scoring summaries.
- **Unified Provider Interface**: Easily swap between Local Ollama, Groq (free cloud tier), HuggingFace, or pure offline mode via `.env`.

---

## 📁 Architecture Overview

```text
├── server/                          # Backend API Server (Node / Express)
│   ├── config.js                    # Environment & AI provider configurations
│   ├── server.js                    # Express app with CORS & error handling
│   ├── ai/
│   │   ├── aiService.js             # Unified AI pipeline (Ollama / Cloud / Fallback)
│   │   ├── prompts.js               # Structured JSON system & user prompts
│   │   └── fallbacks.js             # Role-aware ATS, question, and interview heuristics
│   ├── routes/
│   │   ├── resume.js                # POST /api/analyze-resume & /functions/v1/analyze-resume
│   │   ├── questions.js             # POST /api/generate-questions
│   │   ├── interview.js             # POST /api/analyze-answer & /api/interview-feedback
│   │   ├── speech.js                # POST /api/speech-to-text
│   │   └── health.js                # GET /api/health
│   └── test-endpoints.js            # Automated verification test suite
├── src/                             # Frontend Application (React, Vite, TypeScript)
│   ├── components/                  # UI components, layout, and resume analysis
│   ├── pages/dashboard/             # Mock Interview, Voice Round, Code Sandbox, Resume
│   ├── context/                     # Auth, Theme, and Interview prefill state
│   └── lib/                         # Supabase client and navigation definitions
├── supabase/
│   └── functions/analyze-resume/    # Resilient Edge Function with Ollama/Fallback support
├── .env.example                     # Environment configuration reference
└── package.json                     # Scripts & project dependencies
```

---

## 📡 API Endpoints & Data Contract

| Method | Endpoint | Description | Sample Request Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Health status & active AI provider | *None* |
| `POST` | `/api/generate-questions` | Generates tailored questions | `{"role": "Frontend", "type": "behavioral", "count": 3}` |
| `POST` | `/api/analyze-answer` | Real-time answer evaluation & follow-up | `{"question": "...", "answer": "...", "role": "..."}` |
| `POST` | `/api/interview-feedback` | Complete interview debrief & score | `{"transcript": [...], "role": "..."}` |
| `POST` | `/api/analyze-resume` | ATS scoring, skill matching & questions | `{"resumeText": "...", "targetRole": "..."}` |
| `POST` | `/functions/v1/analyze-resume`| Supabase-compatible ATS endpoint | `{"resumeText": "...", "targetRole": "..."}` |
| `POST` | `/api/speech-to-text` | Verbal delivery & pacing analysis | `{"text": "...", "question": "..."}` |

---

## 🛠️ Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ (tested on v24.13)
- **Ollama**: (Optional for local AI) Download from [ollama.com](https://ollama.com).
  Pull the lightweight model:
  ```bash
  ollama run llama3.2:1b
  ```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `.env` contains:
```env
PORT=5000
AI_PROVIDER=auto
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2:1b
VITE_BACKEND_URL=http://localhost:5000
```

### 3. Start Backend Server
In your terminal, run:
```bash
npm run server
```
The server will start on `http://localhost:5000`.

### 4. Start Frontend
In a separate terminal tab, run:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Testing the Backend Endpoints

An automated endpoint verification suite is included:
```bash
node server/test-endpoints.js
```
This tests `/api/health`, `/api/speech-to-text`, `/api/analyze-answer`, `/api/interview-feedback`, and `/api/analyze-resume` against both the live local model and the fallback engine.

---

## 🔒 Security & Resilience
- **CORS Configured**: Allows cross-origin requests from the frontend client.
- **JSON Input Validation**: Rejects malformed requests with clean HTTP 400 responses.
- **Fail-Safe Fallbacks**: Guaranteed to return 200 with complete JSON data even if the LLM process crashes or runs out of memory.
