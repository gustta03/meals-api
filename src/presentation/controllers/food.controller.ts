import { CreateFoodUseCase } from "@application/use-cases/create-food.use-case";
import { GetFoodUseCase } from "@application/use-cases/get-food.use-case";
import { ListFoodsUseCase } from "@application/use-cases/list-foods.use-case";
import { UpdateFoodUseCase } from "@application/use-cases/update-food.use-case";
import { DeleteFoodUseCase } from "@application/use-cases/delete-food.use-case";
import { FoodMapper } from "@application/mappers/food.mapper";
import { CreateFoodDto } from "@application/dtos/create-food.dto";
import { UpdateFoodDto } from "@application/dtos/update-food.dto";
import { FoodResponseDto } from "@application/dtos/food-response.dto";
import { Result } from "@shared/types/result";
import { Food } from "@domain/entities/food.entity";

/**
 * Controller para gerenciar operações relacionadas a alimentos
 * Não conhece o framework HTTP, apenas lógica de apresentação
 */
export class FoodController {
  constructor(
    private readonly createFoodUseCase: CreateFoodUseCase,
    private readonly getFoodUseCase: GetFoodUseCase,
    private readonly listFoodsUseCase: ListFoodsUseCase,
    private readonly updateFoodUseCase: UpdateFoodUseCase,
    private readonly deleteFoodUseCase: DeleteFoodUseCase
  ) {}

  async create(dto: CreateFoodDto): Promise<Result<FoodResponseDto, string>> {
    const result = await this.createFoodUseCase.execute(dto);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      data: FoodMapper.toDto(result.data),
    };
  }

  async list(): Promise<Result<FoodResponseDto[], string>> {
    const result = await this.listFoodsUseCase.execute();

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      data: FoodMapper.toDtoList(result.data),
    };
  }

  async getById(id: string): Promise<Result<FoodResponseDto, string>> {
    const result = await this.getFoodUseCase.execute(id);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      data: FoodMapper.toDto(result.data),
    };
  }

  async update(
    id: string,
    dto: UpdateFoodDto
  ): Promise<Result<FoodResponseDto, string>> {
    const result = await this.updateFoodUseCase.execute(id, dto);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      data: FoodMapper.toDto(result.data),
    };
  }

  async delete(id: string): Promise<Result<void, string>> {
    const result = await this.deleteFoodUseCase.execute(id);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true, data: undefined };
  }
}
