import { User } from "@domain/entities/user.entity";
import { IUserRepository } from "@domain/repositories/user.repository";
import { Result, success, failure } from "@shared/types/result";
import { ERROR_MESSAGES } from "@shared/constants/error-messages.constants";
import { logger } from "@shared/logger/logger";

export class GetUserByPhoneUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(phoneNumber: string): Promise<Result<User, string>> {
    try {
      const user = await this.userRepository.findByPhoneNumber(phoneNumber);
      if (!user) {
        return failure(ERROR_MESSAGES.USER.NOT_FOUND);
      }

      return success(user);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.USER.NOT_FOUND;
      logger.error({ error, phoneNumber }, "Failed to get user by phone number");
      return failure(errorMessage);
    }
  }
}
