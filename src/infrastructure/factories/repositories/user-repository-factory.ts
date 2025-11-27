import { IUserRepository } from "@domain/repositories/user.repository";
import { MongoDBUserRepository } from "../../repositories/mongodb-user.repository";

let userRepositoryInstance: IUserRepository | null = null;

export const makeUserRepository = (): IUserRepository => {
  if (!userRepositoryInstance) {
    userRepositoryInstance = new MongoDBUserRepository();
  }
  return userRepositoryInstance;
};
