const GOOGLE_AI_API_KEY = "AIzaSyCsv7OIC2uJUGP1BB-EVfgfScxY2mOyZ4k";
const GOOGLE_AI_TEXT_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const GOOGLE_AI_IMAGE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent";

export interface ImageGenerationRequest {
  prompt: string;
  style?: 'realistic' | 'artistic' | 'cartoon' | 'anime' | 'photographic';
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  quality?: 'standard' | 'hd';
}

export interface ImageGenerationResponse {
  imageUrl: string;
  prompt: string;
  timestamp: Date;
}

export interface GeminiMessage {
  role?: "user" | "model";
  parts: { text: string }[];
}

export interface GeminiResponse {
  candidates: {
    content: {
      parts: { text: string }[];
      role: string;
    };
    finishReason: string;
    index: number;
  }[];
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export class GeminiService {
  private apiKey: string;

  constructor() {
    this.apiKey = GOOGLE_AI_API_KEY;
  }

  async sendMessage(messages: GeminiMessage[]): Promise<string> {
    try {
      const response = await fetch(`${GOOGLE_AI_TEXT_URL}?key=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: messages,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data: GeminiResponse = await response.json();
      return data.candidates[0]?.content?.parts[0]?.text || "Desculpe, não consegui gerar uma resposta.";
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      throw new Error("Falha ao conectar com o serviço de IA. Tente novamente.");
    }
  }

  async generateImage(prompt: string, options?: Partial<ImageGenerationRequest>): Promise<string> {
    try {
      const response = await fetch(`${GOOGLE_AI_IMAGE_URL}?key=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Generate an image: ${prompt}. Style: ${options?.style || 'realistic'}. Aspect ratio: ${options?.aspectRatio || '1:1'}. Quality: ${options?.quality || 'hd'}.`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Google AI Image API error:", response.status, errorText);
        throw new Error(`Google AI Image API error: ${response.status}`);
      }

      const data = await response.json();
      
      // A resposta do Google AI para geração de imagem pode retornar uma URL ou dados base64
      const imageContent = data.candidates?.[0]?.content?.parts?.[0];
      
      if (imageContent?.text) {
        // Se retornar texto com URL da imagem
        const urlMatch = imageContent.text.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
          return urlMatch[0];
        }
      }
      
      // Fallback para Pollinations se a Google AI não funcionar
      const encodedPrompt = encodeURIComponent(prompt);
      return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${Math.floor(Math.random() * 1000000)}`;
      
    } catch (error) {
      console.error("Error generating image:", error);
      
      // Fallback para Pollinations
      const encodedPrompt = encodeURIComponent(prompt);
      return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${Math.floor(Math.random() * 1000000)}`;
    }
  }
}

export const geminiService = new GeminiService();