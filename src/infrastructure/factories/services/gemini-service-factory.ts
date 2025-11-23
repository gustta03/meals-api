import { GeminiService } from "../../gemini/gemini.service";
import { logger } from "@shared/logger/logger";

export const makeGeminiService = (): GeminiService | null => {
  try {
    return new GeminiService();
  } catch (error) {
    logger.warn({ error }, "Gemini service initialization failed. Nutrition analysis will not work.");
    return null;
  }
};

