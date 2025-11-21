import { GetFoodUseCase } from "@application/use-cases/get-food.use-case";
import { makeFoodRepository } from "../repositories/food-repository-factory";

export const makeGetFoodUseCase = (): GetFoodUseCase => {
  return new GetFoodUseCase(makeFoodRepository());
};

