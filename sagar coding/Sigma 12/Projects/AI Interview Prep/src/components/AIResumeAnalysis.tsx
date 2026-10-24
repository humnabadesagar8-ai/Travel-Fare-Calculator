import { useCallback, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ScoreGauge } from '@/components/ScoreGauge';
import { useInterviewPrefill } from '@/context/InterviewPrefillContext';
import { useRouter } from '@/components/Router';
import { analyzeResume, type ResumeAnalysisResult } from '@/lib/aiClient';
import {
  UploadCloud,
  FileText,
  X,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  MessageSquarePlus,
  Target,
  FileSearch,
  Cpu,
  Gauge,
} from 'lucide-react';

export type { ResumeAnalysisResult };

interface AIResumeAnalysisProps {
  onSaved: () => void;
  onPersist?: (fileName: string, targetRole: string, result: ResumeAnalysisResult) => Promise<void> | void;
  credits: number;
}

type Stage = 'idle' | 'extracting' | 'matching' | 'scoring' | 'done' | 'error';
type BusyStage = Exclude<Stage, 'idle' | 'done' | 'error'>;

const stageInfo: Record<BusyStage, { label: string; icon: typeof FileSearch }> = {
  extracting: { label: 'Extracting text from PDF…', icon: FileSearch },
  matching: { label: 'Matching against job roles…', icon: Cpu },
  scoring: { label: 'Generating ATS Score…', icon: Gauge },
};

export function AIResumeAnalysis({ onSaved, onPersist, credits }: AIResumeAnalysisProps) {
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState('');
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResumeAnalysisResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { setPrefill } = useInterviewPrefill();
  const { navigate } = useRouter();

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type === 'application/pdf') {
      setFile(f);
      setResult(null);
      setError(null);
    } else {
      setError('Please upload a PDF file.');
    }
  }, []);

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setResult(null);
      setError(null);
    }
  };

  const extractPdfText = async (pdfFile: File): Promise<string> => {
    const pdfjs = await import('pdfjs-dist');
    // Use the bundled worker via Vite's ?url import
    const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map((item) => ('str' in item ? item.str : '')).join(' ') + '\n';
    }
    return fullText.trim();
  };

  const runStages = async (pdfFile: File, role: string) => {
    setStage('extracting');
    setError(null);
    try {
      const resumeText = await extractPdfText(pdfFile);
      if (!resumeText) {
        throw new Error('No text could be extracted from this PDF. It may be a scanned image.');
      }

      setStage('matching');
      await new Promise((r) => setTimeout(r, 700));

      setStage('scoring');
      const data = await analyzeResume(resumeText, role);

      setResult(data);
      if (onPersist) {
        try {
          await onPersist(pdfFile.name, role, data);
        } catch (_) {}
      }
      setStage('done');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong during analysis.');
      setStage('error');
    }
  };

  const handleAnalyze = () => {
    if (!file || !targetRole.trim()) return;
    // Credit check bypassed
    runStages(file, targetRole.trim());
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setStage('idle');
    setTargetRole('');
  };

  const startMockFromResume = () => {
    if (!result) return;
    setPrefill({
      questions: result.recommended_interview_questions,
      source: 'resume',
    });
    navigate('/dashboard/mock');
  };

  const busy = stage === 'extracting' || stage === 'matching' || stage === 'scoring';

  return (
    <div className="glass-card p-6">
      <div className="mb-5 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent-400" />
        <h3 className="text-sm font-semibold text-white">AI Resume Analysis</h3>
        <span className="ml-auto rounded-md bg-accent-500/10 px-2 py-0.5 text-xs font-medium text-accent-300 ring-1 ring-accent-500/20">
          Gemini-powered
        </span>
      </div>

      {/* Idle / input state */}
      {stage === 'idle' && (
        <>
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all ${dragOver
              ? 'border-accent-500/60 bg-accent-500/10'
              : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/5'
              }`}
          >
            <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={onSelect} />
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-500/10 ring-1 ring-accent-500/20">
              <UploadCloud className="h-7 w-7 text-accent-400" />
            </div>
            <p className="text-sm font-medium text-white">Drag & drop your resume PDF</p>
            <p className="mt-1 text-xs text-ink-500">or click to browse — PDF only, max 5MB</p>
          </div>

          {/* Selected file */}
          {file && (
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-error-500/10 ring-1 ring-error-500/20">
                <FileText className="h-4 w-4 text-error-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{file.name}</p>
                <p className="text-xs text-ink-500">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-ink-500 transition-colors hover:text-error-400">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Target role */}
          <div className="mt-4">
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ink-300">
              <Target className="h-3.5 w-3.5" /> Target Job Role
            </label>
            <input
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Full Stack Developer"
              className="input-field"
            />
          </div>

          {error && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-error-500/30 bg-error-500/10 px-4 py-3 text-sm text-error-400">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={!file || !targetRole.trim()}
            className="btn-primary mt-4 w-full"
          >
            <Sparkles className="h-4 w-4" /> Analyze resume
          </button>
          <p className="mt-2 text-center text-xs text-ink-500">Unlimited credits active</p>
        </>
      )}

      {/* Loading stages */}
      {busy && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative mb-6 flex h-20 w-20 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-accent-500/20" />
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-500/15 ring-2 ring-accent-500/30">
              {(() => {
                const StageIcon = stageInfo[stage as BusyStage].icon;
                return <StageIcon className="h-7 w-7 animate-pulse text-accent-400" />;
              })()}
            </div>
          </div>
          <p className="text-sm font-medium text-white">{stageInfo[stage as BusyStage].label}</p>
          {/* Progress dots */}
          <div className="mt-5 flex items-center gap-2">
            {(['extracting', 'matching', 'scoring'] as const).map((s, i) => {
              const order = ['extracting', 'matching', 'scoring'];
              const activeIdx = order.indexOf(stage);
              const done = i < activeIdx;
              const current = i === activeIdx;
              return (
                <div key={s} className="flex items-center gap-2">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${done ? 'bg-success-500/20 text-success-400 ring-1 ring-success-500/30'
                    : current ? 'bg-accent-500/20 text-accent-400 ring-1 ring-accent-500/30 animate-pulse'
                      : 'bg-white/5 text-ink-600 ring-1 ring-white/10'
                    }`}>
                    {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  {i < 2 && <div className={`h-px w-8 ${done ? 'bg-success-500/40' : 'bg-white/10'}`} />}
                </div>
              );
            })}
          </div>
          <div className="mt-4 h-1 w-48 overflow-hidden rounded-full bg-ink-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent-500 to-violet-500 transition-all duration-700"
              style={{ width: stage === 'extracting' ? '33%' : stage === 'matching' ? '66%' : '100%' }}
            />
          </div>
        </div>
      )}

      {/* Error state */}
      {stage === 'error' && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-error-500/10 ring-1 ring-error-500/20">
            <AlertCircle className="h-7 w-7 text-error-400" />
          </div>
          <p className="text-sm font-medium text-white">Analysis failed</p>
          <p className="mt-1 max-w-sm text-xs text-ink-400">{error}</p>
          <button onClick={reset} className="btn-ghost mt-5">Try again</button>
        </div>
      )}

      {/* Results */}
      {stage === 'done' && result && (
        <div className="animate-fade-in">
          {/* Gauge + summary */}
          <div className="flex flex-col items-center gap-6 rounded-2xl bg-white/[0.02] p-6 ring-1 ring-white/5 md:flex-row md:items-center">
            <ScoreGauge score={result.ats_score} />
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-white">Resume Analysis Complete</h4>
              <p className="mt-1 text-sm text-ink-400">
                Target role: <span className="font-medium text-accent-300">{targetRole}</span>
              </p>
              <p className="mt-1 text-xs text-ink-500">Analyzed from {file?.name}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {result.missing_keywords.slice(0, 5).map((k) => (
                  <span key={k} className="rounded-lg bg-warning-500/10 px-2.5 py-1 text-xs font-medium text-warning-400 ring-1 ring-warning-500/20">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Structured cards */}
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <ResultCard icon={CheckCircle2} title="Strengths" items={result.strengths} accent="success" />
            <ResultCard icon={AlertTriangle} title="Weaknesses" items={result.weaknesses} accent="error" />
            <ResultCard icon={KeyRound} title="Missing Keywords" items={result.missing_keywords} accent="warning" />
            <ResultCard icon={MessageSquarePlus} title="Recommended Interview Questions" items={result.recommended_interview_questions} accent="accent" />
          </div>

          {/* Actions */}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button onClick={startMockFromResume} className="btn-primary flex-1">
              <MessageSquarePlus className="h-4 w-4" /> Start Mock Interview Based on Resume
            </button>
            <button onClick={reset} className="btn-ghost">Analyze another resume</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultCard({
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
    success: 'text-success-400 bg-success-500/10 ring-success-500/20',
    error: 'text-error-400 bg-error-500/10 ring-error-500/20',
    warning: 'text-warning-400 bg-warning-500/10 ring-warning-500/20',
    accent: 'text-accent-400 bg-accent-500/10 ring-accent-500/20',
  };
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
      <div className="mb-3 flex items-center gap-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ring-1 ${colorMap[accent]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <h4 className="text-sm font-semibold text-white">{title}</h4>
      </div>
      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm text-ink-300">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-600" />
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-ink-500">None identified.</p>
      )}
    </div>
  );
}
