import { Meal } from "@domain/entities/meal.entity";

export interface IMealRepository {
  save(meal: Meal): Promise<Meal>;
  findByUserIdAndDate(userId: string, date: Date): Promise<Meal[]>;
  findByUserIdAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<Meal[]>;
  findById(id: string): Promise<Meal | null>;
  delete(id: string): Promise<void>;
}

