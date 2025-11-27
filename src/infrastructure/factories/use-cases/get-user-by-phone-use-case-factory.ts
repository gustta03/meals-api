import { GetUserByPhoneUseCase } from "@application/use-cases/get-user-by-phone.use-case";
import { makeUserRepository } from "../repositories/user-repository-factory";

export const makeGetUserByPhoneUseCase = (): GetUserByPhoneUseCase => {
  return new GetUserByPhoneUseCase(makeUserRepository());
};
