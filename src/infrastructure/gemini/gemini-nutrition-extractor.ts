/**
 * Serviço Gemini para Extração de Dados Nutricionais
 * 
 * Responsabilidades:
 * - Extrair dados nutricionais via Gemini
 * - Construir prompts estruturados e eficientes
 * - Parsear respostas JSON do Gemini
 * - Tratar erros de resposta
 */

import { GeminiService } from "./gemini.service";
import { NutritionValidator } from "../services/nutrition-validator.service";
import { NutritionCacheService } from "../services/nutrition-cache.service";
import { logger } from "@shared/logger/logger";
import { ERROR_MESSAGES } from "@shared/constants/error-messages.constants";
import type { NutritionExtractionResult } from "@application/dtos/extracted-nutrition.dto";

/**
 * Resposta esperada do Gemini em formato JSON
 */
interface GeminiNutritionResponse {
  readonly food_name: string;
  readonly weight_grams: number;
  readonly calories: number;
  readonly protein_g: number;
  readonly carbs_g: number;
  readonly fat_g: number;
  readonly fiber_g?: number;
  readonly confidence: "alta" | "média" | "baixa";
  readonly notes?: string;
}

export class GeminiNutritionExtractor {
  private readonly gemini: GeminiService;
  private readonly validator: NutritionValidator;
  private readonly cache: NutritionCacheService;

  constructor(
    gemini: GeminiService,
    validator: NutritionValidator,
    cache: NutritionCacheService
  ) {
    this.gemini = gemini;
    this.validator = validator;
    this.cache = cache;
  }

  /**
   * Extrai dados nutricionais de uma descrição de alimento
   */
  async extract(foodDescription: string, weightGrams: number): Promise<NutritionExtractionResult> {
    const cachedData = this.cache.get(foodDescription, weightGrams);
    if (cachedData) {
      logger.debug(
        { foodDescription, weightGrams },
        "Nutrition data retrieved from cache"
      );
      return {
        ...cachedData,
        isValid: true,
        warnings: [],
      };
    }

    const geminiResult = await this.callGemini(foodDescription, weightGrams);
    if (!geminiResult.success) {
      return {
        isValid: false,
        reason: geminiResult.error,
        attempted: { foodName: foodDescription, weightGrams },
      };
    }

    const validationResult = this.validator.validate(
      {
        foodName: geminiResult.data.food_name,
        weightGrams: geminiResult.data.weight_grams,
        calories: geminiResult.data.calories,
        proteinG: geminiResult.data.protein_g,
        carbsG: geminiResult.data.carbs_g,
        fatG: geminiResult.data.fat_g,
        fiberG: geminiResult.data.fiber_g,
      },
      geminiResult.data.confidence
    );

    if (!validationResult.isValid) {
      return validationResult;
    }

    this.cache.set(foodDescription, weightGrams, validationResult);

    return validationResult;
  }

  /**
   * Faz chamada ao Gemini para extrair nutrição
   */
  private async callGemini(
    foodDescription: string,
    weightGrams: number
  ): Promise<{ success: true; data: GeminiNutritionResponse } | { success: false; error: string }> {
    try {
      const prompt = this.buildExtractionPrompt(foodDescription, weightGrams);
      const response = await this.gemini.model.generateContent(prompt);
      const responseText = response.response.text();

      const parsedResponse = this.parseGeminiResponse(responseText);
      return { success: true, data: parsedResponse };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.GEMINI.API_KEY_MISSING;
      logger.error(
        { error, foodDescription, weightGrams },
        "Failed to extract nutrition from Gemini"
      );
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Constrói prompt otimizado para Gemini
   */
  private buildExtractionPrompt(foodDescription: string, weightGrams: number): string {
    return `Você é um nutricionista especialista. Analise o alimento e forneça dados nutricionais PRECISOS e MATEMATICAMENTE CORRETOS.

Alimento: "${foodDescription}"
Peso: ${weightGrams}g

IMPORTANTE - Valores devem ser matematicamente consistentes:
- 1g de carboidrato = 4 kcal
- 1g de proteína = 4 kcal  
- 1g de gordura = 9 kcal
- Total de calorias DEVE ser aproximadamente: (carbs_g × 4) + (protein_g × 4) + (fat_g × 9)
- A diferença entre calorias calculadas e reportadas não deve exceder 5%

Retorne APENAS um JSON válido (sem markdown, sem código blocks, JSON puro):
{
  "food_name": "nome padronizado do alimento em português",
  "weight_grams": ${weightGrams},
  "calories": número inteiro (DEVE ser consistente com os macros),
  "protein_g": número com até 1 casa decimal,
  "carbs_g": número com até 1 casa decimal,
  "fat_g": número com até 1 casa decimal,
  "fiber_g": número com até 1 casa decimal (opcional),
  "confidence": "alta" | "média" | "baixa",
  "notes": "observações opcionais"
}

Regras de Precisão:
1. Se o alimento é vago ou não especifica preparação (ex: "frango", "peito de frango"):
   - Retorne nome genérico SEM assumir preparação: "Frango, peito"
   - Use valores nutricionais médios/genéricos (não específicos)
   - Marque confidence como "média"
2. Se é específico quanto à preparação (ex: "frango frito", "peito grelhado"):
   - Retorne nome completo com preparação
   - Use dados para essa preparação específica
   - Marque confidence como "alta"
3. Se é caseiro/receita complexa:
   - Faça estimativa baseada em ingredientes típicos
   - Marque confidence como "média" ou "baixa"
4. Confidence "alta" apenas para alimentos catalogados com preparação específica
5. Confidence "média" para estimativas bem fundamentadas ou preparação não especificada
6. Confidence "baixa" para alimentos muito vaguos ou regionais

VALORES DE REFERÊNCIA (por 100g):
- Arroz branco cozido: ~130 kcal, 2.3g proteína, 28g carboidrato, 0.2g gordura
- Batata cozida: ~75 kcal, 1.5g proteína, 17g carboidrato, 0.1g gordura
- Alface: ~15 kcal, 1.2g proteína, 2.5g carboidrato, 0.2g gordura

Exemplo de resposta válida:
{"food_name":"Arroz branco cozido","weight_grams":150,"calories":195,"protein_g":3.5,"carbs_g":42.0,"fat_g":0.3,"confidence":"alta","notes":"Valores para arroz branco cozido"}`;
  }

  /**
   * Parseia resposta JSON do Gemini
   */
  private parseGeminiResponse(responseText: string): GeminiNutritionResponse {
    try {
      // Remover markdown code blocks se presente
      const cleaned = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const parsed = JSON.parse(cleaned) as GeminiNutritionResponse;

      // Validar estrutura básica
      if (!parsed.food_name || typeof parsed.calories !== "number") {
        throw new Error("Response missing required fields");
      }

      // Validar que food_name não está vazio ou é inválido
      const foodName = parsed.food_name.trim();
      if (foodName.length === 0 || 
          foodName.toLowerCase().includes("não especificado") ||
          foodName.toLowerCase().includes("nao especificado") ||
          foodName.toLowerCase().includes("não encontrado") ||
          foodName.toLowerCase().includes("nao encontrado") ||
          foodName.toLowerCase() === "alimento" ||
          /^\d+$/.test(foodName)) {
        throw new Error(`Invalid food name returned: "${foodName}"`);
      }

      return parsed;
    } catch (error) {
      logger.error(
        { responseText, error },
        "Failed to parse Gemini nutrition response"
      );
      throw new Error("Gemini returned invalid JSON response");
    }
  }
}
