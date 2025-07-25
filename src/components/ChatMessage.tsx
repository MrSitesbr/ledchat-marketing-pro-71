import React from "react";
import { Message } from "@/types/chat";
import { UserIcon, BotIcon, CopyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isMobile = useIsMobile();
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      toast.success("Mensagem copiada!");
    } catch (error) {
      toast.error("Erro ao copiar mensagem");
    }
  };

  const formatContent = (content: string) => {
    // Split by lines and format
    return content.split('\n').map((line, index) => {
      // Handle headers
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-xl font-bold mt-4 mb-2">{line.substring(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-lg font-bold mt-3 mb-2">{line.substring(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-base font-bold mt-2 mb-1">{line.substring(4)}</h3>;
      }
      
      // Handle images
      if (line.startsWith('![') && line.includes('](') && line.includes(')')) {
        const imageMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
        if (imageMatch) {
          const [, altText, imageUrl] = imageMatch;
          return (
            <div key={index} className={cn("my-4", isMobile ? "mx-0" : "mx-auto")}>
              <img 
                src={imageUrl} 
                alt={altText} 
                className={cn(
                  "chat-image w-full h-auto rounded-lg border border-border shadow-sm object-contain",
                  isMobile ? "max-h-[250px]" : "max-h-[400px]"
                )}
                style={{ 
                  maxWidth: '100%',
                  height: 'auto',
                  display: 'block'
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
                loading="lazy"
              />
              <div className="hidden p-4 bg-muted rounded-lg border-2 border-dashed border-border text-center">
                <p className="text-sm text-muted-foreground">
                  ⚠️ Não foi possível carregar a imagem
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  URL: {imageUrl}
                </p>
              </div>
            </div>
          );
        }
      }
      
      // Handle bullets
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={index} className="ml-4 list-disc">{line.substring(2)}</li>;
      }
      
      // Handle numbered lists
      if (/^\d+\. /.test(line)) {
        return <li key={index} className="ml-4 list-decimal">{line.replace(/^\d+\. /, '')}</li>;
      }
      
      // Handle bold text
      if (line.includes('**')) {
        const parts = line.split('**');
        return (
          <p key={index} className="mb-2">
            {parts.map((part, i) => 
              i % 2 === 0 ? part : <strong key={i}>{part}</strong>
            )}
          </p>
        );
      }
      
      // Regular paragraphs
      if (line.trim()) {
        return <p key={index} className="mb-2">{line}</p>;
      }
      
      // Empty lines
      return <br key={index} />;
    });
  };

  return (
    <div
      className={cn(
        "flex gap-3 transition-colors",
        isMobile ? "p-4" : "p-6",
        message.role === "user"
          ? "bg-background"
          : "bg-chat-ai"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 rounded-full flex items-center justify-center",
          isMobile ? "w-7 h-7" : "w-8 h-8",
          message.role === "user"
            ? "bg-chat-user text-chat-user-foreground"
            : "bg-primary text-primary-foreground"
        )}
      >
        {message.role === "user" ? (
          <UserIcon className={isMobile ? "w-3.5 h-3.5" : "w-4 h-4"} />
        ) : (
          <BotIcon className={isMobile ? "w-3.5 h-3.5" : "w-4 h-4"} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "prose prose-sm max-w-none",
            message.role === "user"
              ? "text-foreground"
              : "text-chat-ai-foreground"
          )}
        >
          {message.isStreaming && message.content === "" ? (
            <div className="flex items-center gap-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm text-muted-foreground">Pensando...</span>
            </div>
          ) : (
            <div className="whitespace-pre-wrap">
              {formatContent(message.content)}
              {message.isStreaming && (
                <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse"></span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {message.content && !message.isStreaming && (
          <div className="flex items-center gap-2 mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 px-2 text-xs"
            >
              <CopyIcon className="w-3 h-3 mr-1" />
              Copiar
            </Button>
            <span className="text-xs text-muted-foreground">
              {message.timestamp.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}