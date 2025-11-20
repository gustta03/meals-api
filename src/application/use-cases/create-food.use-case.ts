import { Food } from "@domain/entities/food.entity";
import { IFoodRepository } from "@domain/repositories/food.repository";
import { CreateFoodDto } from "../dtos/create-food.dto";
import { Result, success, failure } from "@shared/types/result";
import { generateUUID } from "@shared/utils/uuid";

/**
 * Caso de uso: Criar um novo alimento
 * Implementa a lógica de negócio para criação de alimentos
 */
export class CreateFoodUseCase {
  constructor(private readonly foodRepository: IFoodRepository) {}

  async execute(dto: CreateFoodDto): Promise<Result<Food, string>> {
    try {
      // Verificar se já existe um alimento com o mesmo nome
      const existingFood = await this.foodRepository.findByName(dto.name);
      if (existingFood) {
        return failure("Food with this name already exists");
      }

      // Gerar ID único
      const id = generateUUID();

      // Criar entidade de domínio
      const food = Food.create(
        id,
        dto.name,
        dto.calories,
        dto.protein,
        dto.carbs,
        dto.fat
      );

      // Persistir
      const savedFood = await this.foodRepository.save(food);

      return success(savedFood);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create food";
      return failure<string>(errorMessage);
    }
  }
}

