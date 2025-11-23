import { ProcessMessageUseCase } from "@application/use-cases/process-message.use-case";
import { makeAnalyzeNutritionUseCase } from "./analyze-nutrition-use-case-factory";
import { makeSaveMealUseCase } from "./save-meal-use-case-factory";
import { makeGetDailySummaryUseCase } from "./get-daily-summary-use-case-factory";

export const makeProcessMessageUseCase = (): ProcessMessageUseCase => {
  return new ProcessMessageUseCase(
    makeAnalyzeNutritionUseCase(),
    makeSaveMealUseCase(),
    makeGetDailySummaryUseCase()
  );
};

