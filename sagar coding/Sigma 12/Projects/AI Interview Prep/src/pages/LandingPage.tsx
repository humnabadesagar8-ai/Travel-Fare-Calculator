import { Link } from '@/components/Router';
import {
  ArrowRight,
  FileText,
  Mic,
  Code2,
  BarChart3,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Zap,
  CheckCircle2,
  Star,
} from 'lucide-react';
import { LogoWordmark } from '@/components/Logo';

const features = [
  {
    icon: FileText,
    title: 'Resume Prep',
    desc: 'AI-powered resume analysis with ATS scoring, skill detection, and tailored improvement feedback.',
    color: 'from-accent-500/20 to-accent-500/5',
  },
  {
    icon: MessageSquare,
    title: 'AI Mock Interview',
    desc: 'Practice behavioral interviews with an adaptive AI interviewer that responds in real time.',
    color: 'from-violet-500/20 to-violet-500/5',
  },
  {
    icon: Mic,
    title: 'Voice Round',
    desc: 'Simulated voice interviews with live transcription and instant performance scoring.',
    color: 'from-success-500/20 to-success-500/5',
  },
  {
    icon: Code2,
    title: 'Code Sandbox',
    desc: 'Solve real coding problems in a multi-language sandbox with instant test feedback.',
    color: 'from-warning-500/20 to-warning-500/5',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    desc: 'Track your progress across every session with detailed charts and trend insights.',
    color: 'from-accent-500/20 to-violet-500/5',
  },
  {
    icon: ShieldCheck,
    title: 'Admin Panel',
    desc: 'Role-based oversight for administrators to monitor platform activity and users.',
    color: 'from-error-500/20 to-error-500/5',
  },
];

const stats = [
  { value: '50K+', label: 'Interviews simulated' },
  { value: '12K+', label: 'Resumes analyzed' },
  { value: '94%', label: 'Confidence boost' },
  { value: '4.9', label: 'Average rating' },
];

const steps = [
  { title: 'Create your account', desc: 'Sign up free and get 50 starter credits — no card required.' },
  { title: 'Pick a practice mode', desc: 'Resume review, mock interview, voice round, or code sandbox.' },
  { title: 'Get instant feedback', desc: 'Receive AI-generated scores and actionable feedback after every session.' },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-ink-950">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 bg-radial-glow" />
      <div className="pointer-events-none fixed inset-0 bg-grid bg-grid-dark opacity-40" />

      {/* Nav */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <LogoWordmark />
        <nav className="hidden items-center gap-8 text-sm font-medium text-ink-300 md:flex">
          <a href="#features" className="transition-colors hover:text-white">Features</a>
          <a href="#how" className="transition-colors hover:text-white">How it works</a>
          <a href="#stats" className="transition-colors hover:text-white">Results</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-ghost">Sign in</Link>
          <Link to="/register" className="btn-primary">Get started <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-20 pb-24 text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-ink-300">
          <Sparkles className="h-3.5 w-3.5 text-accent-400" />
          AI-powered interview preparation, all in one place
        </div>
        <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-[1.1] tracking-tight text-white md:text-7xl">
          Land your dream job with <span className="text-gradient">AI interview prep</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-400">
          PrepAI sharpens your resume, simulates real interviews, and scores your performance — so you walk into every interview with confidence.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/register" className="btn-primary px-6 py-3 text-base">
            Start preparing free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/login" className="btn-ghost px-6 py-3 text-base">I already have an account</Link>
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-ink-500">
          <CheckCircle2 className="h-4 w-4 text-success-500" />
          50 free credits · No credit card required
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="relative z-10 mx-auto max-w-7xl px-6 pb-16">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="glass-card p-6 text-center">
              <div className="text-3xl font-bold text-gradient">{s.value}</div>
              <div className="mt-1 text-sm text-ink-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 mx-auto max-w-7xl px-6 py-16">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-white md:text-4xl">Everything you need to prepare</h2>
          <p className="mt-3 text-ink-400">Six powerful tools, one unified platform.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group glass-card relative overflow-hidden p-6 transition-all hover:-translate-y-1 hover:border-white/20"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 transition-opacity group-hover:opacity-100`} />
              <div className="relative">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
                  <f.icon className="h-6 w-6 text-accent-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-400">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative z-10 mx-auto max-w-7xl px-6 py-16">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-white md:text-4xl">How it works</h2>
          <p className="mt-3 text-ink-400">Three steps to interview-ready.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="glass-card p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-accent-500/15 text-sm font-bold text-accent-400 ring-1 ring-accent-500/20">
                {i + 1}
              </div>
              <h3 className="text-lg font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-sm text-ink-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-20">
        <div className="glass-card relative overflow-hidden p-10 text-center md:p-16">
          <div className="absolute inset-0 bg-radial-glow" />
          <div className="relative">
            <Zap className="mx-auto mb-4 h-10 w-10 text-accent-400" />
            <h2 className="text-3xl font-bold text-white md:text-4xl">Ready to ace your next interview?</h2>
            <p className="mx-auto mt-3 max-w-xl text-ink-400">
              Join thousands of candidates who landed offers at top companies with PrepAI.
            </p>
            <Link to="/register" className="btn-primary mx-auto mt-8 px-6 py-3 text-base">
              Create your free account <ArrowRight className="h-4 w-4" />
            </Link>
            <div className="mt-6 flex items-center justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-warning-400 text-warning-400" />
              ))}
              <span className="ml-2 text-sm text-ink-400">Loved by 12,000+ candidates</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-ink-500 md:flex-row">
          <LogoWordmark />
          <p>© 2026 PrepAI. Built for ambitious candidates.</p>
        </div>
      </footer>
    </div>
  );
}
