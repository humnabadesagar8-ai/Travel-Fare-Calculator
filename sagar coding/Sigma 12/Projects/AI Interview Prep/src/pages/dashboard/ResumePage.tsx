import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { PageHeader, StatCard, EmptyState } from '@/components/ui';
import { AIResumeAnalysis, type ResumeAnalysisResult } from '@/components/AIResumeAnalysis';
import {
  FileText,
  Award,
  TrendingUp,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  MessageSquarePlus,
} from 'lucide-react';
import type { Resume } from '@/types/database';

export function ResumePage() {
  const { profile } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('resumes')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setResumes((data as Resume[]) ?? []);
        setLoading(false);
      });
  }, [profile, refreshKey]);

  const persistResult = useCallback(
    async (fileName: string, targetRole: string, result: ResumeAnalysisResult) => {
      if (!profile) return;
      const { data } = await supabase
        .from('resumes')
        .insert({
          user_id: profile.id,
          file_url: fileName,
          score: result.ats_score,
          skills_detected: result.missing_keywords,
          feedback_json: {
            target_role: targetRole,
            strengths: result.strengths,
            weaknesses: result.weaknesses,
            missing_keywords: result.missing_keywords,
            recommended_interview_questions: result.recommended_interview_questions,
          },
        })
        .select('*')
        .single();
      if (data) setResumes((prev) => [data as Resume, ...prev]);
    },
    [profile]
  );

  const handleSaved = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const handleDelete = async (id: string) => {
    await supabase.from('resumes').delete().eq('id', id);
    setResumes((prev) => prev.filter((r) => r.id !== id));
  };

  const avgScore = resumes.length
    ? Math.round(resumes.reduce((s, r) => s + (r.score ?? 0), 0) / resumes.length)
    : 0;
  const topScore = resumes.length ? Math.max(...resumes.map((r) => r.score ?? 0)) : 0;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Resume Prep"
        subtitle="Upload your resume PDF for AI-powered ATS scoring, skill matching, and tailored interview questions."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={FileText} label="Resumes analyzed" value={resumes.length} accent="accent" />
        <StatCard icon={Award} label="Average score" value={`${avgScore}%`} accent="success" />
        <StatCard icon={TrendingUp} label="Top score" value={`${topScore}%`} accent="violet" />
      </div>

      {/* AI Analysis module */}
      <div className="mt-6">
        <AIResumeAnalysis onSaved={handleSaved} onPersist={persistResult} credits={profile?.credits ?? 0} />
      </div>

      {/* Past analyses */}
      <div className="mt-8">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-500">Past analyses</h3>
        {loading ? (
          <div className="flex h-40 items-center justify-center text-ink-500">Loading…</div>
        ) : resumes.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No resumes analyzed yet"
            subtitle="Upload your resume above to get instant AI feedback."
          />
        ) : (
          <div className="space-y-4">
            {resumes.map((r) => {
              const fb = r.feedback_json as {
                target_role?: string;
                strengths?: string[];
                weaknesses?: string[];
                missing_keywords?: string[];
                recommended_interview_questions?: string[];
              };
              const scoreColor =
                (r.score ?? 0) >= 80
                  ? 'text-success-400'
                  : (r.score ?? 0) >= 60
                  ? 'text-warning-400'
                  : 'text-error-400';
              return (
                <div key={r.id} className="glass-card p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-500/10 ring-1 ring-accent-500/20">
                        <FileText className="h-5 w-5 text-accent-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{r.file_url}</p>
                        <p className="text-xs text-ink-500">
                          {fb.target_role ? `Role: ${fb.target_role} · ` : ''}
                          {new Date(r.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`text-2xl font-bold ${scoreColor}`}>{r.score}%</div>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="text-ink-500 transition-colors hover:text-error-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {fb.strengths && fb.strengths.length > 0 && (
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <FeedbackList icon={CheckCircle2} title="Strengths" items={fb.strengths} accent="success" />
                      <FeedbackList icon={AlertTriangle} title="Weaknesses" items={fb.weaknesses ?? []} accent="error" />
                      <FeedbackList icon={KeyRound} title="Missing Keywords" items={fb.missing_keywords ?? []} accent="warning" />
                      <FeedbackList
                        icon={MessageSquarePlus}
                        title="Recommended Questions"
                        items={fb.recommended_interview_questions ?? []}
                        accent="accent"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function FeedbackList({
  icon: Icon,
  title,
  items,
  accent,
}: {
  icon: typeof CheckCircle2;
  title: string;
  items: string[];
  accent: 'success' | 'error' | 'warning' | 'accent';
}) {
  const colorMap = {
    success: 'text-success-400',
    error: 'text-error-400',
    warning: 'text-warning-400',
    accent: 'text-accent-400',
  };
  return (
    <div>
      <p className={`mb-2 flex items-center gap-1.5 text-xs font-medium ${colorMap[accent]}`}>
        <Icon className="h-3.5 w-3.5" /> {title}
      </p>
      {items.length > 0 ? (
        <ul className="space-y-1">
          {items.map((s, i) => (
            <li key={i} className="text-xs text-ink-300">
              • {s}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-ink-500">None identified.</p>
      )}
    </div>
  );
}
