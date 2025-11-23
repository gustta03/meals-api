import { SaveMealUseCase } from "@application/use-cases/save-meal.use-case";
import { makeMealRepository } from "../repositories/meal-repository-factory";

export const makeSaveMealUseCase = (): SaveMealUseCase => {
  return new SaveMealUseCase(makeMealRepository());
};

