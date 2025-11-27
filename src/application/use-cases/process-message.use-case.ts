import { Message } from "@domain/entities/message.entity";
import { Result, success, failure } from "@shared/types/result";
import { AnalyzeNutritionUseCase } from "./analyze-nutrition.use-case";
import { SaveMealUseCase } from "./save-meal.use-case";
import { GetDailySummaryUseCase } from "./get-daily-summary.use-case";
import { GenerateWeeklyReportUseCase } from "./generate-weekly-report.use-case";
import { ManageOnboardingUseCase } from "./manage-onboarding.use-case";
import { EnsureUserExistsUseCase } from "./ensure-user-exists.use-case";
import { MESSAGE } from "@shared/constants/message.constants";
import { ONBOARDING } from "@shared/constants/onboarding.constants";
import { ERROR_MESSAGES } from "@shared/constants/error-messages.constants";
import { GOAL } from "@shared/constants/goal.constants";
import { logger } from "@shared/logger/logger";
import { NutritionAnalysisDto } from "../dtos/nutrition-analysis.dto";
import { MealType } from "@domain/entities/meal.entity";
import { PendingConfirmationService } from "@infrastructure/services/pending-confirmation.service";
import { PendingGoalUpdateService } from "@infrastructure/services/pending-goal-update.service";
import { IProgressBarService } from "@infrastructure/services/progress-bar.service";
import { IUserSessionRepository } from "@domain/repositories/user-session.repository";

export interface ProcessMessageResult {
  message: string;
  imageBuffer?: Buffer;
  imageMimeType?: string;
}

export class ProcessMessageUseCase {
  constructor(
    private readonly analyzeNutritionUseCase: AnalyzeNutritionUseCase,
    private readonly saveMealUseCase: SaveMealUseCase,
    private readonly getDailySummaryUseCase: GetDailySummaryUseCase,
    private readonly generateWeeklyReportUseCase: GenerateWeeklyReportUseCase,
    private readonly manageOnboardingUseCase: ManageOnboardingUseCase,
    private readonly ensureUserExistsUseCase: EnsureUserExistsUseCase,
    private readonly progressBarService: IProgressBarService,
    private readonly userSessionRepository: IUserSessionRepository
  ) {}

  async execute(message: Message): Promise<Result<ProcessMessageResult, string>> {
    try {
      const ensureUserResult = await this.ensureUserExistsUseCase.execute(message.from);
      if (!ensureUserResult.success) {
        logger.error({ error: ensureUserResult.error, phoneNumber: message.from }, "Failed to ensure user exists");
        return failure(ERROR_MESSAGES.USER.FAILED_TO_CREATE);
      }

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

  private async processTextMessage(message: Message): Promise<Result<ProcessMessageResult, string>> {
    const messageBody = message.body;
    const lowerBody = messageBody.toLowerCase().trim();

    // Check for pending confirmation first (has higher priority than goal updates)
    if (PendingConfirmationService.hasPendingConfirmation(message.from)) {
      const isConfirmation = this.isConfirmationResponse(lowerBody);
      
      if (isConfirmation === true) {
        const pendingData = PendingConfirmationService.getPendingConfirmation(message.from);
        if (pendingData) {
          PendingConfirmationService.clearPendingConfirmation(message.from);
          return this.processPendingNutritionData(message.from, pendingData);
        }
      } else if (isConfirmation === false) {
        PendingConfirmationService.clearPendingConfirmation(message.from);
        return success({ 
          message: "Entendi! Se quiser, pode enviar outra foto ou descrever sua refeição novamente. 😊" 
        });
      }
    }

    // Check for pending goal update (after confirmation check)
    if (PendingGoalUpdateService.hasPendingGoalUpdate(message.from)) {
      const calorieGoal = this.extractCalorieGoal(messageBody);
      if (calorieGoal === null) {
        return success({ message: ONBOARDING.MESSAGES.GOAL_INVALID });
      }

      const userSessionBefore = await this.userSessionRepository.findByUserId(message.from);
      const hadGoalBefore = !!userSessionBefore?.dailyCalorieGoal;
      
      const setGoalResult = await this.manageOnboardingUseCase.setDailyCalorieGoal(message.from, calorieGoal);
      PendingGoalUpdateService.clearPendingGoalUpdate(message.from);
      
      if (!setGoalResult.success) {
        return success({ message: ONBOARDING.MESSAGES.GOAL_INVALID });
      }
      
      return success({
        message: `Perfeito! Sua meta diária de calorias foi ${hadGoalBefore ? "atualizada" : "definida"} para ${calorieGoal} kcal! 🔥\n\nAgora você pode acompanhar seu progresso em todas as análises nutricionais. 💪`,
      });
    }

    const onboardingStatus = await this.manageOnboardingUseCase.checkUserStatus(message.from);

    if (onboardingStatus.success && onboardingStatus.data.currentStep === "welcome") {
      await this.manageOnboardingUseCase.advanceToNextStep(message.from);
      return success({ message: ONBOARDING.MESSAGES.WELCOME });
    }

    if (onboardingStatus.success && onboardingStatus.data.currentStep === "goal_setting") {
      const calorieGoal = this.extractCalorieGoal(messageBody);
      if (calorieGoal === null) {
        return success({ message: ONBOARDING.MESSAGES.GOAL_INVALID });
      }

      const setGoalResult = await this.manageOnboardingUseCase.setDailyCalorieGoal(message.from, calorieGoal);
      if (!setGoalResult.success) {
        return success({ message: ONBOARDING.MESSAGES.GOAL_INVALID });
      }

      await this.manageOnboardingUseCase.advanceToNextStep(message.from);
      return success({ message: ONBOARDING.MESSAGES.EXPLAINING });
    }

    if (onboardingStatus.success && onboardingStatus.data.currentStep === "explaining") {
      if (lowerBody === "ok" || lowerBody === "entendi" || lowerBody === "entendido" || lowerBody === "vamos" || lowerBody === "vamos lá" || lowerBody === "pronto") {
        await this.manageOnboardingUseCase.advanceToNextStep(message.from);
        return success({ message: ONBOARDING.MESSAGES.EXPLAINING });
      }
    }

    if (lowerBody === MESSAGE.GREETINGS.OI || lowerBody === MESSAGE.GREETINGS.OLA || lowerBody === MESSAGE.GREETINGS.OLA_ALT) {
      if (onboardingStatus.success && onboardingStatus.data.currentStep === "completed") {
        return success({ message: MESSAGE.RESPONSES.GREETING });
      }
      if (onboardingStatus.success && onboardingStatus.data.currentStep === "welcome") {
        await this.manageOnboardingUseCase.advanceToNextStep(message.from);
        return success({ message: ONBOARDING.MESSAGES.WELCOME });
      }
      return success({ message: MESSAGE.RESPONSES.GREETING });
    }

    if (lowerBody.includes(MESSAGE.COMMANDS.AJUDA) || lowerBody === MESSAGE.COMMANDS.HELP) {
      return success({ message: MESSAGE.RESPONSES.HELP });
    }

    // Check for goal update commands
    if (
      lowerBody.includes(MESSAGE.COMMANDS.META) ||
      lowerBody.includes(MESSAGE.COMMANDS.ATUALIZAR_META) ||
      lowerBody.includes(MESSAGE.COMMANDS.DEFINIR_META) ||
      lowerBody.includes(MESSAGE.COMMANDS.META_CALORIAS)
    ) {
      const userSession = await this.userSessionRepository.findByUserId(message.from);
      const currentGoal = userSession?.dailyCalorieGoal;
      
      PendingGoalUpdateService.setPendingGoalUpdate(message.from);
      
      if (currentGoal) {
        return success({
          message: `Sua meta atual é de ${currentGoal} kcal. 🔥\n\nQual é a sua nova meta diária de calorias?\n\nPor favor, me informe um número entre ${GOAL.MIN_DAILY_CALORIES} e ${GOAL.MAX_DAILY_CALORIES} (exemplo: 2000, 2500, etc.)`,
        });
      }
      
      return success({
        message: `Vamos definir sua meta diária de calorias! 🔥\n\nPor favor, me informe um número entre ${GOAL.MIN_DAILY_CALORIES} e ${GOAL.MAX_DAILY_CALORIES} (exemplo: 2000, 2500, etc.)`,
      });
    }

    if (lowerBody.startsWith(MESSAGE.COMMANDS.ALIMENTOS)) {
      return success({ message: "Em breve você poderá consultar a lista completa de alimentos disponíveis! 😊\n\nPor enquanto, você pode descrever qualquer alimento na sua refeição e eu farei a análise nutricional para você. Estou sempre aprendendo e melhorando para te ajudar melhor!" });
    }

    if (lowerBody.includes("resumo") || lowerBody.includes("hoje") || lowerBody.includes("diário")) {
      return this.getDailySummary(message.from);
    }

    if (
      lowerBody.includes(MESSAGE.COMMANDS.RELATORIO_SEMANAL) ||
      lowerBody.includes(MESSAGE.COMMANDS.RELATORIO_SEMANAL_ALT) ||
      lowerBody.includes(MESSAGE.COMMANDS.SEMANA)
    ) {
      return this.getWeeklyReport(message.from);
    }

    const nutritionResult = await this.analyzeNutritionUseCase.executeFromText(messageBody);

    if (!nutritionResult.success) {
      if (onboardingStatus.success && onboardingStatus.data.currentStep === "practicing") {
        return success({ message: ONBOARDING.MESSAGES.PRACTICING_RETRY });
      }
      return success({ message: MESSAGE.RESPONSES.NOT_UNDERSTOOD });
    }

    const mealType = this.detectMealType(messageBody);
    const saveResult = await this.saveMealUseCase.execute(message.from, nutritionResult.data, mealType);

    if (!saveResult.success) {
      logger.warn({ error: saveResult.error, userId: message.from }, "Failed to save meal, but showing analysis");
    }

    const isCompletingOnboarding = onboardingStatus.success && onboardingStatus.data.currentStep === "practicing";
    
    if (isCompletingOnboarding) {
      await this.manageOnboardingUseCase.completeOnboarding(message.from);
    }

    const response = this.formatNutritionResponse(nutritionResult.data);
    const dailySummary = await this.getDailySummaryUseCase.execute(message.from);
    
    // Get user session to check for calorie goal
    const userSession = await this.userSessionRepository.findByUserId(message.from);
    const calorieGoal = userSession?.dailyCalorieGoal;
    
    let imageBuffer: Buffer | undefined;
    let imageMimeType: string | undefined;
    
    if (calorieGoal && dailySummary.success) {
      try {
        imageBuffer = await this.progressBarService.generateCalorieProgressBar(
          dailySummary.data.dailyTotals.kcal,
          calorieGoal
        );
        imageMimeType = "image/png";
      } catch (error) {
        logger.warn({ error, userId: message.from }, "Failed to generate progress bar");
      }
    }
    
    if (isCompletingOnboarding) {
      return success({
        message: `${response}\n\n${ONBOARDING.MESSAGES.PRACTICING_SUCCESS}`,
        imageBuffer,
        imageMimeType,
      });
    }
    
    if (dailySummary.success) {
      return success({
        message: `${response}\n\n📅 Resumo do seu dia até agora:\n• Total: ${dailySummary.data.dailyTotals.kcal} kcal | ${dailySummary.data.dailyTotals.proteinG}g proteína | ${dailySummary.data.dailyTotals.carbG}g carboidrato | ${dailySummary.data.dailyTotals.fatG}g lipídio\n\nContinue assim! Você está no caminho certo! 🌟`,
        imageBuffer,
        imageMimeType,
      });
    }

    return success({ message: response, imageBuffer, imageMimeType });
  }

  private async processImageMessage(message: Message): Promise<Result<ProcessMessageResult, string>> {
    if (!message.imageBase64 || !message.imageMimeType) {
      return failure(ERROR_MESSAGES.NUTRITION.INVALID_INPUT);
    }

    const onboardingStatus = await this.manageOnboardingUseCase.checkUserStatus(message.from);
    const isCompletingOnboarding = onboardingStatus.success && onboardingStatus.data.currentStep === "practicing";

    // Extrair itens da imagem (sem buscar na PACO ainda)
    const extractedItems = await this.analyzeNutritionUseCase.getExtractedItemsFromImage(
      message.imageBase64,
      message.imageMimeType
    );

    if (!extractedItems || extractedItems.length === 0) {
      if (isCompletingOnboarding) {
        return success({ message: ONBOARDING.MESSAGES.PRACTICING_RETRY });
      }
      return success({ 
        message: "Desculpe, não consegui identificar alimentos na imagem. 😅\n\nTente enviar uma foto mais clara ou descreva sua refeição em texto!" 
      });
    }

    // Salvar dados pendentes para confirmação
    PendingConfirmationService.setPendingConfirmation(message.from, {
      items: extractedItems,
    });

    const itemsList = extractedItems.map((item) => `• ${item.name} (${item.quantity})`).join("\n");

    let confirmationMessage = `Olá! Analisei a foto do seu prato e identifiquei os seguintes itens:\n\n${itemsList}\n\nEstá correto? Se sim, posso calcular os valores nutricionais completos para você! 😊\n\nConfirma esses itens? (sim/não)`;

    if (isCompletingOnboarding) {
      confirmationMessage = `${confirmationMessage}\n\n${ONBOARDING.MESSAGES.PRACTICING_SUCCESS}`;
    }

    return success({ message: confirmationMessage });
  }

  private isConfirmationResponse(text: string): boolean | null {
    // Remove emojis e caracteres especiais, mantém apenas letras e espaços
    const cleaned = text.replace(/[^\w\s]/gi, "").toLowerCase().trim();
    
    const confirmations = ["sim", "s", "yes", "y", "confirmo", "confirmar", "correto", "esta certo", "certo", "ok", "pode", "pode calcular", "confirma", "confirmado"];
    const negations = ["não", "nao", "no", "n", "negativo", "incorreto", "errado", "não está", "nao esta", "nao esta correto", "não esta correto"];
    
    // Verificar correspondência exata primeiro
    if (confirmations.some(conf => cleaned === conf)) {
      return true;
    }
    
    if (negations.some(neg => cleaned === neg)) {
      return false;
    }
    
    // Verificar se contém palavras de confirmação
    if (confirmations.some(conf => cleaned.includes(conf) && conf.length >= 2)) {
      return true;
    }
    
    if (negations.some(neg => cleaned.includes(neg) && neg.length >= 2)) {
      return false;
    }
    
    return null; // Não é uma confirmação clara
  }

  private async processPendingNutritionData(
    userId: string,
    pendingData: { items: Array<{ name: string; quantity: string; weightGrams: number; unit?: string }> }
  ): Promise<Result<ProcessMessageResult, string>> {
    try {
      // Re-analisar com os dados pendentes
      const nutritionResult = await this.analyzeNutritionUseCase.executeFromExtractedItems(pendingData.items);

      if (!nutritionResult.success) {
        return success({ 
          message: "Desculpe, não consegui calcular os valores nutricionais para esses itens. Alguns alimentos podem não estar na nossa base de dados. 😅" 
        });
      }

      const mealType = this.detectMealType("");
      const saveResult = await this.saveMealUseCase.execute(userId, nutritionResult.data, mealType);

      if (!saveResult.success) {
        logger.warn({ error: saveResult.error, userId }, "Failed to save meal, but showing analysis");
      }

      const response = this.formatNutritionResponse(nutritionResult.data);
      const dailySummary = await this.getDailySummaryUseCase.execute(userId);
      
      // Get user session to check for calorie goal
      const userSession = await this.userSessionRepository.findByUserId(userId);
      const calorieGoal = userSession?.dailyCalorieGoal;
      
      let imageBuffer: Buffer | undefined;
      let imageMimeType: string | undefined;
      
      if (calorieGoal && dailySummary.success) {
        try {
          imageBuffer = await this.progressBarService.generateCalorieProgressBar(
            dailySummary.data.dailyTotals.kcal,
            calorieGoal
          );
          imageMimeType = "image/png";
        } catch (error) {
          logger.warn({ error, userId }, "Failed to generate progress bar");
        }
      }
      
      if (dailySummary.success) {
        return success({
          message: `${response}\n\n📅 Resumo do seu dia até agora:\n• Total: ${dailySummary.data.dailyTotals.kcal} kcal | ${dailySummary.data.dailyTotals.proteinG}g proteína | ${dailySummary.data.dailyTotals.carbG}g carboidrato | ${dailySummary.data.dailyTotals.fatG}g lipídio\n\nContinue assim! Você está no caminho certo! 🌟`,
          imageBuffer,
          imageMimeType,
        });
      }

      return success({ message: response, imageBuffer, imageMimeType });
    } catch (error) {
      logger.error({ error, userId }, "Failed to process pending nutrition data");
      return failure("Failed to process confirmation");
    }
  }

  private formatNutritionResponse(data: NutritionAnalysisDto): string {
    const itemsList = data.items
      .map(
        (item) =>
          `• ${item.name} (${item.quantity} - ${item.weightGrams}g):\n  ${item.nutrients.kcal} kcal | ${item.nutrients.proteinG}g proteína | ${item.nutrients.carbG}g carboidrato | ${item.nutrients.fatG}g lipídio`
      )
      .join("\n\n");

    return `Perfeito! Analisei sua refeição e aqui está o resultado: 😊\n\n📊 Análise Nutricional:\n\n${itemsList}\n\n📈 Totais da Refeição:\n• Calorias: ${data.totals.kcal} kcal\n• Proteína: ${data.totals.proteinG} g\n• Carboidrato: ${data.totals.carbG} g\n• Lipídio: ${data.totals.fatG} g\n\nÓtima escolha! Continue cuidando da sua alimentação! 💪`;
  }

  private async getDailySummary(userId: string): Promise<Result<ProcessMessageResult, string>> {
    const summaryResult = await this.getDailySummaryUseCase.execute(userId);

    if (!summaryResult.success) {
      return failure(summaryResult.error);
    }

    const { meals, dailyTotals } = summaryResult.data;

    if (meals.length === 0) {
      return success({ message: "Olá! 😊\n\nAinda não há refeições registradas para hoje.\n\nQue tal começar agora? Você pode:\n• Descrever sua refeição para eu analisar\n• Enviar uma foto do seu prato\n\nEstou aqui para te ajudar a acompanhar sua alimentação! 💪" });
    }

    const mealsList = meals
      .map(
        (meal) =>
          `\n🍽️ ${meal.mealType.toUpperCase()}:\n  ${meal.totals.kcal} kcal | ${meal.totals.proteinG}g proteína | ${meal.totals.carbG}g carboidrato | ${meal.totals.fatG}g lipídio`
      )
      .join("\n");

    return success({
      message: `Ótimo! Aqui está seu resumo nutricional de hoje (${summaryResult.data.date}): 😊\n\n${mealsList}\n\n📊 Total do dia:\n• ${dailyTotals.kcal} kcal\n• ${dailyTotals.proteinG}g proteína\n• ${dailyTotals.carbG}g carboidrato\n• ${dailyTotals.fatG}g lipídio\n\nParabéns por cuidar da sua alimentação! Continue assim! 🌟`,
    });
  }

  private async getWeeklyReport(userId: string): Promise<Result<ProcessMessageResult, string>> {
    const reportResult = await this.generateWeeklyReportUseCase.execute(userId);

    if (!reportResult.success) {
      return failure(reportResult.error);
    }

    const { textReport, chartImage } = reportResult.data;

    return success({
      message: textReport,
      imageBuffer: chartImage,
      imageMimeType: "image/png",
    });
  }

  private extractCalorieGoal(messageBody: string): number | null {
    // Remove espaços e caracteres não numéricos, exceto números
    const cleaned = messageBody.trim().replace(/[^\d]/g, "");
    const number = parseInt(cleaned, 10);
    
    if (isNaN(number)) {
      return null;
    }
    
    if (number < GOAL.MIN_DAILY_CALORIES || number > GOAL.MAX_DAILY_CALORIES) {
      return null;
    }
    
    return number;
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

