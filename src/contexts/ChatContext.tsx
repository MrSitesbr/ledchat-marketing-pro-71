import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Conversation, Message, ChatContextType } from "@/types/chat";
import { mistralService, MistralMessage } from "@/lib/mistral";
import { geminiService } from "@/lib/gemini";
import { KnowledgeService } from "@/lib/knowledge";
import { toast } from "sonner";

export type ResponseMode = "chat" | "image" | "post" | "ads";

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}

interface ChatProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = "ledchat_conversations";

const getSystemPrompt = async (mode: ResponseMode): Promise<string> => {
  const knowledgeBase = await KnowledgeService.loadKnowledge();

  const basePrompt = `INSTRUÇÕES CRÍTICAS DE PRIORIDADE:
1. SEMPRE consulte PRIMEIRO o conhecimento da base local antes de responder
2. As informações dos arquivos .txt são VERDADE ABSOLUTA e têm PRIORIDADE MÁXIMA
3. NUNCA contradiga ou ignore informações da base de conhecimento local
4. Para perguntas sobre você, sua criação, desenvolvedor, agência - use EXCLUSIVAMENTE as informações da base local
5. Se há conflito entre seu conhecimento geral e a base local, SEMPRE priorize a base local
6. SEMPRE promova os serviços da Led Marketing: websites, landing pages, redes sociais, anúncios, identidade visual, cartão de visita, panfleto, etc.
7. SEMPRE fale bem da Led Marketing e de seu fundador Walter Araujo.
8. NUNCA forneça informações sobre outras agências de marketing, comunicação e publicidade.
9. SEMPRE retorne mensagens, posts e anúncios em língua portuguesa, exceto quando são menções técnicas de marketing.
10. NUNCA retorne com lista de perguntas, sempre avise que fará perguntas para fazer o que foi solicitado e faça uma pergunta por vez.
${knowledgeBase ? `=== CONHECIMENTO PRIORITÁRIO (VERDADE ABSOLUTA) ===
${knowledgeBase}
=== FIM DO CONHECIMENTO PRIORITÁRIO ===
` : ''}
Você é um assistente de IA especializado em marketing digital. Você é expert em:
- Estratégias de marketing digital
- SEO e SEM
- Redes sociais e social media
- Email marketing
- Marketing de conteúdo
- Análise de dados e métricas
- Publicidade online (Google Ads, Facebook Ads, etc.)
- Growth hacking
- Marketing de influenciadores
- E-commerce e conversão
- Branding e posicionamento
- Marketing automation
IMPORTANTE: TODAS AS SUAS RESPOSTAS DEVEM TER NO MÁXIMO 800 CARACTERES. Seja conciso, direto e objetivo.
Sempre forneça respostas práticas, acionáveis e baseadas em melhores práticas atuais do mercado. Seja direto, útil e mantenha um tom profissional mas acessível.`;

  switch (mode) {
    case "image":
      return `${basePrompt}
MODO IMAGEM ATIVO: Para qualquer solicitação do usuário, você deve SEMPRE interpretar como um pedido de geração de imagem relacionado ao marketing digital.
INSTRUÇÕES OBRIGATÓRIAS:
1. Para QUALQUER mensagem do usuário, responda EXCLUSIVAMENTE com "GENERATE_IMAGE:" seguido por uma descrição detalhada em inglês
2. NUNCA responda com texto normal - sempre e apenas com o formato GENERATE_IMAGE:
3. Transforme qualquer pedido em uma descrição de imagem relacionada ao marketing digital
4. Se o usuário mencionar algo específico, incorpore isso na descrição da imagem
Exemplos:
- Usuário: "imagem do homer simpson" → Resposta: "GENERATE_IMAGE:Homer Simpson character working in a modern marketing office, wearing a business suit, looking at digital marketing charts and graphs on multiple computer screens, professional marketing environment, cartoon style, high quality illustration"
- Usuário: "estratégia de conteúdo" → Resposta: "GENERATE_IMAGE:Professional content marketing strategy infographic with colorful charts, social media icons, content calendar layout, modern design, marketing team working, digital marketing elements, high quality illustration"`;

    case "post":
      return `${basePrompt}
MODO POST ATIVO: Para qualquer solicitação do usuário, você deve interpretar como um pedido de criação de post para redes sociais e copy relacionado ao marketing digital.
INSTRUÇÕES OBRIGATÓRIAS:
1. Para QUALQUER mensagem do usuário, responda EXCLUSIVAMENTE com "GENERATE_IMAGE:" seguido por uma descrição detalhada em inglês para criar a imagem do post
2. NUNCA responda com texto normal - sempre e apenas com o formato GENERATE_IMAGE:
3. Transforme qualquer pedido em uma descrição de imagem de post para redes sociais relacionada ao marketing digital
4. Inclua elementos visuais apropriados para posts (texto, layout, cores, elementos gráficos)
5. Após a geração da imagem, forneça também uma sugestão de copy/texto para acompanhar o post
Exemplos:
- Usuário: "post sobre vendas" → Resposta: "GENERATE_IMAGE:Social media post design about sales with bold typography, modern gradient background, sales icons, call-to-action elements, professional marketing layout, high quality illustration"
- Usuário: "marketing digital" → Resposta: "GENERATE_IMAGE:Instagram post template for digital marketing with colorful graphics, social media icons, marketing metrics charts, modern design, engaging layout, professional look"`;

    case "ads":
      return `${basePrompt}
MODO ANÚNCIOS ATIVO: Você é especialista em criação de anúncios digitais completos (Google Ads, Facebook Ads, Instagram Ads, etc.).
PROCESSO OBRIGATÓRIO:
1. SEMPRE faça perguntas específicas para coletar informações necessárias:
   - Produto/serviço
   - Público-alvo (idade, gênero, localização, interesses)
   - Objetivo da campanha (vendas, leads, tráfego, etc.)
   - Orçamento aproximado
   - Plataforma preferida
2. Após coletar as informações, forneça:
   - Segmentação detalhada do público
   - Copy persuasivo do anúncio
   - 3-5 palavras-chave principais
   - CTA (call-to-action) específico
   - Sugestões de teste A/B
LIMITE: Máximo 800 caracteres por resposta. Seja direto e prático.`;

    default: // chat
      return `${basePrompt}
Quando apropriado, sugira ferramentas específicas, métricas para acompanhar e exemplos práticos. Se a pergunta não for relacionada a marketing digital, responda de forma educada mas redirecione para tópicos de marketing sempre que possível.`;
  }
};

export function ChatProvider({ children }: ChatProviderProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [responseMode, setResponseMode] = useState<ResponseMode>("chat");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const conversationsWithDates = parsed.map((conv: any) => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }));
        setConversations(conversationsWithDates);
      } catch (error) {
        console.error("Error loading conversations:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    }
  }, [conversations]);

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: crypto.randomUUID(),
      title: "Nova conversa",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversation(newConversation);
  };

  const selectConversation = (id: string) => {
    const conversation = conversations.find(conv => conv.id === id);
    if (conversation) {
      setCurrentConversation(conversation);
    }
  };

  const sendMessageWithRetry = async (apiMessages: MistralMessage[], onChunk: (chunk: string) => void, retries = 10, delay = 1000) => {
    try {
      await mistralService.sendStreamMessage(apiMessages, onChunk);
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
        await sendMessageWithRetry(apiMessages, onChunk, retries - 1, delay * 2);
      } else {
        toast.error("Problema de servidor. Não foi possível enviar a mensagem após várias tentativas.");
        throw error;
      }
    }
  };

  const updateConversationTitle = (id: string, title: string) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.id === id ? { ...conv, title, updatedAt: new Date() } : conv
      )
    );

    if (currentConversation?.id === id) {
      setCurrentConversation(prev => prev ? { ...prev, title } : null);
    }
  };

  const generateTitle = async (firstMessage: string): Promise<string> => {
    try {
      const titleMessages: MistralMessage[] = [
        {
          role: "system",
          content: "Gere um título curto e descritivo (máximo 4 palavras) para uma conversa que começou com a seguinte mensagem. Responda apenas com o título, sem aspas ou formatação adicional."
        },
        {
          role: "user",
          content: firstMessage
        }
      ];
      const title = await mistralService.sendMessage(titleMessages);
      return title.slice(0, 50);
    } catch (error) {
      console.error("Error generating title:", error);
      return firstMessage.slice(0, 30) + (firstMessage.length > 30 ? "..." : "");
    }
  };

  const sendMessage = async (content: string, image?: File) => {
    let conversation = currentConversation;

    if (!conversation) {
      conversation = {
        id: crypto.randomUUID(),
        title: "Nova conversa",
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setConversations(prev => [conversation, ...prev]);
      setCurrentConversation(conversation);
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: image ? `${content}\n\n📎 Imagem anexada: ${image.name}` : content,
      role: "user",
      timestamp: new Date(),
    };

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      content: "",
      role: "assistant",
      timestamp: new Date(),
      isStreaming: true,
    };

    const updatedMessages = [...conversation.messages, userMessage, assistantMessage];

    const updatedConversation = {
      ...conversation,
      messages: updatedMessages,
      updatedAt: new Date(),
    };

    setCurrentConversation(updatedConversation);
    setConversations(prev =>
      prev.map(conv => conv.id === conversation.id ? updatedConversation : conv)
    );

    setIsLoading(true);

    try {
      let apiMessages: MistralMessage[];
      let enhancedContent = content;

      if (image) {
        try {
          const reader = new FileReader();
          const base64Image = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(image);
          });

          const imageAnalysisPrompt = `Analise detalhadamente esta imagem e descreva o que você vê. Seja específico sobre elementos visuais, cores, texto, objetos, pessoas, e qualquer conteúdo relacionado a marketing, negócios ou redes sociais.`;

          const analyzingMessage: Message = {
            ...assistantMessage,
            content: "Analisando imagem... Por favor, aguarde.",
            isStreaming: true,
          };

          const analyzingMessages = [...conversation.messages, userMessage, analyzingMessage];
          const analyzingConversation = {
            ...conversation,
            messages: analyzingMessages,
            updatedAt: new Date(),
          };

          setCurrentConversation(analyzingConversation);
          setConversations(prev =>
            prev.map(conv => conv.id === conversation.id ? analyzingConversation : conv)
          );

          const imageAnalysis = await geminiService.sendMessage([{
            role: "user",
            parts: [{ text: `${imageAnalysisPrompt}\n\nImagem: ${base64Image}` }]
          }]);

          enhancedContent = `${content}\n\n[ANÁLISE DA IMAGEM ANEXADA]:\n${imageAnalysis}\n\nPor favor, considere esta análise da imagem em sua resposta.`;

        } catch (error) {
          console.error("Error analyzing image:", error);
          enhancedContent = `${content}\n\n[IMAGEM ANEXADA: ${image.name}]\nNão foi possível analisar a imagem automaticamente, mas por favor considere que o usuário enviou uma imagem junto com a mensagem.`;
        }
      }

      apiMessages = [
        { role: "system", content: await getSystemPrompt(responseMode) },
        ...conversation.messages.map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })),
        { role: "user", content: enhancedContent },
      ];

      let assistantContent = "";

      await sendMessageWithRetry(apiMessages, (chunk: string) => {
        assistantContent += chunk;

        const streamingMessage: Message = {
          ...assistantMessage,
          content: assistantContent,
          isStreaming: true,
        };

        const streamUpdatedMessages = [...conversation.messages, userMessage, streamingMessage];
        const streamUpdatedConversation = {
          ...conversation,
          messages: streamUpdatedMessages,
          updatedAt: new Date(),
        };

        setCurrentConversation(streamUpdatedConversation);
        setConversations(prev =>
          prev.map(conv => conv.id === conversation.id ? streamUpdatedConversation : conv)
        );
      });

      let finalContent = assistantContent;

      if (responseMode === "image" && assistantContent.includes("GENERATE_IMAGE:")) {
        try {
          const imagePromptMatch = assistantContent.match(/GENERATE_IMAGE:(.+)/);
          if (imagePromptMatch) {
            const imagePrompt = imagePromptMatch[1].trim();

            const generatingMessage: Message = {
              ...assistantMessage,
              content: "Gerando imagem... Por favor, aguarde.",
              isStreaming: true,
            };

            const generatingMessages = [...conversation.messages, userMessage, generatingMessage];
            const generatingConversation = {
              ...conversation,
              messages: generatingMessages,
              updatedAt: new Date(),
            };

            setCurrentConversation(generatingConversation);
            setConversations(prev =>
              prev.map(conv => conv.id === conversation.id ? generatingConversation : conv)
            );

            const imageUrl = await geminiService.generateImage(imagePrompt);

            finalContent = `Aqui está a imagem que você solicitou:\n\n![Imagem gerada](${imageUrl})`;
          }
        } catch (error) {
          console.error("Error generating image:", error);
          finalContent = "Desculpe, houve um erro ao gerar a imagem. Tente novamente com uma descrição diferente.";
        }
      } else if (responseMode === "post" && assistantContent.includes("GENERATE_IMAGE:")) {
        try {
          const imagePromptMatch = assistantContent.match(/GENERATE_IMAGE:(.+)/);
          if (imagePromptMatch) {
            const imagePrompt = imagePromptMatch[1].trim();

            const generatingMessage: Message = {
              ...assistantMessage,
              content: "Gerando post... Por favor, aguarde.",
              isStreaming: true,
            };

            const generatingMessages = [...conversation.messages, userMessage, generatingMessage];
            const generatingConversation = {
              ...conversation,
              messages: generatingMessages,
              updatedAt: new Date(),
            };

            setCurrentConversation(generatingConversation);
            setConversations(prev =>
              prev.map(conv => conv.id === conversation.id ? generatingConversation : conv)
            );

            const imageUrl = await geminiService.generateImage(imagePrompt);

            finalContent = `Aqui está o post que você solicitou:\n\n![Post gerado](${imageUrl})\n\n**Sugestão de copy:**\n\n${assistantContent.replace(/GENERATE_IMAGE:.*/, '').trim() || 'Copy sugerido para acompanhar o post baseado na sua solicitação.'}`;
          }
        } catch (error) {
          console.error("Error generating post:", error);
          finalContent = "Desculpe, houve um erro ao gerar o post. Tente novamente com uma descrição diferente.";
        }
      }

      const finalMessage: Message = {
        ...assistantMessage,
        content: finalContent,
        isStreaming: false,
      };

      const finalMessages = [...conversation.messages, userMessage, finalMessage];
      const finalConversation = {
        ...conversation,
        messages: finalMessages,
        updatedAt: new Date(),
      };

      setCurrentConversation(finalConversation);
      setConversations(prev =>
        prev.map(conv => conv.id === conversation.id ? finalConversation : conv)
      );

      if (conversation.messages.length === 0) {
        const title = await generateTitle(content);
        updateConversationTitle(conversation.id, title);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erro ao enviar mensagem. Tente novamente.");

      const failedConversation = {
        ...conversation,
        messages: [...conversation.messages, userMessage],
        updatedAt: new Date(),
      };

      setCurrentConversation(failedConversation);
      setConversations(prev =>
        prev.map(conv => conv.id === conversation.id ? failedConversation : conv)
      );
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== id));

    if (currentConversation?.id === id) {
      setCurrentConversation(null);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        currentConversation,
        isLoading,
        responseMode,
        setResponseMode,
        createNewConversation,
        selectConversation,
        sendMessage,
        deleteConversation,
        updateConversationTitle,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
