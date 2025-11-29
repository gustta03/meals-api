import { MongoClient, Db, MongoClientOptions } from "mongodb";
import { logger } from "@shared/logger/logger";
import { DATABASE } from "@shared/constants/database.constants";
import { CONFIG } from "@shared/constants/config.constants";
import { ERROR_MESSAGES } from "@shared/constants/error-messages.constants";

export class MongoDBConnection {
  private static instance: MongoDBConnection;
  private client: MongoClient | null = null;
  private db: Db | null = null;

  private constructor() {}

  static getInstance(): MongoDBConnection {
    if (!MongoDBConnection.instance) {
      MongoDBConnection.instance = new MongoDBConnection();
    }
    return MongoDBConnection.instance;
  }

  async connect(): Promise<void> {
    if (this.client) {
      return;
    }

    const uri = process.env.MONGODB_URI || CONFIG.DATABASE.DEFAULT_URI;
    const dbName = process.env.MONGODB_DB_NAME || CONFIG.DATABASE.DEFAULT_DB_NAME;

    const clientOptions: MongoClientOptions = {
      maxPoolSize: DATABASE.CONNECTION.MAX_POOL_SIZE,
      minPoolSize: DATABASE.CONNECTION.MIN_POOL_SIZE,
      connectTimeoutMS: DATABASE.CONNECTION.CONNECT_TIMEOUT_MS,
      socketTimeoutMS: DATABASE.CONNECTION.SOCKET_TIMEOUT_MS,
      serverSelectionTimeoutMS: DATABASE.CONNECTION.SERVER_SELECTION_TIMEOUT_MS,
      heartbeatFrequencyMS: DATABASE.CONNECTION.HEARTBEAT_FREQUENCY_MS,
      retryReads: DATABASE.CONNECTION.RETRY_READS,
      retryWrites: DATABASE.CONNECTION.RETRY_WRITES,
      monitorCommands: false,
    };

    try {
      this.client = new MongoClient(uri, clientOptions);
      
      this.client.on("error", (error) => {
        logger.error({ error }, "MongoDB client error");
      });
      
      await this.client.connect();
      this.db = this.client.db(dbName);

      logger.info({ dbName }, "Connected to MongoDB");
    } catch (error) {
      const maskedUri = uri.replace(/\/\/.*@/, "//***@");
      logger.error(
        { 
          error, 
          uri: maskedUri,
          dbName,
        }, 
        ERROR_MESSAGES.DATABASE.CONNECTION_FAILED
      );
      throw error;
    }
  }

  getDatabase(): Db {
    if (!this.db) {
      throw new Error(ERROR_MESSAGES.DATABASE.CONNECTION_FAILED);
    }
    return this.db;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      logger.info("Disconnected from MongoDB");
    }
  }

  isConnected(): boolean {
    return this.client !== null && this.db !== null;
  }
}

