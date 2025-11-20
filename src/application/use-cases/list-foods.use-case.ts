import { Food } from "@domain/entities/food.entity";
import { IFoodRepository } from "@domain/repositories/food.repository";
import { Result, success, failure } from "@shared/types/result";

/**
 * Caso de uso: Listar todos os alimentos
 */
export class ListFoodsUseCase {
  constructor(private readonly foodRepository: IFoodRepository) {}

  async execute(): Promise<Result<Food[], string>> {
    try {
      const foods = await this.foodRepository.findAll();
      return success<Food[], string>(foods);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to list foods";
      return failure<string>(errorMessage);
    }
  }
}

