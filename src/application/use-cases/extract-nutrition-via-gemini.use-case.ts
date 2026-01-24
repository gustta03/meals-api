/**
 * Use Case: Extrair Dados Nutricionais via Gemini
 * 
 * Responsabilidades:
 * - Coordenar extração de nutrição com Gemini
 * - Converter resultado para NutritionAnalysisDto
 * - Tratar erros e retornar Result
 */

import { Result, success, failure } from "@shared/types/result";
import { GeminiNutritionExtractor } from "@infrastructure/gemini/gemini-nutrition-extractor";
import { ERROR_MESSAGES } from "@shared/constants/error-messages.constants";
import { logger } from "@shared/logger/logger";
import type { NutritionAnalysisDto } from "@application/dtos/nutrition-analysis.dto";

export class ExtractNutritionViaGeminiUseCase {
  constructor(private readonly geminiExtractor: GeminiNutritionExtractor) {}

  /**
   * Extrai dados nutricionais para um alimento específico
   */
  async executeForFood(
    foodDescription: string,
    weightGrams: number
  ): Promise<Result<NutritionAnalysisDto, string>> {
    if (!foodDescription || foodDescription.trim().length === 0) {
      return failure(ERROR_MESSAGES.NUTRITION.INVALID_INPUT);
    }

    if (weightGrams <= 0 || weightGrams > 5000) {
      return failure("Peso deve estar entre 1g e 5000g");
    }

    try {
      const extractionResult = await this.geminiExtractor.extract(
        foodDescription,
        weightGrams
      );

      if (!extractionResult.isValid) {
        logger.warn(
          { foodDescription, reason: extractionResult.reason },
          "Failed to extract nutrition via Gemini"
        );
        return failure(
          `Não consegui extrair dados de nutrição: ${extractionResult.reason}`
        );
      }

      const analysisDto = this.convertToNutritionAnalysis(extractionResult);
      return success(analysisDto);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : ERROR_MESSAGES.NUTRITION.FAILED_TO_ANALYZE;

      logger.error(
        { error, foodDescription, weightGrams },
        "Error in ExtractNutritionViaGeminiUseCase"
      );

      return failure(errorMessage);
    }
  }

  /**
   * Extrai dados nutricionais para múltiplos alimentos
   */
  async executeForFoods(
    foods: Array<{ description: string; weightGrams: number }>
  ): Promise<Result<NutritionAnalysisDto, string>> {
    if (foods.length === 0) {
      return failure(ERROR_MESSAGES.NUTRITION.INVALID_INPUT);
    }

    try {
      const extractedItems = await Promise.all(
        foods.map((food) =>
          this.geminiExtractor.extract(food.description, food.weightGrams)
        )
      );

      // Validar se todos foram extraídos com sucesso
      const invalidItems = extractedItems.filter((item) => !item.isValid);
      if (invalidItems.length > 0) {
        logger.warn(
          { totalItems: foods.length, failedItems: invalidItems.length },
          "Some nutrition items failed to extract"
        );
        // Continuar com itens válidos
      }

      const validItems = extractedItems.filter((item) => item.isValid);
      if (validItems.length === 0) {
        return failure(
          "Não consegui extrair dados nutricionais de nenhum alimento"
        );
      }

      const analysis = this.buildCombinedAnalysis(validItems);
      return success(analysis);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : ERROR_MESSAGES.NUTRITION.FAILED_TO_ANALYZE;

      logger.error(
        { error, foodCount: foods.length },
        "Error extracting multiple foods via Gemini"
      );

      return failure(errorMessage);
    }
  }

  /**
   * Converte resultado de extração para NutritionAnalysisDto
   */
  private convertToNutritionAnalysis(
    extractedData: any
  ): NutritionAnalysisDto {
    return {
      items: [
        {
          name: extractedData.foodName,
          quantity: `${extractedData.weightGrams}g`,
          weightGrams: extractedData.weightGrams,
          pacoId: `gemini_${Date.now()}`,
          nutrients: {
            kcal: extractedData.calories,
            proteinG: extractedData.proteinG,
            carbG: extractedData.carbsG,
            fatG: extractedData.fatG,
          },
        },
      ],
      totals: {
        kcal: Math.round(extractedData.calories * 100) / 100,
        proteinG: Math.round(extractedData.proteinG * 100) / 100,
        carbG: Math.round(extractedData.carbsG * 100) / 100,
        fatG: Math.round(extractedData.fatG * 100) / 100,
      },
    };
  }

  /**
   * Combina análises de múltiplos alimentos
   */
  private buildCombinedAnalysis(
    validItems: any[]
  ): NutritionAnalysisDto {
    const items = validItems.map((item, index) => {
      // A estrutura retornada pelo validator (ValidatedNutritionDto) tem:
      // foodName, weightGrams, calories, proteinG, carbsG, fatG
      // Verificar se é ValidatedNutritionDto (tem isValid: true)
      if (!item.isValid) {
        logger.warn(
          { item, index },
          "Invalid item passed to buildCombinedAnalysis"
        );
        return null;
      }

      const foodName = item.foodName || `Alimento ${index + 1}`;
      const weightGrams = item.weightGrams || 100;
      const calories = item.calories || 0;
      const proteinG = item.proteinG || 0;
      const carbsG = item.carbsG || 0;
      const fatG = item.fatG || 0;

      logger.debug(
        {
          foodName,
          weightGrams,
          calories,
          proteinG,
          carbsG,
          fatG,
          itemStructure: Object.keys(item),
        },
        "Building combined analysis item"
      );

      return {
        name: foodName,
        quantity: `${weightGrams}g`,
        weightGrams: weightGrams,
        pacoId: `gemini_${Date.now()}_${index}`,
        nutrients: {
          kcal: Math.round(calories * 100) / 100,
          proteinG: Math.round(proteinG * 100) / 100,
          carbG: Math.round(carbsG * 100) / 100,
          fatG: Math.round(fatG * 100) / 100,
        },
      };
    }).filter((item) => item !== null) as Array<{
      name: string;
      quantity: string;
      weightGrams: number;
      pacoId: string;
      nutrients: {
        kcal: number;
        proteinG: number;
        carbG: number;
        fatG: number;
      };
    }>;

    const totals = {
      kcal: 0,
      proteinG: 0,
      carbG: 0,
      fatG: 0,
    };

    items.forEach((item) => {
      totals.kcal += item.nutrients.kcal;
      totals.proteinG += item.nutrients.proteinG;
      totals.carbG += item.nutrients.carbG;
      totals.fatG += item.nutrients.fatG;
    });

    // Arredondar totais
    totals.kcal = Math.round(totals.kcal * 100) / 100;
    totals.proteinG = Math.round(totals.proteinG * 100) / 100;
    totals.carbG = Math.round(totals.carbG * 100) / 100;
    totals.fatG = Math.round(totals.fatG * 100) / 100;

    // Validação matemática: verificar se os valores fazem sentido
    // 1g carboidrato = 4 kcal, 1g proteína = 4 kcal, 1g gordura = 9 kcal
    const calculatedCalories = (totals.carbG * 4) + (totals.proteinG * 4) + (totals.fatG * 9);
    const calorieDifference = Math.abs(totals.kcal - calculatedCalories);
    
    if (calorieDifference > totals.kcal * 0.2) { // Mais de 20% de diferença
      logger.warn(
        {
          reportedCalories: totals.kcal,
          calculatedCalories: Math.round(calculatedCalories * 100) / 100,
          difference: calorieDifference,
          items: items.map((i) => ({
            name: i.name,
            weight: i.weightGrams,
            kcal: i.nutrients.kcal,
          })),
        },
        "Calorie mismatch detected - values may be incorrect"
      );
    }

    logger.debug(
      {
        totalItems: items.length,
        totals,
        calculatedCalories: Math.round(calculatedCalories * 100) / 100,
        calorieDifference: Math.round(calorieDifference * 100) / 100,
      },
      "Combined analysis built"
    );

    return { items, totals };
  }
}
