import { TacoFoodResolverService } from "@infrastructure/services/taco-food-resolver.service";
import { makeTacoRepository } from "../repositories/taco-repository-factory";
import { makeGeminiService } from "./gemini-service-factory";

export const makeTacoFoodResolverService = (): TacoFoodResolverService => {
  return new TacoFoodResolverService(makeTacoRepository(), makeGeminiService());
};
