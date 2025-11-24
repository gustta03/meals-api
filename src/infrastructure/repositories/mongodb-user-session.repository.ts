import { UserSession, OnboardingStep } from "@domain/entities/user-session.entity";
import { IUserSessionRepository } from "@domain/repositories/user-session.repository";
import { MongoDBConnection } from "../database/mongodb.connection";
import { Collection } from "mongodb";
import { DATABASE } from "@shared/constants/database.constants";
import { logger } from "@shared/logger/logger";

interface UserSessionDocument {
  _id: string;
  onboardingStep: OnboardingStep;
  createdAt: Date;
  updatedAt: Date;
  dailyCalorieGoal?: number;
}

export class MongoDBUserSessionRepository implements IUserSessionRepository {
  private get collection(): Collection<UserSessionDocument> {
    return MongoDBConnection.getInstance()
      .getDatabase()
      .collection<UserSessionDocument>(DATABASE.COLLECTIONS.USER_SESSIONS);
  }

  async findByUserId(userId: string): Promise<UserSession | null> {
    try {
      const doc = await this.collection.findOne({ _id: userId });
      return doc ? this.toEntity(doc) : null;
    } catch (error) {
      logger.error({ error, userId }, "Failed to find user session by user id");
      throw new Error(`Failed to find user session by user id: ${error}`);
    }
  }

  async save(session: UserSession): Promise<UserSession> {
    try {
      const doc = this.toDocument(session);
      await this.collection.updateOne(
        { _id: session.userId },
        { $set: doc },
        { upsert: true }
      );
      return session;
    } catch (error) {
      logger.error({ error, userId: session.userId }, "Failed to save user session");
      throw new Error(`Failed to save user session: ${error}`);
    }
  }

  async delete(userId: string): Promise<void> {
    try {
      await this.collection.deleteOne({ _id: userId });
    } catch (error) {
      logger.error({ error, userId }, "Failed to delete user session");
      throw new Error(`Failed to delete user session: ${error}`);
    }
  }

  private toEntity(doc: UserSessionDocument): UserSession {
    return UserSession.fromPersistence(
      doc._id,
      doc.onboardingStep,
      doc.createdAt,
      doc.updatedAt,
      undefined,
      doc.dailyCalorieGoal
    );
  }

  private toDocument(session: UserSession): UserSessionDocument {
    return {
      _id: session.userId,
      onboardingStep: session.onboardingStep,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      dailyCalorieGoal: session.dailyCalorieGoal,
    };
  }
}

