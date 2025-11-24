import { IUserSessionRepository } from "@domain/repositories/user-session.repository";
import { IMealRepository } from "@domain/repositories/meal.repository";
import { UserSession } from "@domain/entities/user-session.entity";
import { Result, success, failure } from "@shared/types/result";
import { logger } from "@shared/logger/logger";
import { ONBOARDING } from "@shared/constants/onboarding.constants";
import { GOAL } from "@shared/constants/goal.constants";

export interface OnboardingStatus {
  isNewUser: boolean;
  currentStep: "welcome" | "goal_setting" | "explaining" | "practicing" | "completed";
  message?: string;
}

export class ManageOnboardingUseCase {
  constructor(
    private readonly userSessionRepository: IUserSessionRepository,
    private readonly mealRepository: IMealRepository
  ) {}

  async checkUserStatus(userId: string): Promise<Result<OnboardingStatus, string>> {
    try {
      const session = await this.userSessionRepository.findByUserId(userId);
      const hasMeals = await this.hasUserMeals(userId);

      if (!session && !hasMeals) {
        const newSession = UserSession.create(userId);
        await this.userSessionRepository.save(newSession);
        return success({
          isNewUser: true,
          currentStep: "welcome",
          message: ONBOARDING.MESSAGES.WELCOME,
        });
      }

      if (session && session.onboardingStep !== "completed") {
        return success({
          isNewUser: false,
          currentStep: session.onboardingStep,
        });
      }

      return success({
        isNewUser: false,
        currentStep: "completed",
      });
    } catch (error) {
      logger.error({ error, userId }, "Failed to check user onboarding status");
      return failure("Failed to check user status");
    }
  }

  async advanceToNextStep(userId: string): Promise<Result<UserSession, string>> {
    try {
      const session = await this.userSessionRepository.findByUserId(userId);
      
      if (!session) {
        return failure("User session not found");
      }

      let nextSession: UserSession;

      switch (session.onboardingStep) {
        case "welcome":
          nextSession = session.updateOnboardingStep("goal_setting");
          break;
        case "goal_setting":
          nextSession = session.updateOnboardingStep("explaining");
          break;
        case "explaining":
          nextSession = session.updateOnboardingStep("practicing");
          break;
        case "practicing":
          nextSession = session.completeOnboarding();
          break;
        default:
          return success(session);
      }

      await this.userSessionRepository.save(nextSession);
      return success(nextSession);
    } catch (error) {
      logger.error({ error, userId }, "Failed to advance onboarding step");
      return failure("Failed to advance onboarding step");
    }
  }

  async completeOnboarding(userId: string): Promise<Result<void, string>> {
    try {
      const session = await this.userSessionRepository.findByUserId(userId);
      
      if (!session) {
        return failure("User session not found");
      }

      const completedSession = session.completeOnboarding();
      await this.userSessionRepository.save(completedSession);
      return success(undefined);
    } catch (error) {
      logger.error({ error, userId }, "Failed to complete onboarding");
      return failure("Failed to complete onboarding");
    }
  }

  async setDailyCalorieGoal(userId: string, goal: number): Promise<Result<UserSession, string>> {
    try {
      if (goal < GOAL.MIN_DAILY_CALORIES || goal > GOAL.MAX_DAILY_CALORIES) {
        return failure(`Daily calorie goal must be between ${GOAL.MIN_DAILY_CALORIES} and ${GOAL.MAX_DAILY_CALORIES}`);
      }

      let session = await this.userSessionRepository.findByUserId(userId);
      
      // Create session if it doesn't exist
      if (!session) {
        session = UserSession.create(userId);
      }

      const updatedSession = session.setDailyCalorieGoal(goal);
      await this.userSessionRepository.save(updatedSession);
      return success(updatedSession);
    } catch (error) {
      logger.error({ error, userId, goal }, "Failed to set daily calorie goal");
      return failure("Failed to set daily calorie goal");
    }
  }

  private async hasUserMeals(userId: string): Promise<boolean> {
    try {
      const today = new Date();
      const meals = await this.mealRepository.findByUserIdAndDate(userId, today);
      return meals.length > 0;
    } catch (error) {
      logger.warn({ error, userId }, "Failed to check user meals, assuming no meals");
      return false;
    }
  }
}

