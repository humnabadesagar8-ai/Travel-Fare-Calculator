export type UserRole = 'user' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  credits: number;
  created_at: string;
}

export type InterviewType = 'voice' | 'coding' | 'behavioral';

export interface Resume {
  id: string;
  user_id: string;
  file_url: string | null;
  score: number | null;
  skills_detected: string[];
  feedback_json: Record<string, unknown>;
  created_at: string;
}

export interface Interview {
  id: string;
  user_id: string;
  type: InterviewType;
  score: number | null;
  transcript_json: unknown[];
  feedback_json: Record<string, unknown>;
  created_at: string;
}

export type SubmissionStatus = 'pending' | 'pass' | 'fail';

export interface CodingSubmission {
  id: string;
  user_id: string;
  problem_id: string;
  code: string;
  language: string;
  status: SubmissionStatus;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
      };
      resumes: {
        Row: Resume;
        Insert: Partial<Resume>;
        Update: Partial<Resume>;
      };
      interviews: {
        Row: Interview;
        Insert: Partial<Interview>;
        Update: Partial<Interview>;
      };
      coding_submissions: {
        Row: CodingSubmission;
        Insert: Partial<CodingSubmission>;
        Update: Partial<CodingSubmission>;
      };
    };
  };
}
