/**
 * Serviço de Validação de Dados Nutricionais
 * 
 * Responsabilidades:
 * - Validar se valores nutricionais são razoáveis
 * - Detectar erros de entrada/saída do Gemini
 * - Emitir avisos sobre dados suspeitos
 * - Garantir integridade dos dados
 */

import { NUTRITION } from "@shared/constants/nutrition.constants";
import { logger } from "@shared/logger/logger";
import type { NutritionDataDto, ValidatedNutritionDto, InvalidNutritionDto } from "@application/dtos/extracted-nutrition.dto";

interface ValidationWarning {
  readonly field: string;
  readonly issue: string;
  readonly value: number;
}

interface ValidationCheckResult {
  readonly isValid: boolean;
  readonly warnings: readonly ValidationWarning[];
}

export class NutritionValidator {
  /**
   * Valida dados nutricionais e retorna resultado com avisos
   */
  validate(
    nutrition: NutritionDataDto,
    confidence: "alta" | "média" | "baixa"
  ): ValidatedNutritionDto | InvalidNutritionDto {
    const validation = this.performValidationChecks(nutrition);

    if (!validation.isValid) {
      logger.warn(
        { nutrition, validation },
        "Nutrition validation failed"
      );

      return {
        isValid: false,
        reason: "Dados nutricionais fora dos limites aceitáveis",
        attempted: nutrition,
      };
    }

    if (validation.warnings.length > 0) {
      logger.debug(
        { warnings: validation.warnings, nutrition },
        "Nutrition validation completed with warnings"
      );
    }

    return {
      ...nutrition,
      confidence,
      source: "gemini",
      isValid: true,
      warnings: validation.warnings.map((w) => `${w.field}: ${w.issue}`),
    };
  }

  /**
   * Executa todas as checagens de validação
   */
  private performValidationChecks(nutrition: NutritionDataDto): ValidationCheckResult {
    const warnings: ValidationWarning[] = [];

    this.checkCalories(nutrition.calories, warnings);
    this.checkMacros(nutrition.proteinG, "Proteína", warnings);
    this.checkMacros(nutrition.carbsG, "Carboidrato", warnings);
    this.checkMacros(nutrition.fatG, "Lipídio", warnings);
    this.checkWeight(nutrition.weightGrams, warnings);
    this.checkMacroBalance(nutrition, warnings);
    this.checkMathematicalConsistency(nutrition, warnings);

    const isValid = this.isResultValid(nutrition);
    return { isValid, warnings };
  }

  /**
   * Verifica consistência matemática entre calorias e macros
   * 1g carboidrato = 4 kcal, 1g proteína = 4 kcal, 1g gordura = 9 kcal
   */
  private checkMathematicalConsistency(
    nutrition: NutritionDataDto,
    warnings: ValidationWarning[]
  ): void {
    const calculatedCalories = (nutrition.carbsG * 4) + (nutrition.proteinG * 4) + (nutrition.fatG * 9);
    const difference = Math.abs(nutrition.calories - calculatedCalories);
    const percentageDifference = nutrition.calories > 0 
      ? (difference / nutrition.calories) * 100 
      : 100;

    // Permitir até 10% de diferença (alguns alimentos têm fibras, álcool, etc.)
    if (percentageDifference > 10) {
      warnings.push({
        field: "Calorias",
        issue: `Inconsistência matemática: calorias reportadas (${nutrition.calories}) vs calculadas (${Math.round(calculatedCalories)}) - diferença de ${Math.round(percentageDifference)}%`,
        value: nutrition.calories,
      });

      logger.warn(
        {
          reportedCalories: nutrition.calories,
          calculatedCalories: Math.round(calculatedCalories * 100) / 100,
          difference: Math.round(difference * 100) / 100,
          percentageDifference: Math.round(percentageDifference * 100) / 100,
          nutrition,
        },
        "Mathematical inconsistency detected in nutrition data"
      );
    }
  }

  /**
   * Valida se calorias estão dentro de limites razoáveis
   */
  private checkCalories(
    calories: number,
    warnings: ValidationWarning[]
  ): void {
    if (calories < NUTRITION.MIN_CALORIES) {
      warnings.push({
        field: "Calorias",
        issue: "Valor negativo ou zero",
        value: calories,
      });
      return;
    }

    if (calories > NUTRITION.MAX_REASONABLE_CALORIES) {
      warnings.push({
        field: "Calorias",
        issue: `Valor extremamente alto (${calories} kcal)`,
        value: calories,
      });
    }
  }

  /**
   * Valida se macros estão dentro de limites razoáveis
   */
  private checkMacros(
    value: number,
    macroName: string,
    warnings: ValidationWarning[]
  ): void {
    if (value < NUTRITION.MIN_PROTEIN) {
      warnings.push({
        field: macroName,
        issue: "Valor negativo",
        value,
      });
      return;
    }

    if (value > NUTRITION.MAX_REASONABLE_MACROS) {
      warnings.push({
        field: macroName,
        issue: `Valor muito alto (${value}g)`,
        value,
      });
    }
  }

  /**
   * Valida se peso está dentro de limites
   */
  private checkWeight(weight: number, warnings: ValidationWarning[]): void {
    if (weight < NUTRITION.MIN_WEIGHT_GRAMS) {
      warnings.push({
        field: "Peso",
        issue: "Peso muito baixo",
        value: weight,
      });
      return;
    }

    if (weight > 1000) {
      warnings.push({
        field: "Peso",
        issue: `Peso muito alto para um alimento único (${weight}g)`,
        value: weight,
      });
    }
  }

  /**
   * Valida se o balanço de macros é coerente
   * (não faz sentido ter muita proteína mas zero carbos/gordura em um alimento comum)
   */
  private checkMacroBalance(
    nutrition: NutritionDataDto,
    warnings: ValidationWarning[]
  ): void {
    const totalMacroCalories = 
      (nutrition.proteinG * 4) + 
      (nutrition.carbsG * 4) + 
      (nutrition.fatG * 9);

    const macroCalorieRatio = totalMacroCalories / nutrition.calories;

    // Se macros somam menos de 85% das calorias, algo está errado
    if (macroCalorieRatio < 0.85 && nutrition.calories > 50) {
      warnings.push({
        field: "Balanço de Macros",
        issue: "Macros não explicam as calorias totais",
        value: macroCalorieRatio,
      });
    }

    // Se macros somam mais de 110% (arredondamento), há inconsistência
    if (macroCalorieRatio > 1.1) {
      warnings.push({
        field: "Balanço de Macros",
        issue: "Macros excedem as calorias totais",
        value: macroCalorieRatio,
      });
    }
  }

  /**
   * Determina se o resultado final é válido
   */
  private isResultValid(nutrition: NutritionDataDto): boolean {
    return (
      nutrition.calories >= NUTRITION.MIN_CALORIES &&
      nutrition.calories <= NUTRITION.MAX_REASONABLE_CALORIES &&
      nutrition.proteinG >= NUTRITION.MIN_PROTEIN &&
      nutrition.carbsG >= NUTRITION.MIN_CARBS &&
      nutrition.fatG >= NUTRITION.MIN_FAT &&
      nutrition.weightGrams >= NUTRITION.MIN_WEIGHT_GRAMS &&
      nutrition.weightGrams <= 1000
    );
  }
}
