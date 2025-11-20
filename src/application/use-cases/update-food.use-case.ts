import { Food } from "@domain/entities/food.entity";
import { IFoodRepository } from "@domain/repositories/food.repository";
import { UpdateFoodDto } from "../dtos/update-food.dto";
import { Result, success, failure } from "@shared/types/result";

/**
 * Caso de uso: Atualizar um alimento
 */
export class UpdateFoodUseCase {
  constructor(private readonly foodRepository: IFoodRepository) {}

  async execute(id: string, dto: UpdateFoodDto): Promise<Result<Food, string>> {
    try {
      const existingFood = await this.foodRepository.findById(id);

      if (!existingFood) {
        return failure("Food not found");
      }

      // Atualizar apenas os campos fornecidos
      const updatedFood = existingFood.updateMacros(
        dto.calories ?? existingFood.calories,
        dto.protein ?? existingFood.protein,
        dto.carbs ?? existingFood.carbs,
        dto.fat ?? existingFood.fat
      );

      const savedFood = await this.foodRepository.update(updatedFood);

      return success<Food, string>(savedFood);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update food";
      return failure<string>(errorMessage);
    }
  }
}

