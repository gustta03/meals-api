import { IFoodRepository } from "@domain/repositories/food.repository";
import { Result, success, failure } from "@shared/types/result";

/**
 * Caso de uso: Deletar um alimento
 */
export class DeleteFoodUseCase {
  constructor(private readonly foodRepository: IFoodRepository) {}

  async execute(id: string): Promise<Result<void, string>> {
    try {
      const existingFood = await this.foodRepository.findById(id);

      if (!existingFood) {
        return failure("Food not found");
      }

      await this.foodRepository.delete(id);

      return success<void, string>(undefined);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete food";
      return failure<string>(errorMessage);
    }
  }
}

