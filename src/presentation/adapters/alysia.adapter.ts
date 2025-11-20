import { Elysia } from "elysia";
import { Result } from "@shared/types/result";

/**
 * Adapter para converter entre Elysia e Controllers
 * Isola a dependência do framework HTTP da camada de apresentação
 */
export class AlysiaAdapter {
  /**
   * Adapta um método de controller para uma rota do Elysia
   * Converte o Result do controller em resposta HTTP apropriada
   */
  static adapt<T>(
    handler: () => Promise<Result<T, string>>,
    successStatus: number = 200
  ) {
    return async (context: { set: any }) => {
      const result = await handler();

      if (!result.success) {
        const status = this.getErrorStatus(result.error);
        context.set.status = status;
        return { error: result.error };
      }

      context.set.status = successStatus;
      return result.data;
    };
  }

  /**
   * Adapta um método de controller que recebe parâmetros
   */
  static adaptWithParams<T, P>(
    handler: (params: P) => Promise<Result<T, string>>,
    successStatus: number = 200
  ) {
    return async (context: { params: P; set: any }) => {
      const result = await handler(context.params);

      if (!result.success) {
        const status = this.getErrorStatus(result.error);
        context.set.status = status;
        return { error: result.error };
      }

      context.set.status = successStatus;
      return result.data;
    };
  }

  /**
   * Adapta um método de controller que recebe body
   */
  static adaptWithBody<T, B>(
    handler: (body: B) => Promise<Result<T, string>>,
    successStatus: number = 200
  ) {
    return async (context: { body: unknown; set: any }) => {
      const result = await handler(context.body as B);

      if (!result.success) {
        const status = this.getErrorStatus(result.error);
        context.set.status = status;
        return { error: result.error };
      }

      context.set.status = successStatus;
      return result.data;
    };
  }

  /**
   * Adapta um método de controller que recebe params e body
   */
  static adaptWithParamsAndBody<T, P, B>(
    handler: (params: P, body: B) => Promise<Result<T, string>>,
    successStatus: number = 200
  ) {
    return async (context: { params: P; body: unknown; set: any }) => {
      const result = await handler(context.params, context.body as B);

      if (!result.success) {
        const status = this.getErrorStatus(result.error);
        context.set.status = status;
        return { error: result.error };
      }

      context.set.status = successStatus;
      return result.data;
    };
  }

  /**
   * Adapta um método de controller que retorna void (para DELETE)
   */
  static adaptVoid<P>(
    handler: (params: P) => Promise<Result<void, string>>,
    successStatus: number = 204
  ) {
    return async (context: { params: P; set: any }) => {
      const result = await handler(context.params);

      if (!result.success) {
        const status = this.getErrorStatus(result.error);
        context.set.status = status;
        return { error: result.error };
      }

      context.set.status = successStatus;
      return;
    };
  }

  /**
   * Determina o status HTTP baseado no tipo de erro
   */
  private static getErrorStatus(error: string): number {
    if (error.includes("not found")) {
      return 404;
    }
    if (error.includes("already exists") || error.includes("Validation")) {
      return 400;
    }
    return 500;
  }
}

