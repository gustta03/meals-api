import { GeminiService } from "./gemini.service";
import { NutritionValidator } from "../services/nutrition-validator.service";
import { NutritionCacheService } from "../services/nutrition-cache.service";
import { logger } from "@shared/logger/logger";
import { ERROR_MESSAGES } from "@shared/constants/error-messages.constants";
import type { NutritionExtractionResult } from "@application/dtos/extracted-nutrition.dto";

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

  private buildExtractionPrompt(foodDescription: string, weightGrams: number): string {
    return `Você é um mecanismo determinístico de análise nutricional.
Criatividade é estritamente proibida.

Seu único objetivo é retornar dados nutricionais matematicamente corretos, consistentes e verificáveis.

Se qualquer informação necessária não estiver explicitamente definida, você deve:

usar valores médios conservadores amplamente aceitos, OU

reduzir o nível de "confidence"

PROIBIÇÕES ABSOLUTAS

Você NÃO PODE:

inferir método de preparo não especificado

assumir ingredientes, óleo, manteiga ou condimentos

extrapolar dados regionais ou marcas

usar valores "típicos" sem base consolidada

retornar "confidence": "alta" sem preparo explícito

ignorar ou contornar regras matemáticas

retornar texto fora de JSON

retornar JSON inválido ou incompleto

REGRAS MATEMÁTICAS (INQUEBRÁVEIS)

Use exclusivamente:

Carboidratos: 4 kcal por grama

Proteínas: 4 kcal por grama

Gorduras: 9 kcal por grama

Calorias totais DEVEM ser calculadas como:

(calorias) = (carbs_g × 4) + (protein_g × 4) + (fat_g × 9)

A diferença entre:

calorias calculadas

campo "calories"

NÃO pode exceder 5%.

Se houver inconsistência:
➡️ ajuste os macronutrientes, nunca ignore a matemática.

FORMATO DE SAÍDA (OBRIGATÓRIO)

Retorne APENAS um JSON válido

Sem markdown

Sem explicações

Sem comentários

Sem texto adicional

Campos obrigatórios sempre presentes

"calories": número inteiro

Macronutrientes: máximo 1 casa decimal

Estrutura fixa (campos obrigatórios):
{
"food_name": "string",
"weight_grams": número,
"calories": número inteiro,
"protein_g": número (até 1 casa decimal),
"carbs_g": número (até 1 casa decimal),
"fat_g": número (até 1 casa decimal),
"confidence": "alta" | "média" | "baixa"
}

Campos opcionais (inclua apenas se relevante):
"fiber_g": número (até 1 casa decimal)
"notes": "string"

Se fibra não for relevante ou confiável, omita fiber_g.
Se não houver observações, omita notes.

Alimento: "${foodDescription}"
Peso: ${weightGrams}g

VALORES DE REFERÊNCIA (por 100g):
- Arroz branco cozido: ~130 kcal, 2.3g proteína, 28g carboidrato, 0.2g gordura
- Batata cozida: ~75 kcal, 1.5g proteína, 17g carboidrato, 0.1g gordura
- Alface: ~15 kcal, 1.2g proteína, 2.5g carboidrato, 0.2g gordura`;
  }

  private parseGeminiResponse(responseText: string): GeminiNutritionResponse {
    try {
      const cleaned = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const parsed = JSON.parse(cleaned) as GeminiNutritionResponse;

      if (!parsed.food_name || typeof parsed.calories !== "number") {
        throw new Error("Response missing required fields");
      }

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
