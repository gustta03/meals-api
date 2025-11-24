import { PendingNutritionData } from "@domain/entities/user-session.entity";
import { logger } from "@shared/logger/logger";

export class PendingConfirmationService {
  private static pendingConfirmations: Map<string, PendingNutritionData> = new Map();

  static setPendingConfirmation(userId: string, data: PendingNutritionData): void {
    this.pendingConfirmations.set(userId, data);
    logger.debug({ userId, itemsCount: data.items.length }, "Pending confirmation set");
  }

  static getPendingConfirmation(userId: string): PendingNutritionData | null {
    const data = this.pendingConfirmations.get(userId);
    return data || null;
  }

  static clearPendingConfirmation(userId: string): void {
    const existed = this.pendingConfirmations.delete(userId);
    if (existed) {
      logger.debug({ userId }, "Pending confirmation cleared");
    }
  }

  static hasPendingConfirmation(userId: string): boolean {
    return this.pendingConfirmations.has(userId);
  }
}

