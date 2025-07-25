import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface GeneratedImage {
  imageURL: string;
  positivePrompt: string;
  seed: number;
}

export function ImageGenerator() {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast.error("Por favor, digite um prompt para gerar a imagem");
      return;
    }

    if (!apiKey.trim()) {
      toast.error("Por favor, insira sua chave da API Runware");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('https://api.runware.ai/v1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          {
            taskType: "authentication",
            apiKey: apiKey
          },
          {
            taskType: "imageInference",
            taskUUID: crypto.randomUUID(),
            positivePrompt: prompt,
            width: 1024,
            height: 1024,
            model: "runware:100@1",
            numberResults: 1,
            outputFormat: "WEBP",
            CFGScale: 1,
            scheduler: "FlowMatchEulerDiscreteScheduler"
          }
        ])
      });

      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        const imageData = data.data.find((item: any) => item.taskType === "imageInference");
        if (imageData) {
          const newImage: GeneratedImage = {
            imageURL: imageData.imageURL,
            positivePrompt: imageData.positivePrompt,
            seed: imageData.seed
          };
          setGeneratedImages(prev => [newImage, ...prev]);
          toast.success("Imagem gerada com sucesso!");
        }
      } else {
        toast.error("Erro ao gerar imagem. Verifique sua chave da API.");
      }
    } catch (error) {
      console.error("Erro ao gerar imagem:", error);
      toast.error("Erro ao gerar imagem. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <ImageIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerador de Imagens IA</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">Chave da API Runware</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Insira sua chave da API"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Obtenha sua chave em{" "}
              <a 
                href="https://runware.ai/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary hover:underline"
              >
                runware.ai
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt da Imagem</Label>
            <Input
              id="prompt"
              placeholder="Descreva a imagem que você quer gerar..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isGenerating) {
                  generateImage();
                }
              }}
            />
          </div>

          <Button 
            onClick={generateImage} 
            disabled={isGenerating || !prompt.trim() || !apiKey.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando imagem...
              </>
            ) : (
              "Gerar Imagem"
            )}
          </Button>

          {generatedImages.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Imagens Geradas</h3>
              <div className="grid gap-4">
                {generatedImages.map((image, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-sm">{image.positivePrompt}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <img
                        src={image.imageURL}
                        alt={image.positivePrompt}
                        className="w-full h-auto rounded-lg"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Seed: {image.seed}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}