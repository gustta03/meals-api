import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { errorHandler } from "./presentation/middlewares/error-handler.middleware";
import { MongoDBConnection } from "./infrastructure/database/mongodb.connection";
import { registerRoutes } from "./presentation/routes";
import { WhatsAppService } from "./infrastructure/whatsapp/whatsapp.service";
import { logger } from "@shared/logger/logger";

async function startServer() {
  try {
    const mongoConnection = MongoDBConnection.getInstance();
    try {
      await mongoConnection.connect();
    } catch (error) {
      logger.warn({ error }, "MongoDB connection failed, continuing without database");
    }

    const whatsappService = new WhatsAppService();
    await whatsappService.start();

    const app = new Elysia()
      .use(swagger({
        documentation: {
          info: {
            title: "Bot Nutri API",
            version: "1.0.0",
            description: "API de nutrição usando Bun + Elysia com Clean Architecture",
          },
          tags: [
            { name: "foods", description: "Operações relacionadas a alimentos" },
          ],
        },
      }))
      .use(errorHandler)
      .get("/", () => ({
        message: "Bot Nutri API",
        version: "1.0.0",
        docs: "/swagger",
      }))
      .get("/health", () => ({
        status: "ok",
        timestamp: new Date().toISOString(),
      }))
      .use(registerRoutes(new Elysia()))
      .listen(3000);

    logger.info(
      {
        hostname: app.server?.hostname,
        port: app.server?.port,
      },
      "Server is running"
    );
    logger.info(
      {
        url: `http://${app.server?.hostname}:${app.server?.port}/swagger`,
      },
      "Swagger docs available"
    );

    process.on("SIGINT", async () => {
      logger.info("Shutting down gracefully...");
      await whatsappService.stop();
      await mongoConnection.disconnect();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      logger.info("Shutting down gracefully...");
      await whatsappService.stop();
      await mongoConnection.disconnect();
      process.exit(0);
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error({ error: errorMessage, stack: errorStack }, "Failed to start server");
    process.exit(1);
  }
}

startServer();

