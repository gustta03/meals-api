import { GoogleGenerativeAI } from "@google/generative-ai";
import { CONFIG } from "@shared/constants/config.constants";
import { ERROR_MESSAGES } from "@shared/constants/error-messages.constants";
import { logger } from "@shared/logger/logger";

interface ExtractedFoodItem {
  name: string;
  quantity: string;
  weightGrams: number;
  unit?: string;
}

interface GeminiTextResponse {
  items: ExtractedFoodItem[];
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]>;
  private visionModel: ReturnType<GoogleGenerativeAI["getGenerativeModel"]>;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
      logger.warn("GEMINI_API_KEY not found in environment variables. Gemini features will not work.");
      throw new Error(ERROR_MESSAGES.GEMINI.API_KEY_MISSING);
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      
      try {
        this.model = this.genAI.getGenerativeModel({
          model: CONFIG.GEMINI.DEFAULT_MODEL,
        });
        this.visionModel = this.genAI.getGenerativeModel({
          model: CONFIG.GEMINI.VISION_MODEL,
        });
        logger.info({ model: CONFIG.GEMINI.DEFAULT_MODEL, visionModel: CONFIG.GEMINI.VISION_MODEL }, "Gemini models initialized");
      } catch (modelError) {
        logger.warn({ error: modelError, configuredModel: CONFIG.GEMINI.DEFAULT_MODEL }, "Failed to initialize configured model, falling back to gemini-pro");
        this.model = this.genAI.getGenerativeModel({
          model: "gemini-pro",
        });
        this.visionModel = this.genAI.getGenerativeModel({
          model: "gemini-pro-vision",
        });
        logger.info("Using fallback models: gemini-pro and gemini-pro-vision");
      }
    } catch (error) {
      logger.error({ error }, "Failed to initialize Gemini service");
      throw error;
    }
  }

  async extractFoodItemsFromText(text: string): Promise<Array<{ name: string; quantity: string; weightGrams: number; unit?: string }>> {
    try {
      const prompt = this.buildExtractionPrompt(text);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const textResponse = response.text();

      logger.debug({ text, response: textResponse }, "Gemini text extraction response");

      const extractedItems = this.parseExtractionResponse(textResponse);
      return extractedItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        weightGrams: item.weightGrams,
        unit: item.unit,
      }));
    } catch (error: any) {
      const errorDetails = {
        message: error?.message,
        status: error?.status,
        statusText: error?.statusText,
        code: error?.code,
        response: error?.response?.data || error?.response,
      };
      logger.error({ error: errorDetails, text }, "Failed to extract food items from text");
      
      if (error?.status === 404) {
        throw new Error("Gemini API: Model not found or API endpoint incorrect. Please check your GEMINI_API_KEY and model configuration.");
      }
      if (error?.status === 401 || error?.status === 403) {
        throw new Error("Gemini API: Invalid API key. Please check your GEMINI_API_KEY.");
      }
      
      throw new Error(ERROR_MESSAGES.GEMINI.FAILED_TO_PROCESS_TEXT);
    }
  }

  async extractFoodItemsFromImage(imageBase64: string, mimeType: string): Promise<Array<{ name: string; quantity: string; weightGrams: number; unit?: string }>> {
    try {
      const prompt = this.buildImageExtractionPrompt();
      const imagePart = {
        inlineData: {
          data: imageBase64,
          mimeType,
        },
      };

      const result = await this.visionModel.generateContent([prompt, imagePart]);
      const response = await result.response;
      const textResponse = response.text();

      logger.debug({ response: textResponse }, "Gemini image extraction response");

      const extractedItems = this.parseExtractionResponse(textResponse);
      return extractedItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        weightGrams: item.weightGrams,
        unit: item.unit,
      }));
    } catch (error) {
      logger.error({ error }, "Failed to extract food items from image");
      throw new Error(ERROR_MESSAGES.GEMINI.FAILED_TO_PROCESS_IMAGE);
    }
  }

  private buildExtractionPrompt(text: string): string {
    return `Analise a seguinte mensagem de texto descrevendo alimentos consumidos e extraia os itens com suas quantidades.

Mensagem: "${text}"

IMPORTANTE: Use nomes GENÉRICOS e SIMPLES dos alimentos, sem descrições de preparo ou molhos.
Exemplos:
- "Asas de frango ao molho picante" → "asas de frango" ou "frango"
- "Arroz branco temperado" → "arroz"
- "Feijão preto" → "feijão"

Extraia cada alimento mencionado com:
- name: nome GENÉRICO do alimento (em português, sem preparo/molho)
- quantity: quantidade mencionada (ex: "2 peitos", "300g", "1 copo")
- weightGrams: peso estimado em gramas (converta unidades como "copo" para ml/gramas, "peito de frango" para ~150g cada, etc.)
- unit: unidade mencionada (opcional, "g" ou "ml")

Retorne APENAS um JSON válido no formato:
{
  "items": [
    {
      "name": "nome do alimento",
      "quantity": "quantidade original",
      "weightGrams": 0,
      "unit": "g ou ml"
    }
  ]
}

Seja preciso nas conversões:
- 1 copo = 200ml
- 1 xícara = 240ml
- 1 peito de frango = 150g
- 1 ovo = 50g
- 1 colher de sopa = 15ml

Retorne APENAS o JSON, sem texto adicional.`;
  }

  private buildImageExtractionPrompt(): string {
    return `Analise a imagem do prato e identifique os alimentos presentes.

IMPORTANTE: Use nomes GENÉRICOS e SIMPLES dos alimentos, sem descrições de preparo ou molhos.
Exemplos:
- "Asas de frango ao molho picante" → "asas de frango" ou "frango"
- "Cenoura com aipo" → "cenoura" e "aipo" (separados)
- "Molho ranch" → "molho" ou ignore se não for alimento principal
- "Arroz branco" → "arroz"
- "Feijão preto" → "feijão"

Para cada alimento identificado, estime:
- name: nome GENÉRICO do alimento (em português, sem preparo/molho)
- quantity: quantidade estimada (ex: "1 porção", "2 unidades", "8 unidades")
- weightGrams: peso estimado em gramas (faça uma estimativa razoável baseada no tamanho visual)
- unit: "g" ou "ml"

Retorne APENAS um JSON válido no formato:
{
  "items": [
    {
      "name": "nome genérico do alimento",
      "quantity": "quantidade estimada",
      "weightGrams": 0,
      "unit": "g ou ml"
    }
  ]
}

Retorne APENAS o JSON, sem texto adicional.`;
  }

  private parseExtractionResponse(textResponse: string): ExtractedFoodItem[] {
    try {
      const cleanedResponse = textResponse.trim().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed: GeminiTextResponse = JSON.parse(cleanedResponse);
      return parsed.items || [];
    } catch (error) {
      logger.error({ error, textResponse }, "Failed to parse Gemini response");
      return [];
    }
  }
}

