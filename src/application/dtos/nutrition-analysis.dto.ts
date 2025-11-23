export interface NutritionItemDto {
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

export interface NutritionAnalysisDto {
  items: NutritionItemDto[];
  totals: {
    kcal: number;
    proteinG: number;
    carbG: number;
    fatG: number;
  };
}

