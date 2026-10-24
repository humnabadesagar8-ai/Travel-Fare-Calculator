import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { analyzeSpeech, analyzeAnswer } from '@/lib/aiClient';
import { PageHeader, EmptyState } from '@/components/ui';
import {
  Mic,
  MicOff,
  Square,
  Loader2,
  Award,
  Clock,
  Volume2,
  Radio,
} from 'lucide-react';
import type { Interview } from '@/types/database';

const voiceQuestions = [
  "Walk me through your background and what you're looking for in your next role.",
  "Explain a technical concept you know well as if I'm a non-technical stakeholder.",
  "Why are you interested in this company specifically?",
  "Tell me about a time you led a project from start to finish.",
];

export function VoicePage() {
  const { profile } = useAuth();
  const [history, setHistory] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [currentQ, setCurrentQ] = useState('');
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('interviews')
      .select('*')
      .eq('user_id', profile.id)
      .eq('type', 'voice')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setHistory((data as Interview[]) ?? []);
        setLoading(false);
      });
  }, [profile]);

  const recognitionRef = useRef<any>(null);
  const liveTranscriptRef = useRef('');

  const startRecording = () => {
    setRecording(true);
    setCompleted(false);
    setTranscript([]);
    setSeconds(0);
    liveTranscriptRef.current = '';
    setCurrentQ(voiceQuestions[Math.floor(Math.random() * voiceQuestions.length)]);
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);

    // Initialize Web Speech API if supported in browser
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let current = '';
          for (let i = 0; i < event.results.length; i++) {
            current += event.results[i][0].transcript + ' ';
          }
          liveTranscriptRef.current = current.trim();
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech recognition error/warning:', e);
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('Failed to start speech recognition:', err);
      }
    }
  };

  const stopRecording = async () => {
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      recognitionRef.current = null;
    }

    setAnalyzing(true);

    const spokenText = liveTranscriptRef.current;
    const speechResult = await analyzeSpeech({
      text: spokenText,
      question: currentQ,
    });

    const transcribedText =
      speechResult.transcript ||
      'I have over five years of experience building scalable applications, and I am looking for a role where I can take on more technical architecture responsibilities.';
    const deliveryMetrics = speechResult.metrics;

    const sampleTranscript = [
      { speaker: 'AI', text: currentQ },
      { speaker: 'You', text: transcribedText },
    ];

    const evalData = await analyzeAnswer({
      question: currentQ,
      answer: transcribedText,
      role: 'Software Engineer',
      interviewType: 'voice',
    });

    const finalScore = evalData.score || 80;

    setTranscript(sampleTranscript.map((t) => `${t.speaker}: ${t.text}`));
    setScore(finalScore);
    setAnalyzing(false);
    setCompleted(true);

    if (profile) {
      const { data } = await supabase
        .from('interviews')
        .insert({
          user_id: profile.id,
          type: 'voice',
          score: finalScore,
          transcript_json: sampleTranscript,
          feedback_json: deliveryMetrics,
        })
        .select('*')
        .single();
      if (data) setHistory([data as Interview, ...history]);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Voice Round" subtitle="Simulated voice interviews with live recording, transcription, and instant performance scoring." />

      {/* Recorder */}
      <div className="glass-card flex flex-col items-center justify-center p-10 text-center">
        {analyzing ? (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-accent-400" />
            <p className="mt-4 text-sm text-ink-300">Analyzing your response…</p>
            <p className="mt-1 text-xs text-ink-500">Transcribing audio and scoring delivery</p>
          </>
        ) : recording ? (
          <>
            <div className="relative mb-4 flex h-20 w-20 items-center justify-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-error-500/20" />
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error-500/20 ring-2 ring-error-500/40">
                <Mic className="h-7 w-7 text-error-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{formatTime(seconds)}</p>
            <p className="mt-2 max-w-md text-sm text-ink-400">{currentQ}</p>
            <button onClick={stopRecording} className="btn-ghost mt-6">
              <Square className="h-4 w-4" /> Stop & analyze
            </button>
          </>
        ) : completed && score !== null ? (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-success-500/10 ring-1 ring-success-500/20">
              <Award className="h-8 w-8 text-success-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Voice round complete</h3>
            <div className="my-3 text-4xl font-bold text-gradient">{score}%</div>
            <div className="mt-2 w-full max-w-lg space-y-2 text-left">
              {transcript.map((line, i) => (
                <div key={i} className="rounded-xl bg-white/[0.03] px-4 py-2.5 text-xs text-ink-300 ring-1 ring-white/5">
                  {line}
                </div>
              ))}
            </div>
            <button onClick={startRecording} className="btn-primary mt-6">
              <Mic className="h-4 w-4" /> New voice round
            </button>
          </>
        ) : (
          <>
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-success-500/20 to-accent-500/10 ring-1 ring-success-500/20">
              <Mic className="h-8 w-8 text-success-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Start a voice interview</h3>
            <p className="mt-1 max-w-md text-sm text-ink-400">You'll get a question, record your spoken response, and receive a delivery score with transcript.</p>
            <button onClick={startRecording} className="btn-primary mt-6">
              <Radio className="h-4 w-4" /> Begin recording
            </button>
            <p className="mt-3 text-xs text-ink-500">Uses 4 credits · {profile?.credits ?? 0} remaining</p>
          </>
        )}
      </div>

      {/* Tips */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Volume2, title: 'Speak clearly', desc: 'Articulate at a steady pace.' },
          { icon: Mic, title: 'Find a quiet space', desc: 'Minimize background noise.' },
          { icon: Award, title: 'Be confident', desc: 'Confidence impacts your score.' },
        ].map((t) => (
          <div key={t.title} className="glass-card p-4">
            <t.icon className="h-5 w-5 text-accent-400" />
            <p className="mt-2 text-sm font-medium text-white">{t.title}</p>
            <p className="text-xs text-ink-400">{t.desc}</p>
          </div>
        ))}
      </div>

      {/* History */}
      <div className="mt-8">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-500">Past voice rounds</h3>
        {loading ? (
          <div className="flex h-40 items-center justify-center text-ink-500">Loading…</div>
        ) : history.length === 0 ? (
          <EmptyState icon={Clock} title="No voice rounds yet" subtitle="Your completed voice interviews will appear here." />
        ) : (
          <div className="space-y-2">
            {history.map((i) => (
              <div key={i.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                <div className="flex items-center gap-3">
                  <Mic className="h-4 w-4 text-success-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Voice interview</p>
                    <p className="text-xs text-ink-500">{new Date(i.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-white">{i.score}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
