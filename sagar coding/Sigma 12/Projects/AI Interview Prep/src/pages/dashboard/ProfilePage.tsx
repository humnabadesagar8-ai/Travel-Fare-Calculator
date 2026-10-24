import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { PageHeader, StatCard } from '@/components/ui';
import {
  User,
  Mail,
  Coins,
  Shield,
  Calendar,
  Pencil,
  Check,
  X,
  Sun,
  Moon,
  Bell,
  Lock,
  Trash2,
  Award,
  Sparkles,
} from 'lucide-react';

export function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const { theme, toggle } = useTheme();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [saved, setSaved] = useState(false);

  const initials = (profile?.full_name || profile?.email || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleSave = () => {
    if (!profile) return;
    // Persist updated full_name to local storage
    const updated = { ...profile, full_name: fullName.trim() || profile.full_name };
    localStorage.setItem('prepai_user_profile', JSON.stringify(updated));
    // Update profiles table in local DB
    try {
      const raw = localStorage.getItem('prepai_db_profiles');
      const list = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((p: any) => p.id === profile.id);
      if (idx >= 0) list[idx] = updated;
      localStorage.setItem('prepai_db_profiles', JSON.stringify(list));
    } catch (_) {}
    refreshProfile();
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleCancel = () => {
    setFullName(profile?.full_name || '');
    setEditing(false);
  };

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  return (
    <div className="animate-fade-in">
      <PageHeader title="Profile & Settings" subtitle="Manage your account details and app preferences." />

      {/* Saved banner */}
      {saved && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-success-500/30 bg-success-500/10 px-4 py-3 text-sm text-success-400 animate-fade-in">
          <Check className="h-4 w-4" /> Profile updated successfully.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="glass-card p-6 flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500/30 to-violet-500/20 text-2xl font-bold text-accent-300 ring-2 ring-accent-500/30">
                {initials}
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-success-500/20 ring-1 ring-success-500/30">
                <span className="h-2 w-2 rounded-full bg-success-400" />
              </div>
            </div>
            <p className="text-lg font-semibold text-white">{profile?.full_name || 'User'}</p>
            <p className="text-xs text-ink-500 mt-0.5">{profile?.email}</p>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-accent-500/10 px-2.5 py-1 text-xs font-medium text-accent-300 ring-1 ring-accent-500/20">
              <Shield className="h-3 w-3" /> {profile?.role || 'user'}
            </div>
            <div className="mt-4 w-full border-t border-white/5 pt-4 space-y-2.5 text-sm text-ink-400">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> Member since</span>
                <span className="text-xs text-ink-300">{memberSince}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2"><Coins className="h-3.5 w-3.5 text-warning-400" /> Credits</span>
                <span className="text-xs font-semibold text-warning-300">{profile?.credits ?? 999}</span>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="mt-4 space-y-3">
            <StatCard icon={Award} label="Total sessions" value="∞" accent="violet" />
            <StatCard icon={Sparkles} label="AI credits left" value={`${profile?.credits ?? 999}`} accent="warning" />
          </div>
        </div>

        {/* Settings Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Account info */}
          <div className="glass-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <User className="h-4 w-4 text-accent-400" /> Account Information
              </h3>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-ink-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Pencil className="h-3 w-3" /> Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={handleSave} className="flex items-center gap-1.5 rounded-lg bg-accent-600 px-3 py-1.5 text-xs text-white transition-colors hover:bg-accent-500">
                    <Check className="h-3 w-3" /> Save
                  </button>
                  <button onClick={handleCancel} className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-ink-300 hover:text-white">
                    <X className="h-3 w-3" /> Cancel
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-400">Full Name</label>
                {editing ? (
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input-field"
                    placeholder="Your full name"
                  />
                ) : (
                  <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-sm text-white">
                    <User className="h-4 w-4 text-ink-500" />
                    {profile?.full_name || '—'}
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-400">Email address</label>
                <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-sm text-ink-300">
                  <Mail className="h-4 w-4 text-ink-500" />
                  {profile?.email || '—'}
                  <span className="ml-auto rounded-md bg-success-500/10 px-2 py-0.5 text-xs text-success-400 ring-1 ring-success-500/20">Verified</span>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-400">Account role</label>
                <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-sm text-ink-300">
                  <Shield className="h-4 w-4 text-ink-500" />
                  {profile?.role || 'user'}
                </div>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="glass-card p-6">
            <h3 className="mb-4 text-sm font-semibold text-white flex items-center gap-2">
              <Bell className="h-4 w-4 text-violet-400" /> Preferences
            </h3>
            <div className="space-y-3">
              {/* Theme toggle */}
              <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? <Moon className="h-4 w-4 text-ink-400" /> : <Sun className="h-4 w-4 text-warning-400" />}
                  <div>
                    <p className="text-sm font-medium text-white">Appearance</p>
                    <p className="text-xs text-ink-500">{theme === 'dark' ? 'Dark mode active' : 'Light mode active'}</p>
                  </div>
                </div>
                <button
                  onClick={toggle}
                  className={`relative h-6 w-11 rounded-full transition-colors ${theme === 'dark' ? 'bg-accent-600' : 'bg-ink-700'}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${theme === 'dark' ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>

              {/* Notifications */}
              <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                <div className="flex items-center gap-3">
                  <Bell className="h-4 w-4 text-ink-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Notifications</p>
                    <p className="text-xs text-ink-500">Interview reminders and score alerts</p>
                  </div>
                </div>
                <button className="relative h-6 w-11 rounded-full bg-accent-600 transition-colors">
                  <span className="absolute left-5 top-0.5 h-5 w-5 rounded-full bg-white shadow" />
                </button>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="glass-card p-6">
            <h3 className="mb-4 text-sm font-semibold text-white flex items-center gap-2">
              <Lock className="h-4 w-4 text-warning-400" /> Security
            </h3>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-sm text-ink-300 transition-colors hover:bg-white/5 hover:text-white">
                <span className="flex items-center gap-2"><Lock className="h-4 w-4" /> Change password</span>
                <span className="text-xs text-ink-500">→</span>
              </button>
              <button className="w-full flex items-center justify-between rounded-xl border border-error-500/10 bg-error-500/[0.04] px-4 py-3 text-sm text-error-400 transition-colors hover:bg-error-500/10">
                <span className="flex items-center gap-2"><Trash2 className="h-4 w-4" /> Delete account</span>
                <span className="text-xs text-ink-600">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
