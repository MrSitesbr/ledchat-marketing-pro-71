import React from "react";
import { Button } from "@/components/ui/button";
import { useChatContext, ResponseMode } from "@/contexts/ChatContext";
import { MessageCircleIcon, ImageIcon, InstagramIcon, TargetIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ModeSelector() {
  const { responseMode, setResponseMode } = useChatContext();

  const modes: Array<{ value: ResponseMode; label: string; icon: React.ReactNode; description: string }> = [
    {
      value: "chat",
      label: "Chat",
      icon: <MessageCircleIcon className="w-4 h-4" />,
      description: "Conversação normal sobre marketing digital"
    },
    {
      value: "image",
      label: "Imagem",
      icon: <ImageIcon className="w-4 h-4" />,
      description: "Gerar imagens relacionadas ao marketing"
    },
    {
      value: "post",
      label: "Post",
      icon: <InstagramIcon className="w-4 h-4" />,
      description: "Criar imagem de post e copy"
    },
    {
      value: "ads",
      label: "Anúncios",
      icon: <TargetIcon className="w-4 h-4" />,
      description: "Criar anúncios completos com segmentação"
    }
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      {modes.map((mode) => (
        <Button
          key={mode.value}
          variant={responseMode === mode.value ? "default" : "ghost"}
          size="sm"
          onClick={() => setResponseMode(mode.value)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 text-xs",
            responseMode === mode.value && "bg-primary text-primary-foreground"
          )}
          title={mode.description}
        >
          {mode.icon}
          {mode.label}
        </Button>
      ))}
    </div>
  );
}