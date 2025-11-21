import { Message } from "@domain/entities/message.entity";
import { Result, success, failure } from "@shared/types/result";

export class ProcessMessageUseCase {
  async execute(message: Message): Promise<Result<string, string>> {
    try {
      const response = this.generateResponse(message.body);
      return success(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to process message";
      return failure(errorMessage);
    }
  }

  private generateResponse(messageBody: string): string {
    const lowerBody = messageBody.toLowerCase().trim();

    if (lowerBody === "oi" || lowerBody === "olá" || lowerBody === "ola") {
      return "Olá! Como posso ajudar você hoje?";
    }

    if (lowerBody.includes("ajuda") || lowerBody === "help") {
      return "Comandos disponíveis:\n- /alimentos - Listar alimentos\n- /buscar <nome> - Buscar alimento\n- /ajuda - Ver esta mensagem";
    }

    if (lowerBody.startsWith("/alimentos")) {
      return "Lista de alimentos disponíveis...";
    }

    return "Desculpe, não entendi. Digite /ajuda para ver os comandos disponíveis.";
  }
}

