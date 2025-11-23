import { IMealRepository } from "@domain/repositories/meal.repository";
import { MongoDBMealRepository } from "../../repositories/mongodb-meal.repository";

export const makeMealRepository = (): IMealRepository => {
  return new MongoDBMealRepository();
};

