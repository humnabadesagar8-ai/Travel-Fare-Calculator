import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { PageHeader, StatCard, EmptyState } from '@/components/ui';
import {
  BarChart3,
  TrendingUp,
  Award,
  Target,
  MessageSquare,
  Mic,
  Code2,
  FileText,
  Activity,
} from 'lucide-react';
import type { Interview, CodingSubmission, Resume } from '@/types/database';

export function AnalyticsPage() {
  const { profile } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [submissions, setSubmissions] = useState<CodingSubmission[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const uid = profile.id;
      const [iv, cs, rs] = await Promise.all([
        supabase.from('interviews').select('*').eq('user_id', uid).order('created_at', { ascending: true }),
        supabase.from('coding_submissions').select('*').eq('user_id', uid).order('created_at', { ascending: true }),
        supabase.from('resumes').select('*').eq('user_id', uid).order('created_at', { ascending: true }),
      ]);
      setInterviews((iv.data as Interview[]) ?? []);
      setSubmissions((cs.data as CodingSubmission[]) ?? []);
      setResumes((rs.data as Resume[]) ?? []);
      setLoading(false);
    })();
  }, [profile]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-ink-500">Loading analytics…</div>;
  }

  const scoredInterviews = interviews.filter((i) => i.score != null);
  const avgScore = scoredInterviews.length
    ? Math.round(scoredInterviews.reduce((s, i) => s + (i.score ?? 0), 0) / scoredInterviews.length)
    : 0;
  const bestScore = scoredInterviews.length ? Math.max(...scoredInterviews.map((i) => i.score ?? 0)) : 0;
  const passCount = submissions.filter((s) => s.status === 'pass').length;
  const totalSubs = submissions.length;
  const passRate = totalSubs ? Math.round((passCount / totalSubs) * 100) : 0;

  // Score over time (last 10 scored interviews)
  const scoreTrend = scoredInterviews.slice(-10).map((i) => ({
    score: i.score ?? 0,
    date: new Date(i.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
  }));

  // Breakdown by type
  const typeBreakdown = (['behavioral', 'voice', 'coding'] as const).map((type) => ({
    type,
    count: interviews.filter((i) => i.type === type).length,
    icon: type === 'voice' ? Mic : type === 'coding' ? Code2 : MessageSquare,
  }));

  const maxTrend = Math.max(100, ...scoreTrend.map((s) => s.score));

  return (
    <div className="animate-fade-in">
      <PageHeader title="Analytics" subtitle="Track your progress across every session with detailed insights." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Award} label="Avg. interview score" value={`${avgScore}%`} accent="success" trend={`${scoredInterviews.length} scored sessions`} />
        <StatCard icon={TrendingUp} label="Best score" value={`${bestScore}%`} accent="violet" trend="Across all interviews" />
        <StatCard icon={Target} label="Code pass rate" value={`${passRate}%`} accent="warning" trend={`${passCount}/${totalSubs} passed`} />
        <StatCard icon={FileText} label="Resumes analyzed" value={resumes.length} accent="accent" trend="All-time" />
      </div>

      {/* Score trend chart */}
      <div className="mt-6 glass-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-accent-400" />
          <h3 className="text-sm font-semibold text-white">Interview score trend</h3>
        </div>
        {scoreTrend.length > 0 ? (
          <div className="flex h-48 items-end gap-2 overflow-x-auto">
            {scoreTrend.map((s, i) => (
              <div key={i} className="flex min-w-[40px] flex-1 flex-col items-center gap-2">
                <span className="text-[10px] font-medium text-ink-400">{s.score}%</span>
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-accent-600 to-violet-500 transition-all"
                    style={{ height: `${(s.score / maxTrend) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-ink-500">{s.date}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={BarChart3} title="No scored interviews yet" subtitle="Complete a mock interview or voice round to see your trend." />
        )}
      </div>

      {/* Breakdown */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* By type */}
        <div className="glass-card p-6">
          <h3 className="mb-4 text-sm font-semibold text-white">Sessions by type</h3>
          <div className="space-y-3">
            {typeBreakdown.map((t) => {
              const max = Math.max(1, ...typeBreakdown.map((x) => x.count));
              return (
                <div key={t.type}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 capitalize text-ink-300">
                      <t.icon className="h-4 w-4 text-accent-400" /> {t.type}
                    </span>
                    <span className="font-semibold text-white">{t.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-ink-800">
                    <div className="h-full rounded-full bg-gradient-to-r from-accent-500 to-violet-500" style={{ width: `${(t.count / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submission status */}
        <div className="glass-card p-6">
          <h3 className="mb-4 text-sm font-semibold text-white">Coding submission status</h3>
          {totalSubs > 0 ? (
            <div className="flex flex-col items-center justify-center py-4">
              {/* Donut */}
              <div className="relative h-32 w-32">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgb(30,41,59)" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.915" fill="none" stroke="rgb(34,197,94)" strokeWidth="3"
                    strokeDasharray={`${passRate}, 100`} strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-white">{passRate}%</span>
                  <span className="text-[10px] text-ink-500">pass rate</span>
                </div>
              </div>
              <div className="mt-4 flex gap-6 text-sm">
                <span className="flex items-center gap-1.5 text-success-400"><span className="h-2.5 w-2.5 rounded-full bg-success-500" /> Passed: {passCount}</span>
                <span className="flex items-center gap-1.5 text-error-400"><span className="h-2.5 w-2.5 rounded-full bg-error-500" /> Failed: {totalSubs - passCount}</span>
              </div>
            </div>
          ) : (
            <EmptyState icon={Code2} title="No submissions yet" subtitle="Solve problems in the Code Sandbox to see analytics." />
          )}
        </div>
      </div>
    </div>
  );
}
