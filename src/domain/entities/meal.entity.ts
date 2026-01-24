import { normalizeToStartOfDay, toDate, getToday } from "@shared/utils/date.utils";

export class Meal {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly items: MealItem[],
    public readonly totals: {
      kcal: number;
      proteinG: number;
      carbG: number;
      fatG: number;
    },
    public readonly mealType: MealType,
    public readonly date: Date,
    public readonly createdAt: Date
  ) {
    this.validate();
  }

  static create(
    id: string,
    userId: string,
    items: MealItem[],
    totals: {
      kcal: number;
      proteinG: number;
      carbG: number;
      fatG: number;
    },
    mealType: MealType,
    date?: Date
  ): Meal {
    // Normalizar data para início do dia no timezone do Brasil
    const mealDate = date 
      ? toDate(normalizeToStartOfDay(date))
      : toDate(getToday());
    
    const createdAt = new Date();
    return new Meal(id, userId, items, totals, mealType, mealDate, createdAt);
  }

  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error("Meal ID is required");
    }

    if (!this.userId || this.userId.trim().length === 0) {
      throw new Error("User ID is required");
    }

    if (!this.items || this.items.length === 0) {
      throw new Error("Meal must have at least one item");
    }

    if (this.totals.kcal < 0) {
      throw new Error("Total calories cannot be negative");
    }

    if (this.totals.proteinG < 0) {
      throw new Error("Total protein cannot be negative");
    }

    if (this.totals.carbG < 0) {
      throw new Error("Total carbs cannot be negative");
    }

    if (this.totals.fatG < 0) {
      throw new Error("Total fat cannot be negative");
    }
  }
}

export interface MealItem {
  name: string;
  quantity: string;
  weightGrams: number;
  pacoId: string;
  nutrients: {
    kcal: number;
    proteinG: number;
    carbG: number;
    fatG: number;
  };
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snack" | "other";

