import { Meal, MealType } from "@domain/entities/meal.entity";
import { IMealRepository } from "@domain/repositories/meal.repository";
import { NutritionAnalysisDto } from "../dtos/nutrition-analysis.dto";
import { Result, success, failure } from "@shared/types/result";
import { generateUUID } from "@shared/utils/uuid";
import { logger } from "@shared/logger/logger";
import { getDateKey, formatDate } from "@shared/utils/date.utils";

export class SaveMealUseCase {
  constructor(private readonly mealRepository: IMealRepository) {}

  async execute(
    userId: string,
    nutritionAnalysis: NutritionAnalysisDto,
    mealType: MealType = "other"
  ): Promise<Result<Meal, string>> {
    try {
      const id = generateUUID();

      const meal = Meal.create(
        id,
        userId,
        nutritionAnalysis.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          weightGrams: item.weightGrams,
          pacoId: item.pacoId,
          nutrients: item.nutrients,
        })),
        nutritionAnalysis.totals,
        mealType
      );

      const savedMeal = await this.mealRepository.save(meal);

      logger.info(
        {
          mealId: savedMeal.id,
          userId,
          mealDate: savedMeal.date.toISOString(),
          mealDateKey: getDateKey(savedMeal.date),
          mealDateLocal: formatDate(savedMeal.date, "DD/MM/YYYY HH:mm:ss"),
        },
        "Meal saved successfully"
      );
      return success(savedMeal);
    } catch (error) {
      logger.error({ error, userId }, "Failed to save meal");
      const errorMessage = error instanceof Error ? error.message : "Failed to save meal";
      return failure(errorMessage);
    }
  }
}

