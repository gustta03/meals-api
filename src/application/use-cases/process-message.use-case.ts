import { Message } from "@domain/entities/message.entity";
import { Result, success, failure } from "@shared/types/result";
import { AnalyzeNutritionUseCase } from "./analyze-nutrition.use-case";
import { SaveMealUseCase } from "./save-meal.use-case";
import { GetDailySummaryUseCase } from "./get-daily-summary.use-case";
import { MESSAGE } from "@shared/constants/message.constants";
import { ERROR_MESSAGES } from "@shared/constants/error-messages.constants";
import { logger } from "@shared/logger/logger";
import { NutritionAnalysisDto } from "../dtos/nutrition-analysis.dto";
import { MealType } from "@domain/entities/meal.entity";

export class ProcessMessageUseCase {
  constructor(
    private readonly analyzeNutritionUseCase: AnalyzeNutritionUseCase,
    private readonly saveMealUseCase: SaveMealUseCase,
    private readonly getDailySummaryUseCase: GetDailySummaryUseCase
  ) {}

  async execute(message: Message): Promise<Result<string, string>> {
    try {
      if (message.hasImage && message.imageBase64 && message.imageMimeType) {
        return this.processImageMessage(message);
      }

      return this.processTextMessage(message);
    } catch (error) {
      logger.error({ error, messageId: message.id }, "Failed to process message");
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.MESSAGE.PROCESSING_FAILED;
      return failure(errorMessage);
    }
  }

  private async processTextMessage(message: Message): Promise<Result<string, string>> {
    const messageBody = message.body;
    const lowerBody = messageBody.toLowerCase().trim();

    if (lowerBody === MESSAGE.GREETINGS.OI || lowerBody === MESSAGE.GREETINGS.OLA || lowerBody === MESSAGE.GREETINGS.OLA_ALT) {
      return success(MESSAGE.RESPONSES.GREETING);
    }

    if (lowerBody.includes(MESSAGE.COMMANDS.AJUDA) || lowerBody === MESSAGE.COMMANDS.HELP) {
      return success(MESSAGE.RESPONSES.HELP);
    }

    if (lowerBody.startsWith(MESSAGE.COMMANDS.ALIMENTOS)) {
      return success("Lista de alimentos disponíveis...");
    }

    if (lowerBody.includes("resumo") || lowerBody.includes("hoje") || lowerBody.includes("diário")) {
      return this.getDailySummary(message.from);
    }

    const nutritionResult = await this.analyzeNutritionUseCase.executeFromText(messageBody);

    if (!nutritionResult.success) {
      return success(MESSAGE.RESPONSES.NOT_UNDERSTOOD);
    }

    const mealType = this.detectMealType(messageBody);
    const saveResult = await this.saveMealUseCase.execute(message.from, nutritionResult.data, mealType);

    if (!saveResult.success) {
      logger.warn({ error: saveResult.error, userId: message.from }, "Failed to save meal, but showing analysis");
    }

    const response = this.formatNutritionResponse(nutritionResult.data);
    const dailySummary = await this.getDailySummaryUseCase.execute(message.from);
    
    if (dailySummary.success) {
      return success(
        `${response}\n\n📅 Resumo do dia:\n• Total: ${dailySummary.data.dailyTotals.kcal} kcal | ${dailySummary.data.dailyTotals.proteinG}g proteína | ${dailySummary.data.dailyTotals.carbG}g carboidrato | ${dailySummary.data.dailyTotals.fatG}g lipídio`
      );
    }

    return success(response);
  }

  private async processImageMessage(message: Message): Promise<Result<string, string>> {
    if (!message.imageBase64 || !message.imageMimeType) {
      return failure(ERROR_MESSAGES.NUTRITION.INVALID_INPUT);
    }

    const nutritionResult = await this.analyzeNutritionUseCase.executeFromImage(
      message.imageBase64,
      message.imageMimeType
    );

    if (!nutritionResult.success) {
      return failure(nutritionResult.error);
    }

    const itemsList = nutritionResult.data.items.map((item) => `- ${item.name} (${item.quantity})`).join("\n");

    const confirmationMessage = `Detectei os seguintes itens no prato:\n\n${itemsList}\n\nConfirma esses itens? (sim/não)`;

    return success(confirmationMessage);
  }

  private formatNutritionResponse(data: NutritionAnalysisDto): string {
    const itemsList = data.items
      .map(
        (item) =>
          `• ${item.name} (${item.quantity} - ${item.weightGrams}g):\n  ${item.nutrients.kcal} kcal | ${item.nutrients.proteinG}g proteína | ${item.nutrients.carbG}g carboidrato | ${item.nutrients.fatG}g lipídio`
      )
      .join("\n\n");

    return `📊 Análise Nutricional:\n\n${itemsList}\n\n📈 Totais:\n• Calorias: ${data.totals.kcal} kcal\n• Proteína: ${data.totals.proteinG} g\n• Carboidrato: ${data.totals.carbG} g\n• Lipídio: ${data.totals.fatG} g`;
  }

  private async getDailySummary(userId: string): Promise<Result<string, string>> {
    const summaryResult = await this.getDailySummaryUseCase.execute(userId);

    if (!summaryResult.success) {
      return failure(summaryResult.error);
    }

    const { meals, dailyTotals } = summaryResult.data;

    if (meals.length === 0) {
      return success("📅 Nenhuma refeição registrada hoje.");
    }

    const mealsList = meals
      .map(
        (meal) =>
          `\n🍽️ ${meal.mealType.toUpperCase()}:\n  ${meal.totals.kcal} kcal | ${meal.totals.proteinG}g proteína | ${meal.totals.carbG}g carboidrato | ${meal.totals.fatG}g lipídio`
      )
      .join("\n");

    return success(
      `📅 Resumo do dia (${summaryResult.data.date}):${mealsList}\n\n📊 Total do dia:\n• ${dailyTotals.kcal} kcal\n• ${dailyTotals.proteinG}g proteína\n• ${dailyTotals.carbG}g carboidrato\n• ${dailyTotals.fatG}g lipídio`
    );
  }

  private detectMealType(messageBody: string): MealType {
    const lowerBody = messageBody.toLowerCase();
    
    if (lowerBody.includes("café") || lowerBody.includes("cafe") || lowerBody.includes("desjejum") || lowerBody.includes("manhã")) {
      return "breakfast";
    }
    if (lowerBody.includes("almoço") || lowerBody.includes("almoco")) {
      return "lunch";
    }
    if (lowerBody.includes("jantar") || lowerBody.includes("janta")) {
      return "dinner";
    }
    if (lowerBody.includes("lanche") || lowerBody.includes("snack")) {
      return "snack";
    }
    
    return "other";
  }
}

