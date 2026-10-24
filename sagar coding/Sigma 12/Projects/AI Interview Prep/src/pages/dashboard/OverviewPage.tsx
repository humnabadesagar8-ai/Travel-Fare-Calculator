import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { PageHeader, StatCard, EmptyState } from '@/components/ui';
import { Link } from '@/components/Router';
import {
  FileText,
  MessageSquare,
  Mic,
  Code2,
  TrendingUp,
  Coins,
  ArrowRight,
  Award,
  Target,
  Sparkles,
} from 'lucide-react';

interface OverviewData {
  resumeCount: number;
  interviewCount: number;
  submissionCount: number;
  avgScore: number;
  recentInterviews: { id: string; type: string; score: number | null; created_at: string }[];
}

const quickActions = [
  { label: 'Analyze Resume', to: '/dashboard/resume', icon: FileText, color: 'from-accent-500/20 to-accent-500/5' },
  { label: 'Mock Interview', to: '/dashboard/mock', icon: MessageSquare, color: 'from-violet-500/20 to-violet-500/5' },
  { label: 'Voice Round', to: '/dashboard/voice', icon: Mic, color: 'from-success-500/20 to-success-500/5' },
  { label: 'Code Sandbox', to: '/dashboard/sandbox', icon: Code2, color: 'from-warning-500/20 to-warning-500/5' },
];

export function OverviewPage() {
  const { profile } = useAuth();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const uid = profile.id;
      const [resumes, interviews, submissions] = await Promise.all([
        supabase.from('resumes').select('id').eq('user_id', uid),
        supabase.from('interviews').select('id, type, score, created_at').eq('user_id', uid).order('created_at', { ascending: false }),
        supabase.from('coding_submissions').select('id').eq('user_id', uid),
      ]);
      const scored = (interviews.data ?? []).filter((i: any) => i.score != null);
      const avg = scored.length ? Math.round(scored.reduce((s: number, i: any) => s + (i.score ?? 0), 0) / scored.length) : 0;
      setData({
        resumeCount: resumes.data?.length ?? 0,
        interviewCount: interviews.data?.length ?? 0,
        submissionCount: submissions.data?.length ?? 0,
        avgScore: avg,
        recentInterviews: (interviews.data ?? []).slice(0, 5),
      });
      setLoading(false);
    })();
  }, [profile]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-ink-500">Loading your dashboard…</div>;
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title={`Welcome back, ${profile?.full_name?.split(' ')[0] ?? 'there'} 👋`} subtitle="Here's your interview prep activity at a glance." />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FileText} label="Resumes analyzed" value={data?.resumeCount ?? 0} accent="accent" />
        <StatCard icon={MessageSquare} label="Mock interviews" value={data?.interviewCount ?? 0} accent="violet" />
        <StatCard icon={Code2} label="Coding submissions" value={data?.submissionCount ?? 0} accent="warning" />
        <StatCard icon={Award} label="Avg. interview score" value={`${data?.avgScore ?? 0}%`} accent="success" />
      </div>

      {/* Quick actions */}
      <div className="mt-8">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-500">Quick actions</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((a) => (
            <Link key={a.label} to={a.to} className="group glass-card relative overflow-hidden p-5 transition-all hover:-translate-y-1 hover:border-white/20">
              <div className={`absolute inset-0 bg-gradient-to-br ${a.color} opacity-0 transition-opacity group-hover:opacity-100`} />
              <div className="relative flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
                  <a.icon className="h-5 w-5 text-accent-400" />
                </div>
                <ArrowRight className="h-4 w-4 text-ink-500 transition-all group-hover:translate-x-1 group-hover:text-white" />
              </div>
              <p className="relative mt-4 text-sm font-semibold text-white">{a.label}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent activity + credits */}
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="glass-card lg:col-span-2 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Recent interviews</h3>
            <Link to="/dashboard/analytics" className="text-xs font-medium text-accent-400 hover:text-accent-300">View all</Link>
          </div>
          {data?.recentInterviews.length ? (
            <div className="space-y-2">
              {data.recentInterviews.map((i) => (
                <div key={i.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/10 ring-1 ring-accent-500/20">
                      {i.type === 'voice' ? <Mic className="h-4 w-4 text-success-400" /> : i.type === 'coding' ? <Code2 className="h-4 w-4 text-warning-400" /> : <MessageSquare className="h-4 w-4 text-accent-400" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium capitalize text-white">{i.type} interview</p>
                      <p className="text-xs text-ink-500">{new Date(i.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className={`text-sm font-semibold ${i.score != null ? 'text-white' : 'text-ink-500'}`}>
                    {i.score != null ? `${i.score}%` : '—'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={MessageSquare} title="No interviews yet" subtitle="Start a mock interview to see your activity here." />
          )}
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent-400" />
            <h3 className="text-sm font-semibold text-white">Credits & goals</h3>
          </div>
          <div className="mt-4 space-y-4">
            <div className="rounded-xl bg-gradient-to-br from-warning-500/10 to-transparent p-4 ring-1 ring-warning-500/20">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-warning-400" />
                <span className="text-2xl font-bold text-white">{profile?.credits ?? 0}</span>
                <span className="text-sm text-ink-400">credits left</span>
              </div>
              <p className="mt-1 text-xs text-ink-500">Each AI session uses 1-5 credits.</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-accent-500/10 to-transparent p-4 ring-1 ring-accent-500/20">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-accent-400" />
                <span className="text-sm font-semibold text-white">Weekly goal</span>
              </div>
              <p className="mt-1 text-xs text-ink-500">Complete 5 practice sessions this week.</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-800">
                <div className="h-full rounded-full bg-gradient-to-r from-accent-500 to-violet-500" style={{ width: `${Math.min((data?.interviewCount ?? 0) / 5 * 100, 100)}%` }} />
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/[0.02] p-3 text-xs text-ink-400">
              <TrendingUp className="h-4 w-4 text-success-400" />
              You're on track — keep practicing!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
