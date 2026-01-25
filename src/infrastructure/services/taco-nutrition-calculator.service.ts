import { TacoItem } from "@domain/entities/taco-item.entity";
import type { NutritionAnalysisDto } from "@application/dtos/nutrition-analysis.dto";

interface ResolvedFood {
  tacoItem: TacoItem;
  weightGrams: number;
  originalDescription: string;
  confidence: "alta" | "média" | "baixa";
}

export class TacoNutritionCalculatorService {
  calculateNutritionForFoods(resolvedFoods: ResolvedFood[]): NutritionAnalysisDto {
    const items = resolvedFoods.map((resolved, index) => {
      const nutrition = resolved.tacoItem.calculateNutritionForWeight(resolved.weightGrams);
      
      return {
        name: resolved.tacoItem.nome,
        quantity: `${resolved.weightGrams}g`,
        weightGrams: resolved.weightGrams,
        pacoId: `taco_${resolved.tacoItem.codigo}`,
        nutrients: {
          kcal: nutrition.kcal,
          proteinG: nutrition.proteinaG,
          carbG: nutrition.carboidratoG,
          fatG: nutrition.lipidioG,
        },
      };
    });
    
    const totals = {
      kcal: 0,
      proteinG: 0,
      carbG: 0,
      fatG: 0,
    };
    
    items.forEach((item) => {
      totals.kcal += item.nutrients.kcal;
      totals.proteinG += item.nutrients.proteinG;
      totals.carbG += item.nutrients.carbG;
      totals.fatG += item.nutrients.fatG;
    });
    
    totals.kcal = Math.round(totals.kcal * 100) / 100;
    totals.proteinG = Math.round(totals.proteinG * 100) / 100;
    totals.carbG = Math.round(totals.carbG * 100) / 100;
    totals.fatG = Math.round(totals.fatG * 100) / 100;
    
    return { items, totals };
  }
}
