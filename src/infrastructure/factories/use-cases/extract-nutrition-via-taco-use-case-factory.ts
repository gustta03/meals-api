import { ExtractNutritionViaTacoUseCase } from "@application/use-cases/extract-nutrition-via-taco.use-case";
import { makeTacoFoodResolverService } from "../services/taco-food-resolver-service-factory";
import { makeTacoNutritionCalculatorService } from "../services/taco-nutrition-calculator-service-factory";

export const makeExtractNutritionViaTacoUseCase = (): ExtractNutritionViaTacoUseCase => {
  return new ExtractNutritionViaTacoUseCase(
    makeTacoFoodResolverService(),
    makeTacoNutritionCalculatorService()
  );
};
