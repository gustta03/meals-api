import { Resvg } from "@resvg/resvg-js";
import { WeeklyReportDto } from "@application/use-cases/get-weekly-report.use-case";
import { REPORT } from "@shared/constants/report.constants";
import { ERROR_MESSAGES } from "@shared/constants/error-messages.constants";
import { logger } from "@shared/logger/logger";

export interface IChartService {
  generateWeeklyNutritionChart(report: WeeklyReportDto): Promise<Buffer>;
  generateWeeklyChartWithProgressBars(
    report: WeeklyReportDto,
    goalCalories: number
  ): Promise<Buffer>;
}

export class ChartService implements IChartService {
  async generateWeeklyNutritionChart(report: WeeklyReportDto): Promise<Buffer> {
    try {
      const svg = this._generateChartSVG(report);
      
      const resvg = new Resvg(svg, {
        font: {
          loadSystemFonts: true,
          defaultFontFamily: 'sans-serif',
        },
      });
      
      const pngData = resvg.render();
      const pngBuffer = pngData.asPng();
      
      logger.debug({ reportStartDate: report.startDate, reportEndDate: report.endDate }, "Weekly nutrition chart generated successfully");
      return pngBuffer;
    } catch (error) {
      logger.error({ error, report }, "Failed to generate weekly nutrition chart");
      throw new Error(ERROR_MESSAGES.REPORT.CHART_GENERATION_FAILED);
    }
  }

  async generateWeeklyChartWithProgressBars(
    report: WeeklyReportDto,
    goalCalories: number
  ): Promise<Buffer> {
    try {
      const chartSvg = this._generateChartSVG(report);
      const progressBarsSvg = this._generateProgressBarsSVG(report, goalCalories);
      
      const combinedSvg = this._combineSVGs(chartSvg, progressBarsSvg);
      
      const resvg = new Resvg(combinedSvg, {
        font: {
          loadSystemFonts: true,
          defaultFontFamily: 'sans-serif',
        },
      });
      
      const pngData = resvg.render();
      const pngBuffer = pngData.asPng();
      
      logger.debug({ reportStartDate: report.startDate, reportEndDate: report.endDate, goalCalories }, "Weekly chart with progress bars generated successfully");
      return pngBuffer;
    } catch (error) {
      logger.error({ error, report, goalCalories }, "Failed to generate weekly chart with progress bars");
      throw new Error(ERROR_MESSAGES.REPORT.CHART_GENERATION_FAILED);
    }
  }

  private _generateChartSVG(report: WeeklyReportDto): string {
    const width = REPORT.CHART.WIDTH;
    const height = REPORT.CHART.HEIGHT;
    const padding = 60;
    const chartWidth = width - (padding * 2);
    const chartHeight = height - 150;
    const chartX = padding;
    const chartY = 100;

    const labels = report.days.map((day) => {
      const date = new Date(day.date + "T00:00:00");
      const dayName = date.toLocaleDateString("pt-BR", { weekday: "short" });
      const dayNumber = date.getDate();
      return `${dayName} ${dayNumber}`;
    });

    const caloriesData = report.days.map((day) => Math.max(0, day.kcal));
    const proteinData = report.days.map((day) => Math.max(0, day.proteinG));
    const carbsData = report.days.map((day) => Math.max(0, day.carbG));

    const maxCalories = Math.max(...caloriesData, 100);
    const maxProtein = Math.max(...proteinData, 50);
    const maxCarbs = Math.max(...carbsData, 50);
    const maxValue = Math.max(maxCalories, maxProtein * 2, maxCarbs * 2) || 100;

    const xScale = chartWidth / (labels.length - 1 || 1);
    const yScale = chartHeight / maxValue;

    const caloriesPath = this._generateLinePath(
      caloriesData,
      chartX,
      chartY,
      chartHeight,
      xScale,
      yScale
    );
    const proteinPath = this._generateLinePath(
      proteinData,
      chartX,
      chartY,
      chartHeight,
      xScale,
      yScale * 2
    );
    const carbsPath = this._generateLinePath(
      carbsData,
      chartX,
      chartY,
      chartHeight,
      xScale,
      yScale * 2
    );

    const caloriesAreaPath = caloriesPath + ` L ${chartX + chartWidth},${chartY + chartHeight} L ${chartX},${chartY + chartHeight} Z`;
    const proteinAreaPath = proteinPath + ` L ${chartX + chartWidth},${chartY + chartHeight} L ${chartX},${chartY + chartHeight} Z`;
    const carbsAreaPath = carbsPath + ` L ${chartX + chartWidth},${chartY + chartHeight} L ${chartX},${chartY + chartHeight} Z`;

    const points = [
      ...caloriesData.map((value, index) => ({
        x: chartX + index * xScale,
        y: chartY + chartHeight - (value * yScale),
        color: REPORT.CHART.COLORS.CALORIES,
      })),
      ...proteinData.map((value, index) => ({
        x: chartX + index * xScale,
        y: chartY + chartHeight - (value * yScale * 2),
        color: REPORT.CHART.COLORS.PROTEIN,
      })),
      ...carbsData.map((value, index) => ({
        x: chartX + index * xScale,
        y: chartY + chartHeight - (value * yScale * 2),
        color: REPORT.CHART.COLORS.CARBS,
      })),
    ];

    const pointsSvg = points
      .map(
        (point) =>
          `<circle cx="${point.x}" cy="${point.y}" r="6" fill="${point.color}" stroke="#FFFFFF" stroke-width="2"/>`
      )
      .join("\n");

    const gridLines = this._generateGridLines(
      chartX,
      chartY,
      chartWidth,
      chartHeight,
      maxValue
    );

    const xAxisLabels = labels
      .map(
        (label, index) =>
          `<text x="${chartX + index * xScale}" y="${chartY + chartHeight + 30}" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#1F2937">${label}</text>`
      )
      .join("\n");

    const yAxisLabels = Array.from({ length: 6 }, (_, i) => {
      const value = (maxValue / 5) * (5 - i);
      const y = chartY + (chartHeight / 5) * i;
      return `<text x="${chartX - 10}" y="${y + 5}" text-anchor="end" font-family="sans-serif" font-size="11" fill="#6B7280">${Math.round(value)}</text>`;
    }).join("\n");

    const startDateFormatted = this._formatDateForTitle(report.startDate);
    const endDateFormatted = this._formatDateForTitle(report.endDate);
    const title = `Relatório Semanal de Nutrição - ${startDateFormatted} a ${endDateFormatted}`;

    const escapedTitle = title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="white"/>
  
  <text x="${width / 2}" y="30" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="bold" fill="#1F2937">${escapedTitle}</text>
  
  <g id="grid">${gridLines}</g>
  
  <g id="areas">
    <path d="${caloriesAreaPath}" fill="${REPORT.CHART.COLORS.CALORIES}33" stroke="none"/>
    <path d="${proteinAreaPath}" fill="${REPORT.CHART.COLORS.PROTEIN}33" stroke="none"/>
    <path d="${carbsAreaPath}" fill="${REPORT.CHART.COLORS.CARBS}33" stroke="none"/>
  </g>
  
  <g id="lines">
    <path d="${caloriesPath}" fill="none" stroke="${REPORT.CHART.COLORS.CALORIES}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${proteinPath}" fill="none" stroke="${REPORT.CHART.COLORS.PROTEIN}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${carbsPath}" fill="none" stroke="${REPORT.CHART.COLORS.CARBS}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  
  <g id="points">${pointsSvg}</g>
  
  <g id="labels">
    ${xAxisLabels}
    ${yAxisLabels}
  </g>
  
  <g id="legend" transform="translate(${width / 2 - 150}, ${height - 40})">
    <circle cx="0" cy="0" r="6" fill="${REPORT.CHART.COLORS.CALORIES}"/>
    <text x="15" y="5" font-family="sans-serif" font-size="14" fill="#1F2937">Calorias (kcal)</text>
    
    <circle cx="150" cy="0" r="6" fill="${REPORT.CHART.COLORS.PROTEIN}"/>
    <text x="165" y="5" font-family="sans-serif" font-size="14" fill="#1F2937">Proteína (g)</text>
    
    <circle cx="280" cy="0" r="6" fill="${REPORT.CHART.COLORS.CARBS}"/>
    <text x="295" y="5" font-family="sans-serif" font-size="14" fill="#1F2937">Carboidrato (g)</text>
  </g>
</svg>`;
  }

  private _generateProgressBarsSVG(
    report: WeeklyReportDto,
    goalCalories: number
  ): string {
    const width = REPORT.CHART.WIDTH;
    const barHeight = 100;
    const padding = 20;
    const barWidth = (width - padding * 3) / 2;
    const barsPerRow = 2;
    
    const rows = Math.ceil(report.days.length / barsPerRow);
    const totalHeight = 60 + rows * (barHeight + padding) + padding;

    const bars = report.days
      .map((day, index) => {
        const row = Math.floor(index / barsPerRow);
        const col = index % barsPerRow;
        const x = padding + col * (barWidth + padding);
        const y = 60 + row * (barHeight + padding);

        const safeGoalCalories = Math.max(goalCalories, 1);
        const percentage = Math.min((day.kcal / safeGoalCalories) * 100, 100);
        const date = new Date(day.date + "T00:00:00");
        const dayName = date.toLocaleDateString("pt-BR", { weekday: "short" });
        const dayNumber = date.getDate();
        const month = date.toLocaleDateString("pt-BR", { month: "short" });

        const fillWidth = ((barWidth - padding * 2) * percentage) / 100;
        const barX = x + padding;
        const barY = y + 50;
        const barInnerWidth = barWidth - padding * 2;
        const barInnerHeight = 40;

        const percentageTextColor = percentage >= 50 ? "#FFFFFF" : "#1F2937";
        const percentageText = fillWidth > 60 
          ? `<text x="${barX + fillWidth / 2}" y="${barY + barInnerHeight / 2}" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="${percentageTextColor}">${Math.round(percentage)}%</text>`
          : "";

        return `
          <g id="bar-${index}">
            <text x="${barX}" y="${y + 5}" font-family="sans-serif" font-size="18" font-weight="bold" fill="#1F2937">${dayName} ${dayNumber}/${month}</text>
            <text x="${barX}" y="${y + 25}" font-family="sans-serif" font-size="16" fill="#6B7280">${Math.round(day.kcal)}/${Math.round(goalCalories)} kcal</text>
            
            <rect x="${barX}" y="${barY}" width="${barInnerWidth}" height="${barInnerHeight}" fill="#E5E7EB" rx="4"/>
            <rect x="${barX}" y="${barY}" width="${fillWidth}" height="${barInnerHeight}" fill="${percentage >= 100 ? "#EF4444" : "#3B82F6"}" rx="4"/>
            
            ${percentageText}
          </g>
        `;
      })
      .join("\n");

    return `
      <svg width="${width}" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${totalHeight}" fill="white"/>
        <text x="${width / 2}" y="35" text-anchor="middle" font-family="sans-serif" font-size="28" font-weight="bold" fill="#1F2937">Progresso Diário em Relação à Meta</text>
        ${bars}
      </svg>
    `;
  }

  private _combineSVGs(chartSvg: string, progressBarsSvg: string): string {
    const chartHeight = REPORT.CHART.HEIGHT;
    
    const progressBarsMatch = progressBarsSvg.match(/height="(\d+)"/);
    const progressBarsHeight = progressBarsMatch ? parseInt(progressBarsMatch[1], 10) : 0;
    
    const totalHeight = chartHeight + progressBarsHeight;
    const width = REPORT.CHART.WIDTH;

    const chartSVGContent = chartSvg.replace(/<svg[^>]*>/, "").replace(/<\/svg>$/, "");
    const progressBarsSVGContent = progressBarsSvg
      .replace(/<svg[^>]*>/, "")
      .replace(/<\/svg>$/, "")
      .replace(/<rect width="[^"]*" height="[^"]*" fill="white"\/>/, "");

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${totalHeight}" fill="white"/>
  <g transform="translate(0, 0)">${chartSVGContent}</g>
  <g transform="translate(0, ${chartHeight})">${progressBarsSVGContent}</g>
</svg>`;
  }

  private _generateLinePath(
    data: number[],
    startX: number,
    startY: number,
    chartHeight: number,
    xScale: number,
    yScale: number
  ): string {
    if (data.length === 0) {
      return "";
    }

    const points = data
      .map(
        (value, index) =>
          `${startX + index * xScale},${startY + chartHeight - value * yScale}`
      )
      .join(" ");

    return `M ${points}`;
  }

  private _generateGridLines(
    x: number,
    y: number,
    width: number,
    height: number,
    maxValue: number
  ): string {
    const horizontalLines = Array.from({ length: 6 }, (_, i) => {
      const lineY = y + (height / 5) * i;
      return `<line x1="${x}" y1="${lineY}" x2="${x + width}" y2="${lineY}" stroke="#E5E7EB" stroke-width="1"/>`;
    }).join("\n");

    const verticalLines = Array.from({ length: 8 }, (_, i) => {
      const lineX = x + (width / 7) * i;
      return `<line x1="${lineX}" y1="${y}" x2="${lineX}" y2="${y + height}" stroke="#E5E7EB" stroke-width="1"/>`;
    }).join("\n");

    return horizontalLines + "\n" + verticalLines;
  }

  private _formatDateForTitle(dateString: string): string {
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

}
