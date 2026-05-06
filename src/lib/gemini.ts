import { GoogleGenAI } from "@google/genai";
import { SpeechFeedback, Exercise } from "@/src/types";
import { SPEECH_FEEDBACK_SCHEMA, EXERCISES_SCHEMA } from "./gemini.schema";
import { GeminiError, GeminiErrorType, GeminiResult, validateRequiredFields } from "./errors";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const DEFAULT_MODEL = "gemini-3-flash-preview";
const MODEL = process.env.GEMINI_MODEL || DEFAULT_MODEL;

export const ANALYSIS_SYSTEM_PROMPT = `Act as a Speech Pathologist and professional Voice Coach.
Analyze this public speaking audio based on the following script content.

Provide a detailed analysis including:
1. Transcription and text-to-speech alignment.
2. Pronunciation errors and clinical speech insights.
3. Biometric metrics: Pace (WPM), Confidence, Rhythm, Intonation, and Articulation.
4. Physical vocal characteristics: Resonance, Breath management, and Vocal Health (strain/fry).
5. Emotional tone and sentiment intensity.
6. Advanced detections: Micro-hesitations (sub-500ms pauses), Plosive clarity (/p/, /b/, /t/), and Environmental Signal-to-Noise quality.
7. Accent Profile: Identify the primary regional/cultural accent and provide a clarity score (0-100) based on how easily a general audience would understand the speech.
8. Stress & Confidence Profile: Based on vocal tremor patterns, pace variation, breath irregularity, and hesitation clustering, determine an overall stress level (0-100, where 0=calm and 100=extremely stressed). List the key nervousness indicators observed (e.g., "elevated pace", "shallow breathing", "frequent hesitations"). Identify the peak stress moment and provide coaching on managing anxiety in similar situations.`;

const REQUIRED_FIELDS = [
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
];

export async function analyzeSpeech(
  audioBase64: string,
  mimeType: string,
  scriptText: string
): Promise<GeminiResult<SpeechFeedback>> {
  try {
    const safeMimeType = mimeType || "audio/webm";

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: {
        parts: [
          {
            text: ANALYSIS_SYSTEM_PROMPT,
          },
          {
            text: `Script to analyze against:\n${scriptText}`,
          },
          {
            inlineData: {
              data: audioBase64,
              mimeType: safeMimeType,
            },
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: SPEECH_FEEDBACK_SCHEMA,
      },
    });

    if (!response.text) {
      return {
        success: false,
        error: new GeminiError(
          GeminiErrorType.API_ERROR,
          "Gemini API returned empty response",
          { responseText: response.text }
        ),
      };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(response.text);
    } catch (parseError) {
      return {
        success: false,
        error: new GeminiError(
          GeminiErrorType.PARSE_ERROR,
          "Failed to parse API response as JSON",
          {
            responseText: response.text.slice(0, 200),
            parseError: parseError instanceof Error ? parseError.message : String(parseError),
          }
        ),
      };
    }

    if (!parsed || typeof parsed !== "object") {
      return {
        success: false,
        error: new GeminiError(
          GeminiErrorType.VALIDATION_ERROR,
          "API response is not a valid object",
          { receivedType: typeof parsed }
        ),
      };
    }

    const missingFields = validateRequiredFields(
      parsed as Record<string, unknown>,
      REQUIRED_FIELDS
    );
    if (missingFields.length > 0) {
      return {
        success: false,
        error: new GeminiError(
          GeminiErrorType.MISSING_FIELDS,
          `Response missing required fields: ${missingFields.join(", ")}`,
          { missingFields }
        ),
      };
    }

    return {
      success: true,
      data: parsed as SpeechFeedback,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error during speech analysis";
    return {
      success: false,
      error: new GeminiError(GeminiErrorType.API_ERROR, message, {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
      }),
    };
  }
}

export async function generatePracticeScript(
  topic?: string,
  mode?: 'general' | 'interview' | 'presentation' | 'sales'
): Promise<{ script: string; prompt: string }> {
  try {
    const modePrompts: Record<string, string> = {
      general: `Generate ONLY a short (30-60 second) public speaking script about "%TOPIC%". It should be professional and engaging. Do not include any instructions or preamble.`,
      interview: `Generate ONLY a 30-60 second sample answer to a behavioral interview question about "%TOPIC%". Provide just the answer itself, no instructions or guidance. Do not include the question.`,
      presentation: `Generate ONLY a 30-60 second presentation snippet about "%TOPIC%". Provide just the content to deliver, no instructions or guidance.`,
      sales: `Generate ONLY a 30-60 second sales pitch about "%TOPIC%". Provide just the pitch itself, no instructions or guidance.`,
    };

    const topicsGeneral = ["innovation", "leadership", "teamwork", "resilience", "communication", "confidence", "problem-solving", "growth mindset"];
    const topicsInterview = ["a time you overcame a challenge", "your greatest strength", "a mistake you learned from", "teamwork", "handling pressure", "your career goals"];
    const topicsPresentation = ["a new product feature", "quarterly results", "a technical process", "a business strategy", "industry trends"];
    const topicsSales = ["a software solution", "a consulting service", "a premium product", "a subscription platform", "a productivity tool"];

    const topicMap: Record<string, string[]> = {
      general: topicsGeneral,
      interview: topicsInterview,
      presentation: topicsPresentation,
      sales: topicsSales,
    };

    const selectedMode = mode || 'general';
    const availableTopics = topicMap[selectedMode];
    const selectedTopic = topic || availableTopics[Math.floor(Math.random() * availableTopics.length)];
    const prompt = modePrompts[selectedMode].replace("%TOPIC%", selectedTopic);

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    });

    if (!response.text) {
      throw new Error("Gemini API returned empty response for script generation");
    }

    return {
      script: response.text,
      prompt: prompt,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error during script generation";
    console.error("Script generation error:", message);
    throw new Error(message);
  }
}

export async function generateExercises(feedback: SpeechFeedback): Promise<GeminiResult<Exercise[]>> {
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: {
        parts: [
          {
            text: `Based on this speech analysis, generate 4-6 targeted micro-practice drills that focus on the person's weakest areas.

Speech Metrics:
- Confidence: ${feedback.confidenceScore}%
- Pace: ${feedback.paceAnalysis.wpm} WPM (${feedback.paceAnalysis.rating})
- Rhythm: ${feedback.rhythmScore}%
- Intonation: ${feedback.intonationScore}%
- Articulation: ${feedback.articulationScore}%
- Breath Management: ${feedback.breathManagement.score}%
- Mispronounced words: ${feedback.pronunciationFeedback.map(p => p.word).join(", ") || "None"}
- Filler words: ${feedback.fillerWordDetection.map(f => `"${f.word}" (${f.count}x)`).join(", ") || "None"}

Create exercises that are brief (1-2 minutes), actionable, and targeted to improve the lowest-scoring areas.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: EXERCISES_SCHEMA,
      },
    });

    if (!response.text) {
      return {
        success: false,
        error: new GeminiError(
          GeminiErrorType.API_ERROR,
          "Gemini API returned empty response for exercises",
          {}
        ),
      };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(response.text);
    } catch (parseError) {
      return {
        success: false,
        error: new GeminiError(
          GeminiErrorType.PARSE_ERROR,
          "Failed to parse exercises response as JSON",
          {}
        ),
      };
    }

    if (!Array.isArray(parsed)) {
      return {
        success: false,
        error: new GeminiError(
          GeminiErrorType.VALIDATION_ERROR,
          "Exercises response is not an array",
          {}
        ),
      };
    }

    return {
      success: true,
      data: parsed as Exercise[],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error during exercise generation";
    return {
      success: false,
      error: new GeminiError(GeminiErrorType.API_ERROR, message, {}),
    };
  }
}
