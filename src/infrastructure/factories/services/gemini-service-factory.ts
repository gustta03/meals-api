import { GeminiService } from "../../gemini/gemini.service";

export const makeGeminiService = (): GeminiService => {
  return new GeminiService();
};

