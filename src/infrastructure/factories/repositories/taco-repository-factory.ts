import { ITacoRepository } from "@domain/repositories/taco.repository";
import { MongoDBTacoRepository } from "../../repositories/mongodb-taco.repository";

export const makeTacoRepository = (): ITacoRepository => {
  return new MongoDBTacoRepository();
};
