import { createContext, useContext, useState, type ReactNode } from 'react';

export interface InterviewPrefill {
  questions: string[];
  source: string;
}

interface InterviewPrefillContextValue {
  prefill: InterviewPrefill | null;
  setPrefill: (p: InterviewPrefill | null) => void;
}

const InterviewPrefillContext = createContext<InterviewPrefillContextValue | undefined>(undefined);

export function InterviewPrefillProvider({ children }: { children: ReactNode }) {
  const [prefill, setPrefill] = useState<InterviewPrefill | null>(null);
  return (
    <InterviewPrefillContext.Provider value={{ prefill, setPrefill }}>
      {children}
    </InterviewPrefillContext.Provider>
  );
}

export function useInterviewPrefill() {
  const ctx = useContext(InterviewPrefillContext);
  if (!ctx) throw new Error('useInterviewPrefill must be used within InterviewPrefillProvider');
  return ctx;
}
