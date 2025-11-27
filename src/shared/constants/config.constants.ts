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
    DEFAULT_MODEL: "gemini-2.0-flash",
    VISION_MODEL: "gemini-2.0-flash",
    DEFAULT_TEMPERATURE: 0.7,
    DEFAULT_MAX_TOKENS: 2048,
  },
  TACO: {
    API_URL: process.env.TACO_API_URL,
  },
} as const;

