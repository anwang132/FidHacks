export interface JobMatch {
  title: string;
  company_type: string;
  fit_score: number;
  fit_label: string;
  match_reasons: string[];
  gap_areas: string[];
  salary_range: string;
}

export interface ParseResult {
  reframed_skills: string[];
  suggested_salary: number;
  job_matches: JobMatch[];
}

// kept for negotiate context
export interface ResumedSkills {
  reframed_skills: string[];
  suggested_roles: string[];
  suggested_salary: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AppState {
  baseSalary: number;
  negotiatedSalary: number;
  resumeSkills: ResumedSkills | null;
  chatHistory: ChatMessage[];
  setBaseSalary: (salary: number) => void;
  setNegotiatedSalary: (salary: number) => void;
  setResumeSkills: (skills: ResumedSkills) => void;
  addChatMessage: (msg: ChatMessage) => void;
  resetChat: () => void;
}
