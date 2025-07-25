import React, { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { useChatContext } from "@/contexts/ChatContext";
import { useUserContext } from "@/contexts/UserContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { SparklesIcon, TrendingUpIcon, TargetIcon } from "lucide-react";

export function ChatArea() {
  const { currentConversation } = useChatContext();
  const { isAuthenticated } = useUserContext();
  const isMobile = useIsMobile();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentConversation?.messages]);

  if (!currentConversation) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center p-4 md:p-8">
          <div className="text-center max-w-2xl px-4">
            <div className={cn(
              "bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 p-3",
              isMobile ? "w-12 h-12" : "w-16 h-16"
            )}>
              <img 
                src="/lovable-uploads/de8f4ce7-dd12-4e84-a9f0-3834cc70efcb.png" 
                alt="LedMKT Logo" 
                className="w-full h-full object-contain"
                style={{ 
                  maxWidth: '100%',
                  height: 'auto',
                  display: 'block'
                }}
                onError={(e) => {
                  console.log('Logo failed to load');
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <h1 className={cn(
              "font-bold mb-3 bg-gradient-primary bg-clip-text text-transparent",
              isMobile ? "text-lg" : "text-xl md:text-2xl"
            )}>
              Bem-vindo ao LedMKT
            </h1>
            <p className={cn(
              "text-muted-foreground mb-4 md:mb-6",
              isMobile ? "text-sm" : "text-sm md:text-base"
            )}>
              Seu assistente especializado em marketing digital, desenvolvido pela Led MKT
            </p>
            
            {!isAuthenticated && (
              <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm text-primary font-medium">
                  💡 Faça login para salvar suas conversas e histórico completo!
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-lg border border-border bg-card/50">
                <SparklesIcon className="w-6 h-6 text-primary mb-2 mx-auto" />
                <h3 className="font-semibold mb-1">Estratégias Personalizadas</h3>
                <p className="text-sm text-muted-foreground">
                  Receba estratégias de marketing digital customizadas para seu negócio
                </p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-card/50">
                <TrendingUpIcon className="w-6 h-6 text-primary mb-2 mx-auto" />
                <h3 className="font-semibold mb-1">Análise de Performance</h3>
                <p className="text-sm text-muted-foreground">
                  Aprenda a analisar e otimizar suas campanhas de marketing
                </p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-card/50">
                <TargetIcon className="w-6 h-6 text-primary mb-2 mx-auto" />
                <h3 className="font-semibold mb-1">Foco em Conversão</h3>
                <p className="text-sm text-muted-foreground">
                  Estratégias comprovadas para aumentar suas taxas de conversão
                </p>
              </div>
            </div>
          </div>
        </div>
        <ChatInput />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea ref={scrollAreaRef} className="flex-1">
        <div className={cn("mx-auto", isMobile ? "px-4" : "max-w-4xl")}>
          {currentConversation.messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <ChatInput />
    </div>
  );
}