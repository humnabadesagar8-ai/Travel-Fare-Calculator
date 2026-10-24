import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type RouteState = { path: string; navigate: (to: string) => void };

const RouterContext = createContext<RouteState | undefined>(undefined);

function currentPath(): string {
  const hash = window.location.hash.replace(/^#/, '');
  return hash || '/';
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState<string>(currentPath());

  useEffect(() => {
    const onHash = () => setPath(currentPath());
    window.addEventListener('hashchange', onHash);
    if (!window.location.hash) window.location.hash = '/';
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = (to: string) => {
    window.location.hash = to;
  };

  return <RouterContext.Provider value={{ path, navigate }}>{children}</RouterContext.Provider>;
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}

export function Link({ to, className, children }: { to: string; className?: string; children: ReactNode }) {
  const { navigate } = useRouter();
  return (
    <a href={`#${to}`} className={className} onClick={(e) => { e.preventDefault(); navigate(to); }}>
      {children}
    </a>
  );
}
