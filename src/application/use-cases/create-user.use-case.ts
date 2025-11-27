import { User } from "@domain/entities/user.entity";
import { IUserRepository } from "@domain/repositories/user.repository";
import { Result, success, failure } from "@shared/types/result";
import { generateUUID } from "@shared/utils/uuid";
import { ERROR_MESSAGES } from "@shared/constants/error-messages.constants";
import { logger } from "@shared/logger/logger";

export interface CreateUserDto {
  phoneNumber: string;
  name?: string;
}

export class CreateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(dto: CreateUserDto): Promise<Result<User, string>> {
    try {
      const existingUser = await this.userRepository.findByPhoneNumber(dto.phoneNumber);
      if (existingUser) {
        return failure(ERROR_MESSAGES.USER.ALREADY_EXISTS);
      }

      const id = generateUUID();
      const user = User.create(id, dto.phoneNumber, dto.name);

      const savedUser = await this.userRepository.save(user);

      logger.info({ userId: savedUser.id, phoneNumber: savedUser.phoneNumber }, "User created successfully");
      return success(savedUser);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.USER.FAILED_TO_CREATE;
      logger.error({ error, phoneNumber: dto.phoneNumber }, "Failed to create user");
      return failure(errorMessage);
    }
  }
}
