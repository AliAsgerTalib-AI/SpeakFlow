import { GoogleGenAI } from "@google/genai";
import { SpeechFeedback, Exercise, UserProfile, ScriptAnnotation } from "@/src/types";
import { SPEECH_FEEDBACK_SCHEMA, EXERCISES_SCHEMA, SCRIPT_ANNOTATION_SCHEMA } from "./gemini.schema";
import { GeminiError, GeminiErrorType, GeminiResult, validateRequiredFields } from "./errors";
import { buildGoalContext } from "./vocalEngine";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const DEFAULT_MODEL = "gemini-3-flash-preview";
const MODEL = process.env.GEMINI_MODEL || DEFAULT_MODEL;

export function buildAnalysisPrompt(goalContext?: string): string {
  return `You are a Speech-Language Pathologist with 20 years of clinical experience and a professional Voice Coach. You help speakers find their authentic voice.

Analyze this public speaking audio based on the following script content.

Provide a detailed analysis including:
1. Transcription and text-to-speech alignment.
2. Pronunciation errors and clinical speech insights.
3. Biometric metrics (all as 0-100 scores): Pace (WPM as number), Confidence (0-100), Rhythm (0-100), Intonation (0-100), and Articulation (0-100).
4. Physical vocal characteristics: Resonance (0-100), Breath management (0-100 score), and Vocal Health strain level (0-100).
5. Emotional tone and sentiment intensity (sentiment as 0-1 decimal where 0=negative, 1=positive).
6. Advanced detections: Micro-hesitations (count as number), Plosive clarity quality (0-100), and Environmental noise level (0-100).
7. Accent Profile: Identify the primary regional/cultural accent and provide a clarity score (0-100) based on how easily a general audience would understand the speech.
8. Stress & Confidence Profile: Determine an overall stress level (0-100, where 0=calm and 100=extremely stressed). List the key nervousness indicators observed (e.g., "elevated pace", "shallow breathing", "frequent hesitations"). Identify the peak stress moment and provide coaching on managing anxiety in similar situations.

LANGUAGE RULES: Never use the labels "Standard" or "Atypical". Describe vocal qualities with intent language — "forward resonance placement", "dropping laryngeal tension", "expanding breath support". Do not pathologize.
${goalContext ? `\nUSER CONTEXT:\n${goalContext}` : ''}

EXPERT SUGGESTION: In the expertSuggestion field, provide exactly ONE high-impact, immediately actionable coaching cue — the single most important thing this speaker can work on right now. Write it as a direct coaching statement, not a list.

IMPORTANT: All percentage-based metrics MUST be returned as numbers between 0 and 100 (e.g., 85 for 85%), except sentimentScore which should be 0-1.`;
}

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
  "expertSuggestion",
];

const ANNOTATION_REQUIRED_FIELDS = ["segments", "estimatedDuration", "overallTips"];

export async function analyzeSpeech(
  audioBase64: string,
  mimeType: string,
  scriptText: string,
  profile?: UserProfile | null
): Promise<GeminiResult<SpeechFeedback>> {
  try {
    const safeMimeType = mimeType || "audio/webm";
    const goalContext = buildGoalContext(profile);
    const systemPrompt = buildAnalysisPrompt(goalContext);

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: {
        parts: [
          {
            text: systemPrompt,
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

export async function annotateScript(scriptText: string): Promise<GeminiResult<ScriptAnnotation>> {
  try {
    const prompt = `You are a world-class speech coach and presentation trainer. Your job is to annotate a speaker's script with precise delivery instructions so they can perform it with confidence and impact.

Analyze the script below and break it into alternating segments of raw text and delivery instructions. Every instruction must be placed at the exact moment in the script where the speaker should execute it.

Available instruction types and when to use them:
- PAUSE: Strategic silence. Use after key points, before important reveals, or to let emotion land. Include duration in detail (e.g. "2 seconds").
- STRESS: Emphasize a word or short phrase for maximum impact. Include which word(s) and why.
- BREATH: Remind the speaker to take a controlled breath before a long phrase or after an emotional moment.
- LOOK_AROUND: Prompt the speaker to make eye contact with different parts of the audience. Use at natural transition points.
- SLOW_DOWN: Reduce pace for complex ideas, emotional weight, or to create gravitas.
- SPEED_UP: Increase energy for exciting moments, lists, or to build momentum.
- LOWER_VOICE: Drop to a more intimate or authoritative register for contrast and emphasis.
- PROJECT_VOICE: Boost volume and forward resonance for audience engagement, calls to action, or climactic moments.

RULES:
1. Every segment must be either { "type": "text", "content": "..." } or { "type": "instruction", "instruction": "<TYPE>", "detail": "<coaching note>" }.
2. Text segments must contain verbatim excerpts from the script — do not paraphrase.
3. Do not skip any part of the script. The concatenation of all "text" segment content values must reproduce the original script in full.
4. Place 6–14 instructions throughout the script. More instructions in dense, complex or climactic sections.
5. The "detail" field must be a specific, actionable coaching note (1–2 sentences max).
6. estimatedDuration: Give a human-readable time estimate for delivery at a professional speaking pace (e.g. "2 minutes 15 seconds").
7. overallTips: Provide 2–3 sentences of macro delivery advice for this specific script.

Script to annotate:
"""
${scriptText}
"""`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: SCRIPT_ANNOTATION_SCHEMA,
      },
    });

    if (!response.text) {
      return {
        success: false,
        error: new GeminiError(
          GeminiErrorType.API_ERROR,
          "Gemini API returned empty response for annotation",
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
          "Failed to parse annotation response as JSON",
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
          "Annotation response is not a valid object",
          { receivedType: typeof parsed }
        ),
      };
    }

    const missingFields = validateRequiredFields(
      parsed as Record<string, unknown>,
      ANNOTATION_REQUIRED_FIELDS
    );
    if (missingFields.length > 0) {
      return {
        success: false,
        error: new GeminiError(
          GeminiErrorType.MISSING_FIELDS,
          `Annotation response missing required fields: ${missingFields.join(", ")}`,
          { missingFields }
        ),
      };
    }

    return {
      success: true,
      data: parsed as ScriptAnnotation,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error during annotation";
    return {
      success: false,
      error: new GeminiError(GeminiErrorType.API_ERROR, message, {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
      }),
    };
  }
}
