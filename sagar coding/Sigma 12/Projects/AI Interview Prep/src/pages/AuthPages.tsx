import { useState, type ReactNode } from 'react';
import { Link, useRouter } from '@/components/Router';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/Logo';
import { ArrowRight, Mail, Lock, User, AlertCircle, Loader2 } from 'lucide-react';

function AuthShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="relative min-h-screen bg-ink-950">
      <div className="pointer-events-none fixed inset-0 bg-radial-glow" />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center">
            <Link to="/" className="flex items-center gap-2.5">
              <Logo className="h-10 w-10" />
              <span className="text-xl font-bold text-white">Prep<span className="text-gradient">AI</span></span>
            </Link>
          </div>
          <div className="glass-card p-8">
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            <p className="mt-1.5 text-sm text-ink-400">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { signIn } = useAuth();
  const { navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    navigate('/dashboard');
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue your interview prep.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-error-500/30 bg-error-500/10 px-4 py-3 text-sm text-error-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-300">Email</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input-field pl-10" />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-300">Password</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="input-field pl-10" />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign in <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-400">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-accent-400 hover:text-accent-300">Create one</Link>
      </p>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { signUp } = useAuth();
  const { navigate } = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    navigate('/dashboard');
  };

  return (
    <AuthShell title="Create your account" subtitle="Get 50 free credits to start preparing.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-error-500/30 bg-error-500/10 px-4 py-3 text-sm text-error-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-300">Full name</label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
            <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" className="input-field pl-10" />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-300">Email</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input-field pl-10" />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-300">Password</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className="input-field pl-10" />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create account <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-400">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-accent-400 hover:text-accent-300">Sign in</Link>
      </p>
    </AuthShell>
  );
}
