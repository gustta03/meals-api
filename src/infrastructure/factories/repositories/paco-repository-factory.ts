import { IPacoRepository } from "@domain/repositories/paco.repository";
import { MongoDBPacoRepository } from "../../repositories/mongodb-paco.repository";

export const makePacoRepository = (): IPacoRepository => {
  return new MongoDBPacoRepository();
};

