// Service para carregar conhecimento da pasta public/knowledge
export class KnowledgeService {
  private static knowledgeBase: string = "";
  private static lastLoaded: number = 0;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  static async loadKnowledge(): Promise<string> {
    const now = Date.now();
    
    // Se o cache ainda é válido, retorna o conhecimento já carregado
    if (this.knowledgeBase && (now - this.lastLoaded) < this.CACHE_DURATION) {
      return this.knowledgeBase;
    }

    try {
      // Tenta carregar lista de arquivos da pasta knowledge
      const response = await fetch('/knowledge');
      
      if (!response.ok) {
        console.warn('Pasta knowledge não encontrada ou vazia');
        return "";
      }

      const html = await response.text();
      
      // Extrai nomes de arquivos .txt do HTML da listagem de diretório
      const txtFiles = this.extractTxtFiles(html);
      
      if (txtFiles.length === 0) {
        console.info('Nenhum arquivo .txt encontrado na pasta knowledge');
        return "";
      }

      // Carrega conteúdo de todos os arquivos .txt
      const knowledgePromises = txtFiles.map(async (fileName) => {
        try {
          const fileResponse = await fetch(`/knowledge/${fileName}`);
          if (fileResponse.ok) {
            const content = await fileResponse.text();
            return `\n=== ${fileName} ===\n${content}\n`;
          }
        } catch (error) {
          console.warn(`Erro ao carregar ${fileName}:`, error);
        }
        return "";
      });

      const knowledgeContents = await Promise.all(knowledgePromises);
      this.knowledgeBase = knowledgeContents.filter(content => content.trim()).join('\n');
      this.lastLoaded = now;

      console.info(`Conhecimento carregado: ${txtFiles.length} arquivos .txt`);
      return this.knowledgeBase;

    } catch (error) {
      console.warn('Erro ao carregar conhecimento:', error);
      return "";
    }
  }

  private static extractTxtFiles(html: string): string[] {
    const txtFiles: string[] = [];
    
    // Padrões para diferentes servidores web
    const patterns = [
      /<a[^>]*href="([^"]*\.txt)"[^>]*>/gi,
      /<li><a[^>]*>([^<]*\.txt)<\/a><\/li>/gi,
      /href="([^"]*\.txt)"/gi
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const fileName = match[1];
        if (fileName && !txtFiles.includes(fileName)) {
          txtFiles.push(fileName);
        }
      }
    }

    return txtFiles;
  }

  static getKnowledgeBase(): string {
    return this.knowledgeBase;
  }

  static clearCache(): void {
    this.knowledgeBase = "";
    this.lastLoaded = 0;
  }
}