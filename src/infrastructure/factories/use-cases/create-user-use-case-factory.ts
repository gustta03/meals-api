import { CreateUserUseCase } from "@application/use-cases/create-user.use-case";
import { makeUserRepository } from "../repositories/user-repository-factory";

export const makeCreateUserUseCase = (): CreateUserUseCase => {
  return new CreateUserUseCase(makeUserRepository());
};
