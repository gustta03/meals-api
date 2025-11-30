import { IWhatsAppRepository } from "@domain/repositories/whatsapp.repository";
import { SendMessageDto } from "../dtos/message.dto";
import { Result, success, failure } from "@shared/types/result";
import { logger } from "@shared/logger/logger";

export class SendMessageUseCase {
  constructor(private readonly whatsappRepository: IWhatsAppRepository) {}

  async execute(dto: SendMessageDto): Promise<Result<void, string>> {
    try {
      logger.debug(
        {
          to: dto.to,
          messageLength: dto.message.length,
          hasImage: !!dto.imageBuffer,
          hasInteractive: !!dto.interactiveMessage,
        },
        "Enviando mensagem"
      );

      if (dto.interactiveMessage) {
        await this.whatsappRepository.sendInteractiveMessage(dto.to, {
          header: dto.interactiveMessage.header,
          body: dto.interactiveMessage.body,
          footer: dto.interactiveMessage.footer,
          buttons: dto.interactiveMessage.buttons,
        });
      } else if (dto.imageBuffer) {
        await this.whatsappRepository.sendImage(
          dto.to,
          dto.imageBuffer,
          dto.message,
          dto.imageMimeType || "image/png"
        );
      } else {
        await this.whatsappRepository.sendMessage(dto.to, dto.message);
      }

      logger.debug({ to: dto.to }, "Mensagem enviada com sucesso");
      return success(undefined);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send message";
      logger.error(
        {
          error,
          errorMessage,
          to: dto.to,
        },
        "Erro ao enviar mensagem"
      );
      return failure(errorMessage);
    }
  }
}

