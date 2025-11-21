import { ListFoodsUseCase } from "@application/use-cases/list-foods.use-case";
import { makeFoodRepository } from "../repositories/food-repository-factory";

export const makeListFoodsUseCase = (): ListFoodsUseCase => {
  return new ListFoodsUseCase(makeFoodRepository());
};

