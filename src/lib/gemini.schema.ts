import { Type } from "@google/genai";

export const EXERCISES_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      description: { type: Type.STRING },
      steps: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      targetMetric: { type: Type.STRING },
      difficulty: { type: Type.STRING },
    },
    required: ["title", "description", "steps", "targetMetric", "difficulty"],
  },
};

export const SPEECH_FEEDBACK_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    transcription: { type: Type.STRING },
    pronunciationFeedback: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          suggestions: { type: Type.STRING },
        },
        required: ["word", "suggestions"],
      },
    },
    paceAnalysis: {
      type: Type.OBJECT,
      properties: {
        wpm: { type: Type.NUMBER },
        rating: { type: Type.STRING },
        feedback: { type: Type.STRING },
      },
      required: ["wpm", "rating", "feedback"],
    },
    fillerWordDetection: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          count: { type: Type.NUMBER },
        },
        required: ["word", "count"],
      },
    },
    confidenceScore: { type: Type.NUMBER },
    generalAdvice: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    clinicalInsights: { type: Type.STRING },
    rhythmScore: { type: Type.NUMBER },
    rhythmFeedback: { type: Type.STRING },
    intonationScore: { type: Type.NUMBER },
    emotionalTone: {
      type: Type.OBJECT,
      properties: {
        primary: { type: Type.STRING },
        intensity: { type: Type.NUMBER },
        feedback: { type: Type.STRING },
      },
      required: ["primary", "intensity", "feedback"],
    },
    breathManagement: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        feedback: { type: Type.STRING },
      },
      required: ["score", "feedback"],
    },
    phrasingFeedback: { type: Type.STRING },
    articulationScore: { type: Type.NUMBER },
    vocalHealth: {
      type: Type.OBJECT,
      properties: {
        strainLevel: { type: Type.NUMBER },
        fryPresence: { type: Type.BOOLEAN },
        feedback: { type: Type.STRING },
      },
      required: ["strainLevel", "fryPresence", "feedback"],
    },
    sentimentScore: { type: Type.NUMBER },
    vocalResonance: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        feedback: { type: Type.STRING },
      },
      required: ["score", "feedback"],
    },
    microHesitations: { type: Type.NUMBER },
    plosiveAnalysis: {
      type: Type.OBJECT,
      properties: {
        quality: { type: Type.NUMBER },
        feedback: { type: Type.STRING },
      },
      required: ["quality", "feedback"],
    },
    environmentalNoise: {
      type: Type.OBJECT,
      properties: {
        level: { type: Type.NUMBER },
        feedback: { type: Type.STRING },
      },
      required: ["level", "feedback"],
    },
    accentProfile: {
      type: Type.OBJECT,
      properties: {
        detectedAccent: { type: Type.STRING },
        clarityScore: { type: Type.NUMBER },
        feedback: { type: Type.STRING },
      },
      required: ["detectedAccent", "clarityScore", "feedback"],
    },
    stressProfile: {
      type: Type.OBJECT,
      properties: {
        stressLevel: { type: Type.NUMBER },
        nervousnessIndicators: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        peakMoment: { type: Type.STRING },
        overallAssessment: { type: Type.STRING },
      },
      required: ["stressLevel", "nervousnessIndicators", "peakMoment", "overallAssessment"],
    },
  },
  required: [
    "transcription",
    "pronunciationFeedback",
    "paceAnalysis",
    "fillerWordDetection",
    "confidenceScore",
    "generalAdvice",
    "clinicalInsights",
    "rhythmScore",
    "rhythmFeedback",
    "intonationScore",
    "emotionalTone",
    "breathManagement",
    "phrasingFeedback",
    "articulationScore",
    "vocalHealth",
    "sentimentScore",
    "vocalResonance",
    "microHesitations",
    "plosiveAnalysis",
    "environmentalNoise",
    "accentProfile",
    "stressProfile",
  ],
};
