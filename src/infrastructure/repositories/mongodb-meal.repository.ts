import { Meal, MealItem, MealType } from "@domain/entities/meal.entity";
import { IMealRepository } from "@domain/repositories/meal.repository";
import { MongoDBConnection } from "../database/mongodb.connection";
import { Collection } from "mongodb";
import { DATABASE } from "@shared/constants/database.constants";
import { logger } from "@shared/logger/logger";

interface MealDocument {
  _id: string;
  userId: string;
  items: MealItem[];
  totals: {
    kcal: number;
    proteinG: number;
    carbG: number;
    fatG: number;
  };
  mealType: MealType;
  date: Date;
  createdAt: Date;
}

export class MongoDBMealRepository implements IMealRepository {
  private get collection(): Collection<MealDocument> {
    return MongoDBConnection.getInstance()
      .getDatabase()
      .collection<MealDocument>(DATABASE.COLLECTIONS.MEALS);
  }

  async save(meal: Meal): Promise<Meal> {
    try {
      const doc = this.toDocument(meal);
      await this.collection.insertOne(doc);
      return meal;
    } catch (error) {
      logger.error({ error, mealId: meal.id }, "Failed to save meal");
      throw new Error(`Failed to save meal: ${error}`);
    }
  }

  async findByUserIdAndDate(userId: string, date: Date): Promise<Meal[]> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const docs = await this.collection
        .find({
          userId,
          date: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        })
        .sort({ date: 1 })
        .toArray();

      return docs.map((doc) => this.toEntity(doc));
    } catch (error) {
      logger.error({ error, userId, date }, "Failed to find meals by user and date");
      throw new Error(`Failed to find meals by user and date: ${error}`);
    }
  }

  async findByUserIdAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<Meal[]> {
    try {
      const docs = await this.collection
        .find({
          userId,
          date: {
            $gte: startDate,
            $lte: endDate,
          },
        })
        .sort({ date: 1 })
        .toArray();

      return docs.map((doc) => this.toEntity(doc));
    } catch (error) {
      logger.error({ error, userId, startDate, endDate }, "Failed to find meals by user and date range");
      throw new Error(`Failed to find meals by user and date range: ${error}`);
    }
  }

  async findById(id: string): Promise<Meal | null> {
    try {
      const doc = await this.collection.findOne({ _id: id });
      return doc ? this.toEntity(doc) : null;
    } catch (error) {
      logger.error({ error, id }, "Failed to find meal by id");
      throw new Error(`Failed to find meal by id: ${error}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const result = await this.collection.deleteOne({ _id: id });
      if (result.deletedCount === 0) {
        throw new Error("Meal not found");
      }
    } catch (error) {
      logger.error({ error, id }, "Failed to delete meal");
      throw new Error(`Failed to delete meal: ${error}`);
    }
  }

  private toEntity(doc: MealDocument): Meal {
    return Meal.create(
      doc._id,
      doc.userId,
      doc.items,
      doc.totals,
      doc.mealType,
      doc.date
    );
  }

  private toDocument(meal: Meal): MealDocument {
    return {
      _id: meal.id,
      userId: meal.userId,
      items: meal.items,
      totals: meal.totals,
      mealType: meal.mealType,
      date: meal.date,
      createdAt: meal.createdAt,
    };
  }
}

