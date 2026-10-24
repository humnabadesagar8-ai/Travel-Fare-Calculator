import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useInterviewPrefill } from '@/context/InterviewPrefillContext';
import { generateQuestions, analyzeAnswer, generateInterviewFeedback } from '@/lib/aiClient';
import { PageHeader, EmptyState } from '@/components/ui';
import {
  MessageSquare,
  Send,
  Sparkles,
  Loader2,
  Award,
  CheckCircle2,
  RotateCcw,
  Clock,
  FileText,
} from 'lucide-react';
import type { Interview } from '@/types/database';

interface ChatMessage {
  role: 'ai' | 'user';
  text: string;
}

const behavioralQuestions = [
  "Tell me about a time you faced a difficult challenge at work and how you handled it.",
  "Describe a situation where you had to work with a difficult team member.",
  "What's a project you're particularly proud of, and why?",
  "How do you prioritize tasks when everything seems urgent?",
  "Tell me about a time you failed and what you learned from it.",
  "Describe a time you had to persuade someone to see things your way.",
];

const sampleFeedback = {
  strengths: ['Clear structure in answers', 'Good use of specific examples', 'Confident tone'],
  improvements: ['Add more quantifiable results', 'Be more concise in the STAR method', 'Prepare a stronger closing statement'],
};

export function MockInterviewPage() {
  const { profile } = useAuth();
  const { prefill, setPrefill } = useInterviewPrefill();
  const [history, setHistory] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [debriefFeedback, setDebriefFeedback] = useState<{ strengths: string[]; improvements: string[] }>(sampleFeedback);
  const [resumeSourced, setResumeSourced] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('interviews')
      .select('*')
      .eq('user_id', profile.id)
      .eq('type', 'behavioral')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setHistory((data as Interview[]) ?? []);
        setLoading(false);
      });
  }, [profile]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  const startInterview = async () => {
    setActive(true);
    setCompleted(false);
    setScore(null);
    setResumeSourced(prefill?.source === 'resume');

    let pool = prefill?.questions?.length ? prefill.questions : behavioralQuestions;

    if (!prefill?.questions?.length) {
      const dynamicQuestions = await generateQuestions({
        role: 'Software Engineer',
        type: 'behavioral',
        count: 5,
      });
      if (dynamicQuestions && dynamicQuestions.length > 0) {
        pool = dynamicQuestions;
      }
    }

    const firstQ = pool[Math.floor(Math.random() * pool.length)];
    setMessages([
      {
        role: 'ai',
        text: resumeSourced
          ? `Welcome! I've tailored these questions based on your resume. Let's begin. ${firstQ}`
          : `Welcome! Let's begin. ${firstQ}`,
      },
    ]);
    // Consume the prefill so it doesn't persist across future manual sessions
    setPrefill(null);
  };

  const sendMessage = async () => {
    if (!input.trim() || thinking) return;
    const currentAnswer = input.trim();
    const userMsg: ChatMessage = { role: 'user', text: currentAnswer };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setThinking(true);

    // Get the previous question asked by the AI
    const lastAiMsg = [...messages].reverse().find((m) => m.role === 'ai');
    const questionText = lastAiMsg ? lastAiMsg.text : 'Tell me about yourself.';

    const evalData = await analyzeAnswer({
      question: questionText,
      answer: currentAnswer,
      role: 'Software Engineer',
      interviewType: 'behavioral',
    });

    const replyText = evalData.feedback
      ? `${evalData.feedback} ${evalData.followUpQuestion || ''}`.trim()
      : 'Great answer. Tell me more about your specific role in that achievement.';

    setMessages((m) => [...m, { role: 'ai', text: replyText }]);
    setThinking(false);
  };

  const finishInterview = async () => {
    if (!profile) return;
    setThinking(true);

    const debrief = await generateInterviewFeedback({
      transcript: messages,
      role: 'Software Engineer',
      interviewType: 'behavioral',
    });

    const finalScore = debrief.score || 80;
    const finalFeedback = {
      strengths: debrief.strengths?.length ? debrief.strengths : sampleFeedback.strengths,
      improvements: debrief.improvements?.length ? debrief.improvements : sampleFeedback.improvements,
    };

    setScore(finalScore);
    setDebriefFeedback(finalFeedback);
    setCompleted(true);
    setActive(false);
    setThinking(false);

    const { data } = await supabase
      .from('interviews')
      .insert({
        user_id: profile.id,
        type: 'behavioral',
        score: finalScore,
        transcript_json: messages,
        feedback_json: finalFeedback,
      })
      .select('*')
      .single();
    if (data) setHistory([data as Interview, ...history]);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="AI Mock Interview" subtitle="Practice behavioral interviews with an adaptive AI interviewer. Get real-time scoring and feedback." />

      {!active && !completed && (
        <div className="glass-card flex flex-col items-center justify-center p-10 text-center">
          {prefill?.source === 'resume' && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-accent-500/20 bg-accent-500/10 px-4 py-2.5 text-sm text-accent-300">
              <FileText className="h-4 w-4" />
              Tailored questions from your resume are ready
            </div>
          )}
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-accent-500/10 ring-1 ring-violet-500/20">
            <MessageSquare className="h-8 w-8 text-violet-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Ready to practice?</h3>
          <p className="mt-1 max-w-md text-sm text-ink-400">
            {prefill?.source === 'resume'
              ? 'Start a mock interview using questions generated from your resume analysis.'
              : 'Start a behavioral mock interview. The AI will ask questions, you respond, and you\'ll get a score with feedback at the end.'}
          </p>
          <button onClick={startInterview} className="btn-primary mt-6">
            <Sparkles className="h-4 w-4" /> Start mock interview
          </button>
          <p className="mt-3 text-xs text-ink-500">Uses 5 credits · {profile?.credits ?? 0} remaining</p>
        </div>
      )}

      {active && (
        <div className="glass-card flex flex-col" style={{ height: '60vh' }}>
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse-glow rounded-full bg-success-500" />
              <span className="text-sm font-medium text-white">Interview in progress</span>
            </div>
            <button onClick={finishInterview} className="btn-ghost text-xs">End interview</button>
          </div>
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === 'user'
                      ? 'bg-accent-600 text-white'
                      : 'bg-white/5 text-ink-100 ring-1 ring-white/10'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-ink-500" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-ink-500" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-ink-500" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>
          <div className="border-t border-white/5 p-4">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your answer…"
                className="input-field"
                disabled={thinking}
              />
              <button onClick={sendMessage} disabled={thinking || !input.trim()} className="btn-primary shrink-0">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {completed && score !== null && (
        <div className="glass-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-success-500/10 ring-1 ring-success-500/20">
            <Award className="h-8 w-8 text-success-400" />
          </div>
          <h3 className="text-2xl font-bold text-white">Interview complete!</h3>
          <p className="mt-1 text-sm text-ink-400">Your performance score:</p>
          <div className="my-4 text-5xl font-bold text-gradient">{score}%</div>
          <div className="mx-auto mt-4 grid max-w-lg gap-4 text-left md:grid-cols-2">
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-success-400"><CheckCircle2 className="h-3.5 w-3.5" /> Strengths</p>
              <ul className="space-y-1">{debriefFeedback.strengths.map((s, i) => <li key={i} className="text-xs text-ink-300">• {s}</li>)}</ul>
            </div>
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-warning-400"><RotateCcw className="h-3.5 w-3.5" /> To improve</p>
              <ul className="space-y-1">{debriefFeedback.improvements.map((s, i) => <li key={i} className="text-xs text-ink-300">• {s}</li>)}</ul>
            </div>
          </div>
          <button onClick={startInterview} className="btn-primary mx-auto mt-6">
            <RotateCcw className="h-4 w-4" /> Practice again
          </button>
        </div>
      )}

      {/* History */}
      <div className="mt-8">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-500">Past interviews</h3>
        {loading ? (
          <div className="flex h-40 items-center justify-center text-ink-500">Loading…</div>
        ) : history.length === 0 ? (
          <EmptyState icon={Clock} title="No interviews yet" subtitle="Your completed mock interviews will appear here." />
        ) : (
          <div className="space-y-2">
            {history.map((i) => (
              <div key={i.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-4 w-4 text-violet-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Behavioral interview</p>
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
