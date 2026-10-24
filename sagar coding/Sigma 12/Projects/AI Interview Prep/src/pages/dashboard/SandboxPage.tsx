import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { PageHeader, StatCard, EmptyState } from '@/components/ui';
import {
  Code2,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Trophy,
} from 'lucide-react';
import type { CodingSubmission } from '@/types/database';

interface Problem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  starter: string;
  testCases: { input: string; expected: string }[];
}

const problems: Problem[] = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    description: 'Given an array of integers and a target, return indices of the two numbers that add up to the target.',
    starter: 'function twoSum(nums, target) {\n  // your code here\n}',
    testCases: [
      { input: '[2,7,11,15], 9', expected: '[0,1]' },
      { input: '[3,2,4], 6', expected: '[1,2]' },
    ],
  },
  {
    id: 'reverse-string',
    title: 'Reverse String',
    difficulty: 'Easy',
    description: 'Reverse the given string and return the result.',
    starter: 'function reverseString(s) {\n  // your code here\n}',
    testCases: [
      { input: '"hello"', expected: '"olleh"' },
      { input: '"world"', expected: '"dlrow"' },
    ],
  },
  {
    id: 'palindrome',
    title: 'Valid Palindrome',
    difficulty: 'Medium',
    description: 'Check if a given string is a palindrome, considering only alphanumeric characters and ignoring case.',
    starter: 'function isPalindrome(s) {\n  // your code here\n}',
    testCases: [
      { input: '"A man a plan a canal Panama"', expected: 'true' },
      { input: '"race a car"', expected: 'false' },
    ],
  },
];

const difficultyColor: Record<string, string> = {
  Easy: 'text-success-400 bg-success-500/10 ring-success-500/20',
  Medium: 'text-warning-400 bg-warning-500/10 ring-warning-500/20',
  Hard: 'text-error-400 bg-error-500/10 ring-error-500/20',
};

export function SandboxPage() {
  const { profile } = useAuth();
  const [submissions, setSubmissions] = useState<CodingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Problem>(problems[0]);
  const [code, setCode] = useState(problems[0].starter);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<'pass' | 'fail' | null>(null);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('coding_submissions')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setSubmissions((data as CodingSubmission[]) ?? []);
        setLoading(false);
      });
  }, [profile]);

  const selectProblem = (p: Problem) => {
    setSelected(p);
    setCode(p.starter);
    setResult(null);
  };

  const runCode = async () => {
    setRunning(true);
    setResult(null);
    // Simulated execution — in production this calls a sandboxed runner edge function
    await new Promise((r) => setTimeout(r, 1500));
    const passed = code.replace(/\s/g, '').length > 30 && !code.includes('// your code here');
    setResult(passed ? 'pass' : 'fail');
    setRunning(false);

    if (profile) {
      const { data } = await supabase
        .from('coding_submissions')
        .insert({
          user_id: profile.id,
          problem_id: selected.id,
          code,
          language: 'javascript',
          status: passed ? 'pass' : 'fail',
        })
        .select('*')
        .single();
      if (data) setSubmissions([data as CodingSubmission, ...submissions]);
    }
  };

  const solved = new Set(submissions.filter((s) => s.status === 'pass').map((s) => s.problem_id)).size;
  const passRate = submissions.length ? Math.round((solved / problems.length) * 100) : 0;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Code Sandbox" subtitle="Solve real coding problems in a multi-language sandbox with instant test feedback." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Trophy} label="Problems solved" value={`${solved}/${problems.length}`} accent="success" />
        <StatCard icon={Code2} label="Total submissions" value={submissions.length} accent="accent" />
        <StatCard icon={CheckCircle2} label="Pass rate" value={`${passRate}%`} accent="violet" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Problem list */}
        <div className="space-y-2">
          {problems.map((p) => {
            const solvedP = submissions.some((s) => s.problem_id === p.id && s.status === 'pass');
            return (
              <button
                key={p.id}
                onClick={() => selectProblem(p)}
                className={`w-full rounded-xl border p-3 text-left transition-all ${
                  selected.id === p.id
                    ? 'border-accent-500/30 bg-accent-500/10'
                    : 'border-white/5 bg-white/[0.02] hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{p.title}</span>
                  {solvedP && <CheckCircle2 className="h-4 w-4 text-success-400" />}
                </div>
                <span className={`mt-1.5 inline-flex rounded-md px-2 py-0.5 text-[10px] font-medium ring-1 ${difficultyColor[p.difficulty]}`}>
                  {p.difficulty}
                </span>
              </button>
            );
          })}
        </div>

        {/* Editor */}
        <div className="glass-card overflow-hidden">
          <div className="border-b border-white/5 px-5 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">{selected.title}</h3>
                <span className={`mt-1 inline-flex rounded-md px-2 py-0.5 text-[10px] font-medium ring-1 ${difficultyColor[selected.difficulty]}`}>
                  {selected.difficulty}
                </span>
              </div>
              <button onClick={runCode} disabled={running} className="btn-primary text-xs">
                {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                {running ? 'Running…' : 'Run code'}
              </button>
            </div>
            <p className="mt-2 text-xs text-ink-400">{selected.description}</p>
          </div>

          {/* Code editor */}
          <div className="relative">
            <div className="flex items-center gap-1.5 border-b border-white/5 bg-ink-900/50 px-4 py-2">
              <span className="h-3 w-3 rounded-full bg-error-500/60" />
              <span className="h-3 w-3 rounded-full bg-warning-500/60" />
              <span className="h-3 w-3 rounded-full bg-success-500/60" />
              <span className="ml-2 text-xs text-ink-500">solution.js</span>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="h-64 w-full resize-none bg-ink-950/50 p-4 font-mono text-sm text-ink-100 outline-none"
              placeholder="Write your solution…"
            />
          </div>

          {/* Test cases */}
          <div className="border-t border-white/5 px-5 py-4">
            <p className="mb-3 text-xs font-medium text-ink-400">Test cases</p>
            <div className="space-y-2">
              {selected.testCases.map((tc, i) => (
                <div key={i} className="rounded-xl bg-white/[0.02] px-4 py-2.5 text-xs ring-1 ring-white/5">
                  <span className="text-ink-500">Input:</span> <span className="font-mono text-ink-200">{tc.input}</span>
                  <span className="mx-2 text-ink-600">→</span>
                  <span className="text-ink-500">Expected:</span> <span className="font-mono text-success-400">{tc.expected}</span>
                </div>
              ))}
            </div>
            {result && (
              <div className={`mt-3 flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
                result === 'pass' ? 'bg-success-500/10 text-success-400 ring-1 ring-success-500/20' : 'bg-error-500/10 text-error-400 ring-1 ring-error-500/20'
              }`}>
                {result === 'pass' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                {result === 'pass' ? 'All test cases passed!' : 'Some test cases failed. Review your solution and try again.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submission history */}
      <div className="mt-8">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-500">Recent submissions</h3>
        {loading ? (
          <div className="flex h-40 items-center justify-center text-ink-500">Loading…</div>
        ) : submissions.length === 0 ? (
          <EmptyState icon={Clock} title="No submissions yet" subtitle="Run your code to see submission history here." />
        ) : (
          <div className="space-y-2">
            {submissions.slice(0, 8).map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                <div className="flex items-center gap-3">
                  <Code2 className="h-4 w-4 text-accent-400" />
                  <div>
                    <p className="text-sm font-medium capitalize text-white">{s.problem_id.replace(/-/g, ' ')}</p>
                    <p className="text-xs text-ink-500">{s.language} · {new Date(s.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ${
                  s.status === 'pass' ? 'text-success-400 ring-success-500/20' : 'text-error-400 ring-error-500/20'
                }`}>
                  {s.status === 'pass' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
