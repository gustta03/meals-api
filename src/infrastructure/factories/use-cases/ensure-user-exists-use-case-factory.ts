import { EnsureUserExistsUseCase } from "@application/use-cases/ensure-user-exists.use-case";
import { makeGetUserByPhoneUseCase } from "./get-user-by-phone-use-case-factory";
import { makeCreateUserUseCase } from "./create-user-use-case-factory";

export const makeEnsureUserExistsUseCase = (): EnsureUserExistsUseCase => {
  return new EnsureUserExistsUseCase(
    makeGetUserByPhoneUseCase(),
    makeCreateUserUseCase()
  );
};
