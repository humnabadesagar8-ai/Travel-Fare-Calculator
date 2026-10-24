import { BrainCircuit } from 'lucide-react';

export function Logo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-violet-600 ${className}`}>
      <BrainCircuit className="h-1/2 w-1/2 text-white" strokeWidth={2.5} />
    </div>
  );
}

export function LogoWordmark({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Logo className="h-9 w-9" />
      <span className="text-lg font-bold tracking-tight text-white">
        Prep<span className="text-gradient">AI</span>
      </span>
    </div>
  );
}
