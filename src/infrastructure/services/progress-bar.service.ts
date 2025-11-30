import { Resvg } from "@resvg/resvg-js";
import { PROGRESS_BAR } from "@shared/constants/goal.constants";
import { logger } from "@shared/logger/logger";
import { ERROR_MESSAGES } from "@shared/constants/error-messages.constants";

export interface IProgressBarService {
  generateCalorieProgressBar(currentCalories: number, goalCalories: number): Promise<Buffer>;
}

export class ProgressBarService implements IProgressBarService {
  async generateCalorieProgressBar(currentCalories: number, goalCalories: number): Promise<Buffer> {
    try {
      const svg = this._generateProgressBarSVG(currentCalories, goalCalories);
      
      const resvg = new Resvg(svg, {
        font: {
          loadSystemFonts: true,
          defaultFontFamily: 'sans-serif',
        },
      });
      
      const pngData = resvg.render();
      const pngBuffer = pngData.asPng();
      
      logger.debug({ currentCalories, goalCalories }, "Progress bar generated successfully");
      return pngBuffer;
    } catch (error) {
      logger.error({ error, currentCalories, goalCalories }, "Failed to generate progress bar");
      throw new Error(ERROR_MESSAGES.REPORT.CHART_GENERATION_FAILED);
    }
  }

  private _generateProgressBarSVG(currentCalories: number, goalCalories: number): string {
    const width = PROGRESS_BAR.WIDTH;
    const height = PROGRESS_BAR.HEIGHT;
    const padding = PROGRESS_BAR.PADDING;
    const barWidth = width - padding * 2;
    const barHeight = PROGRESS_BAR.BAR_HEIGHT;
    const borderRadius = PROGRESS_BAR.BAR_BORDER_RADIUS;

    const safeGoalCalories = Math.max(goalCalories, 1);
    const percentage = Math.min((currentCalories / safeGoalCalories) * 100, 100);
    const fillWidth = (barWidth * percentage) / 100;

    const titleY = padding;
    const valuesY = padding + PROGRESS_BAR.TITLE_FONT_SIZE + 20;
    const barY = valuesY + PROGRESS_BAR.VALUE_FONT_SIZE + 30;
    const percentageY = barY + barHeight / 2;

    const currentCaloriesRounded = Math.round(currentCalories);
    const goalCaloriesRounded = Math.round(goalCalories);
    const percentageRounded = Math.round(percentage);

    const percentageTextX = fillWidth > 150
      ? padding + fillWidth / 2
      : padding + fillWidth + 20;
    const percentageTextColor = fillWidth > 150 ? "#FFFFFF" : PROGRESS_BAR.TEXT_COLOR;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${PROGRESS_BAR.BACKGROUND_COLOR}"/>
  
  <text x="${width / 2}" y="${titleY + PROGRESS_BAR.TITLE_FONT_SIZE}" text-anchor="middle" font-family="sans-serif" font-size="${PROGRESS_BAR.TITLE_FONT_SIZE}" font-weight="bold" fill="${PROGRESS_BAR.TEXT_COLOR}">Meta Diária de Calorias</text>
  
  <text x="${padding}" y="${valuesY + PROGRESS_BAR.VALUE_FONT_SIZE}" text-anchor="start" font-family="sans-serif" font-size="${PROGRESS_BAR.VALUE_FONT_SIZE}" font-weight="bold" fill="${PROGRESS_BAR.TEXT_COLOR}">${currentCaloriesRounded}</text>
  
  <text x="${width - padding}" y="${valuesY + PROGRESS_BAR.VALUE_FONT_SIZE + (PROGRESS_BAR.VALUE_FONT_SIZE - PROGRESS_BAR.LABEL_FONT_SIZE) / 2}" text-anchor="end" font-family="sans-serif" font-size="${PROGRESS_BAR.LABEL_FONT_SIZE}" fill="#6B7280">/ ${goalCaloriesRounded} kcal</text>
  
  <rect x="${padding}" y="${barY}" width="${barWidth}" height="${barHeight}" rx="${borderRadius}" fill="${PROGRESS_BAR.BAR_BACKGROUND_COLOR}"/>
  
  <rect x="${padding}" y="${barY}" width="${fillWidth}" height="${barHeight}" rx="${borderRadius}" fill="${PROGRESS_BAR.BAR_FILL_COLOR}"/>
  
  <text x="${percentageTextX}" y="${percentageY}" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="${PROGRESS_BAR.PERCENTAGE_FONT_SIZE}" font-weight="bold" fill="${percentageTextColor}">${percentageRounded}%</text>
</svg>`;
  }
}
