import { logger } from "@shared/logger/logger";

export class PendingGoalUpdateService {
  private static pendingGoalUpdates: Set<string> = new Set();

  static setPendingGoalUpdate(userId: string): void {
    this.pendingGoalUpdates.add(userId);
    logger.debug({ userId }, "Pending goal update set");
  }

  static hasPendingGoalUpdate(userId: string): boolean {
    return this.pendingGoalUpdates.has(userId);
  }

  static clearPendingGoalUpdate(userId: string): void {
    const existed = this.pendingGoalUpdates.delete(userId);
    if (existed) {
      logger.debug({ userId }, "Pending goal update cleared");
    }
  }
}

