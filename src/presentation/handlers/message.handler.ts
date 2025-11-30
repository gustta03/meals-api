import { Message } from "@domain/entities/message.entity";
import { ProcessMessageUseCase } from "@application/use-cases/process-message.use-case";
import { SendMessageUseCase } from "@application/use-cases/send-message.use-case";
import { SendMessageDto } from "@application/dtos/message.dto";
import { logger } from "@shared/logger/logger";

export class MessageHandler {
  constructor(
    private readonly processMessageUseCase: ProcessMessageUseCase,
    private readonly sendMessageUseCase: SendMessageUseCase
  ) {}

  async handle(message: Message): Promise<void> {
    logger.info(
      {
        messageId: message.id,
        from: message.from,
        to: message.to,
        body: message.body,
        hasImage: message.hasImage,
        isGroup: message.isGroup,
        groupId: message.groupId,
        timestamp: message.timestamp.toISOString(),
      },
      "Mensagem recebida"
    );

    try {
      const result = await this.processMessageUseCase.execute(message);

      if (result.success) {
        logger.debug(
          {
            messageId: message.id,
            responseLength: result.data.message.length,
            hasImage: !!result.data.imageBuffer,
          },
          "Mensagem processada com sucesso, enviando resposta"
        );

        const sendDto: SendMessageDto = {
          to: message.from,
          message: result.data.message,
          imageBuffer: result.data.imageBuffer,
          imageMimeType: result.data.imageMimeType,
          interactiveMessage: result.data.interactiveMessage,
        };

        logger.debug({
          messageId: message.id,
          hasImageBuffer: !!sendDto.imageBuffer,
          imageMimeType: sendDto.imageMimeType,
          imageBufferSize: sendDto.imageBuffer?.length,
          messageLength: sendDto.message.length,
        }, "Preparing to send message with image");

        const sendResult = await this.sendMessageUseCase.execute(sendDto);

        if (sendResult.success) {
          logger.info(
            {
              messageId: message.id,
              to: message.from,
            },
            "Resposta enviada com sucesso"
          );
        } else {
          logger.error(
            {
              messageId: message.id,
              error: sendResult.error,
            },
            "Erro ao enviar resposta"
          );
        }
      } else {
        logger.warn(
          {
            messageId: message.id,
            error: result.error,
          },
          "Erro ao processar mensagem"
        );
      }
    } catch (error) {
      logger.error(
        {
          error,
          messageId: message.id,
        },
        "Erro inesperado ao processar mensagem"
      );
    }
  }
}

