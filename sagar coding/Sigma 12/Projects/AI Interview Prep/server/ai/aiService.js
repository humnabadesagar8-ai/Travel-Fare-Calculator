import { config } from '../config.js';
import { PROMPTS } from './prompts.js';
import {
  getFallbackResumeAnalysis,
  getFallbackQuestions,
  getFallbackAnswerAnalysis,
  getFallbackInterviewFeedback,
  getFallbackSpeechAnalysis,
} from './fallbacks.js';

/**
 * Robust JSON Extractor.
 * Parses JSON safely even if the LLM adds markdown fences or extraneous text.
 */
function extractJSON(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Empty response from AI model');
  }

  const trimmed = rawText.trim();

  // Try direct parse
  try {
    return JSON.parse(trimmed);
  } catch (_) {
    // Continue to regex extraction
  }

  // Check for ```json ... ``` code fence
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch (_) {
      // Continue
    }
  }

  // Find outermost curly or square braces
  const braceMatch = trimmed.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (braceMatch && braceMatch[0]) {
    try {
      return JSON.parse(braceMatch[0]);
    } catch (_) {
      // Continue
    }
  }

  throw new Error(`Failed to parse valid JSON from AI output: ${trimmed.slice(0, 150)}...`);
}

/**
 * Check if local Ollama server is alive.
 */
export async function isOllamaAvailable() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${config.ollama.baseUrl}/api/tags`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Call Local Ollama with JSON output.
 */
async function callOllama({ systemPrompt, userPrompt, model, timeoutMs = 30000 }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${config.ollama.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || config.ollama.model,
        system: systemPrompt,
        prompt: userPrompt,
        format: 'json',
        stream: false,
        options: {
          temperature: 0.3,
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Ollama request failed (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return extractJSON(data.response);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Call Groq Cloud API (free tier fallback).
 */
async function callGroq({ systemPrompt, userPrompt }) {
  if (!config.groq.apiKey) throw new Error('No Groq API key configured');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.groq.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.groq.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq request failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  return extractJSON(content);
}

/**
 * Unified AI execution pipeline with automatic provider fallback.
 */
export async function executeAI({ systemPrompt, userPrompt, fallbackFn }) {
  const provider = config.aiProvider;

  // 1. If explicitly set to 'mock', run fallback directly
  if (provider === 'mock') {
    return { data: fallbackFn(), provider: 'fallback-mock' };
  }

  // 2. Try Ollama (Primary local zero-token model)
  if (provider === 'auto' || provider === 'ollama') {
    try {
      const isUp = await isOllamaAvailable();
      if (isUp) {
        const result = await callOllama({
          systemPrompt,
          userPrompt,
          model: config.ollama.model,
          timeoutMs: config.ollama.timeoutMs,
        });
        return { data: result, provider: `ollama:${config.ollama.model}` };
      }
    } catch (ollamaErr) {
      console.warn(`[AI Service] Ollama execution failed: ${ollamaErr.message}. Falling back.`);
    }
  }

  // 3. Try Groq Free Tier (if configured)
  if ((provider === 'auto' || provider === 'groq') && config.groq.apiKey) {
    try {
      const result = await callGroq({ systemPrompt, userPrompt });
      return { data: result, provider: `groq:${config.groq.model}` };
    } catch (groqErr) {
      console.warn(`[AI Service] Groq execution failed: ${groqErr.message}. Falling back.`);
    }
  }

  // 4. Safe Heuristic Fallback (Guaranteed to succeed and never crash)
  console.log('[AI Service] Utilizing intelligent offline heuristic fallback.');
  return { data: fallbackFn(), provider: 'fallback-heuristic' };
}

/**
 * Application AI Features
 */

export async function analyzeResume(resumeText, targetRole) {
  const { data } = await executeAI({
    systemPrompt: PROMPTS.resumeAnalysis.system,
    userPrompt: PROMPTS.resumeAnalysis.user(resumeText, targetRole),
    fallbackFn: () => getFallbackResumeAnalysis(resumeText, targetRole),
  });

  // Validate ATS Schema Compliance
  return {
    ats_score: typeof data.ats_score === 'number' ? data.ats_score : 75,
    strengths: Array.isArray(data.strengths) ? data.strengths : ['Strong foundational skills'],
    weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses : ['Highlight more quantifiable results'],
    missing_keywords: Array.isArray(data.missing_keywords) ? data.missing_keywords : [],
    recommended_interview_questions: Array.isArray(data.recommended_interview_questions)
      ? data.recommended_interview_questions
      : ['Tell me about a challenging project you built.'],
  };
}

export async function generateQuestions({ role = 'Software Engineer', type = 'behavioral', count = 5, resumeKeywords = [], difficulty = 'Medium' }) {
  const { data } = await executeAI({
    systemPrompt: PROMPTS.generateQuestions.system,
    userPrompt: PROMPTS.generateQuestions.user({ role, type, count, resumeKeywords, difficulty }),
    fallbackFn: () => getFallbackQuestions({ role, type, count }),
  });

  return {
    role: data.role || role,
    type: data.type || type,
    difficulty: data.difficulty || difficulty,
    questions: Array.isArray(data.questions) ? data.questions : getFallbackQuestions({ role, type, count }).questions,
  };
}

export async function analyzeAnswer({ question, answer, role, interviewType }) {
  const { data } = await executeAI({
    systemPrompt: PROMPTS.analyzeAnswer.system,
    userPrompt: PROMPTS.analyzeAnswer.user({ question, answer, role, interviewType }),
    fallbackFn: () => getFallbackAnswerAnalysis({ question, answer, role, interviewType }),
  });

  return {
    score: typeof data.score === 'number' ? data.score : 75,
    feedback: data.feedback || 'Good structured response.',
    strengths: Array.isArray(data.strengths) ? data.strengths : ['Clear communication'],
    improvements: Array.isArray(data.improvements) ? data.improvements : ['Add more concrete metrics'],
    followUpQuestion: data.followUpQuestion || 'Can you elaborate on your specific technical contributions?',
    suggestedBetterAnswer: data.suggestedBetterAnswer || 'Focus on Situation, Task, Action, and Result.',
  };
}

export async function generateInterviewFeedback({ transcript, role, interviewType }) {
  const { data } = await executeAI({
    systemPrompt: PROMPTS.interviewFeedback.system,
    userPrompt: PROMPTS.interviewFeedback.user({ transcript, role, interviewType }),
    fallbackFn: () => getFallbackInterviewFeedback({ transcript, role, interviewType }),
  });

  return {
    score: typeof data.score === 'number' ? data.score : 80,
    summary: data.summary || 'Solid overall performance across interview rounds.',
    strengths: Array.isArray(data.strengths) ? data.strengths : ['Consistent problem-solving capability'],
    improvements: Array.isArray(data.improvements) ? data.improvements : ['Provide deeper architectural context'],
    detailedFeedback: data.detailedFeedback || {
      clarity: 'Good clear articulation.',
      technicalDepth: 'Demonstrated solid fundamentals.',
      structure: 'Organized responses logically.',
    },
  };
}

export async function analyzeSpeech({ audio, text, question }) {
  // Speech analysis using heuristic and text evaluation
  return getFallbackSpeechAnalysis({ audio, text, question });
}
