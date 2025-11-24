export type OnboardingStep = "welcome" | "goal_setting" | "explaining" | "practicing" | "completed";

export interface PendingNutritionData {
  items: Array<{
    name: string;
    quantity: string;
    weightGrams: number;
    unit?: string;
  }>;
}

export class UserSession {
  private constructor(
    public readonly userId: string,
    public readonly onboardingStep: OnboardingStep,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly pendingNutritionData?: PendingNutritionData,
    public readonly dailyCalorieGoal?: number
  ) {
    this.validate();
  }

  static create(userId: string): UserSession {
    const now = new Date();
    return new UserSession(userId, "welcome", now, now);
  }

  static fromPersistence(
    userId: string,
    onboardingStep: OnboardingStep,
    createdAt: Date,
    updatedAt: Date,
    pendingNutritionData?: PendingNutritionData,
    dailyCalorieGoal?: number
  ): UserSession {
    return new UserSession(userId, onboardingStep, createdAt, updatedAt, pendingNutritionData, dailyCalorieGoal);
  }

  updateOnboardingStep(step: OnboardingStep): UserSession {
    return new UserSession(this.userId, step, this.createdAt, new Date(), this.pendingNutritionData, this.dailyCalorieGoal);
  }

  completeOnboarding(): UserSession {
    return new UserSession(this.userId, "completed", this.createdAt, new Date(), this.pendingNutritionData, this.dailyCalorieGoal);
  }

  setPendingNutritionData(data: PendingNutritionData): UserSession {
    return new UserSession(this.userId, this.onboardingStep, this.createdAt, new Date(), data, this.dailyCalorieGoal);
  }

  clearPendingNutritionData(): UserSession {
    return new UserSession(this.userId, this.onboardingStep, this.createdAt, new Date(), undefined, this.dailyCalorieGoal);
  }

  setDailyCalorieGoal(goal: number): UserSession {
    return new UserSession(this.userId, this.onboardingStep, this.createdAt, new Date(), this.pendingNutritionData, goal);
  }

  hasPendingConfirmation(): boolean {
    return this.pendingNutritionData !== undefined;
  }

  private validate(): void {
    if (!this.userId || this.userId.trim().length === 0) {
      throw new Error("User ID is required");
    }

    if (this.dailyCalorieGoal !== undefined && this.dailyCalorieGoal < 0) {
      throw new Error("Daily calorie goal cannot be negative");
    }
  }
}

