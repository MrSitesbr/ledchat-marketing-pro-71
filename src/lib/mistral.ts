const MISTRAL_API_KEY = "3BHRDYBWZLO1eKOWOVP0cMmJgz904Fwr";
const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";

export interface MistralMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface MistralResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: MistralMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class MistralService {
  private apiKey: string;

  constructor() {
    this.apiKey = MISTRAL_API_KEY;
  }

  async sendMessage(messages: MistralMessage[], model: string = "mistral-large-latest"): Promise<string> {
    try {
      const response = await fetch(MISTRAL_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 1000,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Mistral API error: ${response.status} ${response.statusText}`);
      }

      const data: MistralResponse = await response.json();
      return data.choices[0]?.message?.content || "Desculpe, não consegui gerar uma resposta.";
    } catch (error) {
      console.error("Error calling Mistral API:", error);
      throw new Error("Falha ao conectar com o serviço de IA. Tente novamente.");
    }
  }

  async sendStreamMessage(
    messages: MistralMessage[], 
    onChunk: (chunk: string) => void,
    model: string = "mistral-large-latest"
  ): Promise<void> {
    try {
      const response = await fetch(MISTRAL_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 1000,
          stream: true,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Muitas requisições. Aguarde alguns instantes e tente novamente.");
        }
        throw new Error(`Mistral API error: ${response.status} `);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") return;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                onChunk(content);
              }
            } catch (e) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error("Error streaming from Mistral API:", error);
      if (error instanceof Error && error.message.includes("429")) {
        throw new Error("Muitas requisições. Aguarde alguns instantes e tente novamente.");
      }
      throw new Error("Falha ao conectar com o serviço de IA. Tente novamente.");
    }
  }
}

export const mistralService = new MistralService();