import { ProcessMessageUseCase } from "@application/use-cases/process-message.use-case";
import { makeAnalyzeNutritionUseCase } from "./analyze-nutrition-use-case-factory";
import { makeSaveMealUseCase } from "./save-meal-use-case-factory";
import { makeGetDailySummaryUseCase } from "./get-daily-summary-use-case-factory";
import { createGenerateWeeklyReportUseCase } from "./generate-weekly-report-use-case-factory";
import { makeManageOnboardingUseCase } from "./manage-onboarding-use-case-factory";
import { makeEnsureUserExistsUseCase } from "./ensure-user-exists-use-case-factory";
import { makeProgressBarService } from "../services/progress-bar-service-factory";
import { makeUserSessionRepository } from "../repositories/user-session-repository-factory";

export const makeProcessMessageUseCase = (): ProcessMessageUseCase => {
  return new ProcessMessageUseCase(
    makeAnalyzeNutritionUseCase(),
    makeSaveMealUseCase(),
    makeGetDailySummaryUseCase(),
    createGenerateWeeklyReportUseCase(),
    makeManageOnboardingUseCase(),
    makeEnsureUserExistsUseCase(),
    makeProgressBarService(),
    makeUserSessionRepository()
  );
};

