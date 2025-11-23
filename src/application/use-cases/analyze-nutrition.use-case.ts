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
    extractedItems: Array<{ nome: string; quantidade: string; peso_gramas: number; unidade?: string }>
  ): Promise<Result<NutritionAnalysisDto, string>> {
    const nutritionItems: NutritionItemDto[] = [];
    const totais = {
      kcal: 0,
      proteina_g: 0,
      carboidrato_g: 0,
      lipidio_g: 0,
    };

    for (const item of extractedItems) {
      const pacoItem = await this.pacoRepository.findByName(item.nome);

      if (!pacoItem) {
        logger.warn({ nome: item.nome }, "Item not found in PACO");
        continue;
      }

      const nutrientes = pacoItem.calculateNutritionForWeight(item.peso_gramas);

      nutritionItems.push({
        nome: pacoItem.nome,
        quantidade: item.quantidade,
        peso_gramas: item.peso_gramas,
        paco_id: pacoItem.id,
        nutrientes: {
          kcal: nutrientes.kcal,
          proteina_g: nutrientes.proteinaG,
          carboidrato_g: nutrientes.carboidratoG,
          lipidio_g: nutrientes.lipidioG,
        },
      });

      totais.kcal += nutrientes.kcal;
      totais.proteina_g += nutrientes.proteinaG;
      totais.carboidrato_g += nutrientes.carboidratoG;
      totais.lipidio_g += nutrientes.lipidioG;
    }

    if (nutritionItems.length === 0) {
      return failure(ERROR_MESSAGES.NUTRITION.ITEM_NOT_FOUND_IN_PACO);
    }

    return success({
      items: nutritionItems,
      totais: {
        kcal: Math.round(totais.kcal * 100) / 100,
        proteina_g: Math.round(totais.proteina_g * 100) / 100,
        carboidrato_g: Math.round(totais.carboidrato_g * 100) / 100,
        lipidio_g: Math.round(totais.lipidio_g * 100) / 100,
      },
    });
  }
}

