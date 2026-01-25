import { Result, success, failure } from "@shared/types/result";
import { TacoFoodResolverService } from "@infrastructure/services/taco-food-resolver.service";
import { TacoNutritionCalculatorService } from "@infrastructure/services/taco-nutrition-calculator.service";
import { ERROR_MESSAGES } from "@shared/constants/error-messages.constants";
import { logger } from "@shared/logger/logger";
import type { NutritionAnalysisDto } from "@application/dtos/nutrition-analysis.dto";

export class ExtractNutritionViaTacoUseCase {
  constructor(
    private readonly tacoFoodResolver: TacoFoodResolverService,
    private readonly tacoNutritionCalculator: TacoNutritionCalculatorService
  ) {}

  async execute(messageBody: string): Promise<Result<NutritionAnalysisDto, string>> {
    if (!messageBody || messageBody.trim().length === 0) {
      return failure(ERROR_MESSAGES.NUTRITION.INVALID_INPUT);
    }

    try {
      logger.debug({ messageBody }, "Resolving foods from message via TACO");
      
      const resolvedFoods = await this.tacoFoodResolver.resolveFoodsFromMessage(messageBody.trim());
      
      if (resolvedFoods.length === 0) {
        logger.warn({ messageBody }, "No foods resolved from message");
        return failure("Não consegui identificar alimentos válidos na mensagem");
      }
      
      logger.debug(
        {
          resolvedCount: resolvedFoods.length,
          foods: resolvedFoods.map((f) => ({
            name: f.tacoItem.nome,
            weight: f.weightGrams,
            confidence: f.confidence,
          })),
        },
        "Foods resolved successfully"
      );
      
      const analysis = this.tacoNutritionCalculator.calculateNutritionForFoods(resolvedFoods);
      
      return success(analysis);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : ERROR_MESSAGES.NUTRITION.FAILED_TO_ANALYZE;

      logger.error(
        { error, messageBody },
        "Error extracting nutrition via TACO"
      );

      return failure(errorMessage);
    }
  }
}
