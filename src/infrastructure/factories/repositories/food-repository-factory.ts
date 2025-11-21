import { IFoodRepository } from "@domain/repositories/food.repository";
import { MongoDBFoodRepository } from "../../repositories/mongodb-food.repository";

export const makeFoodRepository = (): IFoodRepository => {
  return new MongoDBFoodRepository();
};

