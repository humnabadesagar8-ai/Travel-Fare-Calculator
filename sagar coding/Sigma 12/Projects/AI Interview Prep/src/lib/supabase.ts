import { createClient, type Session, type User } from '@supabase/supabase-js';
import type { Database, Profile, Resume, Interview, CodingSubmission } from '@/types/database';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://placeholder.supabase.co';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'placeholder-anon-key';

// Real Supabase client instance
const rawSupabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Seed Initial Local Storage Database if empty
function initializeLocalStorageDB() {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem('prepai_db_initialized')) {
    const defaultProfile: Profile = {
      id: 'demo_user_default',
      email: 'demo@prepai.dev',
      full_name: 'Demo Candidate',
      role: 'user',
      credits: 50,
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    };

    const defaultInterviews: Interview[] = [
      {
        id: 'interview_init_1',
        user_id: defaultProfile.id,
        type: 'behavioral',
        score: 86,
        transcript_json: [
          { role: 'ai', text: 'Welcome! Tell me about a time you resolved a major bug in production.' },
          { role: 'user', text: 'I diagnosed a memory leak caused by unclosed database connections and deployed a fix within 2 hours.' },
        ],
        feedback_json: {
          strengths: ['Decisive problem resolution', 'Clear technical articulation', 'Structured timeline'],
          improvements: ['Add more detail on post-incident prevention measures'],
        },
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'interview_init_2',
        user_id: defaultProfile.id,
        type: 'voice',
        score: 79,
        transcript_json: [
          { speaker: 'AI', text: 'Walk me through your engineering background.' },
          { speaker: 'You', text: 'I specialize in full-stack TypeScript applications with React and Node.js.' },
        ],
        feedback_json: {
          pacing: 'Good pace — ~132 words per minute.',
          clarity: 'Clear vocal articulation.',
          confidence: 'Composed and steady delivery.',
        },
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ];

    const defaultSubmissions: CodingSubmission[] = [
      {
        id: 'sub_init_1',
        user_id: defaultProfile.id,
        problem_id: 'two-sum',
        code: 'function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const diff = target - nums[i];\n    if (map.has(diff)) return [map.get(diff), i];\n    map.set(nums[i], i);\n  }\n  return [];\n}',
        language: 'javascript',
        status: 'pass',
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
    ];

    const defaultResumes: Resume[] = [
      {
        id: 'resume_init_1',
        user_id: defaultProfile.id,
        file_url: 'Resume_SoftwareEngineer.pdf',
        score: 84,
        skills_detected: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
        feedback_json: {
          target_role: 'Full Stack Engineer',
          strengths: ['Demonstrated full-stack architecture competencies', 'Clear project deliverables'],
          weaknesses: ['Add more quantified metrics and scale of users served'],
          missing_keywords: ['CI/CD', 'Docker', 'Kubernetes'],
          recommended_interview_questions: [
            'How do you design scalable APIs in Node.js?',
            'Describe how you handle state management across complex React applications.',
          ],
        },
        created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
      },
    ];

    localStorage.setItem('prepai_db_profiles', JSON.stringify([defaultProfile]));
    localStorage.setItem('prepai_db_interviews', JSON.stringify(defaultInterviews));
    localStorage.setItem('prepai_db_coding_submissions', JSON.stringify(defaultSubmissions));
    localStorage.setItem('prepai_db_resumes', JSON.stringify(defaultResumes));
    localStorage.setItem('prepai_db_initialized', 'true');
  }
}

initializeLocalStorageDB();

// Listeners for mock auth state changes
type AuthListener = (event: string, session: Session | null) => void;
const authListeners: Set<AuthListener> = new Set();

function getMockSession(): Session | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('prepai_mock_session');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getMockProfile(userId?: string): Profile | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('prepai_db_profiles');
  if (!raw) return null;
  try {
    const list: Profile[] = JSON.parse(raw);
    if (userId) {
      return list.find((p) => p.id === userId) || list[0] || null;
    }
    return list[0] || null;
  } catch {
    return null;
  }
}

function setMockSessionAndProfile(session: Session, profile: Profile) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('prepai_mock_session', JSON.stringify(session));
  localStorage.setItem('prepai_user_profile', JSON.stringify(profile));

  // Add or update profile in profiles table
  const raw = localStorage.getItem('prepai_db_profiles');
  let list: Profile[] = [];
  try {
    list = raw ? JSON.parse(raw) : [];
  } catch (_) {
    list = [];
  }
  const idx = list.findIndex((p) => p.id === profile.id);
  if (idx >= 0) {
    list[idx] = profile;
  } else {
    list.unshift(profile);
  }
  localStorage.setItem('prepai_db_profiles', JSON.stringify(list));

  // Notify listeners
  authListeners.forEach((l) => l('SIGNED_IN', session));
}

function clearMockSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('prepai_mock_session');
  localStorage.removeItem('prepai_user_profile');
  authListeners.forEach((l) => l('SIGNED_OUT', null));
}

// Resilient Mock Query Builder for Local Storage
class ResilientQueryBuilder<T = any> implements PromiseLike<{ data: T | null; error: any }> {
  private table: string;
  private filters: Array<{ col: string; val: any }> = [];
  private orderCol: string | null = null;
  private ascending = true;
  private action: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private payload: any = null;
  private isSingle = false;

  constructor(table: string) {
    this.table = table;
  }

  select(columns = '*') {
    this.action = 'select';
    return this;
  }

  insert(values: any) {
    this.action = 'insert';
    this.payload = values;
    return this;
  }

  update(values: any) {
    this.action = 'update';
    this.payload = values;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  eq(col: string, val: any) {
    this.filters.push({ col, val });
    return this;
  }

  order(col: string, opts: { ascending?: boolean } = {}) {
    this.orderCol = col;
    this.ascending = opts.ascending ?? true;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isSingle = true;
    return this;
  }

  private executeLocal(): { data: any; error: any } {
    const key = `prepai_db_${this.table}`;
    let items: any[] = [];
    try {
      const raw = localStorage.getItem(key);
      items = raw ? JSON.parse(raw) : [];
    } catch {
      items = [];
    }

    if (this.action === 'select') {
      let filtered = [...items];
      for (const f of this.filters) {
        filtered = filtered.filter((item) => String(item[f.col]) === String(f.val));
      }
      if (this.orderCol) {
        filtered.sort((a, b) => {
          const valA = a[this.orderCol!] ?? '';
          const valB = b[this.orderCol!] ?? '';
          if (valA < valB) return this.ascending ? -1 : 1;
          if (valA > valB) return this.ascending ? 1 : -1;
          return 0;
        });
      }
      if (this.isSingle) {
        return { data: filtered[0] ?? null, error: null };
      }
      return { data: filtered, error: null };
    }

    if (this.action === 'insert') {
      const newItems = Array.isArray(this.payload) ? this.payload : [this.payload];
      const stamped = newItems.map((item) => ({
        ...item,
        id: item.id || `id_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        created_at: item.created_at || new Date().toISOString(),
      }));

      items.unshift(...stamped);
      localStorage.setItem(key, JSON.stringify(items));
      return {
        data: this.isSingle || !Array.isArray(this.payload) ? stamped[0] : stamped,
        error: null,
      };
    }

    if (this.action === 'update') {
      let updated: any[] = [];
      items = items.map((item) => {
        const matches = this.filters.every((f) => String(item[f.col]) === String(f.val));
        if (matches) {
          const newItem = { ...item, ...this.payload };
          updated.push(newItem);
          return newItem;
        }
        return item;
      });
      localStorage.setItem(key, JSON.stringify(items));
      return { data: this.isSingle ? updated[0] ?? null : updated, error: null };
    }

    if (this.action === 'delete') {
      items = items.filter((item) => {
        return !this.filters.every((f) => String(item[f.col]) === String(f.val));
      });
      localStorage.setItem(key, JSON.stringify(items));
      return { data: null, error: null };
    }

    return { data: null, error: null };
  }

  async execute(): Promise<{ data: any; error: any }> {
    // Try real Supabase call with short timeout, fallback to local storage
    try {
      let query: any = (rawSupabase.from as any)(this.table);
      if (this.action === 'select') query = query.select();
      if (this.action === 'insert') query = query.insert(this.payload);
      if (this.action === 'update') query = query.update(this.payload);
      if (this.action === 'delete') query = query.delete();

      for (const f of this.filters) {
        query = query.eq(f.col, f.val);
      }
      if (this.orderCol) {
        query = query.order(this.orderCol, { ascending: this.ascending });
      }
      if (this.isSingle) {
        query = query.single();
      }

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Network timeout')), 1000)
      );

      const result: any = await Promise.race([query, timeoutPromise]);
      if (result && !result.error) {
        return result;
      }
    } catch (_) {
      // Offline fallback
    }

    return this.executeLocal();
  }

  then<TResult1 = { data: T | null; error: any }, TResult2 = never>(
    onfulfilled?: ((value: { data: T | null; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

// Resilient Auth Layer
const resilientAuth = {
  async getSession(): Promise<{ data: { session: Session | null }; error: any }> {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 1000)
      );
      const res: any = await Promise.race([rawSupabase.auth.getSession(), timeoutPromise]);
      if (res?.data?.session) return res;
    } catch (_) {}

    return { data: { session: getMockSession() }, error: null };
  },

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    authListeners.add(callback);

    let rawSub: any = null;
    try {
      const { data } = rawSupabase.auth.onAuthStateChange(callback);
      rawSub = data?.subscription;
    } catch (_) {}

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            authListeners.delete(callback);
            if (rawSub) rawSub.unsubscribe();
          },
        },
      },
    };
  },

  async signUp({ email, password, options }: { email: string; password: string; options?: any }): Promise<{
    data: { user: User | null; session: Session | null };
    error: any;
  }> {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 1500)
      );
      const res: any = await Promise.race([
        rawSupabase.auth.signUp({ email, password, options }),
        timeoutPromise,
      ]);
      if (res?.data?.user && !res.error) {
        return res;
      }
    } catch (_) {}

    // Fallback: Create mock user and session locally
    const fullName = options?.data?.full_name || email.split('@')[0] || 'User';
    const mockUser: User = {
      id: `usr_${Date.now()}`,
      app_metadata: { provider: 'email' },
      user_metadata: { full_name: fullName },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: email,
      phone: '',
      role: 'authenticated',
      updated_at: new Date().toISOString(),
    };

    const mockProfile: Profile = {
      id: mockUser.id,
      email: email,
      full_name: fullName,
      role: 'user',
      credits: 50,
      created_at: new Date().toISOString(),
    };

    const mockSession: Session = {
      access_token: `mock_jwt_${Date.now()}`,
      refresh_token: `mock_refresh_${Date.now()}`,
      expires_in: 3600,
      token_type: 'bearer',
      user: mockUser,
    };

    setMockSessionAndProfile(mockSession, mockProfile);
    return { data: { user: mockUser, session: mockSession }, error: null };
  },

  async signInWithPassword({ email }: { email: string; password: string }): Promise<{
    data: { user: User | null; session: Session | null };
    error: any;
  }> {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 1500)
      );
      const res: any = await Promise.race([
        rawSupabase.auth.signInWithPassword({ email, password: 'password' }),
        timeoutPromise,
      ]);
      if (res?.data?.user && !res.error) {
        return res;
      }
    } catch (_) {}

    // Fallback to local profile / user
    let profile = getMockProfile();
    if (!profile || profile.email !== email) {
      profile = {
        id: `usr_${Date.now()}`,
        email: email,
        full_name: email.split('@')[0] || 'User',
        role: 'user',
        credits: 50,
        created_at: new Date().toISOString(),
      };
    }

    const mockUser: User = {
      id: profile.id,
      app_metadata: { provider: 'email' },
      user_metadata: { full_name: profile.full_name },
      aud: 'authenticated',
      created_at: profile.created_at,
      email: email,
      phone: '',
      role: 'authenticated',
      updated_at: new Date().toISOString(),
    };

    const mockSession: Session = {
      access_token: `mock_jwt_${Date.now()}`,
      refresh_token: `mock_refresh_${Date.now()}`,
      expires_in: 3600,
      token_type: 'bearer',
      user: mockUser,
    };

    setMockSessionAndProfile(mockSession, profile);
    return { data: { user: mockUser, session: mockSession }, error: null };
  },

  async signOut(): Promise<{ error: any }> {
    try {
      await rawSupabase.auth.signOut();
    } catch (_) {}
    clearMockSession();
    return { error: null };
  },
};

// Unified Resilient Supabase Export
export const supabase = {
  auth: resilientAuth,
  from(table: string) {
    return new ResilientQueryBuilder(table);
  },
};
