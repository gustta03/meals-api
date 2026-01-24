import { ProcessMessageUseCase } from "@application/use-cases/process-message.use-case";
import { ExtractNutritionViaGeminiUseCase } from "@application/use-cases/extract-nutrition-via-gemini.use-case";
import { makeAnalyzeNutritionUseCase } from "./analyze-nutrition-use-case-factory";
import { makeSaveMealUseCase } from "./save-meal-use-case-factory";
import { makeGetDailySummaryUseCase } from "./get-daily-summary-use-case-factory";
import { makeManageOnboardingUseCase } from "./manage-onboarding-use-case-factory";
import { makeEnsureUserExistsUseCase } from "./ensure-user-exists-use-case-factory";
import { makeProgressBarService } from "../services/progress-bar-service-factory";
import { makeUserSessionRepository } from "../repositories/user-session-repository-factory";
import { makeGeminiNutritionExtractor } from "../services/gemini-nutrition-extractor.factory";

export const makeExtractNutritionViaGeminiUseCase = (): ExtractNutritionViaGeminiUseCase => {
  return new ExtractNutritionViaGeminiUseCase(makeGeminiNutritionExtractor());
};

export const makeProcessMessageUseCase = (): ProcessMessageUseCase => {
  return new ProcessMessageUseCase(
    makeAnalyzeNutritionUseCase(),
    makeExtractNutritionViaGeminiUseCase(),
    makeSaveMealUseCase(),
    makeGetDailySummaryUseCase(),
    makeManageOnboardingUseCase(),
    makeEnsureUserExistsUseCase(),
    makeProgressBarService(),
    makeUserSessionRepository()
  );
};

