import { CreateFoodUseCase } from "@application/use-cases/create-food.use-case";
import { makeFoodRepository } from "../repositories/food-repository-factory";

export const makeCreateFoodUseCase = (): CreateFoodUseCase => {
  return new CreateFoodUseCase(makeFoodRepository());
};

