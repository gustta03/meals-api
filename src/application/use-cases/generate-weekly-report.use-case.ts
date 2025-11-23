import { Result, success, failure } from "@shared/types/result";
import { GetWeeklyReportUseCase, WeeklyReportDto } from "./get-weekly-report.use-case";
import { IChartService } from "@infrastructure/services/chart.service";
import { logger } from "@shared/logger/logger";
import { ERROR_MESSAGES } from "@shared/constants/error-messages.constants";

export interface WeeklyReportResult {
  report: WeeklyReportDto;
  chartImage: Buffer;
  textReport: string;
}

export class GenerateWeeklyReportUseCase {
  constructor(
    private readonly getWeeklyReportUseCase: GetWeeklyReportUseCase,
    private readonly chartService: IChartService
  ) {}

  async execute(userId: string, startDate?: Date): Promise<Result<WeeklyReportResult, string>> {
    try {
      const reportResult = await this.getWeeklyReportUseCase.execute(userId, startDate);

      if (!reportResult.success) {
        return failure(reportResult.error);
      }

      const report = reportResult.data;
      const chartImage = await this.chartService.generateWeeklyNutritionChart(report);
      const textReport = this.formatTextReport(report);

      return success({
        report,
        chartImage,
        textReport,
      });
    } catch (error) {
      logger.error({ error, userId, startDate }, "Failed to generate weekly report");
      const errorMessage = error instanceof Error 
        ? error.message 
        : ERROR_MESSAGES.REPORT.WEEKLY_FAILED;
      return failure(errorMessage);
    }
  }

  private formatTextReport(report: WeeklyReportDto): string {
    const { days, weeklyTotals, startDate, endDate } = report;

    let text = `Olá! Aqui está seu relatório semanal completo! 😊\n\n`;
    text += `📊 RELATÓRIO SEMANAL DE NUTRIÇÃO\n`;
    text += `📅 Período: ${this.formatDate(startDate)} a ${this.formatDate(endDate)}\n\n`;

    text += `📈 RESUMO POR DIA:\n\n`;
    
    days.forEach((day) => {
      const date = new Date(day.date);
      const dayName = date.toLocaleDateString("pt-BR", { weekday: "long" });
      const dayNumber = date.getDate();
      const month = date.toLocaleDateString("pt-BR", { month: "short" });
      
      text += `📅 ${dayName}, ${dayNumber} ${month}:\n`;
      text += `   • Calorias: ${day.kcal} kcal\n`;
      text += `   • Proteína: ${day.proteinG} g\n`;
      text += `   • Carboidrato: ${day.carbG} g\n`;
      text += `   • Lipídio: ${day.fatG} g\n`;
      text += `   • Refeições: ${day.mealCount}\n\n`;
    });

    text += `📊 TOTAIS DA SEMANA:\n`;
    text += `   • Total de Calorias: ${weeklyTotals.kcal} kcal\n`;
    text += `   • Total de Proteína: ${weeklyTotals.proteinG} g\n`;
    text += `   • Total de Carboidrato: ${weeklyTotals.carbG} g\n`;
    text += `   • Total de Lipídio: ${weeklyTotals.fatG} g\n\n`;

    text += `📈 MÉDIAS DIÁRIAS:\n`;
    text += `   • Média de Calorias: ${weeklyTotals.averageKcal} kcal/dia\n`;
    text += `   • Média de Proteína: ${weeklyTotals.averageProteinG} g/dia\n`;
    text += `   • Média de Carboidrato: ${weeklyTotals.averageCarbG} g/dia\n`;
    text += `   • Média de Lipídio: ${weeklyTotals.averageFatG} g/dia\n\n`;

    text += `Parabéns por acompanhar sua alimentação durante toda a semana! Continue assim, você está fazendo um ótimo trabalho! 🌟💪\n\n`;
    text += `Abaixo você encontrará um gráfico visual com a evolução dos seus nutrientes ao longo da semana.`;

    return text;
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", { 
      day: "2-digit", 
      month: "short", 
      year: "numeric" 
    });
  }
}

