import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeSpeech(audioBase64: string, mimeType: string, scriptText: string) {
  const model = process.env.GEMINI_MODEL || "gemini-3-flash-preview"; 
  const safeMimeType = mimeType || "audio/webm";
  
  const response = await ai.models.generateContent({
    model: model,
    contents: {
      parts: [
        {
          text: `Act as a Speech Pathologist and professional Voice Coach. 
          Analyze this public speaking audio based on the following script: "${scriptText}". 
          
          Provide a detailed analysis including:
          1. Transcription and text-to-speech alignment.
          2. Pronunciation errors and clinical speech insights.
          3. Biometric metrics: Pace (WPM), Confidence, Rhythm, Intonation, and Articulation.
          4. Physical vocal characteristics: Resonance, Breath management, and Vocal Health (strain/fry).
          5. Emotional tone and sentiment intensity.
          6. Advanced detections: Micro-hesitations (sub-500ms pauses), Plosive clarity (/p/, /b/, /t/), and Environmental Signal-to-Noise quality.
          7. Accent Profile: Identify the primary regional/cultural accent and provide a clarity score (0-100) based on how easily a general audience would understand the speech.`
        },
        {
          inlineData: {
            data: audioBase64,
            mimeType: safeMimeType
          }
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          transcription: { type: Type.STRING },
          pronunciationFeedback: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                suggestions: { type: Type.STRING }
              },
              required: ["word", "suggestions"]
            }
          },
          paceAnalysis: {
            type: Type.OBJECT,
            properties: {
              wpm: { type: Type.NUMBER },
              rating: { type: Type.STRING },
              feedback: { type: Type.STRING }
            },
            required: ["wpm", "rating", "feedback"]
          },
          fillerWordDetection: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                count: { type: Type.NUMBER }
              },
              required: ["word", "count"]
            }
          },
          confidenceScore: { type: Type.NUMBER },
          generalAdvice: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
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
              feedback: { type: Type.STRING }
            },
            required: ["primary", "intensity", "feedback"]
          },
          breathManagement: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              feedback: { type: Type.STRING }
            },
            required: ["score", "feedback"]
          },
          phrasingFeedback: { type: Type.STRING },
          articulationScore: { type: Type.NUMBER },
          vocalHealth: {
            type: Type.OBJECT,
            properties: {
              strainLevel: { type: Type.NUMBER },
              fryPresence: { type: Type.BOOLEAN },
              feedback: { type: Type.STRING }
            },
            required: ["strainLevel", "fryPresence", "feedback"]
          },
          sentimentScore: { type: Type.NUMBER },
          vocalResonance: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              feedback: { type: Type.STRING }
            },
            required: ["score", "feedback"]
          },
          microHesitations: { type: Type.NUMBER },
          plosiveAnalysis: {
            type: Type.OBJECT,
            properties: {
              quality: { type: Type.NUMBER },
              feedback: { type: Type.STRING }
            },
            required: ["quality", "feedback"]
          },
          environmentalNoise: {
            type: Type.OBJECT,
            properties: {
              level: { type: Type.NUMBER },
              feedback: { type: Type.STRING }
            },
            required: ["level", "feedback"]
          },
          accentProfile: {
            type: Type.OBJECT,
            properties: {
              detectedAccent: { type: Type.STRING },
              clarityScore: { type: Type.NUMBER },
              feedback: { type: Type.STRING }
            },
            required: ["detectedAccent", "clarityScore", "feedback"]
          }
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
          "accentProfile"
        ]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function generatePracticeScript(topic: string = "confidence") {
  const model = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
  const response = await ai.models.generateContent({
    model: model,
    contents: `Generate a short (30-60 second) public speaking practice script about "${topic}". 
    it should be professional, engaging, and designed to help build confidence.`
  });
  return response.text;
}

// Ensure GEMINI_MODEL is declared in env
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
