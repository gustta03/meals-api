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
  REPORT: {
    WEEKLY_FAILED: "Failed to generate weekly report",
    CHART_GENERATION_FAILED: "Failed to generate chart",
  },
  USER: {
    NOT_FOUND: "User not found",
    ALREADY_EXISTS: "User with this phone number already exists",
    INVALID_PHONE_NUMBER: "Invalid phone number format",
    FAILED_TO_CREATE: "Failed to create user",
    FAILED_TO_UPDATE: "Failed to update user",
  },
} as const;

