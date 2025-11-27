import { User } from "@domain/entities/user.entity";
import { IUserRepository } from "@domain/repositories/user.repository";
import { CreateUserUseCase } from "./create-user.use-case";
import { GetUserByPhoneUseCase } from "./get-user-by-phone.use-case";
import { Result, success } from "@shared/types/result";
import { ERROR_MESSAGES } from "@shared/constants/error-messages.constants";
import { logger } from "@shared/logger/logger";

export class EnsureUserExistsUseCase {
  constructor(
    private readonly getUserByPhoneUseCase: GetUserByPhoneUseCase,
    private readonly createUserUseCase: CreateUserUseCase
  ) {}

  async execute(phoneNumber: string, name?: string): Promise<Result<User, string>> {
    try {
      const getUserResult = await this.getUserByPhoneUseCase.execute(phoneNumber);

      if (getUserResult.success) {
        logger.debug({ userId: getUserResult.data.id, phoneNumber }, "User already exists");
        return success(getUserResult.data);
      }

      // Only create new user if the error is specifically "NOT_FOUND"
      // Other errors (like database connection issues) should be propagated
      if (getUserResult.error !== ERROR_MESSAGES.USER.NOT_FOUND) {
        logger.error({ error: getUserResult.error, phoneNumber }, "Failed to get user, not creating new user");
        return getUserResult;
      }

      logger.info({ phoneNumber }, "User not found, creating new user");
      const createResult = await this.createUserUseCase.execute({ phoneNumber, name });

      if (!createResult.success) {
        logger.error({ error: createResult.error, phoneNumber }, "Failed to create user");
        return createResult;
      }

      logger.info({ userId: createResult.data.id, phoneNumber }, "User created successfully");
      return success(createResult.data);
    } catch (error) {
      logger.error({ error, phoneNumber }, "Failed to ensure user exists");
      const errorMessage = error instanceof Error ? error.message : "Failed to ensure user exists";
      return { success: false, error: errorMessage };
    }
  }
}
