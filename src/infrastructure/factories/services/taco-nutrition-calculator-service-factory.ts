import { TacoNutritionCalculatorService } from "@infrastructure/services/taco-nutrition-calculator.service";

export const makeTacoNutritionCalculatorService = (): TacoNutritionCalculatorService => {
  return new TacoNutritionCalculatorService();
};
