/**
 * Script para limpar todas as refeições do banco de dados
 * 
 * Uso: bun run src/scripts/clear-meals.ts
 * 
 * ATENÇÃO: Este script apaga TODAS as refeições do banco!
 */

import { MongoDBConnection } from "../infrastructure/database/mongodb.connection";
import { DATABASE } from "../shared/constants/database.constants";
import { logger } from "../shared/logger/logger";

async function clearMeals(): Promise<void> {
  const connection = MongoDBConnection.getInstance();

  try {
    logger.info("Connecting to MongoDB...");
    await connection.connect();

    const db = connection.getDatabase();
    const mealsCollection = db.collection(DATABASE.COLLECTIONS.MEALS);

    // Contar refeições antes de deletar
    const countBefore = await mealsCollection.countDocuments();
    logger.info({ countBefore }, "Meals found in database");

    if (countBefore === 0) {
      logger.info("No meals to delete");
      return;
    }

    // Deletar todas as refeições
    const deleteResult = await mealsCollection.deleteMany({});

    logger.info(
      {
        deletedCount: deleteResult.deletedCount,
        countBefore,
      },
      "Meals deleted successfully"
    );

    // Verificar se realmente deletou tudo
    const countAfter = await mealsCollection.countDocuments();
    if (countAfter > 0) {
      logger.warn(
        { countAfter },
        "Some meals were not deleted"
      );
    } else {
      logger.info("All meals deleted successfully");
    }
  } catch (error) {
    logger.error({ error }, "Failed to clear meals");
    throw error;
  } finally {
    await connection.disconnect();
    logger.info("Disconnected from MongoDB");
  }
}

// Executar script
clearMeals()
  .then(() => {
    logger.info("Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    logger.error({ error }, "Script failed");
    process.exit(1);
  });
