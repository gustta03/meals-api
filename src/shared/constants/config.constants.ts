export const CONFIG = {
  SERVER: {
    DEFAULT_PORT: 3000,
    DEFAULT_HOST: "0.0.0.0",
  },
  DATABASE: {
    DEFAULT_URI: "mongodb://admin:admin123@localhost:27017/?authSource=admin",
    DEFAULT_DB_NAME: "bot-nutri",
  },
  GEMINI: {
    DEFAULT_MODEL: "gemini-pro",
    VISION_MODEL: "gemini-pro-vision",
    DEFAULT_TEMPERATURE: 0.7,
    DEFAULT_MAX_TOKENS: 2048,
  },
} as const;

