import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ContentArchitectOutput {
  linguistic_check: string;
  content_output: {
    headline: string;
    body: string;
    expert_insight: string;
    cta: string;
    hashtags: string[];
    technical_briefing: string;
  };
  visual_engine: {
    image_prompt: string;
    ratio: string;
  };
}

export interface GenerationParams {
  topic: string;
  field: string;
  platform: 'LinkedIn' | 'Instagram' | 'X';
  language: 'Arabic' | 'English';
}

export function generateImage(prompt: string, width: number = 1024, height: number = 1024) {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&nologo=true`;
}

export async function generateContent(params: { topic: string; field: string; platform: string; style: string; language: string }): Promise<ContentArchitectOutput> {
  const model = "gemini-3-flash-preview";

  const systemInstruction = `Role: Strategic Content Architect. 
Goal: High-impact content for ${params.platform} in ${params.language}. 
Field: ${params.field}. 
Style: ${params.style}.
Output: Catchy Headline, Detailed Body, Expert Insight, Goal-oriented CTA, Technical briefing. 
Visual: Describe a cinematic 3D render representing the topic in a ${params.style} aesthetic.
Format: STRICT JSON only.`;

  const userPrompt = `Generate a Content Architecture for Topic: "${params.topic}" on ${params.platform} in ${params.language} with a ${params.style} style.`;

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          linguistic_check: { type: Type.STRING },
          content_output: {
            type: Type.OBJECT,
            properties: {
              headline: { type: Type.STRING },
              body: { type: Type.STRING },
              expert_insight: { type: Type.STRING },
              cta: { type: Type.STRING },
              hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
              technical_briefing: { type: Type.STRING }
            },
            required: ["headline", "body", "expert_insight", "cta", "hashtags", "technical_briefing"]
          },
          visual_engine: {
            type: Type.OBJECT,
            properties: {
              image_prompt: { type: Type.STRING },
              ratio: { type: Type.STRING }
            },
            required: ["image_prompt", "ratio"]
          }
        },
        required: ["linguistic_check", "content_output", "visual_engine"]
      }
    }
  });

  try {
    return JSON.parse(response.text.trim());
  } catch (e) {
    console.error("Failed to parse AI response as JSON", e);
    throw new Error("The AI returned content in an invalid format.");
  }
}

export interface AuditOutput {
  corrected_text: string;
  explanation: string;
  is_perfect: boolean;
}

export async function auditContent(content: string, language: string): Promise<AuditOutput> {
  const model = "gemini-3-flash-preview";

  const systemInstruction = `Role: Expert Linguistic Auditor. 
Goal: Perform a comprehensive spelling and linguistic audit of the provided text in ${language}.
Focus: Grammar, spelling, punctuation, styling, and tone.
Output: The corrected version of the text, an explanation of changes made, and a boolean indicating if the original was already perfect.
Format: STRICT JSON only.`;

  const userPrompt = `Audit the following content: "${content}" in ${language}.`;

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          corrected_text: { type: Type.STRING },
          explanation: { type: Type.STRING },
          is_perfect: { type: Type.BOOLEAN }
        },
        required: ["corrected_text", "explanation", "is_perfect"]
      }
    }
  });

  try {
    return JSON.parse(response.text.trim());
  } catch (e) {
    console.error("Failed to parse Audit response as JSON", e);
    throw new Error("The AI returned audit content in an invalid format.");
  }
}
