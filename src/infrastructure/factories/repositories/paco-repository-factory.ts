import { IPacoRepository } from "@domain/repositories/paco.repository";
import { MongoDBPacoRepository } from "../../repositories/mongodb-paco.repository";
import { TacoApiPacoRepository } from "../../repositories/taco-api-paco.repository";
import { makeTacoClient } from "../services/taco-client-factory";
import { logger } from "@shared/logger/logger";
import { CONFIG } from "@shared/constants/config.constants";

export const makePacoRepository = (): IPacoRepository => {
  const useTacoApiEnv = process.env.USE_TACO_API;
  const tacoApiUrlEnv = process.env.TACO_API_URL;
  
  const useTacoApi = useTacoApiEnv === "true" || (tacoApiUrlEnv !== undefined && tacoApiUrlEnv !== "");
  
  logger.info(
    {
      USE_TACO_API: useTacoApiEnv,
      TACO_API_URL: tacoApiUrlEnv || "not set",
      willUseTacoApi: useTacoApi,
    },
    "PACO Repository factory - checking configuration"
  );
  
  if (useTacoApi) {
    const apiUrl = tacoApiUrlEnv || CONFIG.TACO.API_URL;
    logger.info({ apiUrl }, "Using TACO API repository");
    return new TacoApiPacoRepository(makeTacoClient());
  }
  
  logger.info("Using MongoDB PACO repository (fallback)");
  return new MongoDBPacoRepository();
};

