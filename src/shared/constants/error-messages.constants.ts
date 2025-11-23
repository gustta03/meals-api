export const ERROR_MESSAGES = {
  FOOD: {
    NOT_FOUND: "Food not found",
    ALREADY_EXISTS: "Food with this name already exists",
    INVALID_NUTRITION: "Nutrition value cannot be negative",
  },
  DATABASE: {
    CONNECTION_FAILED: "Failed to connect to database",
    OPERATION_FAILED: "Database operation failed",
  },
  NUTRITION: {
    ITEM_NOT_FOUND_IN_PACO: "Item não encontrado na PACO. Necessário mapeamento manual.",
    FAILED_TO_ANALYZE: "Failed to analyze nutritional content",
    INVALID_INPUT: "Invalid input for nutritional analysis",
  },
  GEMINI: {
    API_KEY_MISSING: "Gemini API key is missing",
    FAILED_TO_PROCESS_TEXT: "Failed to process text with Gemini",
    FAILED_TO_PROCESS_IMAGE: "Failed to process image with Gemini",
  },
  MESSAGE: {
    PROCESSING_FAILED: "Failed to process message",
  },
} as const;

