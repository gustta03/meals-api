import { ITacoRepository } from "@domain/repositories/taco.repository";
import { GeminiService } from "@infrastructure/gemini/gemini.service";
import { logger } from "@shared/logger/logger";
import { TacoItem } from "@domain/entities/taco-item.entity";

interface FoodIdentification {
  foodName: string;
  weightGrams: number;
  confidence: "alta" | "média" | "baixa";
}

interface ResolvedFood {
  tacoItem: TacoItem;
  weightGrams: number;
  originalDescription: string;
  confidence: "alta" | "média" | "baixa";
}

export class TacoFoodResolverService {
  constructor(
    private readonly tacoRepository: ITacoRepository,
    private readonly geminiService: GeminiService | null
  ) {}

  async identifyFoodsFromMessage(messageBody: string): Promise<FoodIdentification[]> {
    if (!this.geminiService) {
      throw new Error("Gemini service is not available");
    }

    const prompt = `Você é um sistema de identificação de alimentos. Sua única função é identificar alimentos mencionados na mensagem do usuário e extrair suas quantidades.

Mensagem do usuário: "${messageBody}"

INSTRUÇÕES:
1. Identifique TODOS os alimentos mencionados
2. Extraia o peso/quantidade de cada alimento (se não especificado, use valores conservadores baseados em porções típicas)
3. Separe alimentos compostos (ex: "tapioca recheada com doce de leite" = 2 alimentos)
4. NÃO invente alimentos que não foram mencionados
5. NÃO assuma preparações não especificadas

Retorne APENAS um JSON válido com esta estrutura:
{
  "foods": [
    {
      "food_name": "nome padronizado do alimento",
      "weight_grams": número,
      "confidence": "alta" | "média" | "baixa"
    }
  ]
}

Exemplo:
{"foods":[{"food_name":"Arroz branco cozido","weight_grams":150,"confidence":"alta"},{"food_name":"Frango grelhado","weight_grams":100,"confidence":"alta"}]}`;

    try {
      const response = await this.geminiService.model.generateContent(prompt);
      const responseText = response.response.text();
      
      const cleaned = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      
      const parsed = JSON.parse(cleaned) as { foods: FoodIdentification[] };
      
      if (!parsed.foods || !Array.isArray(parsed.foods)) {
        throw new Error("Invalid response format");
      }
      
      return parsed.foods;
    } catch (error) {
      logger.error({ error, messageBody }, "Failed to identify foods from message");
      throw new Error("Failed to identify foods from message");
    }
  }

  async resolveFood(description: string, weightGrams: number): Promise<ResolvedFood | null> {
    const normalizedDescription = description.toLowerCase().trim();
    
    let tacoItem: TacoItem | null = null;
    let confidence: "alta" | "média" | "baixa" = "baixa";
    
    const searchTerms = this.extractSearchTerms(normalizedDescription);
    
    for (const term of searchTerms) {
      tacoItem = await this.tacoRepository.findByName(term);
      if (tacoItem) {
        confidence = "alta";
        break;
      }
    }
    
    if (!tacoItem) {
      const searchResults = await this.tacoRepository.search(normalizedDescription, 5);
      if (searchResults.length > 0) {
        tacoItem = searchResults[0];
        confidence = "média";
      }
    }
    
    if (!tacoItem) {
      logger.warn({ description }, "Could not resolve food in TACO database");
      return null;
    }
    
    return {
      tacoItem,
      weightGrams,
      originalDescription: description,
      confidence,
    };
  }

  async resolveFoodsFromMessage(messageBody: string): Promise<ResolvedFood[]> {
    const identifications = await this.identifyFoodsFromMessage(messageBody);
    
    const resolvedFoods: ResolvedFood[] = [];
    
    for (const identification of identifications) {
      const resolved = await this.resolveFood(identification.foodName, identification.weightGrams);
      if (resolved) {
        resolvedFoods.push(resolved);
      }
    }
    
    return resolvedFoods;
  }

  private extractSearchTerms(description: string): string[] {
    const terms: string[] = [description];
    
    const cleaned = description
      .replace(/\s+(recheada|recheado|frito|frita|grelhado|grelhada|cozido|cozida|assado|assada|refogado|refogada)/gi, "")
      .trim();
    
    if (cleaned !== description) {
      terms.push(cleaned);
    }
    
    const parts = description.split(/\s+(?:com|de|e)\s+/i);
    if (parts.length > 1) {
      terms.push(...parts.map((p) => p.trim()));
    }
    
    return terms.filter((t) => t.length > 2);
  }
}
