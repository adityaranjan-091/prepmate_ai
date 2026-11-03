export type InterviewMode = 'coding' | 'behavioral' | 'system_design' | 'full_mock';

export type AIProvider = 'gemini' | 'openai' | 'groq' | 'ollama';

export type CandidateLevel = 'entry' | 'mid' | 'senior' | 'staff_principal';

export interface InterviewConfig {
  mode: InterviewMode;
  targetRole: string;
  targetCompany: string;
  candidateLevel: CandidateLevel;
  resumeText?: string;
  jobDescription?: string;
  dsaProblemId?: string;
  provider: AIProvider;
  model: string;
  voiceEnabled: boolean;
  videoEnabled: boolean;
  durationMinutes: number;
}

export interface ChatMessage {
  id: string;
  role: 'system' | 'interviewer' | 'candidate';
  content: string;
  timestamp: number;
  fillerWords?: string[];
  feedback?: string; // Inline AI critique for candidate messages
  starComponent?: 'Situation' | 'Task' | 'Action' | 'Result' | 'General';
}

export interface VisionMetrics {
  eyeContactScore: number; // 0 to 100
  headPose: 'good' | 'tilted' | 'looking_down' | 'looking_away';
  postureAlert: boolean;
  confidenceScore: number; // 0 to 100
  smileDetected: boolean;
  timestamp: number;
}

export interface TelemetrySummary {
  averageEyeContact: number;
  goodPosturePercentage: number;
  averageConfidence: number;
  fillerWordCount: number;
  speakingPaceWpm: number;
  totalSpeakingTimeSeconds: number;
}

export interface StarBreakdown {
  situation: { score: number; feedback: string; detected: boolean };
  task: { score: number; feedback: string; detected: boolean };
  action: { score: number; feedback: string; detected: boolean };
  result: { score: number; feedback: string; detected: boolean };
}

export interface Scorecard {
  id: string;
  sessionId: string;
  overallScore: number; // 0 to 100
  recommendation: 'Strong Hire' | 'Hire' | 'Lean Hire' | 'Lean No Hire' | 'No Hire';
  summary: string;
  categoryScores: {
    technicalAccuracy: number;
    problemSolving: number;
    communication: number;
    starStructure: number;
    confidenceAndPresence: number;
  };
  strengths: string[];
  areasForImprovement: string[];
  starBreakdown?: StarBreakdown;
  telemetrySummary: TelemetrySummary;
  timestamp: number;
}

export interface InterviewSession {
  id: string;
  config: InterviewConfig;
  status: 'configuring' | 'in_progress' | 'paused' | 'completed';
  startTime: number;
  endTime?: number;
  messages: ChatMessage[];
  scorecard?: Scorecard;
  codeSnippet?: string;
  language?: string;
}

