export interface SpeechFeedback {
  transcription: string;
  pronunciationFeedback: { word: string, suggestions: string }[];
  paceAnalysis: { 
    wpm: number; 
    rating: "slow" | "good" | "fast"; 
    feedback: string; 
  };
  fillerWordDetection: { word: string, count: number }[];
  confidenceScore: number;
  generalAdvice: string[];
  clinicalInsights?: string;
  rhythmScore: number;
  rhythmFeedback: string;
  intonationScore: number;
  emotionalTone: {
    primary: string;
    intensity: number;
    feedback: string;
  };
  breathManagement: {
    score: number;
    feedback: string;
  };
  phrasingFeedback: string;
  articulationScore: number;
  vocalHealth: {
    strainLevel: number;
    fryPresence: boolean;
    feedback: string;
  };
  sentimentScore: number;
  vocalResonance: {
    score: number;
    feedback: string;
  };
  microHesitations?: number;
  plosiveAnalysis?: {
    quality: number;
    feedback: string;
  };
  environmentalNoise?: {
    level: number;
    feedback: string;
  };
}

export interface SessionLog {
  id: string;
  userId: string;
  timestamp: any; // Firestore timestamp
  script: string;
  audioUrl?: string; // If we store it, otherwise just metadata
  feedback: SpeechFeedback;
}

export interface UserStats {
  totalSessions: number;
  avgConfidence: number;
  avgPace: number;
  fillerWordFrequency: Record<string, number>;
}
