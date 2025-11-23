import { IPacoRepository } from "@domain/repositories/paco.repository";
import { GeminiService } from "@infrastructure/gemini/gemini.service";
import { Result, success, failure } from "@shared/types/result";
import { NutritionAnalysisDto, NutritionItemDto } from "../dtos/nutrition-analysis.dto";
import { ERROR_MESSAGES } from "@shared/constants/error-messages.constants";
import { logger } from "@shared/logger/logger";

export class AnalyzeNutritionUseCase {
  constructor(
    private readonly pacoRepository: IPacoRepository,
    private readonly geminiService: GeminiService | null
  ) {}

  async executeFromText(text: string): Promise<Result<NutritionAnalysisDto, string>> {
    if (!this.geminiService) {
      return failure(ERROR_MESSAGES.GEMINI.API_KEY_MISSING);
    }

    try {
      const extractedItems = await this.geminiService.extractFoodItemsFromText(text);
      return this.buildNutritionAnalysis(extractedItems);
    } catch (error) {
      logger.error({ error, text }, "Failed to analyze nutrition from text");
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.NUTRITION.FAILED_TO_ANALYZE;
      return failure(errorMessage);
    }
  }

  async executeFromImage(imageBase64: string, mimeType: string): Promise<Result<NutritionAnalysisDto, string>> {
    if (!this.geminiService) {
      return failure(ERROR_MESSAGES.GEMINI.API_KEY_MISSING);
    }

    try {
      const extractedItems = await this.geminiService.extractFoodItemsFromImage(imageBase64, mimeType);
      return this.buildNutritionAnalysis(extractedItems);
    } catch (error) {
      logger.error({ error }, "Failed to analyze nutrition from image");
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.NUTRITION.FAILED_TO_ANALYZE;
      return failure(errorMessage);
    }
  }

  private async buildNutritionAnalysis(
    extractedItems: Array<{ name: string; quantity: string; weightGrams: number; unit?: string }>
  ): Promise<Result<NutritionAnalysisDto, string>> {
    const nutritionItems: NutritionItemDto[] = [];
    const totals = {
      kcal: 0,
      proteinG: 0,
      carbG: 0,
      fatG: 0,
    };

    for (const item of extractedItems) {
      const pacoItem = await this.pacoRepository.findByName(item.name);

      if (!pacoItem) {
        logger.warn({ name: item.name }, "Item not found in PACO");
        continue;
      }

      const nutrients = pacoItem.calculateNutritionForWeight(item.weightGrams);

      nutritionItems.push({
        name: pacoItem.nome,
        quantity: item.quantity,
        weightGrams: item.weightGrams,
        pacoId: pacoItem.id,
        nutrients: {
          kcal: nutrients.kcal,
          proteinG: nutrients.proteinaG,
          carbG: nutrients.carboidratoG,
          fatG: nutrients.lipidioG,
        },
      });

      totals.kcal += nutrients.kcal;
      totals.proteinG += nutrients.proteinaG;
      totals.carbG += nutrients.carboidratoG;
      totals.fatG += nutrients.lipidioG;
    }

    if (nutritionItems.length === 0) {
      return failure(ERROR_MESSAGES.NUTRITION.ITEM_NOT_FOUND_IN_PACO);
    }

    return success({
      items: nutritionItems,
      totals: {
        kcal: Math.round(totals.kcal * 100) / 100,
        proteinG: Math.round(totals.proteinG * 100) / 100,
        carbG: Math.round(totals.carbG * 100) / 100,
        fatG: Math.round(totals.fatG * 100) / 100,
      },
    });
  }
}

