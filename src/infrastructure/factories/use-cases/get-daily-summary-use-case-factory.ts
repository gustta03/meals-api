import { GetDailySummaryUseCase } from "@application/use-cases/get-daily-summary.use-case";
import { makeMealRepository } from "../repositories/meal-repository-factory";

export const makeGetDailySummaryUseCase = (): GetDailySummaryUseCase => {
  return new GetDailySummaryUseCase(makeMealRepository());
};

