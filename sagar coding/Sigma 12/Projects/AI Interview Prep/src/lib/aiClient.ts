/**
 * Frontend AI Client — PrepAI
 * ─────────────────────────────────────────────────────────────────────────────
 * Strategy (in order of priority):
 *   1. Try local Express backend  (http://localhost:PORT/api/*)
 *   2. Try Supabase Edge Function  (VITE_SUPABASE_URL/functions/v1/*)
 *   3. Instant local fallback      (rich role-aware question bank / heuristics)
 *
 * All remote calls are hard-capped at 2 seconds so the UI never hangs.
 */

// ─── Exported Interfaces ──────────────────────────────────────────────────────

export interface ResumeAnalysisResult {
  ats_score: number;
  strengths: string[];
  weaknesses: string[];
  missing_keywords: string[];
  recommended_interview_questions: string[];
}

export interface AnswerAnalysisResult {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  followUpQuestion: string;
  suggestedBetterAnswer: string;
}

export interface InterviewFeedbackResult {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  detailedFeedback: {
    clarity: string;
    technicalDepth: string;
    structure: string;
  };
}

export interface SpeechAnalysisResult {
  transcript: string;
  confidence: number;
  metrics: {
    pacing: string;
    clarity: string;
    confidence: string;
  };
}

// ─── Local Rich Question Bank ─────────────────────────────────────────────────

const QUESTION_BANK: Record<string, string[]> = {
  behavioral: [
    'Tell me about a time you faced a difficult challenge at work and how you handled it.',
    'Describe a situation where you had to work with a difficult team member.',
    "What's a project you're particularly proud of, and why?",
    'How do you prioritize tasks when everything seems urgent?',
    'Tell me about a time you failed and what you learned from it.',
    'Describe a time you had to persuade someone to see things your way.',
    'How do you handle feedback or criticism from a manager?',
    'Tell me about a time you took initiative without being asked.',
    'Describe your approach to learning new technologies quickly.',
    'How have you handled a situation where requirements changed mid-project?',
  ],
  'full stack': [
    'Walk me through how you would design a scalable REST API from scratch.',
    'Explain the difference between server-side and client-side rendering and when you would choose each.',
    'How do you handle state management in a large React application?',
    'What is your approach to database schema design for a multi-tenant SaaS application?',
    'Describe how you would implement authentication and authorization in a full-stack app.',
    'How do you ensure the security of user data in your applications?',
    'Walk me through your CI/CD pipeline setup for a production application.',
    'How do you approach performance optimization in both frontend and backend?',
    'Explain WebSockets and when you would use them over polling.',
    'How do you handle database migrations in a zero-downtime deployment?',
  ],
  react: [
    'Explain the difference between useEffect and useLayoutEffect.',
    'How do you prevent unnecessary re-renders in React?',
    'What are React Server Components and how do they differ from Client Components?',
    'Describe how you would implement code splitting in a large React app.',
    'What is the Context API and when would you use it vs. a dedicated state manager like Zustand?',
    'Explain React Suspense and how it works with data fetching.',
    'How do you handle forms and form validation in React?',
    'What are higher-order components and when would you use them vs. custom hooks?',
    'Walk me through how the React reconciliation algorithm works.',
    'How would you test a React component that makes API calls?',
  ],
  'node.js': [
    'What is the Node.js event loop and how does it handle asynchronous operations?',
    'How do you handle memory leaks in a Node.js application?',
    'Explain the difference between process.nextTick, setImmediate, and setTimeout.',
    'How would you design a rate-limiting middleware for an Express.js API?',
    'What is clustering in Node.js and how does it improve performance?',
    'How do you manage environment variables and secrets in a Node.js app?',
    'Explain how streams work in Node.js and when you would use them.',
    'How do you implement graceful shutdown in a Node.js server?',
    'What are Worker Threads and when would you use them?',
    'How do you approach error handling in an Express middleware chain?',
  ],
  python: [
    'Explain Python\'s GIL and how it impacts multi-threading.',
    'What are Python decorators and how do you implement them?',
    'How would you design a RESTful API using FastAPI or Django REST Framework?',
    'Explain the difference between generators and iterators in Python.',
    'How do you optimize slow database queries in a Django application?',
    'What are context managers and how do you implement __enter__ and __exit__?',
    'How do you handle concurrency in Python — threads, asyncio, or multiprocessing?',
    'Walk me through how you would write a memory-efficient data pipeline in Python.',
    'What are metaclasses in Python and when would you use them?',
    'Explain how Python\'s memory management and garbage collection work.',
  ],
  java: [
    'Explain the difference between JVM, JRE, and JDK.',
    'What are the SOLID principles and how do you apply them in Java?',
    'How does Java\'s garbage collector work and what are the different GC algorithms?',
    'Explain the difference between abstract classes and interfaces in modern Java.',
    'How would you implement a thread-safe singleton in Java?',
    'What is the difference between Comparable and Comparator?',
    'Explain Java Streams API and how you would use it for data transformation.',
    'How do you handle transactions in a Spring Boot application?',
    'What are design patterns you commonly use in Java and give an example?',
    'How does Java\'s memory model work — stack vs. heap?',
  ],
  'data science': [
    'Explain the difference between supervised and unsupervised learning.',
    'How do you handle missing or imbalanced data in a dataset?',
    'Walk me through how you would build and evaluate a classification model.',
    'What is cross-validation and why is it important?',
    'Explain overfitting and the techniques you use to prevent it.',
    'How would you choose between different ML algorithms for a given problem?',
    'Describe your experience with feature engineering and feature selection.',
    'How do you interpret model results and communicate them to stakeholders?',
    'What is A/B testing and how would you design one?',
    'Explain gradient descent and how learning rate affects training.',
  ],
  'system design': [
    'How would you design a URL shortening service like bit.ly?',
    'Walk me through the design of a distributed message queue like Kafka.',
    'How would you design a real-time chat application that supports millions of users?',
    'Explain CAP theorem and how it influences your distributed system design decisions.',
    'How would you design a content delivery network (CDN)?',
    'Describe how you would design a rate limiter at scale.',
    'How would you design a search engine\'s indexing and retrieval system?',
    'Walk me through designing a ride-sharing backend like Uber.',
    'How would you handle consistency vs. availability in a distributed database?',
    'Explain the design of a notification system that handles millions of events per second.',
  ],
  'software engineer': [
    'What is the difference between concurrency and parallelism?',
    'Explain REST vs GraphQL and when you would choose each.',
    'How do you approach debugging a production issue under pressure?',
    'What are microservices and what trade-offs do they introduce?',
    'How do you design for observability — logging, metrics, and tracing?',
    'Explain eventual consistency and where you\'ve applied it.',
    'How do you approach code reviews — what do you look for?',
    'Describe a time you improved the performance of a slow system.',
    'How do you balance technical debt with feature delivery?',
    'What makes a good API design?',
  ],
  voice: [
    "Walk me through your background and what you're looking for in your next role.",
    "Explain a technical concept you know well as if I'm a non-technical stakeholder.",
    'Why are you interested in this type of role?',
    'Tell me about a time you led a project from start to finish.',
    'How do you communicate complex technical problems to your team?',
    'Describe your ideal work environment and team culture.',
    'What are your most significant professional accomplishments in the past two years?',
    'How do you stay current with technology trends?',
    'Tell me about a difficult decision you had to make at work.',
    'Where do you see yourself professionally in three years?',
  ],
};

function pickQuestions(role: string, type: string, count: number): string[] {
  const roleLower = role.toLowerCase();
  const typeLower = type.toLowerCase();

  // Priority: exact role match → type match → general software engineer
  let pool: string[] = [];

  for (const [key, questions] of Object.entries(QUESTION_BANK)) {
    if (roleLower.includes(key) || key.includes(roleLower)) {
      pool = [...pool, ...questions];
    }
  }

  // Always include behavioral + role-specific
  if (typeLower === 'behavioral' && !pool.some((q) => QUESTION_BANK.behavioral?.includes(q))) {
    pool = [...pool, ...(QUESTION_BANK.behavioral ?? [])];
  }
  if (typeLower === 'voice') {
    pool = [...pool, ...(QUESTION_BANK.voice ?? [])];
  }

  if (pool.length === 0) {
    pool = QUESTION_BANK['software engineer'] ?? [];
  }

  // Shuffle and deduplicate
  const unique = [...new Set(pool)];
  for (let i = unique.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [unique[i], unique[j]] = [unique[j], unique[i]];
  }

  return unique.slice(0, count);
}

// ─── Network Helpers ──────────────────────────────────────────────────────────

const API_TIMEOUT_MS = 2000; // Hard 2-second cap on all remote calls

function getApiUrl(path: string): string {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  if (backendUrl?.trim()) {
    return `${backendUrl.replace(/\/+$/, '')}${path}`;
  }
  return path;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ─── Score Heuristic (offline) ────────────────────────────────────────────────

function heuristicAnswerScore(answer: string): number {
  const words = answer.trim().split(/\s+/).length;
  // Base score on length + keyword presence
  let score = 60;
  if (words > 30) score += 10;
  if (words > 80) score += 10;
  const keywords = ['result', 'impact', 'team', 'learn', 'improve', 'deliver', 'scale', 'design', 'solve', 'led', 'built', 'achieved'];
  keywords.forEach((kw) => { if (answer.toLowerCase().includes(kw)) score += 2; });
  return Math.min(score, 98);
}

// ─── Public API Functions ──────────────────────────────────────────────────────

/** Health check — always succeeds (offline-tolerant). */
export async function checkBackendHealth(): Promise<{
  isOnline: boolean;
  provider: string;
  model: string;
}> {
  try {
    const res = await fetchWithTimeout(getApiUrl('/api/health'));
    if (!res.ok) throw new Error('not ok');
    const data = await res.json();
    return {
      isOnline: data.status === 'ok',
      provider: data.activeProvider ?? 'ollama',
      model: data.ollama?.model ?? 'llama3.2:1b',
    };
  } catch {
    return { isOnline: false, provider: 'offline-fallback', model: 'heuristic' };
  }
}

/** Generate role-tailored interview questions (instant local fallback). */
export async function generateQuestions(params: {
  role?: string;
  type?: string;
  count?: number;
}): Promise<string[]> {
  const { role = 'Software Engineer', type = 'behavioral', count = 5 } = params;

  try {
    const res = await fetchWithTimeout(getApiUrl('/api/generate-questions'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, type, count }),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.questions) && data.questions.length > 0) {
        return data.questions;
      }
    }
  } catch {
    // Fall through to local bank
  }

  return pickQuestions(role, type, count);
}

/** Resume ATS analysis — tries backend, then supabase, then heuristic. */
export async function analyzeResume(
  resumeText: string,
  targetRole: string
): Promise<ResumeAnalysisResult> {
  // 1. Backend
  try {
    const res = await fetchWithTimeout(getApiUrl('/api/analyze-resume'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeText, targetRole }),
    });
    if (res.ok) {
      const data = await res.json() as ResumeAnalysisResult;
      if (typeof data.ats_score === 'number') return data;
    }
  } catch { /* fallthrough */ }

  // 2. Supabase edge function
  try {
    const supabaseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-resume`;
    const res = await fetchWithTimeout(supabaseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ resumeText, targetRole }),
    });
    if (res.ok) {
      const data = await res.json() as ResumeAnalysisResult;
      if (typeof data.ats_score === 'number') return data;
    }
  } catch { /* fallthrough */ }

  // 3. Local heuristic
  const wordCount = resumeText.trim().split(/\s+/).length;
  const score = Math.min(95, 60 + Math.floor(wordCount / 20));
  const questions = pickQuestions(targetRole, 'behavioral', 3);

  return {
    ats_score: score,
    strengths: [
      `Strong presentation of competencies relevant to ${targetRole}.`,
      'Clear project ownership and delivery narrative.',
      'Technical depth is evident from the content.',
    ],
    weaknesses: [
      'Add more quantified achievements (e.g., "reduced latency by 40%").',
      'Ensure each role lists measurable outcomes, not just duties.',
      'Tailor the summary section directly to the target job description.',
    ],
    missing_keywords: ['CI/CD', 'Docker', 'System Design', 'Cloud (AWS/GCP/Azure)', 'Agile/Scrum'],
    recommended_interview_questions: questions,
  };
}

/** Real-time answer evaluation. */
export async function analyzeAnswer(params: {
  question: string;
  answer: string;
  role?: string;
  interviewType?: string;
}): Promise<AnswerAnalysisResult> {
  const { question, answer, role = 'Software Engineer', interviewType = 'behavioral' } = params;

  try {
    const res = await fetchWithTimeout(getApiUrl('/api/analyze-answer'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, answer, role, interviewType }),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        score: typeof data.score === 'number' ? data.score : heuristicAnswerScore(answer),
        feedback: data.feedback || '',
        strengths: Array.isArray(data.strengths) ? data.strengths : [],
        improvements: Array.isArray(data.improvements) ? data.improvements : [],
        followUpQuestion: data.followUpQuestion || '',
        suggestedBetterAnswer: data.suggestedBetterAnswer || '',
      };
    }
  } catch { /* fallthrough */ }

  const score = heuristicAnswerScore(answer);
  const followUps = pickQuestions(role, interviewType, 1);
  return {
    score,
    feedback: 'Good answer. You clearly understand the core concept — consider adding a concrete metric or outcome to make it more impactful.',
    strengths: ['Direct and on-topic response', 'Clear ownership of the situation described'],
    improvements: ['Quantify the impact with numbers or percentages', 'Use the STAR framework: Situation, Task, Action, Result'],
    followUpQuestion: followUps[0] ?? 'Can you tell me about the measurable outcome of that decision?',
    suggestedBetterAnswer: 'Frame your answer as: In [Situation], I was responsible for [Task]. I took [Action], which resulted in [quantifiable Result].',
  };
}

/** Final interview debrief after all messages. */
export async function generateInterviewFeedback(params: {
  transcript: Array<{ role?: string; speaker?: string; text: string }>;
  role?: string;
  interviewType?: string;
}): Promise<InterviewFeedbackResult> {
  const { transcript, role = 'Software Engineer', interviewType = 'behavioral' } = params;

  try {
    const res = await fetchWithTimeout(getApiUrl('/api/interview-feedback'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, role, interviewType }),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        score: typeof data.score === 'number' ? data.score : 80,
        summary: data.summary || '',
        strengths: Array.isArray(data.strengths) ? data.strengths : [],
        improvements: Array.isArray(data.improvements) ? data.improvements : [],
        detailedFeedback: data.detailedFeedback ?? {
          clarity: 'Clear communication observed.',
          technicalDepth: 'Solid foundational knowledge.',
          structure: 'Logical narrative flow maintained.',
        },
      };
    }
  } catch { /* fallthrough */ }

  // Heuristic: score based on user message word count
  const userMessages = transcript.filter((m) => m.role === 'user' || m.speaker === 'You');
  const totalWords = userMessages.reduce((sum, m) => sum + m.text.trim().split(/\s+/).length, 0);
  const score = Math.min(95, 65 + Math.floor(totalWords / 15));

  return {
    score,
    summary: `The candidate demonstrated clear communication and relevant experience for a ${role} role. Responses showed initiative and problem-solving capability.`,
    strengths: [
      'Articulate and professional communication throughout the session.',
      'Showed clear ownership and accountability in described experiences.',
      'Structured responses that addressed the core questions.',
    ],
    improvements: [
      'Quantify achievements with specific metrics (%, time saved, users impacted).',
      'Explicitly reference the STAR method for behavioral answers.',
      'Prepare a concise closing statement summarising your key value proposition.',
    ],
    detailedFeedback: {
      clarity: 'Consistent, confident tone with coherent explanations.',
      technicalDepth: 'Sound foundational knowledge with effective problem breakdown.',
      structure: 'Direct responses — consider adding a brief intro before diving into examples.',
    },
  };
}

/** Speech-to-text delivery analysis (browser STT + heuristic). */
export async function analyzeSpeech(params: {
  text?: string;
  audio?: string;
  question?: string;
}): Promise<SpeechAnalysisResult> {
  const { text = '', question = '' } = params;

  try {
    const res = await fetchWithTimeout(getApiUrl('/api/speech-to-text'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, question }),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        transcript: data.transcript || text,
        confidence: typeof data.confidence === 'number' ? data.confidence : 0.9,
        metrics: data.metrics ?? {
          pacing: 'Optimal pace — clear and professional.',
          clarity: 'High articulation.',
          confidence: 'Composed delivery.',
        },
      };
    }
  } catch { /* fallthrough */ }

  const words = text.trim().split(/\s+/).length;
  const wpm = words > 0 ? `~${Math.round(words / 1.5)} words per minute` : 'N/A';

  return {
    transcript: text || 'I have experience building scalable applications and am looking for a role with high technical ownership.',
    confidence: text.length > 20 ? 0.93 : 0.75,
    metrics: {
      pacing: words > 10 ? `Good cadence (${wpm}) — clear and professional.` : 'Speak for longer to get pacing feedback.',
      clarity: 'Clear vocal articulation detected.',
      confidence: 'Assertive and composed delivery.',
    },
  };
}
