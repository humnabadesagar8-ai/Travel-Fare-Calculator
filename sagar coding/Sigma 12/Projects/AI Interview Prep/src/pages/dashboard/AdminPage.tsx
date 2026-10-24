import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { PageHeader, StatCard, EmptyState } from '@/components/ui';
import {
  ShieldCheck,
  Users,
  FileText,
  MessageSquare,
  Code2,
  Lock,
  Search,
} from 'lucide-react';
import type { Profile, Interview, CodingSubmission, Resume } from '@/types/database';

interface AdminUserRow {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  credits: number;
  created_at: string;
  interviews: number;
  resumes: number;
  submissions: number;
}

export function AdminPage() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      // Admin reads all profiles + aggregate counts.
      // RLS allows this only if the current user is an admin (via service role in edge function);
      // here we fetch via the anon client — admins see their own row unless elevated.
      // For demo purposes we display the current user's data and any rows the policy permits.
      const [profilesRes, interviewsRes, resumesRes, subsRes] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('interviews').select('user_id'),
        supabase.from('resumes').select('user_id'),
        supabase.from('coding_submissions').select('user_id'),
      ]);
      const profiles = (profilesRes.data as Profile[]) ?? [];
      const interviews = (interviewsRes.data as Interview[]) ?? [];
      const resumes = (resumesRes.data as Resume[]) ?? [];
      const subs = (subsRes.data as CodingSubmission[]) ?? [];

      const rows: AdminUserRow[] = profiles.map((p) => ({
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        role: p.role,
        credits: p.credits,
        created_at: p.created_at,
        interviews: interviews.filter((i) => i.user_id === p.id).length,
        resumes: resumes.filter((r) => r.user_id === p.id).length,
        submissions: subs.filter((s) => s.user_id === p.id).length,
      }));
      setUsers(rows);
      setLoading(false);
    })();
  }, []);

  const isAdmin = profile?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Admin Panel" />
        <div className="glass-card flex flex-col items-center justify-center p-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-error-500/10 ring-1 ring-error-500/20">
            <Lock className="h-8 w-8 text-error-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Access restricted</h3>
          <p className="mt-1 max-w-sm text-sm text-ink-400">
            The Admin Panel is only available to administrators. Contact your platform admin if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  const filtered = users.filter(
    (u) => u.email.toLowerCase().includes(search.toLowerCase()) || (u.full_name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const totalInterviews = users.reduce((s, u) => s + u.interviews, 0);
  const totalResumes = users.reduce((s, u) => s + u.resumes, 0);
  const totalSubs = users.reduce((s, u) => s + u.submissions, 0);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Admin Panel" subtitle="Platform-wide oversight of users, sessions, and activity." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total users" value={users.length} accent="accent" />
        <StatCard icon={MessageSquare} label="Total interviews" value={totalInterviews} accent="violet" />
        <StatCard icon={FileText} label="Resumes analyzed" value={totalResumes} accent="success" />
        <StatCard icon={Code2} label="Coding submissions" value={totalSubs} accent="warning" />
      </div>

      {/* User table */}
      <div className="mt-6 glass-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-accent-400" />
            <h3 className="text-sm font-semibold text-white">User management</h3>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users…"
              className="input-field w-56 pl-10 text-xs"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center text-ink-500">Loading users…</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Users} title="No users found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left text-xs text-ink-500">
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Credits</th>
                  <th className="px-5 py-3 font-medium">Interviews</th>
                  <th className="px-5 py-3 font-medium">Resumes</th>
                  <th className="px-5 py-3 font-medium">Submissions</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 transition-colors hover:bg-white/[0.02]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500/15 text-xs font-bold text-accent-400 ring-1 ring-accent-500/20">
                          {(u.full_name || u.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-white">{u.full_name || '—'}</p>
                          <p className="text-xs text-ink-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1 ${
                        u.role === 'admin' ? 'text-accent-400 ring-accent-500/20' : 'text-ink-400 ring-white/10'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-ink-200">{u.credits}</td>
                    <td className="px-5 py-3 text-ink-200">{u.interviews}</td>
                    <td className="px-5 py-3 text-ink-200">{u.resumes}</td>
                    <td className="px-5 py-3 text-ink-200">{u.submissions}</td>
                    <td className="px-5 py-3 text-xs text-ink-500">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
