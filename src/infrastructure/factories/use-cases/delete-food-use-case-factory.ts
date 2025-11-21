import { DeleteFoodUseCase } from "@application/use-cases/delete-food.use-case";
import { makeFoodRepository } from "../repositories/food-repository-factory";

export const makeDeleteFoodUseCase = (): DeleteFoodUseCase => {
  return new DeleteFoodUseCase(makeFoodRepository());
};

