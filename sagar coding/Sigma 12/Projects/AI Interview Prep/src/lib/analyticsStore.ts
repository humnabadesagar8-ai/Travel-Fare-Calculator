/**
 * analyticsStore.ts
 * Centralized, localStorage-backed analytics engine for PrepAI.
 * Replaces scattered supabase reads with a fast, offline-first store.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ResumeEntry {
  id: string;
  fileName: string;
  targetRole: string;
  score: number;
  date: string;
}

export interface InterviewEntry {
  id: string;
  mode: 'Behavioral' | 'Voice' | 'Coding';
  role: string;
  score: number;
  transcript?: string;
  date: string;
}

export interface CodingEntry {
  id: string;
  problemId: string;
  passed: boolean;
  date: string;
}

export interface AnalyticsSummary {
  resumesAnalyzedCount: number;
  interviewCount: number;
  avgInterviewScore: number;
  bestScore: number;
  codePassRate: number;
  totalCodingSubmissions: number;
  passedCodingSubmissions: number;
  scoreTrend: { score: number; date: string; mode: string }[];
  recentSessions: InterviewEntry[];
  recentResumes: ResumeEntry[];
}

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const KEYS = {
  resumes: 'prepai_analytics_resumes',
  interviews: 'prepai_analytics_interviews',
  coding: 'prepai_analytics_coding',
} as const;

// ─── Internal Helpers ─────────────────────────────────────────────────────────

function readList<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeList<T>(key: string, list: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // Storage quota exceeded – silently skip
  }
}

function uid(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// ─── Public Write APIs ────────────────────────────────────────────────────────

/** Call after a resume PDF is analysed and scored. */
export function saveResumeAnalysis(
  fileName: string,
  targetRole: string,
  score: number
): ResumeEntry {
  const entry: ResumeEntry = {
    id: uid(),
    fileName,
    targetRole,
    score,
    date: new Date().toISOString(),
  };
  const list = readList<ResumeEntry>(KEYS.resumes);
  list.unshift(entry);
  writeList(KEYS.resumes, list.slice(0, 100)); // keep latest 100
  return entry;
}

/** Call after a mock / voice interview session finishes. */
export function saveInterviewSession(
  mode: InterviewEntry['mode'],
  role: string,
  score: number,
  transcript?: string
): InterviewEntry {
  const entry: InterviewEntry = {
    id: uid(),
    mode,
    role,
    score,
    transcript,
    date: new Date().toISOString(),
  };
  const list = readList<InterviewEntry>(KEYS.interviews);
  list.unshift(entry);
  writeList(KEYS.interviews, list.slice(0, 200));
  return entry;
}

/** Call after a code submission is evaluated. */
export function saveCodingSubmission(
  problemId: string,
  passed: boolean
): CodingEntry {
  const entry: CodingEntry = {
    id: uid(),
    problemId,
    passed,
    date: new Date().toISOString(),
  };
  const list = readList<CodingEntry>(KEYS.coding);
  list.unshift(entry);
  writeList(KEYS.coding, list.slice(0, 200));
  return entry;
}

// ─── Public Read APIs ─────────────────────────────────────────────────────────

export function getResumes(): ResumeEntry[] {
  return readList<ResumeEntry>(KEYS.resumes);
}

export function getInterviews(): InterviewEntry[] {
  return readList<InterviewEntry>(KEYS.interviews);
}

export function getCodingSubmissions(): CodingEntry[] {
  return readList<CodingEntry>(KEYS.coding);
}

/** Returns all computed metrics needed by AnalyticsPage and OverviewPage. */
export function getAnalyticsSummary(): AnalyticsSummary {
  const resumes = getResumes();
  const interviews = getInterviews();
  const coding = getCodingSubmissions();

  const scoredInterviews = interviews.filter((i) => typeof i.score === 'number');
  const avgInterviewScore = scoredInterviews.length
    ? Math.round(
        scoredInterviews.reduce((sum, i) => sum + i.score, 0) / scoredInterviews.length
      )
    : 0;
  const bestScore = scoredInterviews.length
    ? Math.max(...scoredInterviews.map((i) => i.score))
    : 0;

  const passed = coding.filter((c) => c.passed).length;
  const codePassRate = coding.length
    ? Math.round((passed / coding.length) * 100)
    : 0;

  // Last 10 scored interviews for trend chart
  const scoreTrend = [...scoredInterviews]
    .slice(0, 10)
    .reverse()
    .map((i) => ({
      score: i.score,
      date: new Date(i.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      mode: i.mode,
    }));

  return {
    resumesAnalyzedCount: resumes.length,
    interviewCount: interviews.length,
    avgInterviewScore,
    bestScore,
    codePassRate,
    totalCodingSubmissions: coding.length,
    passedCodingSubmissions: passed,
    scoreTrend,
    recentSessions: interviews.slice(0, 5),
    recentResumes: resumes.slice(0, 5),
  };
}
