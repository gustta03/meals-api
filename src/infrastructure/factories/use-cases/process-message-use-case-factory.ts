import { ProcessMessageUseCase } from "@application/use-cases/process-message.use-case";
import { makeAnalyzeNutritionUseCase } from "./analyze-nutrition-use-case-factory";

export const makeProcessMessageUseCase = (): ProcessMessageUseCase => {
  return new ProcessMessageUseCase(makeAnalyzeNutritionUseCase());
};

