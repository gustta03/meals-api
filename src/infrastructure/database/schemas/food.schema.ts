import { Food } from "@domain/entities/food.entity";

export interface FoodDocument {
  _id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  createdAt: Date;
  updatedAt: Date;
}

export class FoodSchema {
  static toDocument(food: Food): FoodDocument {
    return {
      _id: food.id,
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      createdAt: food.createdAt,
      updatedAt: food.updatedAt,
    };
  }

  static toEntity(doc: FoodDocument): Food {
    return Food.fromPersistence(
      doc._id,
      doc.name,
      doc.calories,
      doc.protein,
      doc.carbs,
      doc.fat,
      doc.createdAt,
      doc.updatedAt
    );
  }

  static toEntityList(docs: FoodDocument[]): Food[] {
    return docs.map((doc) => this.toEntity(doc));
  }
}

