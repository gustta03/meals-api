import { IMealRepository } from "@domain/repositories/meal.repository";
import { Result, success, failure } from "@shared/types/result";
import { logger } from "@shared/logger/logger";

export interface DailySummaryDto {
  date: string;
  meals: Array<{
    id: string;
    mealType: string;
    items: Array<{
      name: string;
      quantity: string;
      weightGrams: number;
      nutrients: {
        kcal: number;
        proteinG: number;
        carbG: number;
        fatG: number;
      };
    }>;
    totals: {
      kcal: number;
      proteinG: number;
      carbG: number;
      fatG: number;
    };
  }>;
  dailyTotals: {
    kcal: number;
    proteinG: number;
    carbG: number;
    fatG: number;
  };
}

export class GetDailySummaryUseCase {
  constructor(private readonly mealRepository: IMealRepository) {}

  async execute(userId: string, date?: Date): Promise<Result<DailySummaryDto, string>> {
    try {
      const targetDate = date || new Date();
      const meals = await this.mealRepository.findByUserIdAndDate(userId, targetDate);

      const dailyTotals = {
        kcal: 0,
        proteinG: 0,
        carbG: 0,
        fatG: 0,
      };

      const mealsDto = meals.map((meal) => {
        dailyTotals.kcal += meal.totals.kcal;
        dailyTotals.proteinG += meal.totals.proteinG;
        dailyTotals.carbG += meal.totals.carbG;
        dailyTotals.fatG += meal.totals.fatG;

        return {
          id: meal.id,
          mealType: meal.mealType,
          items: meal.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            weightGrams: item.weightGrams,
            nutrients: item.nutrients,
          })),
          totals: meal.totals,
        };
      });

      return success({
        date: targetDate.toISOString().split("T")[0],
        meals: mealsDto,
        dailyTotals: {
          kcal: Math.round(dailyTotals.kcal * 100) / 100,
          proteinG: Math.round(dailyTotals.proteinG * 100) / 100,
          carbG: Math.round(dailyTotals.carbG * 100) / 100,
          fatG: Math.round(dailyTotals.fatG * 100) / 100,
        },
      });
    } catch (error) {
      logger.error({ error, userId, date }, "Failed to get daily summary");
      const errorMessage = error instanceof Error ? error.message : "Failed to get daily summary";
      return failure(errorMessage);
    }
  }
}

