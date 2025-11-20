import { Food } from "@domain/entities/food.entity";
import { IFoodRepository } from "@domain/repositories/food.repository";
import { Result, success, failure } from "@shared/types/result";

/**
 * Caso de uso: Buscar um alimento por ID
 */
export class GetFoodUseCase {
  constructor(private readonly foodRepository: IFoodRepository) {}

  async execute(id: string): Promise<Result<Food, string>> {
    try {
      const food = await this.foodRepository.findById(id);

      if (!food) {
        return failure("Food not found");
      }

      return success<Food, string>(food);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to get food";
      return failure<string>(errorMessage);
    }
  }
}

