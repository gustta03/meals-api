import { AnalyzeNutritionUseCase } from "@application/use-cases/analyze-nutrition.use-case";
import { makePacoRepository } from "../repositories/paco-repository-factory";
import { makeGeminiService } from "../services/gemini-service-factory";

export const makeAnalyzeNutritionUseCase = (): AnalyzeNutritionUseCase => {
  return new AnalyzeNutritionUseCase(makePacoRepository(), makeGeminiService());
};

