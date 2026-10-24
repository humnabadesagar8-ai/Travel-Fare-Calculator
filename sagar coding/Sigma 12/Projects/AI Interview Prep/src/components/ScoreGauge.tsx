interface ScoreGaugeProps {
  score: number;
  size?: number;
}

export function ScoreGauge({ score, size = 180 }: ScoreGaugeProps) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;

  const color = clamped >= 80 ? '#22c55e' : clamped >= 60 ? '#eab308' : '#ef4444';
  const label = clamped >= 80 ? 'Excellent' : clamped >= 60 ? 'Good' : 'Needs work';

  return (
    <div className="relative inline-flex flex-col items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 160 160" className="-rotate-90">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="10" />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 0.5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-white">{clamped}</span>
        <span className="text-xs font-medium text-ink-500">ATS Score</span>
        <span className="mt-1 rounded-md px-2 py-0.5 text-[10px] font-semibold" style={{ color, backgroundColor: `${color}1a` }}>
          {label}
        </span>
      </div>
    </div>
  );
}
