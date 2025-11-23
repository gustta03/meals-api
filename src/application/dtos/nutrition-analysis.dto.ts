export interface NutritionItemDto {
  nome: string;
  quantidade: string;
  peso_gramas: number;
  paco_id: string;
  nutrientes: {
    kcal: number;
    proteina_g: number;
    carboidrato_g: number;
    lipidio_g: number;
  };
}

export interface NutritionAnalysisDto {
  items: NutritionItemDto[];
  totais: {
    kcal: number;
    proteina_g: number;
    carboidrato_g: number;
    lipidio_g: number;
  };
}

