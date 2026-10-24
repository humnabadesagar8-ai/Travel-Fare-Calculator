import { useEffect, useRef, useState } from 'react';
import { Link, useRouter } from '@/components/Router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { navItems, type DashboardRoute } from '@/lib/nav';
import { Logo, LogoWordmark } from '@/components/Logo';
import {
  Sun,
  Moon,
  Coins,
  ChevronDown,
  User as UserIcon,
  LogOut,
  Settings,
  Menu,
  X,
} from 'lucide-react';

interface DashboardLayoutProps {
  active: DashboardRoute;
  children: React.ReactNode;
}

export function DashboardLayout({ active, children }: DashboardLayoutProps) {
  const { profile, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const { navigate } = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const isAdmin = profile?.role === 'admin';
  const visibleNav = navItems.filter((n) => (!n.adminOnly || isAdmin) && !n.hidden);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const initials = (profile?.full_name || profile?.email || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-ink-950 text-ink-100">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-white/5 bg-ink-900/80 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo className="h-8 w-8" />
            <span className="text-base font-bold text-white">Prep<span className="text-gradient">AI</span></span>
          </Link>
          <button className="text-ink-400 lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="mt-4 space-y-1 px-3">
          {visibleNav.map((item) => {
            const isActive = item.id === active;
            return (
              <Link
                key={item.id}
                to={`/dashboard/${item.id === 'overview' ? '' : item.id}`}
                className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
              >
                <item.icon className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute inset-x-3 bottom-4">
          <div className="glass-card flex items-center gap-3 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/15 text-sm font-bold text-accent-400 ring-1 ring-accent-500/20">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{profile?.full_name || 'User'}</p>
              <p className="truncate text-xs text-ink-500">{profile?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/5 bg-ink-950/80 px-4 backdrop-blur-xl md:px-6">
          <div className="flex items-center gap-3">
            <button className="text-ink-400 lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-sm font-semibold text-white capitalize md:text-base">
              {navItems.find((n) => n.id === active)?.label ?? 'Overview'}
            </h1>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {/* Credits */}
            <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 sm:flex">
              <Coins className="h-4 w-4 text-warning-400" />
              <span className="text-sm font-semibold text-white">
                {profile?.credits && profile.credits > 0 ? profile.credits : 999}
              </span>
              <span className="text-xs text-ink-500">credits</span>
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggle}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-ink-300 transition-colors hover:text-white"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </button>

            {/* Profile dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1.5 pr-2 transition-colors hover:bg-white/10"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500/15 text-xs font-bold text-accent-400 ring-1 ring-accent-500/20">
                  {initials}
                </div>
                <ChevronDown className={`h-4 w-4 text-ink-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 origin-top-right animate-fade-in glass-card overflow-hidden p-1.5">
                  <div className="border-b border-white/5 px-3 py-2.5">
                    <p className="truncate text-sm font-medium text-white">{profile?.full_name || 'User'}</p>
                    <p className="truncate text-xs text-ink-500">{profile?.email}</p>
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-warning-500/10 px-2 py-0.5 text-xs font-medium text-warning-400">
                      <Coins className="h-3 w-3" /> {profile?.credits && profile.credits > 0 ? profile.credits : 999} credits
                    </div>
                  </div>
                  <div className="mt-1 space-y-0.5">
                    <button
                      onClick={() => { navigate('/dashboard/profile'); setMenuOpen(false); }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-300 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <UserIcon className="h-4 w-4" /> Profile
                    </button>
                    <button
                      onClick={() => { navigate('/dashboard/settings'); setMenuOpen(false); }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-300 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <Settings className="h-4 w-4" /> Settings
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-error-400 transition-colors hover:bg-error-500/10"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}

export { LogoWordmark };
