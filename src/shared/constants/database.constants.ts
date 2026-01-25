export const DATABASE = {
  COLLECTIONS: {
    FOODS: "foods",
    PACO_ITEMS: "paco_items",
    TACO_ITEMS: "taco_items",
    MEALS: "meals",
    USER_SESSIONS: "user_sessions",
    USERS: "users",
  },
  NAMES: {
    BOT_NUTRI: "bot-nutri",
  },
  CONNECTION: {
    MAX_POOL_SIZE: 10,
    MIN_POOL_SIZE: 2,
    CONNECT_TIMEOUT_MS: 30000,
    SOCKET_TIMEOUT_MS: 45000,
    SERVER_SELECTION_TIMEOUT_MS: 30000,
    HEARTBEAT_FREQUENCY_MS: 10000,
    RETRY_READS: true,
    RETRY_WRITES: true,
  },
} as const;

