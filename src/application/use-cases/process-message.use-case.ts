import { Message } from "@domain/entities/message.entity";
import { Result, success, failure } from "@shared/types/result";
import { AnalyzeNutritionUseCase } from "./analyze-nutrition.use-case";
import { MESSAGE } from "@shared/constants/message.constants";
import { ERROR_MESSAGES } from "@shared/constants/error-messages.constants";
import { logger } from "@shared/logger/logger";
import { NutritionAnalysisDto } from "../dtos/nutrition-analysis.dto";

export class ProcessMessageUseCase {
  constructor(private readonly analyzeNutritionUseCase: AnalyzeNutritionUseCase) {}

  async execute(message: Message): Promise<Result<string, string>> {
    try {
      if (message.hasImage && message.imageBase64 && message.imageMimeType) {
        return this.processImageMessage(message);
      }

      return this.processTextMessage(message.body);
    } catch (error) {
      logger.error({ error, messageId: message.id }, "Failed to process message");
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.MESSAGE.PROCESSING_FAILED;
      return failure(errorMessage);
    }
  }

  private async processTextMessage(messageBody: string): Promise<Result<string, string>> {
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

    const nutritionResult = await this.analyzeNutritionUseCase.executeFromText(messageBody);

    if (!nutritionResult.success) {
      return success(MESSAGE.RESPONSES.NOT_UNDERSTOOD);
    }

    return success(this.formatNutritionResponse(nutritionResult.data));
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
}

