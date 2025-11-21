import { IWhatsAppRepository } from "@domain/repositories/whatsapp.repository";
import { SendMessageDto } from "../dtos/message.dto";
import { Result, success, failure } from "@shared/types/result";

export class SendMessageUseCase {
  constructor(private readonly whatsappRepository: IWhatsAppRepository) {}

  async execute(dto: SendMessageDto): Promise<Result<void, string>> {
    try {
      await this.whatsappRepository.sendMessage(dto.to, dto.message);
      return success(undefined);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send message";
      return failure(errorMessage);
    }
  }
}

