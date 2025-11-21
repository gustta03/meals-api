import { UpdateFoodUseCase } from "@application/use-cases/update-food.use-case";
import { makeFoodRepository } from "../repositories/food-repository-factory";

export const makeUpdateFoodUseCase = (): UpdateFoodUseCase => {
  return new UpdateFoodUseCase(makeFoodRepository());
};

