import { createCanvas, CanvasRenderingContext2D } from "canvas";
import { PROGRESS_BAR } from "@shared/constants/goal.constants";
import { logger } from "@shared/logger/logger";
import { ERROR_MESSAGES } from "@shared/constants/error-messages.constants";

export interface IProgressBarService {
  generateCalorieProgressBar(currentCalories: number, goalCalories: number): Promise<Buffer>;
}

export class ProgressBarService implements IProgressBarService {
  async generateCalorieProgressBar(currentCalories: number, goalCalories: number): Promise<Buffer> {
    try {
      const canvas = createCanvas(PROGRESS_BAR.WIDTH, PROGRESS_BAR.HEIGHT);
      const ctx = canvas.getContext("2d");

      // Background
      ctx.fillStyle = PROGRESS_BAR.BACKGROUND_COLOR;
      ctx.fillRect(0, 0, PROGRESS_BAR.WIDTH, PROGRESS_BAR.HEIGHT);

      // Calculate percentage
      const percentage = Math.min((currentCalories / goalCalories) * 100, 100);
      const barWidth = PROGRESS_BAR.WIDTH - PROGRESS_BAR.PADDING * 2;
      const fillWidth = (barWidth * percentage) / 100;

      // Title
      ctx.fillStyle = PROGRESS_BAR.TEXT_COLOR;
      ctx.font = `bold ${PROGRESS_BAR.TITLE_FONT_SIZE}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText("Meta Diária de Calorias", PROGRESS_BAR.WIDTH / 2, PROGRESS_BAR.PADDING);

      // Current and goal values
      const valuesY = PROGRESS_BAR.PADDING + PROGRESS_BAR.TITLE_FONT_SIZE + 20;
      ctx.font = `bold ${PROGRESS_BAR.VALUE_FONT_SIZE}px Arial`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(`${Math.round(currentCalories)}`, PROGRESS_BAR.PADDING, valuesY);
      
      ctx.textAlign = "right";
      ctx.fillStyle = "#6B7280";
      ctx.font = `${PROGRESS_BAR.LABEL_FONT_SIZE}px Arial`;
      ctx.textBaseline = "top";
      ctx.fillText(`/ ${Math.round(goalCalories)} kcal`, PROGRESS_BAR.WIDTH - PROGRESS_BAR.PADDING, valuesY + (PROGRESS_BAR.VALUE_FONT_SIZE - PROGRESS_BAR.LABEL_FONT_SIZE) / 2);

      // Progress bar background
      const barY = valuesY + PROGRESS_BAR.VALUE_FONT_SIZE + 30;
      ctx.fillStyle = PROGRESS_BAR.BAR_BACKGROUND_COLOR;
      this.roundRect(
        ctx,
        PROGRESS_BAR.PADDING,
        barY,
        barWidth,
        PROGRESS_BAR.BAR_HEIGHT,
        PROGRESS_BAR.BAR_BORDER_RADIUS
      );
      ctx.fill();

      // Progress bar fill
      ctx.fillStyle = PROGRESS_BAR.BAR_FILL_COLOR;
      this.roundRect(
        ctx,
        PROGRESS_BAR.PADDING,
        barY,
        fillWidth,
        PROGRESS_BAR.BAR_HEIGHT,
        PROGRESS_BAR.BAR_BORDER_RADIUS
      );
      ctx.fill();

      // Percentage text
      const percentageY = barY + PROGRESS_BAR.BAR_HEIGHT / 2;
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `bold ${PROGRESS_BAR.PERCENTAGE_FONT_SIZE}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      // Show percentage on the bar if there's enough space, otherwise above
      if (fillWidth > 150) {
        ctx.fillText(
          `${Math.round(percentage)}%`,
          PROGRESS_BAR.PADDING + fillWidth / 2,
          percentageY
        );
      } else {
        ctx.fillStyle = PROGRESS_BAR.TEXT_COLOR;
        ctx.fillText(
          `${Math.round(percentage)}%`,
          PROGRESS_BAR.PADDING + fillWidth + 20,
          percentageY
        );
      }

      return canvas.toBuffer("image/png");
    } catch (error) {
      logger.error({ error, currentCalories, goalCalories }, "Failed to generate progress bar");
      throw new Error(ERROR_MESSAGES.REPORT.CHART_GENERATION_FAILED);
    }
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

