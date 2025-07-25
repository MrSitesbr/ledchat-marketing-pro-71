import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SendIcon, StopCircleIcon, PlusIcon, XIcon } from "lucide-react";
import { useChatContext } from "@/contexts/ChatContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { ModeSelector } from "./ModeSelector";
import { cn } from "@/lib/utils";

export function ChatInput() {
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { sendMessage, isLoading, currentConversation, responseMode } = useChatContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const message = input.trim();
    const imageFile = selectedImage;
    
    setInput("");

    // Clear image selection
    setSelectedImage(null);
    setImagePreview(null);

    await sendMessage(message, imageFile);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit(e);
    }
  };


  const getPlaceholderText = () => {
    const baseText = currentConversation ? "Digite sua mensagem" : "Comece uma nova conversa";
    
    switch (responseMode) {
      case "image":
        return `${baseText} para gerar uma imagem...`;
      case "post":
        return `${baseText} para criar um post...`;
      case "ads":
        return `${baseText} sobre anúncios digitais...`;
      default:
        return `${baseText} sobre marketing digital...`;
    }
  };

  return (
    <div className="border-t border-border bg-background">
      <div className={cn("mx-auto", isMobile ? "p-3" : "max-w-4xl p-4")}>
        <div className="mb-3 flex justify-center">
          <ModeSelector />
        </div>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {/* Image preview */}
        {imagePreview && (
          <div className="mb-3">
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-w-32 max-h-32 rounded-lg border border-border object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={removeImage}
                className="absolute -top-2 -right-2 h-6 w-6"
              >
                <XIcon className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="relative">
          <div className={cn("relative flex items-center gap-3 bg-muted/30 border border-border rounded-lg", isMobile ? "p-3" : "p-4")}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleImageUpload}
              className="flex-shrink-0 h-8 w-8"
            >
              <PlusIcon className="w-4 h-4" />
            </Button>
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={getPlaceholderText()}
              className="border-0 bg-muted rounded-md shadow-none focus-visible:ring-0 text-base h-10"
              disabled={isLoading}
            />
            <Button
              type="submit"
              variant={isLoading ? "destructive" : "gradient"}
              size="icon"
              disabled={(!input.trim() && !selectedImage) || isLoading}
              className="flex-shrink-0"
            >
              {isLoading ? (
                <StopCircleIcon className="w-4 h-4" />
              ) : (
                <SendIcon className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          {/* Suggestions */}
          {!currentConversation && (
            <div className={cn("mt-4 flex flex-wrap gap-2", isMobile && "mt-3 gap-1.5")}>
              {[
                "Como criar uma estratégia de marketing digital?",
                "Melhores práticas para SEO em 2024",
                "Como aumentar conversões no e-commerce?",
                "Estratégias de marketing para redes sociais",
              ].map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  onClick={() => setInput(suggestion)}
                  className={cn("text-xs h-auto whitespace-normal text-left", isMobile ? "py-1.5 px-2" : "py-2 px-3")}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          )}
        </form>
        
        <div className="mt-2 text-xs text-muted-foreground text-center">
          O LedMKT pode cometer erros. Considere verificar informações importantes.
        </div>
      </div>
    </div>
  );
}