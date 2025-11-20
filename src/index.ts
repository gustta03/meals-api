import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { Container } from "./infrastructure/dependency-injection/container";
import { errorHandler } from "./presentation/middlewares/error-handler.middleware";
import { MongoDBConnection } from "./infrastructure/database/mongodb.connection";

/**
 * Arquivo principal da aplicação
 * Configura o servidor Elysia e registra todas as rotas
 * 
 * Fluxo de dependências:
 * Repository -> Use Case -> Controller -> Elysia (via Container)
 */
async function startServer() {
  try {
    // Conectar ao MongoDB antes de iniciar o servidor
    const mongoConnection = MongoDBConnection.getInstance();
    await mongoConnection.connect();

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
      // Container injeta: Repository -> Use Case -> Controller -> Elysia
      .use(Container.getFoodRoutes())
      .listen(3000);

    console.log(
      `🚀 Server is running at http://${app.server?.hostname}:${app.server?.port}`
    );
    console.log(
      `📚 Swagger docs available at http://${app.server?.hostname}:${app.server?.port}/swagger`
    );

    // Graceful shutdown
    process.on("SIGINT", async () => {
      console.log("\n🛑 Shutting down gracefully...");
      await mongoConnection.disconnect();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      console.log("\n🛑 Shutting down gracefully...");
      await mongoConnection.disconnect();
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

