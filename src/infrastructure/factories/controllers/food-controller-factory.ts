import { FoodController } from "@presentation/controllers/food.controller";
import { makeCreateFoodUseCase } from "../use-cases/create-food-use-case-factory";
import { makeGetFoodUseCase } from "../use-cases/get-food-use-case-factory";
import { makeListFoodsUseCase } from "../use-cases/list-foods-use-case-factory";
import { makeUpdateFoodUseCase } from "../use-cases/update-food-use-case-factory";
import { makeDeleteFoodUseCase } from "../use-cases/delete-food-use-case-factory";

export const makeFoodController = (): FoodController => {
  return new FoodController(
    makeCreateFoodUseCase(),
    makeGetFoodUseCase(),
    makeListFoodsUseCase(),
    makeUpdateFoodUseCase(),
    makeDeleteFoodUseCase()
  );
};

